import Editor from "@monaco-editor/react";
import React, { useState, useRef } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import PrepRichTextEditor from "../PrepRichTextEditor";
import { uploadSdMediaFile } from "./uploadMedia";
import {
  type AdminSDItem,
  type SDDesignType,
  SD_SECTIONS_HLD,
  SD_SECTIONS_LLD,
  EMPTY_DIAGRAM_TEMPLATE,
  parseDiagramDataShape,
} from "./types";

interface SDQuestionModalProps {
  designType: SDDesignType;
  item?: AdminSDItem | null;
  saving: boolean;
  onSave: (
    data: Omit<AdminSDItem, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ) => Promise<void> | void;
  onClose: () => void;
}

export default function SDQuestionModal({
  designType,
  item,
  saving,
  onSave,
  onClose,
}: SDQuestionModalProps) {
  const sections = designType === "hld" ? SD_SECTIONS_HLD : SD_SECTIONS_LLD;
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    section: item?.section ?? sections[0],
    difficulty: item?.difficulty ?? "Medium",
    topics: (item?.topics ?? []).join(", "),
    content: item?.content ?? "",
    diagramData: item?.diagramData
      ? JSON.stringify(item.diagramData, null, 2)
      : "",
    diagramUrl: item?.diagramUrl ?? "",
    additionalImageUrls: item?.additionalImageUrls ?? [],
  });
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadInfo, setImageUploadInfo] = useState<string | null>(null);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isDiagramFolded, setIsDiagramFolded] = useState(false);
  const diagramEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(
    null,
  );

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setDiagramTemplate = () => {
    set("diagramData", JSON.stringify(EMPTY_DIAGRAM_TEMPLATE, null, 2));
    setDiagramError(null);
  };

  const formatDiagramJson = () => {
    const parsed = parseDiagramDataShape(form.diagramData);
    if (parsed.error) {
      setDiagramError(parsed.error);
      return;
    }
    if (!parsed.data) {
      setDiagramError("Add JSON first, then format it.");
      return;
    }
    set("diagramData", JSON.stringify(parsed.data, null, 2));
    setDiagramError(null);
  };

  const toggleFoldAllDiagramJson = () => {
    const editor = diagramEditorRef.current;
    if (!editor) return;

    if (isDiagramFolded) {
      editor.trigger("toolbar", "editor.unfoldAll", null);
      setIsDiagramFolded(false);
      return;
    }

    editor.trigger("toolbar", "editor.foldAll", null);
    setIsDiagramFolded(true);
  };

  const addMissingDiagramKeys = () => {
    if (!form.diagramData.trim()) {
      setDiagramTemplate();
      return;
    }
    const parsed = parseDiagramDataShape(form.diagramData);
    if (parsed.error) {
      setDiagramError(parsed.error);
      return;
    }
    set("diagramData", JSON.stringify(parsed.data, null, 2));
    setIsDiagramFolded(false);
    setDiagramError(null);
  };

  const onSelectImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const validImages = selected.filter((file) =>
      file.type.toLowerCase().startsWith("image/"),
    );
    const ignoredCount = selected.length - validImages.length;
    if (ignoredCount > 0) {
      setImageUploadError(`${ignoredCount} file(s) ignored because they are not images.`);
    } else {
      setImageUploadError(null);
    }

    setPendingImageFiles((prev) => [...prev, ...validImages]);
    e.target.value = "";
  };

  const removePendingImageFile = (index: number) => {
    setPendingImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImageUrl = (url: string) => {
    setForm((prev) => ({
      ...prev,
      additionalImageUrls: prev.additionalImageUrls.filter((u) => u !== url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiagramError(null);
    setImageUploadError(null);
    setImageUploadInfo(null);

    const parsedDiagram = parseDiagramDataShape(form.diagramData);
    if (parsedDiagram.error) {
      setDiagramError(parsedDiagram.error);
      return;
    }

    let uploadedImageUrls: string[] = [];
    if (pendingImageFiles.length > 0) {
      setUploadingImages(true);
      setImageUploadInfo(`Uploading ${pendingImageFiles.length} image(s)...`);
      try {
        uploadedImageUrls = await Promise.all(
          pendingImageFiles.map((file) => uploadSdMediaFile(file, "image")),
        );
      } catch (err) {
        setUploadingImages(false);
        setImageUploadInfo(null);
        setImageUploadError(
          err instanceof Error ? err.message : "Image upload failed.",
        );
        return;
      }
      setUploadingImages(false);
      setImageUploadInfo(`${uploadedImageUrls.length} image(s) uploaded.`);
    }

    const mergedImageUrls = Array.from(
      new Set([...form.additionalImageUrls, ...uploadedImageUrls]),
    );
    if (uploadedImageUrls.length > 0) {
      setPendingImageFiles([]);
      setForm((prev) => ({ ...prev, additionalImageUrls: mergedImageUrls }));
    }

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
      contentKind: "question",
      topics: topicList,
      content: form.content,
      diagramData: parsedDiagram.data,
      diagramUrl: form.diagramUrl.trim(),
      additionalImageUrls: mergedImageUrls,
    });
  };

  const parsedDiagram = parseDiagramDataShape(form.diagramData);
  const diagramSummary = parsedDiagram.data
    ? {
        nodes: parsedDiagram.data.nodes.length,
        edges: parsedDiagram.data.edges.length,
        legend: parsedDiagram.data.legend.length,
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] my-2 sm:my-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? "Edit" : "Add"} {designType.toUpperCase()} Question
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
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
                placeholder="e.g. Design a URL Shortener"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Short description of the problem"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <select
                  value={form.section}
                  onChange={(e) => set("section", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => set("difficulty", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topics{" "}
                <span className="text-xs text-gray-400">(comma-separated)</span>
              </label>
              <input
                value={form.topics}
                onChange={(e) => set("topics", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. Caching, Databases, Load Balancer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Solution / Content
              </label>
              <PrepRichTextEditor
                value={form.content}
                onChange={(html) => set("content", html)}
                placeholder="Write the solution — headings, lists, images…"
                minHeight="280px"
                disabled={saving || uploadingImages}
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/60">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Diagram Data (JSON)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={setDiagramTemplate}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-100"
                  >
                    Use Template
                  </button>
                  <button
                    type="button"
                    onClick={addMissingDiagramKeys}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-100"
                  >
                    Add Missing Keys
                  </button>
                  <button
                    type="button"
                    onClick={formatDiagramJson}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-100"
                  >
                    Beautify
                  </button>
                  <button
                    type="button"
                    onClick={toggleFoldAllDiagramJson}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-100"
                  >
                    {isDiagramFolded ? "Expand All" : "Collapse All"}
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Editor
                  height="320px"
                  defaultLanguage="json"
                  value={form.diagramData}
                  onChange={(value) => {
                    set("diagramData", value ?? "");
                    setDiagramError(null);
                  }}
                  onMount={(editor) => {
                    diagramEditorRef.current = editor;
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbersMinChars: 3,
                    automaticLayout: true,
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    folding: true,
                    foldingHighlight: true,
                    showFoldingControls: "always",
                    glyphMargin: true,
                    renderLineHighlight: "line",
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Required top-level keys: <span className="font-mono">nodes</span>,{" "}
                <span className="font-mono">edges</span>,{" "}
                <span className="font-mono">legend</span>, optional{" "}
                <span className="font-mono">subtitle</span>.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Click the fold arrow in the gutter beside a line to collapse or expand that specific JSON object/array block.
              </p>
              {diagramSummary && (
                <p className="mt-1 text-xs text-emerald-700">
                  Parsed: {diagramSummary.nodes} nodes, {diagramSummary.edges} edges, {diagramSummary.legend} legend entries.
                </p>
              )}
              {diagramError && (
                <p className="mt-1 text-xs text-red-600">{diagramError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legacy Diagram URL <span className="text-xs text-gray-400">(optional fallback)</span>
              </label>
              <input
                value={form.diagramUrl}
                onChange={(e) => set("diagramUrl", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://..."
              />
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images (Upload to S3)
              </label>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                onChange={onSelectImageFiles}
                className="block w-full text-sm text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="mt-2 text-xs text-gray-500">
                Selected files are uploaded on save. Supported types: PNG, JPEG, GIF, WEBP, SVG.
              </p>

              {pendingImageFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Pending Uploads</p>
                  <div className="space-y-1.5">
                    {pendingImageFiles.map((file, idx) => (
                      <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 text-xs bg-orange-50 text-orange-700 px-2 py-1.5 rounded-md">
                        <span className="truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removePendingImageFile(idx)}
                          className="text-orange-700 hover:text-orange-900 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.additionalImageUrls.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Existing Uploaded Images</p>
                  <div className="space-y-1.5">
                    {form.additionalImageUrls.map((url) => (
                      <div key={url} className="flex items-center justify-between gap-2 text-xs bg-gray-100 text-gray-700 px-2 py-1.5 rounded-md">
                        <span className="truncate">{url}</span>
                        <button
                          type="button"
                          onClick={() => removeExistingImageUrl(url)}
                          className="text-gray-600 hover:text-gray-900 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imageUploadInfo && (
                <p className="mt-2 text-xs text-emerald-700">{imageUploadInfo}</p>
              )}
              {imageUploadError && (
                <p className="mt-2 text-xs text-red-600">{imageUploadError}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploadingImages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploadingImages}
              className="px-5 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {(saving || uploadingImages) && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {uploadingImages
                ? "Uploading Images..."
                : item
                  ? "Save Changes"
                  : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

