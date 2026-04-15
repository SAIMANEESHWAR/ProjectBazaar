import React, { useState } from "react";
import { massRecruitmentCompanies as MRC } from "../../data/preparationMockData";

interface Props {
  item?: any | null; // If item exists, we are in EDIT mode
  onClose: () => void;
  onRefresh?: () => void; // Call this to refresh the list after saving
}

const AddQuestionPage = ({ item, onClose, onRefresh }: Props) => {
  const sections = ["DSA", "Interview Ques", "Aptitude"];
  const difficulties = ["Easy", "Medium", "Hard"];
  
  const roles = [
    "Frontend Developer", "Backend Developer", "Fullstack Developer", 
    "UI-UX Designer", "SDE", "SDET QA", "Cloud Engineer", 
    "DevOps", "Data Analytics and Science"
  ];

  const dsaTopics = [
    "Array", "String", "Trees", "Graphs", "DP", 
    "Stacks", "Queues", "Linked List", "Bits", "Heaps", "Hashmaps"
  ];

  const availableCompanies = MRC.map((company) => company.name);

  // --- FORM STATE ---
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    section: item?.section ?? sections[0], 
    role: item?.role ?? roles[4], 
    difficulty: item?.difficulty ?? "Medium",
    topic: item?.topic ?? "",
    company: item?.company ?? "",
  });

  const [saving, setSaving] = useState(false);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // =========================================================
  // 🐍 CALLING THE PYTHON FLASK BACKEND
  // =========================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.title.trim()) return alert("Title is required");
    if (!form.company) return alert("Company is required");
    if (form.section === "DSA" && !form.topic) return alert("Topic is required for DSA");

    setSaving(true);

    try {
      // 1. Prepare Payload
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        role: form.role.toUpperCase(),
        difficulty: form.difficulty.toUpperCase(),
        company: form.company.toUpperCase(),
        topic: form.section === "DSA" ? form.topic.toUpperCase() : "GENERAL",
      };

      // 2. Determine URL (POST for new, PUT for edit)
      const baseUrl = "https://5000-cs-1153eff4-c05e-4332-b59a-c3a91371be60.cs-asia-southeast1-ajrg.cloudshell.dev/questions";
      const url = item?.id ? `${baseUrl}/${item.id}` : baseUrl;
      const method = item?.id ? "PUT" : "POST";

      // 3. The Fetch Call
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save");
      }

      alert(item ? "Updated successfully!" : "Question added to DynamoDB!");
      if (onRefresh) onRefresh(); // Trigger a list reload in parent
      onClose();
    } catch (err: any) {
      console.error("API Error:", err);
      alert(`Backend Error: ${err.message}`);
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-6 space-y-5 overflow-y-auto">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Merge Intervals"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Role + Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
                <select
                  value={form.role}
                  onChange={(e) => updateField("role", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Section (Blocking Logic) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => {
                    updateField("section", e.target.value);
                    if (e.target.value !== "DSA") updateField("topic", ""); 
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* ✅ TOPIC IS BLOCKED UNLESS DSA IS SELECTED */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${form.section === "DSA" ? "text-gray-700" : "text-gray-300"}`}>
                  DSA Topic
                </label>
                <select
                  disabled={form.section !== "DSA"}
                  value={form.topic}
                  onChange={(e) => updateField("topic", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-xl outline-none transition-all ${
                    form.section === "DSA" 
                      ? "border-gray-200 focus:ring-2 focus:ring-orange-500 bg-white" 
                      : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  <option value="">-- Choose Topic --</option>
                  {dsaTopics.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={form.company}
                onChange={(e) => updateField("company", e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="">Select Company</option>
                {availableCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
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

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md disabled:opacity-70">
              {saving ? "Saving..." : item ? "Update Question" : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionPage;