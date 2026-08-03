import React, { useEffect, useState } from "react";
import PrepRichTextEditor from "./PrepRichTextEditor";
import {
  isRichHtmlEmpty,
  richHtmlToPlainText,
} from "../preparation/PrepRichContentRenderer";

export type AdminInterviewQuestion = {
  id: string;
  question: string;
  difficulty: string;
  category: string;
  role: string;
  tags: string[];
  answer: string;
  hints: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type InterviewQuestionSavePayload = Omit<
  AdminInterviewQuestion,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

interface InterviewQuestionModalProps {
  item?: AdminInterviewQuestion | null;
  saving: boolean;
  onSave: (data: InterviewQuestionSavePayload) => Promise<void> | void;
  onClose: () => void;
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export function interviewQuestionPlainText(question: string): string {
  return richHtmlToPlainText(question) || question;
}

export default function InterviewQuestionModal({
  item,
  saving,
  onSave,
  onClose,
}: InterviewQuestionModalProps) {
  const [form, setForm] = useState({
    question: item?.question ?? "",
    difficulty: item?.difficulty ?? "Medium",
    category: item?.category ?? "",
    role: item?.role ?? "",
    tags: (item?.tags ?? []).join(", "),
    answer: item?.answer ?? "",
    hints: (item?.hints ?? []).join("\n"),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      question: item?.question ?? "",
      difficulty: item?.difficulty ?? "Medium",
      category: item?.category ?? "",
      role: item?.role ?? "",
      tags: (item?.tags ?? []).join(", "),
      answer: item?.answer ?? "",
      hints: (item?.hints ?? []).join("\n"),
    });
    setError(null);
  }, [item]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRichHtmlEmpty(form.question)) {
      setError("Question is required.");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const hints = form.hints
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean);

    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      question: form.question.trim(),
      difficulty: form.difficulty || "Medium",
      category: form.category.trim(),
      role: form.role.trim(),
      tags,
      answer: isRichHtmlEmpty(form.answer) ? "" : form.answer.trim(),
      hints,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] my-2 sm:my-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {item?.id ? "Edit Interview Question" : "Add Interview Question"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Same rich editor as System Design — bold, lists, code, and image
              upload.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => set("difficulty", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Behavioral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. SDE"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags{" "}
                <span className="text-xs text-gray-400">(comma-separated)</span>
              </label>
              <input
                value={form.tags}
                onChange={(e) => set("tags", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. leadership, conflict"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question <span className="text-red-500">*</span>
              </label>
              <PrepRichTextEditor
                value={form.question}
                onChange={(html) => set("question", html)}
                placeholder="Write the question — bold, lists, code, images…"
                minHeight="160px"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer / Model response
              </label>
              <PrepRichTextEditor
                value={form.answer}
                onChange={(html) => set("answer", html)}
                placeholder="Ideal answer — headings, bold, lists, code, images…"
                minHeight="280px"
                disabled={saving}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Use the toolbar for bold, lists, links, code snippets, and image
                upload (drag/drop or paste also works).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hints
              </label>
              <textarea
                rows={3}
                value={form.hints}
                onChange={(e) => set("hints", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="One hint per line"
              />
              <p className="mt-1 text-xs text-gray-500">One hint per line.</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isRichHtmlEmpty(form.question)}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving…" : item?.id ? "Save question" : "Add question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
