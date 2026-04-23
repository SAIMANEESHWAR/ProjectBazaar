import React, { useState } from "react";
import { massRecruitmentCompanies as MRC } from "../../data/preparationMockData";

interface Props {
  item?: any | null; 
  onClose: () => void;
  onRefresh?: () => void; 
}

const AddQuestionPage = ({ item, onClose }: Props) => {
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

  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "", // This serves as the 'Answer'
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

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        action: "put_content_single",
        item: {
          title: form.title.trim(),
          description: form.description.trim(),
          role: form.role,
          difficulty: form.difficulty,
          company: form.company,
          topic: form.section === "DSA" ? form.topic : form.section,
        }
      };

      const response = await fetch("https://rls3p3m4fd.execute-api.ap-south-2.amazonaws.com/questions_admin_handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // This will now show the detailed error from the Python logic above
        throw new Error(`[${result.error}] ${result.details}`);
      }

      alert("Success! Question Saved.");
      onClose();
    } catch (err: any) {
      console.error("Full Error:", err);
      // Detailed alert for the user
      alert(`Submission Failed:\n${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{item ? "Edit" : "Add"} Question</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required value={form.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => updateField("role", e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none">
                  {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <select value={form.section} onChange={(e) => updateField("section", e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none">
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <select disabled={form.section !== "DSA"} value={form.topic} onChange={(e) => updateField("topic", e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none disabled:bg-gray-50">
                  <option value="">-- Select --</option>
                  {dsaTopics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select value={form.company} onChange={(e) => updateField("company", e.target.value)} className="w-full px-4 py-2 border rounded-xl outline-none">
                <option value="">Select Company</option>
                {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer / Description</label>
              <textarea rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-orange-500 text-white rounded-xl shadow-md disabled:opacity-50">
              {saving ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionPage;