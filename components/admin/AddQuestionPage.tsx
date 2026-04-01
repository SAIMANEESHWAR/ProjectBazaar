import React, { useState } from "react";
import {massRecruitmentCompanies as MRC} from "../../data/preparationMockData";

interface Props {
  item?: any | null;
  onClose: () => void; // Required
  onSave: (data: any) => Promise<void>; // Required
}

const AddQuestionPage = ({ item, onClose, onSave }: Props) => {
  const sections = ["DSA", "Interview Ques", "Aptitude"];
  const difficulties = ["Easy", "Medium", "Hard"];

  // Dummy data for company selection - in a real app, this might come from a prop or API
  const availableCompanies = MRC.map(company => company.name)

  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    section: item?.section ?? sections[0],
    difficulty: item?.difficulty ?? "Medium",
    topics: (item?.topics ?? []).join(", "),
    companies: item?.companies ?? [],
  });

  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCompanyChange = (company: string) => {
    setForm((prev) => {
      const exists = prev.companies.includes(company);
      return {
        ...prev,
        companies: exists
          ? prev.companies.filter((c: string) => c !== company)
          : [...prev.companies, company],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required");

    setSaving(true);
    try {
      const topicList = form.topics
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);

      const payload = {
        ...(item?.id ? { id: item.id } : {}),
        title: form.title.trim(),
        description: form.description.trim(),
        section: form.section,
        difficulty: form.difficulty,
        topics: topicList,
        companies: form.companies,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {item ? "Edit" : "Add"} Company Question
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-6 space-y-5 overflow-y-auto">

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Reverse a Linked List"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Section Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => updateField("section", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Difficulty Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Companies Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tagged Companies
              </label>
              <div className="flex gap-2 flex-wrap">
                {availableCompanies.map((company) => (
                  <button
                    type="button"
                    key={company}
                    onClick={() => handleCompanyChange(company)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.companies.includes(company)
                        ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"
                      }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>

            {/* Topics Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma separated)</label>
              <input
                value={form.topics}
                onChange={(e) => updateField("topics", e.target.value)}
                placeholder="Linked List, Pointers, Recursion"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                item ? "Update Question" : "Add Question"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionPage;