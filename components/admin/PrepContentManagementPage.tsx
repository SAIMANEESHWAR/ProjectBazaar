import React, { useState, useEffect, useCallback } from "react";
import {
  interviewQuestions,
  dsaProblems,
  quizzes,
  coldDMTemplates,
  massRecruitmentCompanies,
  jobPortals,
  handwrittenNotes,
  roadmaps,
  positionResources,
} from "../../data/preparationMockData";
import { oopsConcepts, languageConcepts } from "../../data/fundamentalsData";
import { DiagramData } from "../../data/systemDesignData";
import { prepAdminApi } from "../../services/preparationApi";

type PrepTab =
  | "overview"
  | "interview-questions"
  | "dsa"
  | "quizzes"
  | "cold-dms"
  | "job-portals"
  | "notes"
  | "roadmaps"
  | "mass-recruitment"
  | "positions"
  | "hld"
  | "lld"
  | "oops"
  | "language";

interface AdminSDQuestion {
  id: string;
  title: string;
  description: string;
  section: string;
  difficulty: string;
  designType: "hld" | "lld";
  topics: string[];
  content: string;
  diagramData?: DiagramData;
  diagramUrl: string;
  additionalImageUrls: string[];
  createdAt?: string;
  updatedAt?: string;
}

const SD_SECTIONS_HLD = ["System Design", "Distributed Systems"];
const SD_SECTIONS_LLD = [
  "Object-Oriented Design",
  "System Design",
  "Game Design",
  "Data Structures",
  "Design Patterns",
];

const EMPTY_DIAGRAM_TEMPLATE: DiagramData = {
  subtitle: "",
  nodes: [
    {
      id: "node-1",
      x: 60,
      y: 80,
      w: 140,
      h: 48,
      label: "ServiceA",
      fill: "#1e3a8a",
    },
  ],
  edges: [],
  legend: [{ color: "#1e3a8a", label: "Service" }],
};

const parseDiagramDataShape = (
  value: string,
): { data?: DiagramData; error?: string } => {
  if (!value.trim()) return { data: undefined };

  try {
    const parsed = JSON.parse(value) as Partial<DiagramData>;
    if (typeof parsed !== "object" || parsed === null) {
      return { error: "Diagram data must be a JSON object." };
    }

    const normalized: DiagramData = {
      subtitle:
        typeof parsed.subtitle === "string" ? parsed.subtitle : undefined,
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      legend: Array.isArray(parsed.legend) ? parsed.legend : [],
    };

    return { data: normalized };
  } catch {
    return { error: "Diagram data is not valid JSON." };
  }
};

const tabs: { id: PrepTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "interview-questions", label: "Interview Qs" },
  { id: "dsa", label: "DSA" },
  { id: "hld", label: "HLD" },
  { id: "lld", label: "LLD" },
  { id: "oops", label: "OOPs" },
  { id: "language", label: "Language" },
  { id: "quizzes", label: "Quizzes" },
  { id: "cold-dms", label: "Cold DMs" },
  { id: "job-portals", label: "Job Portals" },
  { id: "notes", label: "Notes" },
  { id: "roadmaps", label: "Roadmaps" },
  { id: "mass-recruitment", label: "Mass Recruit" },
  { id: "positions", label: "Positions" },
];

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ActionBtns: React.FC<{
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ name, onEdit, onDelete }) => (
  <div className="flex gap-1">
    <button
      onClick={onEdit}
      title={`Edit ${name}`}
      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
    >
      <EditIcon />
    </button>
    <button
      onClick={onDelete}
      title={`Delete ${name}`}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
    >
      <DeleteIcon />
    </button>
  </div>
);

const DiffBadge: React.FC<{ d: string }> = ({ d }) => (
  <span
    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${d === "Easy" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : d === "Medium" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
  >
    {d}
  </span>
);

const ViewToggle: React.FC<{
  view: "table" | "grid";
  onChange: (v: "table" | "grid") => void;
}> = ({ view, onChange }) => (
  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
    <button
      onClick={() => onChange("table")}
      className={`p-1.5 transition-all ${view === "table" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
      title="Table view"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    </button>
    <button
      onClick={() => onChange("grid")}
      className={`p-1.5 transition-all ${view === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
      title="Grid view"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      </svg>
    </button>
  </div>
);

const SectionHeader: React.FC<{
  title: string;
  count: number;
  btnLabel: string;
  view: "table" | "grid";
  onViewChange: (v: "table" | "grid") => void;
  onAdd?: () => void;
}> = ({ title, count, btnLabel, view, onViewChange, onAdd }) => (
  <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
    <h3 className="text-lg font-semibold text-gray-900">
      {title}{" "}
      <span className="text-sm font-normal text-gray-400">({count})</span>
    </h3>
    <div className="flex items-center gap-3">
      <ViewToggle view={view} onChange={onViewChange} />
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
      >
        {btnLabel}
      </button>
    </div>
  </div>
);

const CardShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 ${className}`}
  >
    {children}
  </div>
);

// ─── SD Question Add / Edit Modal ────────────────────────────────────────────
interface SDQuestionModalProps {
  designType: "hld" | "lld";
  item?: AdminSDQuestion | null;
  saving: boolean;
  onSave: (
    data: Omit<AdminSDQuestion, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ) => Promise<void> | void;
  onClose: () => void;
}

const SDQuestionModal: React.FC<SDQuestionModalProps> = ({
  designType,
  item,
  saving,
  onSave,
  onClose,
}) => {
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

  const compactDiagramJson = () => {
    const parsed = parseDiagramDataShape(form.diagramData);
    if (parsed.error) {
      setDiagramError(parsed.error);
      return;
    }
    if (!parsed.data) {
      setDiagramError("Add JSON first, then compact it.");
      return;
    }
    set("diagramData", JSON.stringify(parsed.data));
    setDiagramError(null);
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

  const uploadImageToS3 = async (file: File): Promise<string> => {
    const uploadData = await prepAdminApi.getSystemDesignUploadUrl(
      file.name,
      file.type || "image/png",
    );
    if (!uploadData) {
      throw new Error(`Failed to get upload URL for ${file.name}`);
    }

    const uploadRes = await fetch(uploadData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed for ${file.name} (${uploadRes.status})`);
    }

    return uploadData.publicUrl;
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
          pendingImageFiles.map((file) => uploadImageToS3(file)),
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
      topics: topicList,
      content: form.content.trim(),
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Solution / Content
              </label>
              <textarea
                rows={4}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
                placeholder="Solution text (optional)"
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
                    onClick={compactDiagramJson}
                    className="px-2.5 py-1 text-xs font-medium rounded-md bg-white border border-gray-200 hover:bg-gray-100"
                  >
                    Collapse (Compact)
                  </button>
                </div>
              </div>
              <textarea
                rows={10}
                value={form.diagramData}
                onChange={(e) => {
                  set("diagramData", e.target.value);
                  setDiagramError(null);
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y bg-white"
                placeholder='{"nodes":[],"edges":[],"legend":[],"subtitle":""}'
              />
              <p className="mt-2 text-xs text-gray-500">
                Required top-level keys: <span className="font-mono">nodes</span>,{" "}
                <span className="font-mono">edges</span>,{" "}
                <span className="font-mono">legend</span>, optional{" "}
                <span className="font-mono">subtitle</span>.
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
};

const PrepContentManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrepTab>("overview");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [iqData, setIqData] = useState(interviewQuestions);
  const [dsaData, setDsaData] = useState(dsaProblems);
  const [quizData, setQuizData] = useState(quizzes);
  const [dmData, setDmData] = useState(coldDMTemplates);
  const [jpData, setJpData] = useState(jobPortals);
  const [noteData, setNoteData] = useState(handwrittenNotes);
  const [rmData, setRmData] = useState(roadmaps);
  const [mrData, setMrData] = useState(massRecruitmentCompanies);
  const [posData, setPosData] = useState(positionResources);
  const [hldData, setHldData] = useState<AdminSDQuestion[]>([]);
  const [lldData, setLldData] = useState<AdminSDQuestion[]>([]);
  const [sdLoading, setSdLoading] = useState(false);
  const [sdError, setSdError] = useState<string | null>(null);
  const [oopsData, setOopsData] = useState(oopsConcepts);
  const [langData, setLangData] = useState(languageConcepts);

  // SD modal state
  const [sdModal, setSdModal] = useState<{
    open: boolean;
    designType: "hld" | "lld";
    item?: AdminSDQuestion | null;
  }>({ open: false, designType: "hld" });
  const [sdSaving, setSdSaving] = useState(false);
  // Delete confirmation modal state (for SD; other tabs use window.confirm for now)
  const [deleteModal, setDeleteModal] = useState<{
    id: string;
    name: string;
    designType: "hld" | "lld";
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSdContent = useCallback(async (designType: "hld" | "lld") => {
    setSdLoading(true);
    setSdError(null);
    try {
      const resp = await prepAdminApi.listContent<AdminSDQuestion>(
        "system_design",
        { designType, limit: 200 },
      );
      if (resp.success) {
        if (designType === "hld") setHldData(resp.items ?? []);
        else setLldData(resp.items ?? []);
      } else {
        setSdError("Failed to load system design questions. Please try again.");
      }
    } catch {
      setSdError("Network error loading system design questions.");
    }
    setSdLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "hld") loadSdContent("hld");
    if (activeTab === "lld") loadSdContent("lld");
  }, [activeTab, loadSdContent]);

  // Pre-load SD counts for the overview
  useEffect(() => {
    loadSdContent("hld");
    loadSdContent("lld");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message: string, type: "success" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const confirmDelete = (
    name: string,
    id: string | number,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      )
    ) {
      setter((prev: any[]) => prev.filter((item: any) => item.id !== id));
      showToast(`"${name}" deleted successfully`, "success");
    }
  };

  const triggerEdit = (name: string) => {
    showToast(`Editing "${name}" — editor modal coming soon`, "info");
  };

  // SD-specific: open delete confirmation modal
  const openSdDeleteModal = (item: AdminSDQuestion) => {
    setDeleteModal({
      id: item.id,
      name: item.title,
      designType: item.designType,
    });
  };

  // SD-specific: open add/edit modal
  const openSdAddModal = (designType: "hld" | "lld") => {
    setSdModal({ open: true, designType, item: null });
  };
  const openSdEditModal = (item: AdminSDQuestion) => {
    setSdModal({ open: true, designType: item.designType, item });
  };

  // SD delete confirmed
  const handleSdDeleteConfirm = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    const ok = await prepAdminApi.deleteContent(
      "system_design",
      deleteModal.id,
    );
    setDeleteLoading(false);
    if (ok) {
      if (deleteModal.designType === "hld")
        setHldData((prev) => prev.filter((q) => q.id !== deleteModal.id));
      else setLldData((prev) => prev.filter((q) => q.id !== deleteModal.id));
      showToast(`"${deleteModal.name}" deleted successfully`, "success");
    } else {
      showToast("Delete failed. Please try again.", "info");
    }
    setDeleteModal(null);
  };

  // SD add/edit saved
  const handleSdSave = async (
    formData: Omit<AdminSDQuestion, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ) => {
    setSdSaving(true);
    const item = await prepAdminApi.putContentSingle<AdminSDQuestion>(
      "system_design",
      formData as Record<string, unknown>,
    );
    setSdSaving(false);
    if (item) {
      const isEdit = !!sdModal?.item?.id;
      if (sdModal?.designType === "hld") {
        setHldData((prev) =>
          isEdit
            ? prev.map((q) => (q.id === item.id ? item : q))
            : [item, ...prev],
        );
      } else {
        setLldData((prev) =>
          isEdit
            ? prev.map((q) => (q.id === item.id ? item : q))
            : [item, ...prev],
        );
      }
      showToast(
        `"${item.title}" ${isEdit ? "updated" : "added"} successfully`,
        "success",
      );
      setSdModal({ open: false, designType: sdModal?.designType ?? "hld" });
    } else {
      showToast("Save failed. Please try again.", "info");
    }
  };

  const overviewStats = [
    {
      label: "Interview Questions",
      value: iqData.length,
      color: "bg-blue-500",
    },
    { label: "DSA Problems", value: dsaData.length, color: "bg-green-500" },
    { label: "HLD Questions", value: hldData.length, color: "bg-cyan-500" },
    { label: "LLD Questions", value: lldData.length, color: "bg-sky-500" },
    { label: "OOPs Concepts", value: oopsData.length, color: "bg-violet-500" },
    {
      label: "Language Concepts",
      value: langData.length,
      color: "bg-fuchsia-500",
    },
    { label: "Quizzes", value: quizData.length, color: "bg-purple-500" },
    {
      label: "Cold DM Templates",
      value: dmData.length,
      color: "bg-orange-500",
    },
    { label: "Job Portals", value: jpData.length, color: "bg-pink-500" },
    {
      label: "Handwritten Notes",
      value: noteData.length,
      color: "bg-indigo-500",
    },
    { label: "Roadmaps", value: rmData.length, color: "bg-teal-500" },
    {
      label: "Companies (Mass Recruit)",
      value: mrData.length,
      color: "bg-red-500",
    },
    {
      label: "Position Resources",
      value: posData.length,
      color: "bg-yellow-500",
    },
  ];

  const isGrid = viewMode === "grid";

  return (
    <div className="space-y-6 relative">
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {toast && (
        <div
          style={{ animation: "slideIn 0.3s ease-out" }}
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-green-600" : "bg-blue-600"}`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-orange-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                  <span className="text-sm text-gray-500">{stat.label}</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preparation Content Status
            </h3>
            <div className="space-y-3">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-48">
                    {stat.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(100, stat.value / 10)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Interview Questions ─── */}
      {activeTab === "interview-questions" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Interview Questions"
            count={iqData.length}
            btnLabel="Add Question"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {iqData.map((q) => (
                <CardShell key={q.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={q.difficulty} />
                    <ActionBtns
                      name={q.question}
                      onEdit={() => triggerEdit(q.question)}
                      onDelete={() =>
                        confirmDelete(q.question, q.id, setIqData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {q.question}
                  </h4>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full ring-1 ring-blue-100">
                      {q.category}
                    </span>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {iqData.map((q, i) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {q.question}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={q.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.category}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={q.question}
                          onEdit={() => triggerEdit(q.question)}
                          onDelete={() =>
                            confirmDelete(q.question, q.id, setIqData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── DSA Problems ─── */}
      {activeTab === "dsa" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="DSA Problems"
            count={dsaData.length}
            btnLabel="Add Problem"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {dsaData.map((p) => (
                <CardShell key={p.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={p.difficulty} />
                    <ActionBtns
                      name={p.title}
                      onEdit={() => triggerEdit(p.title)}
                      onDelete={() => confirmDelete(p.title, p.id, setDsaData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {p.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full ring-1 ring-indigo-100">
                      {p.topic}
                    </span>
                    {p.company.slice(0, 2).map((c) => (
                      <span
                        key={c}
                        className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full ring-1 ring-gray-200"
                      >
                        {c}
                      </span>
                    ))}
                    {p.company.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{p.company.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Acceptance: {p.acceptance}%
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Companies
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dsaData.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.title}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={p.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {p.topic}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {p.company.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={p.title}
                          onEdit={() => triggerEdit(p.title)}
                          onDelete={() =>
                            confirmDelete(p.title, p.id, setDsaData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Quizzes ─── */}
      {activeTab === "quizzes" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Quizzes"
            count={quizData.length}
            btnLabel="Add Quiz"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {quizData.map((quiz) => (
                <CardShell key={quiz.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={quiz.difficulty} />
                    <ActionBtns
                      name={quiz.title}
                      onEdit={() => triggerEdit(quiz.title)}
                      onDelete={() =>
                        confirmDelete(quiz.title, quiz.id, setQuizData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {quiz.title}
                  </h4>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {quiz.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {quiz.duration} min
                    </span>
                  </div>
                  <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full ring-1 ring-purple-100">
                    {quiz.category}
                  </span>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizData.map((quiz, i) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {quiz.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.questionCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.duration} min
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={quiz.difficulty} />
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={quiz.title}
                          onEdit={() => triggerEdit(quiz.title)}
                          onDelete={() =>
                            confirmDelete(quiz.title, quiz.id, setQuizData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Cold DMs ─── */}
      {activeTab === "cold-dms" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Cold DM Templates"
            count={dmData.length}
            btnLabel="Add Template"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {dmData.map((dm) => (
                <CardShell key={dm.id}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full ring-1 ring-blue-100">
                      {dm.category}
                    </span>
                    <ActionBtns
                      name={dm.title}
                      onEdit={() => triggerEdit(dm.title)}
                      onDelete={() => confirmDelete(dm.title, dm.id, setDmData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {dm.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-3">
                    {dm.content}
                  </p>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dmData.map((dm, i) => (
                    <tr key={dm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {dm.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {dm.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={dm.title}
                          onEdit={() => triggerEdit(dm.title)}
                          onDelete={() =>
                            confirmDelete(dm.title, dm.id, setDmData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Job Portals ─── */}
      {activeTab === "job-portals" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Job Portals"
            count={jpData.length}
            btnLabel="Add Portal"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {jpData.map((portal) => (
                <CardShell key={portal.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs px-2.5 py-0.5 bg-teal-50 text-teal-600 rounded-full ring-1 ring-teal-100">
                        {portal.category}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 bg-gray-50 text-gray-500 rounded-full ring-1 ring-gray-200">
                        {portal.region}
                      </span>
                    </div>
                    <ActionBtns
                      name={portal.name}
                      onEdit={() => triggerEdit(portal.name)}
                      onDelete={() =>
                        confirmDelete(portal.name, portal.id, setJpData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {portal.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {portal.description}
                  </p>
                  {portal.url && (
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-2 inline-block truncate max-w-full"
                    >
                      {portal.url}
                    </a>
                  )}
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jpData.map((portal) => (
                    <tr key={portal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {portal.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {portal.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {portal.region}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={portal.name}
                          onEdit={() => triggerEdit(portal.name)}
                          onDelete={() =>
                            confirmDelete(portal.name, portal.id, setJpData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Notes ─── */}
      {activeTab === "notes" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Handwritten Notes"
            count={noteData.length}
            btnLabel="Upload Note"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {noteData.map((note) => (
                <CardShell key={note.id}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full ring-1 ring-indigo-100">
                      {note.topic}
                    </span>
                    <ActionBtns
                      name={note.title}
                      onEdit={() => triggerEdit(note.title)}
                      onDelete={() =>
                        confirmDelete(note.title, note.id, setNoteData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {note.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {note.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {note.pageCount} pages
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {noteData.map((note, i) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {note.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {note.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          {note.topic}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {note.pageCount}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={note.title}
                          onEdit={() => triggerEdit(note.title)}
                          onDelete={() =>
                            confirmDelete(note.title, note.id, setNoteData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Roadmaps ─── */}
      {activeTab === "roadmaps" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Roadmaps"
            count={rmData.length}
            btnLabel="Add Roadmap"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {rmData.map((rm) => (
                <CardShell key={rm.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs px-2.5 py-0.5 bg-gray-50 text-gray-600 rounded-full ring-1 ring-gray-200">
                        {rm.category}
                      </span>
                      {rm.isFree && (
                        <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full ring-1 ring-emerald-100">
                          Free
                        </span>
                      )}
                    </div>
                    <ActionBtns
                      name={rm.title}
                      onEdit={() => triggerEdit(rm.title)}
                      onDelete={() => confirmDelete(rm.title, rm.id, setRmData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {rm.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {rm.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    {rm.steps.length} steps
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Steps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Free
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rmData.map((rm, i) => (
                    <tr key={rm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {rm.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {rm.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rm.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rm.steps.length}
                      </td>
                      <td className="px-6 py-4">
                        {rm.isFree ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Free
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={rm.title}
                          onEdit={() => triggerEdit(rm.title)}
                          onDelete={() =>
                            confirmDelete(rm.title, rm.id, setRmData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Mass Recruitment ─── */}
      {activeTab === "mass-recruitment" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Mass Recruitment Companies"
            count={mrData.length}
            btnLabel="Add Company"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {mrData.map((company) => (
                <CardShell key={company.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200">
                        <img
                          src={company.logo}
                          alt=""
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).parentElement!.innerHTML =
                              `<span class="text-sm font-bold text-gray-400">${company.name.charAt(0)}</span>`;
                          }}
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {company.name}
                      </h4>
                    </div>
                    <ActionBtns
                      name={company.name}
                      onEdit={() => triggerEdit(company.name)}
                      onDelete={() =>
                        confirmDelete(company.name, company.id, setMrData)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-blue-50 rounded-lg p-2.5 text-center ring-1 ring-blue-100">
                      <p className="text-lg font-bold text-blue-700">
                        {company.interviewQuestions}
                      </p>
                      <p className="text-[10px] text-blue-500 mt-0.5">
                        Interview
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2.5 text-center ring-1 ring-emerald-100">
                      <p className="text-lg font-bold text-emerald-700">
                        {company.dsaProblems}
                      </p>
                      <p className="text-[10px] text-emerald-500 mt-0.5">DSA</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2.5 text-center ring-1 ring-amber-100">
                      <p className="text-lg font-bold text-amber-700">
                        {company.aptitudeQuestions}
                      </p>
                      <p className="text-[10px] text-amber-500 mt-0.5">
                        Aptitude
                      </p>
                    </div>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Interview Qs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      DSA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aptitude
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mrData.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {company.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.interviewQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.dsaProblems}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.aptitudeQuestions}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={company.name}
                          onEdit={() => triggerEdit(company.name)}
                          onDelete={() =>
                            confirmDelete(company.name, company.id, setMrData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── HLD ─── */}
      {activeTab === "hld" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="High Level Design Questions"
            count={hldData.length}
            btnLabel="Add Question"
            view={viewMode}
            onViewChange={setViewMode}
            onAdd={() => openSdAddModal("hld")}
          />
          {sdLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading HLD questions...</p>
            </div>
          ) : sdError ? (
            <div className="p-8 text-center text-red-600">
              <p className="font-medium">{sdError}</p>
              <button
                onClick={() => loadSdContent("hld")}
                className="mt-3 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : hldData.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="font-medium">No HLD questions yet.</p>
              <button
                onClick={() => openSdAddModal("hld")}
                className="mt-3 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Add your first question
              </button>
            </div>
          ) : isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {hldData.map((q) => (
                <CardShell key={q.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DiffBadge d={q.difficulty} />
                    </div>
                    <ActionBtns
                      name={q.title}
                      onEdit={() => openSdEditModal(q)}
                      onDelete={() => openSdDeleteModal(q)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {q.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {q.description}
                  </p>
                  <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-cyan-50 text-cyan-600 rounded-full ring-1 ring-cyan-100">
                    {q.section}
                  </span>
                  {q.additionalImageUrls?.length > 0 && (
                    <span className="ml-2 mt-3 inline-block text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full ring-1 ring-purple-100">
                      {q.additionalImageUrls.length} image
                      {q.additionalImageUrls.length > 1 ? "s" : ""}
                    </span>
                  )}
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Images
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {hldData.map((q, i) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {q.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {q.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.section}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={q.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.additionalImageUrls?.length ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={q.title}
                          onEdit={() => openSdEditModal(q)}
                          onDelete={() => openSdDeleteModal(q)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── LLD ─── */}
      {activeTab === "lld" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Low Level Design Questions"
            count={lldData.length}
            btnLabel="Add Question"
            view={viewMode}
            onViewChange={setViewMode}
            onAdd={() => openSdAddModal("lld")}
          />
          {sdLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-7 h-7 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-500">Loading LLD questions...</p>
            </div>
          ) : sdError ? (
            <div className="p-8 text-center text-red-600">
              <p className="font-medium">{sdError}</p>
              <button
                onClick={() => loadSdContent("lld")}
                className="mt-3 px-4 py-2 text-sm bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : lldData.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="font-medium">No LLD questions yet.</p>
              <button
                onClick={() => openSdAddModal("lld")}
                className="mt-3 px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Add your first question
              </button>
            </div>
          ) : isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {lldData.map((q) => (
                <CardShell key={q.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DiffBadge d={q.difficulty} />
                    </div>
                    <ActionBtns
                      name={q.title}
                      onEdit={() => openSdEditModal(q)}
                      onDelete={() => openSdDeleteModal(q)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {q.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {q.description}
                  </p>
                  <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-sky-50 text-sky-600 rounded-full ring-1 ring-sky-100">
                    {q.section}
                  </span>
                  {q.additionalImageUrls?.length > 0 && (
                    <span className="ml-2 mt-3 inline-block text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full ring-1 ring-purple-100">
                      {q.additionalImageUrls.length} image
                      {q.additionalImageUrls.length > 1 ? "s" : ""}
                    </span>
                  )}
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Images
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lldData.map((q, i) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {q.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {q.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.section}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={q.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.additionalImageUrls?.length ?? 0}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={q.title}
                          onEdit={() => openSdEditModal(q)}
                          onDelete={() => openSdDeleteModal(q)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── OOPs ─── */}
      {activeTab === "oops" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="OOPs Concepts"
            count={oopsData.length}
            btnLabel="Add Concept"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {oopsData.map((c) => (
                <CardShell key={c.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={c.difficulty} />
                    <ActionBtns
                      name={c.title}
                      onEdit={() => triggerEdit(c.title)}
                      onDelete={() => confirmDelete(c.title, c.id, setOopsData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {c.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {c.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full ring-1 ring-violet-100">
                      {c.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full ring-1 ring-gray-200">
                      {c.language}
                    </span>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {oopsData.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {c.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.category}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={c.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.language}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={c.title}
                          onEdit={() => triggerEdit(c.title)}
                          onDelete={() =>
                            confirmDelete(c.title, c.id, setOopsData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Language ─── */}
      {activeTab === "language" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Language Fundamentals"
            count={langData.length}
            btnLabel="Add Concept"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {langData.map((c) => (
                <CardShell key={c.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={c.difficulty} />
                    <ActionBtns
                      name={c.title}
                      onEdit={() => triggerEdit(c.title)}
                      onDelete={() => confirmDelete(c.title, c.id, setLangData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {c.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {c.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded-full ring-1 ring-fuchsia-100">
                      {c.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full ring-1 ring-gray-200">
                      {c.language}
                    </span>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {langData.map((c, i) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {c.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {c.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.category}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={c.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {c.language}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={c.title}
                          onEdit={() => triggerEdit(c.title)}
                          onDelete={() =>
                            confirmDelete(c.title, c.id, setLangData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Positions ─── */}
      {activeTab === "positions" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Position Resources"
            count={posData.length}
            btnLabel="Add Position"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {posData.map((pos) => (
                <CardShell key={pos.id}>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {pos.role}
                    </h4>
                    <ActionBtns
                      name={pos.role}
                      onEdit={() => triggerEdit(pos.role)}
                      onDelete={() =>
                        confirmDelete(pos.role, pos.id, setPosData)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 rounded-lg p-2 text-center ring-1 ring-blue-100">
                      <p className="text-base font-bold text-blue-700">
                        {pos.interviewQuestions}
                      </p>
                      <p className="text-[10px] text-blue-500">Interview</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center ring-1 ring-emerald-100">
                      <p className="text-base font-bold text-emerald-700">
                        {pos.dsaQuestions}
                      </p>
                      <p className="text-[10px] text-emerald-500">DSA</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2 text-center ring-1 ring-amber-100">
                      <p className="text-base font-bold text-amber-700">
                        {pos.aptitudeQuestions}
                      </p>
                      <p className="text-[10px] text-amber-500">Aptitude</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-purple-50 rounded-lg p-2 text-center ring-1 ring-purple-100">
                      <p className="text-base font-bold text-purple-700">
                        {pos.sqlQuestions}
                      </p>
                      <p className="text-[10px] text-purple-500">SQL</p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-2 text-center ring-1 ring-pink-100">
                      <p className="text-base font-bold text-pink-700">
                        {pos.coreCSQuestions}
                      </p>
                      <p className="text-[10px] text-pink-500">Core CS</p>
                    </div>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Interview Qs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      DSA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aptitude
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SQL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Core CS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posData.map((pos) => (
                    <tr key={pos.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {pos.role}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pos.interviewQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pos.dsaQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pos.aptitudeQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pos.sqlQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {pos.coreCSQuestions}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={pos.role}
                          onEdit={() => triggerEdit(pos.role)}
                          onDelete={() =>
                            confirmDelete(pos.role, pos.id, setPosData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── SD Add/Edit Modal ─── */}
      {sdModal.open && (
        <SDQuestionModal
          designType={sdModal.designType}
          item={sdModal.item ?? null}
          saving={sdSaving}
          onSave={handleSdSave}
          onClose={() =>
            setSdModal({ open: false, designType: sdModal.designType })
          }
        />
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Question
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                "{deleteModal.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSdDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrepContentManagementPage;
