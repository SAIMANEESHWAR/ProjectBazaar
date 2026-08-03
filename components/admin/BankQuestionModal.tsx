import React, { useEffect, useState } from "react";
import PrepRichTextEditor from "./PrepRichTextEditor";
import {
  isRichHtmlEmpty,
  richHtmlToPlainText,
} from "../preparation/PrepRichContentRenderer";
import type { PrepSubTabKey } from "../../data/prepConfig";

export type BankQuestionScope = "mass_recruitment" | "position_resources";

export type AdminBankQuestion = {
  id: string;
  question: string;
  answer?: string;
  category?: string;
  difficulty: string;
  subType: string;
  companyId?: string;
  companyName?: string;
  logo?: string;
  roleId?: string;
  roleLabel?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type BankQuestionSavePayload = Omit<
  AdminBankQuestion,
  "id" | "createdAt" | "updatedAt"
> & { id?: string };

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

const SUB_TYPES: { value: PrepSubTabKey; label: string }[] = [
  { value: "interview", label: "Interview Questions" },
  { value: "dsa", label: "DSA" },
  { value: "aptitude", label: "Aptitude" },
  { value: "sql", label: "SQL" },
  { value: "corecs", label: "Core CS" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface BankQuestionModalProps {
  scope: BankQuestionScope;
  item?: AdminBankQuestion | null;
  saving: boolean;
  defaultSubType?: string;
  onSave: (data: BankQuestionSavePayload) => Promise<void> | void;
  onClose: () => void;
}

export function bankQuestionPlainText(question: string): string {
  return richHtmlToPlainText(question) || question;
}

export default function BankQuestionModal({
  scope,
  item,
  saving,
  defaultSubType = "interview",
  onSave,
  onClose,
}: BankQuestionModalProps) {
  const isCompany = scope === "mass_recruitment";

  const [form, setForm] = useState({
    question: item?.question ?? "",
    answer: item?.answer ?? "",
    difficulty: item?.difficulty ?? "Medium",
    category: item?.category ?? "",
    subType: item?.subType || defaultSubType,
    companyName: item?.companyName ?? "",
    companyId: item?.companyId ?? "",
    logo: item?.logo ?? "",
    roleLabel: item?.roleLabel ?? "",
    roleId: item?.roleId ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      question: item?.question ?? "",
      answer: item?.answer ?? "",
      difficulty: item?.difficulty ?? "Medium",
      category: item?.category ?? "",
      subType: item?.subType || defaultSubType,
      companyName: item?.companyName ?? "",
      companyId: item?.companyId ?? "",
      logo: item?.logo ?? "",
      roleLabel: item?.roleLabel ?? "",
      roleId: item?.roleId ?? "",
    });
    setError(null);
  }, [item, defaultSubType]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRichHtmlEmpty(form.question)) {
      setError("Question is required.");
      return;
    }

    if (isCompany) {
      const companyName = form.companyName.trim();
      if (!companyName) {
        setError("Company name is required.");
        return;
      }
      const companyId = (form.companyId.trim() || slugify(companyName)).trim();
      await onSave({
        ...(item?.id ? { id: item.id } : {}),
        question: form.question.trim(),
        answer: isRichHtmlEmpty(form.answer) ? "" : form.answer.trim(),
        difficulty: form.difficulty || "Medium",
        category: form.category.trim(),
        subType: form.subType || "interview",
        companyId,
        companyName,
        logo:
          form.logo.trim() ||
          `https://www.google.com/s2/favicons?sz=64&domain=${companyId}.com`,
      });
      return;
    }

    const roleLabel = form.roleLabel.trim();
    if (!roleLabel) {
      setError("Role label is required.");
      return;
    }
    const roleId = (form.roleId.trim() || slugify(roleLabel)).trim();
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      question: form.question.trim(),
      answer: isRichHtmlEmpty(form.answer) ? "" : form.answer.trim(),
      difficulty: form.difficulty || "Medium",
      category: form.category.trim(),
      subType: form.subType || "interview",
      roleId,
      roleLabel,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] my-2 sm:my-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {item?.id ? "Edit" : "Add"}{" "}
              {isCompany ? "Company" : "Role"} Question
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
            {isCompany ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.companyName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        companyName: name,
                        companyId:
                          prev.companyId && item?.id
                            ? prev.companyId
                            : slugify(name),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. TCS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company ID
                  </label>
                  <input
                    value={form.companyId}
                    onChange={(e) => set("companyId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="tcs"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role label <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.roleLabel}
                    onChange={(e) => {
                      const label = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        roleLabel: label,
                        roleId:
                          prev.roleId && item?.id
                            ? prev.roleId
                            : slugify(label),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Backend Developer role"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role ID
                  </label>
                  <input
                    value={form.roleId}
                    onChange={(e) => set("roleId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="backend"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={form.subType}
                  onChange={(e) => set("subType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {SUB_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
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
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question <span className="text-red-500">*</span>
              </label>
              <PrepRichTextEditor
                value={form.question}
                onChange={(html) => set("question", html)}
                placeholder="Write the question — bold, lists, code, images…"
                minHeight="180px"
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
                minHeight="240px"
                disabled={saving}
              />
              <p className="mt-1.5 text-xs text-gray-500">
                Use the toolbar for bold, lists, links, code snippets, and image
                upload (drag/drop or paste also works).
              </p>
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
