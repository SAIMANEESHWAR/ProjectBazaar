import React, { useCallback, useEffect, useMemo, useState } from "react";
import { type AdminSDItem, type SDContentKind } from "./types";
import { sortByDisplayOrder } from "./sdDisplayOrder";
import { getGroupThumbnail, groupByTopic } from "../../../lib/prepTopicGrouping";
import { useDragReorder } from "./useDragReorder";

const DragHandle: React.FC<{ label?: string }> = ({ label = "Drag to reorder" }) => (
  <span
    title={label}
    aria-label={label}
    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white/95 p-1.5 text-gray-400 hover:text-gray-700 hover:border-gray-300 cursor-grab active:cursor-grabbing"
  >
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M7 4a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm8-12a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  </span>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ActionBtns: React.FC<{
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ name, onEdit, onDelete }) => (
  <div className="flex gap-1">
    <button onClick={onEdit} title={`Edit ${name}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
      <EditIcon />
    </button>
    <button onClick={onDelete} title={`Delete ${name}`} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
      <DeleteIcon />
    </button>
  </div>
);

const DiffBadge: React.FC<{ d: string }> = ({ d }) => (
  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${d === "Easy" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : d === "Medium" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
    {d}
  </span>
);

const ViewToggle: React.FC<{
  view: "table" | "grid";
  onChange: (v: "table" | "grid") => void;
}> = ({ view, onChange }) => (
  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
    <button onClick={() => onChange("table")} className={`p-1.5 transition-all ${view === "table" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`} title="Table view">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
    </button>
    <button onClick={() => onChange("grid")} className={`p-1.5 transition-all ${view === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`} title="Grid view">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
    </button>
  </div>
);

const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200">{children}</div>
);

const OrderBtns: React.FC<{
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ canMoveUp, canMoveDown, disabled, onMoveUp, onMoveDown }) => (
  <div className="flex flex-col gap-0.5">
    <button
      type="button"
      disabled={disabled || !canMoveUp}
      onClick={onMoveUp}
      title="Move up"
      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
    <button
      type="button"
      disabled={disabled || !canMoveDown}
      onClick={onMoveDown}
      title="Move down"
      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
);

export interface SDContentSectionProps {
  title: string;
  count: number;
  btnLabel: string;
  items: AdminSDItem[];
  loading: boolean;
  error: string | null;
  viewMode: "table" | "grid";
  onViewChange: (v: "table" | "grid") => void;
  onAdd: () => void;
  onRetry: () => void;
  onEdit: (item: AdminSDItem) => void;
  onDelete: (item: AdminSDItem) => void;
  onMoveItem?: (item: AdminSDItem, direction: "up" | "down", scopeItems?: AdminSDItem[]) => void;
  onMoveTopic?: (topic: string, direction: "up" | "down") => void;
  onReorderItems?: (fromIndex: number, toIndex: number, scopeItems?: AdminSDItem[]) => void;
  onReorderTopics?: (fromIndex: number, toIndex: number) => void;
  reordering?: boolean;
  showImagesColumn?: boolean;
  contentKind?: SDContentKind;
}

export default function SDContentSection({
  title,
  count,
  btnLabel,
  items,
  loading,
  error,
  viewMode,
  onViewChange,
  onAdd,
  onRetry,
  onEdit,
  onDelete,
  onMoveItem,
  onMoveTopic,
  onReorderItems,
  onReorderTopics,
  reordering = false,
  showImagesColumn = false,
  contentKind,
}: SDContentSectionProps) {
  const isGrid = viewMode === "grid";
  const isResource = contentKind === "resource";
  const isConcept = contentKind === "concept";
  const groupByTopics = isConcept;
  const sortedItems = useMemo(() => sortByDisplayOrder(items), [items]);
  const topicGroups = useMemo(
    () => (groupByTopics ? groupByTopic(sortedItems) : []),
    [groupByTopics, sortedItems],
  );
  const [selectedTopicGroup, setSelectedTopicGroup] = useState<string | null>(null);
  const activeGroup = useMemo(
    () => topicGroups.find((group) => group.topic === selectedTopicGroup) ?? null,
    [topicGroups, selectedTopicGroup],
  );
  const visibleItems = activeGroup?.items ?? sortedItems;

  useEffect(() => {
    setSelectedTopicGroup(null);
  }, [contentKind, title]);

  const topicDrag = useDragReorder(
    useCallback(
      (fromIndex, toIndex) => onReorderTopics?.(fromIndex, toIndex),
      [onReorderTopics],
    ),
    reordering || !onReorderTopics,
  );

  const conceptDrag = useDragReorder(
    useCallback(
      (fromIndex, toIndex) => {
        if (!activeGroup) return;
        onReorderItems?.(fromIndex, toIndex, activeGroup.items);
      },
      [activeGroup, onReorderItems],
    ),
    reordering || !onReorderItems || !activeGroup,
  );

  const renderConceptCard = (q: AdminSDItem, dragIndex?: number) => {
    const wrapped = (
      <CardShell>
        {q.thumbnailUrl && (
          <div className="mb-3 -mx-5 -mt-5 rounded-t-xl overflow-hidden border-b border-gray-100">
            <img src={q.thumbnailUrl} alt="" className="w-full h-28 object-cover" />
          </div>
        )}
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {dragIndex !== undefined && onReorderItems && (
              <div {...conceptDrag.getHandleProps(dragIndex)} onClick={(event) => event.stopPropagation()}>
                <DragHandle />
              </div>
            )}
            <span className="text-xs text-gray-400">Concept</span>
          </div>
          <ActionBtns name={q.title} onEdit={() => onEdit(q)} onDelete={() => onDelete(q)} />
        </div>
        <h4 className="font-semibold text-gray-900 text-sm">{q.title}</h4>
        <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full ring-1 ring-cyan-100">
          {q.section}
        </span>
      </CardShell>
    );

    if (dragIndex === undefined) {
      return <div key={q.id}>{wrapped}</div>;
    }

    return (
      <div
        key={q.id}
        {...conceptDrag.getDropProps(dragIndex)}
        className={conceptDrag.itemClassName(dragIndex, "rounded-xl transition-all duration-150")}
      >
        {wrapped}
      </div>
    );
  };

  const renderItemRow = (
    q: AdminSDItem,
    i: number,
    rowItems: AdminSDItem[],
    showTopic = false,
    moveScope?: AdminSDItem[],
  ) => {
    const meta = isResource ? resourceMeta(q) : null;
    return (
      <tr key={q.id} className="hover:bg-gray-50">
        <td className="px-4 py-4">
          {onMoveItem ? (
            <OrderBtns
              canMoveUp={i > 0}
              canMoveDown={i < rowItems.length - 1}
              disabled={reordering}
              onMoveUp={() => onMoveItem(q, "up", moveScope ?? rowItems)}
              onMoveDown={() => onMoveItem(q, "down", moveScope ?? rowItems)}
            />
          ) : (
            <span className="text-xs text-gray-400">{q.displayOrder ?? 0}</span>
          )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
        <td className="px-6 py-4">
          <p className="text-sm font-medium text-gray-900">{q.title}</p>
          {!isConcept && (
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{q.description}</p>
          )}
        </td>
        {showTopic && (
          <td className="px-6 py-4 text-sm text-gray-500">
            {(q.topics?.[0]?.trim() || q.section) ?? "General"}
          </td>
        )}
        <td className="px-6 py-4 text-sm text-gray-500">{q.section}</td>
        {!isConcept && (
          <td className="px-6 py-4"><DiffBadge d={q.difficulty} /></td>
        )}
        {showImagesColumn && <td className="px-6 py-4 text-sm text-gray-500">{q.additionalImageUrls?.length ?? 0}</td>}
        {isResource && meta && (
          <td className="px-6 py-4 text-xs text-gray-500">
            {[meta.linkCount > 0 && `${meta.linkCount} link${meta.linkCount > 1 ? "s" : ""}`, meta.hasPdf && "PDF", meta.hasThumb && "Thumb"].filter(Boolean).join(" · ") || "—"}
          </td>
        )}
        <td className="px-6 py-4">
          <ActionBtns name={q.title} onEdit={() => onEdit(q)} onDelete={() => onDelete(q)} />
        </td>
      </tr>
    );
  };

  const resourceMeta = (item: AdminSDItem) => {
    const linkCount = item.resourceLinks?.length ?? 0;
    const hasPdf = Boolean(item.pdfUrl);
    const hasThumb = Boolean(item.thumbnailUrl);
    return { linkCount, hasPdf, hasThumb };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {title} <span className="text-sm font-normal text-gray-400">({count})</span>
        </h3>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={onViewChange} />
          <button onClick={onAdd} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm">
            {btnLabel}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="animate-spin w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600">
          <p className="font-medium">{error}</p>
          <button onClick={onRetry} className="mt-3 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors">Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <p className="font-medium">No items yet.</p>
          <button onClick={onAdd} className="mt-3 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">{btnLabel}</button>
        </div>
      ) : isGrid ? (
        groupByTopics && !selectedTopicGroup ? (
          <div className="p-5">
            {onReorderTopics && (
              <p className="mb-4 text-xs text-gray-500">
                Drag topic cards by the grip handle to change display order.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {topicGroups.map((group, groupIndex) => {
              const thumbnailUrl = getGroupThumbnail(group.items);
              return (
                <div
                  key={group.topic}
                  {...topicDrag.getDropProps(groupIndex)}
                  className={topicDrag.itemClassName(
                    groupIndex,
                    "relative group text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200",
                  )}
                >
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-1">
                    {onReorderTopics && (
                      <div {...topicDrag.getHandleProps(groupIndex)}>
                        <DragHandle label="Drag topic to reorder" />
                      </div>
                    )}
                  </div>
                  {onMoveTopic && (
                    <div
                      className="absolute top-3 right-3 z-10 rounded-lg bg-white/95 border border-gray-200 shadow-sm p-0.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <OrderBtns
                        canMoveUp={groupIndex > 0}
                        canMoveDown={groupIndex < topicGroups.length - 1}
                        disabled={reordering}
                        onMoveUp={() => onMoveTopic(group.topic, "up")}
                        onMoveDown={() => onMoveTopic(group.topic, "down")}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedTopicGroup(group.topic)}
                    className="w-full text-left"
                  >
                    <div className="relative h-36 overflow-hidden">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-end p-4 pl-14">
                          <span className="text-base font-bold text-white/95 line-clamp-2">{group.topic}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                    </div>
                    <div className="p-4 pl-14">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 text-emerald-700">
                          Topic
                        </span>
                        <span className="text-[11px] font-medium text-gray-500 pr-10">
                          {group.items.length} concept{group.items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {group.topic}
                      </h4>
                    </div>
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        ) : groupByTopics && activeGroup ? (
          <div className="p-5">
            <button
              type="button"
              onClick={() => setSelectedTopicGroup(null)}
              className="mb-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back to all topics
            </button>
            <div className="mb-5">
              <h4 className="text-lg font-bold text-gray-900">{activeGroup.topic}</h4>
              <p className="mt-1 text-sm text-gray-500">
                {activeGroup.items.length} concept{activeGroup.items.length === 1 ? "" : "s"}
              </p>
              {onReorderItems && (
                <p className="mt-2 text-xs text-gray-500">
                  Drag concept cards by the grip handle to change order inside this topic.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeGroup.items.map((q, index) => renderConceptCard(q, index))}
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {sortedItems.map((q) => {
            const meta = isResource ? resourceMeta(q) : null;
            return (
            <CardShell key={q.id}>
              {(isResource || isConcept) && q.thumbnailUrl && (
                <div className="mb-3 -mx-5 -mt-5 rounded-t-xl overflow-hidden border-b border-gray-100">
                  <img src={q.thumbnailUrl} alt="" className="w-full h-28 object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                {!isConcept && <DiffBadge d={q.difficulty} />}
                {isConcept && <span className="text-xs text-gray-400">Concept</span>}
                <ActionBtns name={q.title} onEdit={() => onEdit(q)} onDelete={() => onDelete(q)} />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{q.title}</h4>
              {!isConcept && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{q.description}</p>
              )}
              <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full ring-1 ring-cyan-100">{q.section}</span>
              {isResource && meta && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {meta.linkCount > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full ring-1 ring-blue-100">
                      {meta.linkCount} link{meta.linkCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {meta.hasPdf && (
                    <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full ring-1 ring-rose-100">PDF</span>
                  )}
                </div>
              )}
              {showImagesColumn && (q.additionalImageUrls?.length ?? 0) > 0 && (
                <span className="ml-2 mt-3 inline-block text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full ring-1 ring-purple-100">
                  {q.additionalImageUrls.length} image{q.additionalImageUrls.length > 1 ? "s" : ""}
                </span>
              )}
            </CardShell>
          );})}
        </div>
        )
      ) : (
        <div className="overflow-x-auto">
          {groupByTopics && !selectedTopicGroup ? (
            <div className="p-5 space-y-3">
              {topicGroups.map((group, groupIndex) => (
                <div
                  key={group.topic}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:border-orange-300 hover:bg-orange-50/40 transition-colors"
                >
                  {onMoveTopic && (
                    <OrderBtns
                      canMoveUp={groupIndex > 0}
                      canMoveDown={groupIndex < topicGroups.length - 1}
                      disabled={reordering}
                      onMoveUp={() => onMoveTopic(group.topic, "up")}
                      onMoveDown={() => onMoveTopic(group.topic, "down")}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedTopicGroup(group.topic)}
                    className="flex flex-1 items-center justify-between text-left min-w-0"
                  >
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{group.topic}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {group.items.length} concept{group.items.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-orange-600 shrink-0 ml-3">View →</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
          <>
          {groupByTopics && activeGroup && (
            <div className="px-5 pt-5">
              <button
                type="button"
                onClick={() => setSelectedTopicGroup(null)}
                className="mb-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                ← Back to all topics
              </button>
              <div className="mb-4">
                <h4 className="text-lg font-bold text-gray-900">{activeGroup.topic}</h4>
                <p className="mt-1 text-sm text-gray-500">
                  {activeGroup.items.length} concept{activeGroup.items.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          )}
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                {!groupByTopics && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                {!isConcept && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                )}
                {showImagesColumn && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>}
                {isResource && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groupByTopics && !selectedTopicGroup
                ? null
                : visibleItems.map((q, i) =>
                    renderItemRow(
                      q,
                      i,
                      visibleItems,
                      !groupByTopics,
                      groupByTopics ? visibleItems : undefined,
                    ),
                  )}
            </tbody>
          </table>
          </>
          )}
        </div>
      )}
    </div>
  );
}
