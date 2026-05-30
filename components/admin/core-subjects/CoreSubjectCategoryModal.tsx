import { useEffect, useState } from "react";
import { slugifyCoreSubject, type CoreSubject } from "../../../data/coreSubjectsConfig";

export interface CoreSubjectCategoryModalProps {
  item: CoreSubject | null;
  saving: boolean;
  defaultDisplayOrder?: number;
  onSave: (item: Omit<CoreSubject, "id"> & { id?: string }) => void;
  onClose: () => void;
}

export default function CoreSubjectCategoryModal({
  item,
  saving,
  defaultDisplayOrder = 10,
  onSave,
  onClose,
}: CoreSubjectCategoryModalProps) {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    subject: item?.subject ?? "",
    displayOrder: item?.displayOrder ?? defaultDisplayOrder,
    thumbnailUrl: item?.thumbnailUrl ?? "",
  });

  useEffect(() => {
    setForm({
      title: item?.title ?? "",
      description: item?.description ?? "",
      subject: item?.subject ?? "",
      displayOrder: item?.displayOrder ?? defaultDisplayOrder,
      thumbnailUrl: item?.thumbnailUrl ?? "",
    });
  }, [item, defaultDisplayOrder]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = slugifyCoreSubject(form.subject || form.title);
    onSave({
      ...(item?.id ? { id: item.id } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      subject,
      displayOrder: Number(form.displayOrder) || 0,
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {item?.id ? "Edit Subject" : "Add Subject"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Subjects appear as top-level cards (DBMS, OS, etc.). Concepts group by topic under each subject.
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                  subject: prev.subject || slugifyCoreSubject(e.target.value),
                }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="e.g. DBMS"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Learn DBMS Basics to Advanced"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Slug</span>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              placeholder="dbms"
            />
            <p className="mt-1 text-xs text-gray-500">
              Used to link concepts to this subject. Auto-generated from title if left empty on create.
            </p>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Display order</span>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value) || 0 }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Cover image URL</span>
              <input
                value={form.thumbnailUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving…" : item?.id ? "Save subject" : "Add subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
