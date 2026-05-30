import React, { useState } from "react";
import PrepRichTextEditor from "../PrepRichTextEditor";
import { isRichHtmlEmpty } from "../../preparation/PrepRichContentRenderer";
import {
  type AdminSDItem,
  type SDContentKind,
  type SDDesignType,
  SD_SECTIONS_HLD,
  SD_SECTIONS_LLD,
} from "./types";
import { uploadSdMediaFile } from "./uploadMedia";
import SdImageDropzone from "./SdImageDropzone";

const CONTENT_KIND_LABELS: Record<Exclude<SDContentKind, "question" | "resource">, string> = {
  concept: "Concept",
  practice: "Practice",
};

interface SDConceptModalProps {
  designType: SDDesignType;
  contentKind: Exclude<SDContentKind, "question" | "resource">;
  item?: AdminSDItem | null;
  defaultDisplayOrder?: number;
  saving: boolean;
  onSave: (
    data: Omit<AdminSDItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<void> | void;
  onClose: () => void;
}

export default function SDConceptModal({
  designType,
  contentKind,
  item,
  defaultDisplayOrder = 10,
  saving,
  onSave,
  onClose,
}: SDConceptModalProps) {
  const kindLabel = CONTENT_KIND_LABELS[contentKind];
  const isConcept = contentKind === "concept";
  const sections = designType === "hld" ? SD_SECTIONS_HLD : SD_SECTIONS_LLD;
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    section: item?.section ?? sections[0],
    difficulty: item?.difficulty ?? "Medium",
    topics: (item?.topics ?? []).join(", "),
    content: item?.content ?? "",
    thumbnailUrl: item?.thumbnailUrl ?? "",
    displayOrder: item?.displayOrder ?? defaultDisplayOrder,
  });
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!isConcept && isRichHtmlEmpty(form.description)) {
      return;
    }

    setUploading(true);
    let thumbnailUrl = form.thumbnailUrl;
    try {
      if (pendingThumbnail) {
        thumbnailUrl = await uploadSdMediaFile(pendingThumbnail, "thumbnail");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Image upload failed.");
      setUploading(false);
      return;
    }
    setUploading(false);

    const topicList = form.topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      title: form.title.trim(),
      description: isConcept ? "" : form.description.trim(),
      section: form.section,
      difficulty: isConcept ? "Medium" : form.difficulty,
      designType,
      contentKind,
      topics: topicList,
      content: form.content,
      diagramUrl: "",
      additionalImageUrls: [],
      thumbnailUrl,
      displayOrder: Number(form.displayOrder) || 0,
    });
  };

  const busy = saving || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] my-2 sm:my-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? "Edit" : "Add"} {designType.toUpperCase()} {kindLabel}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col">
          <div className="p-6 space-y-4 overflow-y-auto min-h-0">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. CAP Theorem"
              />
            </div>

            {!isConcept && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <PrepRichTextEditor
                  value={form.description}
                  onChange={(html) => set("description", html)}
                  placeholder="Brief summary — lists, code snippets…"
                  minHeight="140px"
                  disabled={busy}
                />
              </div>
            )}

            <div className={isConcept ? "" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => set("section", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {!isConcept && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => set("difficulty", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics <span className="text-xs text-gray-400">(comma-separated)</span>
              </label>
              <input
                value={form.topics}
                onChange={(e) => set("topics", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. Consistency, Availability"
              />
            </div>

            {isConcept && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.displayOrder}
                    onChange={(e) => set("displayOrder", e.target.value)}
                    disabled={busy}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Lower numbers appear first in grid, folder, and topic views.
                  </p>
                </div>
              </div>
            )}

            {isConcept && (
              <SdImageDropzone
                label="Topic Group Image"
                hint="Used as the topic group cover in grid view (one image per topic). Upload on any concept in that topic. Recommended 16:9, at least 640×360px."
                existingUrl={form.thumbnailUrl || undefined}
                pendingFile={pendingThumbnail}
                disabled={busy}
                onFileSelect={setPendingThumbnail}
                onRemove={() => set("thumbnailUrl", "")}
              />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {kindLabel} Content <span className="text-red-500">*</span>
              </label>
              <PrepRichTextEditor
                value={form.content}
                onChange={(html) => set("content", html)}
                placeholder="Write the full concept article — headings, lists, images…"
                minHeight="360px"
                disabled={busy}
              />
            </div>
          </div>

          {uploadError && <p className="px-6 text-xs text-red-600">{uploadError}</p>}

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                busy ||
                !form.content.trim() ||
                (!isConcept && isRichHtmlEmpty(form.description))
              }
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {busy && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {item ? "Save Changes" : `Add ${kindLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
