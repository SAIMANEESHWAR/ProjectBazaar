import React from "react";
import { type AdminSDItem, type SDContentKind } from "./types";

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
  showImagesColumn = false,
  contentKind,
}: SDContentSectionProps) {
  const isGrid = viewMode === "grid";
  const isResource = contentKind === "resource";

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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
          {items.map((q) => {
            const meta = isResource ? resourceMeta(q) : null;
            return (
            <CardShell key={q.id}>
              {isResource && q.thumbnailUrl && (
                <div className="mb-3 -mx-5 -mt-5 rounded-t-xl overflow-hidden border-b border-gray-100">
                  <img src={q.thumbnailUrl} alt="" className="w-full h-28 object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <DiffBadge d={q.difficulty} />
                <ActionBtns name={q.title} onEdit={() => onEdit(q)} onDelete={() => onDelete(q)} />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{q.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{q.description}</p>
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
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                {showImagesColumn && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>}
                {isResource && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((q, i) => {
                const meta = isResource ? resourceMeta(q) : null;
                return (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{q.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{q.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{q.section}</td>
                  <td className="px-6 py-4"><DiffBadge d={q.difficulty} /></td>
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
              );})}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
