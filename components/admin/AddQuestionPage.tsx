import React, { useState, useEffect } from "react";
import { CompanyNames as MRC } from "../../data/preparationMockData";

interface Props {
  item?: any | null;
  onClose: () => void;
  onRefresh?: () => void;
}

// const initialFormState = {
//   title: "",
//   description: "",
//   section: "Interview Ques",
//   role: "SDE",
//   difficulty: "Medium",
//   topic: "",
//   company: "",
// };

// import React, { useState, useEffect } from "react";
// import { CompanyNames as MRC } from "../../data/preparationMockData";

// interface Props {
//   item?: any | null;
//   onClose: () => void;
//   onRefresh?: () => void;
// }

const AddQuestionPage = ({ item, onClose, onRefresh }: Props) => {
  const isEditMode = !!item;

  const sections = ["DSA", "Interview Ques", "Aptitude"];
  const roles = ["Frontend Developer", "Backend Developer", "Fullstack Developer", "SDE", "SDET QA", "Data Analytics"];
  const dsaTopics = ["Array", "String", "Trees", "Graphs", "DP", "Stacks", "Queues", "Linked List"];

  // ✅ Initialize state directly from item if it exists
  const [form, setForm] = useState({
    title: item?.title ?? "",
    description: item?.description ?? "",
    section: item?.section ?? "Interview Ques",
    role: item?.role ?? "SDE",
    difficulty: item?.difficulty ?? "Medium",
    topic: item?.topic ?? "",
    company: item?.company ?? "",
  });

  const [saving, setSaving] = useState(false);

  // ✅ Re-sync form state ONLY when item changes
  useEffect(() => {
    if (item) {
      setForm({
        title: item.title ?? "",
        description: item.description ?? "",
        section: item.section ?? "Interview Ques",
        role: item.role ?? "SDE",
        difficulty: item.difficulty ?? "Medium",
        topic: item.topic ?? "",
        company: item.company ?? "",
      });
    }
  }, [item]);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    try {
      const id = item?.id || item?._id || item?.pk?.replace("QUESTION#", "");
      const method = isEditMode ? "PUT" : "POST";

      const payload = {
        item: {
          ...(isEditMode && { id }), // ✅ only include when updating
          title: form.title.trim(),
          description: form.description.trim(),
          role: form.role,
          difficulty: form.difficulty.toUpperCase(),
          company: form.company,
          section: form.section,
          topic: form.section === "DSA" ? form.topic : form.section,
        }
      };

      if (isEditMode && !id) {
        alert("Invalid item: missing ID");
        return;
      }

      console.log("SENDING PAYLOAD:", payload);

      const response = await fetch("https://rls3p3m4fd.execute-api.ap-south-2.amazonaws.com/questions_admin_handler", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API ERROR:", data);
        throw new Error(data.error || data.message || "Update failed");
      }

      alert(isEditMode ? "Updated!" : "Added!");
      onRefresh?.();
      onClose(); // Parent handles cleanup
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">{isEditMode ? "Edit Question" : "Add Question"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Title */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Title</label>
            <input required value={form.title} onChange={(e) => updateField("title", e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
              <select value={form.role} onChange={(e) => updateField("role", e.target.value)} className="w-full p-2 border rounded-lg outline-none">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {/* Difficulty */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => updateField("difficulty", e.target.value)} className="w-full p-2 border rounded-lg outline-none">
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Section */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Section</label>
              <select value={form.section} onChange={(e) => updateField("section", e.target.value)} className="w-full p-2 border rounded-lg outline-none">
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* Topic */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Topic (DSA Only)</label>
              <select
                disabled={form.section !== "DSA"}
                value={form.topic}
                onChange={(e) => updateField("topic", e.target.value)}
                className="w-full p-2 border rounded-lg outline-none disabled:bg-gray-100"
              >
                <option value="">Select Topic</option>
                {dsaTopics.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Company</label>
            <select value={form.company} onChange={(e) => updateField("company", e.target.value)} className="w-full p-2 border rounded-lg outline-none">
              <option value="">Select Company</option>
              {MRC.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase">Answer</label>
            <textarea rows={4} value={form.description} onChange={(e) => updateField("description", e.target.value)} className="w-full p-2 border rounded-lg outline-none resize-none focus:ring-2 focus:ring-orange-400" />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-500 font-semibold">Cancel</button>
            <button type="submit" disabled={saving} className={`px-10 py-2 rounded-xl text-white font-bold shadow-lg ${isEditMode ? 'bg-blue-600' : 'bg-orange-500'}`}>
              {saving ? "SAVING..." : isEditMode ? "UPDATE" : "SUBMIT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// export { AddQuestionPage };

// ✅ Delete API
const DeleteQuestions = async (id: string) => {
  try {
    const response = await fetch(
      "https://rls3p3m4fd.execute-api.ap-south-2.amazonaws.com/questions_admin_handler",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }
    );

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, message: error.message };
  }
};

export { AddQuestionPage, DeleteQuestions };