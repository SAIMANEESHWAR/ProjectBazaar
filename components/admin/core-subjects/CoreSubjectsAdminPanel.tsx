import SDContentSection from "../system-design/SDContentSection";
import { type CoreSubject } from "../../../data/coreSubjectsConfig";
import { type AdminCoreSubjectItem } from "./coreSubjectsAdmin";

export interface CoreSubjectsAdminPanelProps {
  categories: CoreSubject[];
  categoriesLoading: boolean;
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  onAddCategory: () => void;
  onEditCategory: (category: CoreSubject) => void;
  onDeleteCategory: (category: CoreSubject) => void;
  items: AdminCoreSubjectItem[];
  loading: boolean;
  error: string | null;
  viewMode: "table" | "grid";
  onViewChange: (mode: "table" | "grid") => void;
  onAdd: () => void;
  onRetry: () => void;
  onEdit: (item: AdminCoreSubjectItem) => void;
  onDelete: (item: AdminCoreSubjectItem) => void;
  onMoveItem: (
    item: AdminCoreSubjectItem,
    direction: "up" | "down",
    scopeItems?: AdminCoreSubjectItem[],
  ) => void;
  onMoveTopic: (topic: string, direction: "up" | "down") => void;
  onReorderItems: (
    fromIndex: number,
    toIndex: number,
    scopeItems?: AdminCoreSubjectItem[],
  ) => void;
  onReorderTopics: (fromIndex: number, toIndex: number) => void;
  reordering: boolean;
}

export default function CoreSubjectsAdminPanel({
  categories,
  categoriesLoading,
  selectedSubject,
  onSubjectChange,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
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
  reordering,
}: CoreSubjectsAdminPanelProps) {
  const subjectMeta = categories.find((entry) => entry.subject === selectedSubject);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Subjects
          </p>
          <button
            type="button"
            onClick={onAddCategory}
            className="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
          >
            Add Subject
          </button>
        </div>

        {categoriesLoading ? (
          <p className="text-sm text-gray-500">Loading subjects…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-500">
            No subjects yet. Add DBMS, Operating System, Computer Networks, or any subject you need.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((subject) => (
              <div
                key={subject.id}
                className={`inline-flex items-center gap-1 rounded-lg border ${
                  selectedSubject === subject.subject
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSubjectChange(subject.subject)}
                  className={`px-3 py-2 text-sm font-medium rounded-l-lg transition-all ${
                    selectedSubject === subject.subject
                      ? "text-orange-700"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {subject.title}
                </button>
                <button
                  type="button"
                  onClick={() => onEditCategory(subject)}
                  className="px-2 py-2 text-xs text-gray-500 hover:text-blue-600"
                  title={`Edit ${subject.title}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(subject)}
                  className="px-2 py-2 text-xs text-gray-500 hover:text-red-600 rounded-r-lg"
                  title={`Delete ${subject.title}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {categories.length === 0 ? null : !selectedSubject ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-500">
          Select a subject above to manage its topic-grouped concepts.
        </div>
      ) : (
        <SDContentSection
          title={`${subjectMeta?.title ?? selectedSubject} — Concepts`}
          count={items.length}
          btnLabel="Add Concept"
          items={items}
          loading={loading}
          error={error}
          viewMode={viewMode}
          onViewChange={onViewChange}
          onAdd={onAdd}
          onRetry={onRetry}
          onEdit={(item) => onEdit(item as AdminCoreSubjectItem)}
          onDelete={(item) => onDelete(item as AdminCoreSubjectItem)}
          onMoveItem={(item, direction, scopeItems) =>
            onMoveItem(item as AdminCoreSubjectItem, direction, scopeItems as AdminCoreSubjectItem[] | undefined)
          }
          onMoveTopic={onMoveTopic}
          onReorderItems={(fromIndex, toIndex, scopeItems) =>
            onReorderItems(fromIndex, toIndex, scopeItems as AdminCoreSubjectItem[] | undefined)
          }
          onReorderTopics={onReorderTopics}
          reordering={reordering}
          contentKind="concept"
        />
      )}
    </div>
  );
}
