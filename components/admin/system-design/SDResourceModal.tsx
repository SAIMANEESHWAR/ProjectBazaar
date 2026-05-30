import React, { useState } from "react";
import PrepRichTextEditor from "../PrepRichTextEditor";
import { isRichHtmlEmpty } from "../../preparation/PrepRichContentRenderer";
import { type AdminSDItem, type SDDesignType, SD_SECTIONS_HLD, SD_SECTIONS_LLD } from "./types";
import { uploadSdMediaFile } from "./uploadMedia";
import SdImageDropzone from "./SdImageDropzone";

interface SDResourceModalProps {
  designType: SDDesignType;
  item?: AdminSDItem | null;
  saving: boolean;
  onSave: (
    data: Omit<AdminSDItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => Promise<void> | void;
  onClose: () => void;
}

export default function SDResourceModal({
  designType,
  item,
  saving,
  onSave,
  onClose,
}: SDResourceModalProps) {
  const sections = designType === "hld" ? SD_SECTIONS_HLD : SD_SECTIONS_LLD;
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    section: item?.section ?? sections[0],
    difficulty: item?.difficulty ?? "Medium",
    topics: (item?.topics ?? []).join(", "),
    content: item?.content ?? "",
    resourceLinks: item?.resourceLinks?.length ? [...item.resourceLinks] : [""],
    pdfUrl: item?.pdfUrl ?? "",
    thumbnailUrl: item?.thumbnailUrl ?? "",
  });
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);
  const [pendingThumbnail, setPendingThumbnail] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setLink = (index: number, value: string) => {
    setForm((f) => {
      const next = [...f.resourceLinks];
      next[index] = value;
      return { ...f, resourceLinks: next };
    });
  };

  const addLink = () =>
    setForm((f) => ({ ...f, resourceLinks: [...f.resourceLinks, ""] }));

  const removeLink = (index: number) =>
    setForm((f) => ({
      ...f,
      resourceLinks: f.resourceLinks.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (isRichHtmlEmpty(form.description)) {
      setUploadError("Short description is required.");
      return;
    }

    const links = form.resourceLinks.map((l) => l.trim()).filter(Boolean);
    const hasResource = links.length > 0 || form.pdfUrl || pendingPdf || form.content.trim();

    if (!hasResource) {
      setUploadError("Add at least one link, PDF, or notes content.");
      return;
    }

    setUploading(true);
    let pdfUrl = form.pdfUrl;
    let thumbnailUrl = form.thumbnailUrl;

    try {
      if (pendingThumbnail) {
        thumbnailUrl = await uploadSdMediaFile(pendingThumbnail, "thumbnail");
      }
      if (pendingPdf) {
        pdfUrl = await uploadSdMediaFile(pendingPdf, "pdf");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "File upload failed.");
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
      description: form.description.trim(),
      section: form.section,
      difficulty: form.difficulty,
      designType,
      contentKind: "resource",
      topics: topicList,
      content: form.content,
      diagramUrl: "",
      additionalImageUrls: [],
      resourceLinks: links,
      pdfUrl,
      thumbnailUrl,
    });
  };

  const busy = saving || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[92vh] my-2 sm:my-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? "Edit" : "Add"} {designType.toUpperCase()} Resource
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
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
                placeholder="e.g. System Design Primer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description <span className="text-red-500">*</span>
              </label>
              <PrepRichTextEditor
                value={form.description}
                onChange={(html) => set("description", html)}
                placeholder="Brief summary — lists, code snippets…"
                minHeight="140px"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma-separated)</label>
              <input
                value={form.topics}
                onChange={(e) => set("topics", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">External Links</label>
                <button type="button" onClick={addLink} className="text-xs font-medium text-orange-600 hover:text-orange-700">
                  + Add link
                </button>
              </div>
              {form.resourceLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(index, e.target.value)}
                    placeholder="https://example.com/article"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {form.resourceLinks.length > 1 && (
                    <button type="button" onClick={() => removeLink(index)} className="px-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SdImageDropzone
                label="Thumbnail"
                existingUrl={form.thumbnailUrl || undefined}
                pendingFile={pendingThumbnail}
                disabled={busy}
                onFileSelect={setPendingThumbnail}
                onRemove={() => set("thumbnailUrl", "")}
              />

              <div className="rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">PDF Document</label>
                {(form.pdfUrl || pendingPdf) && (
                  <p className="mb-2 text-xs text-gray-600 truncate">
                    {pendingPdf ? pendingPdf.name : form.pdfUrl}
                  </p>
                )}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) setPendingPdf(file);
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-orange-50 file:text-orange-700"
                />
                {form.pdfUrl && !pendingPdf && (
                  <button type="button" onClick={() => set("pdfUrl", "")} className="mt-2 text-xs text-red-600">
                    Remove PDF
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <PrepRichTextEditor
                value={form.content}
                onChange={(html) => set("content", html)}
                placeholder="Optional notes about this resource…"
                minHeight="200px"
                disabled={busy}
              />
            </div>
          </div>

          {uploadError && <p className="px-6 text-xs text-red-600">{uploadError}</p>}

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 bg-white">
            <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-60">
              Cancel
            </button>
            <button type="submit" disabled={busy || isRichHtmlEmpty(form.description)} className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-60 flex items-center gap-2">
              {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {uploading ? "Uploading…" : item ? "Save Changes" : "Add Resource"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
