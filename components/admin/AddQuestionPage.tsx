import React, { useState, useEffect } from "react";
import { CompanyNames as MRC } from "../../data/preparationMockData";

interface Props {
  item?: any | null;
  onClose: () => void;
  onRefresh?: () => void;
}

const initialFormState = {
  title: "",
  description: "",
  section: "Interview Ques",
  role: "SDE",
  difficulty: "Medium",
  topic: "",
  company: "",
};

const AddQuestionPage = ({ item, onClose, onRefresh }: Props) => {
  const isEditMode = !!item;

  const sections = ["DSA", "Interview Ques", "Aptitude"];
  const roles = [
    "Frontend Developer",
    "Backend Developer",
    "Fullstack Developer",
    "SDE",
    "SDET QA",
    "Data Analytics",
  ];
  const dsaTopics = [
    "Array",
    "String",
    "Trees",
    "Graphs",
    "DP",
    "Stacks",
    "Queues",
    "Linked List",
  ];

  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);

  // ✅ Populate form in edit mode
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
    } else {
      setForm(initialFormState);
    }
  }, [item]);

  const updateField = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setForm(initialFormState);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return;

    setSaving(true);

    try {
      const method = isEditMode ? "PUT" : "POST";

      const id =
        item?.id ?? item?._id ?? item?.question_id ?? null;

      if (isEditMode && !id) {
        throw new Error("Missing ID for update");
      }

      const payload = {
        ...(isEditMode && { id }),
        action: isEditMode
          ? "update_content_single"
          : "put_content_single",

        title: form.title.trim(),
        description: form.description?.trim() ?? "",
        role: form.role,
        difficulty: form.difficulty,
        company: form.company,
        section: form.section,
        topic:
          form.section === "DSA"
            ? form.topic || "General"
            : "",
      };

      console.log("FINAL PAYLOAD:", payload);

      const response = await fetch(
        "https://rls3p3m4fd.execute-api.ap-south-2.amazonaws.com/questions_admin_handler",
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("API ERROR:", result);
        throw new Error(result.message || "API Error");
      }

      alert(
        isEditMode
          ? "Question Updated Successfully!"
          : "New Question Added!"
      );

      onRefresh?.();
      handleClose();
    } catch (err: any) {
      console.error("Submission Error:", err);
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            {isEditMode ? "Edit Question" : "Add New Question"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col min-h-0"
        >
          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Question Title
              </label>
              <input
                required
                value={form.title}
                onChange={(e) =>
                  updateField("title", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Role & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    updateField("role", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    updateField("difficulty", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Section & Topic */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Section
                </label>
                <select
                  value={form.section}
                  onChange={(e) =>
                    updateField("section", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-xl"
                >
                  {sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Topic
                </label>
                <select
                  disabled={form.section !== "DSA"}
                  value={form.topic}
                  onChange={(e) =>
                    updateField("topic", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-xl disabled:bg-gray-100"
                >
                  <option value="">Select Topic</option>
                  {dsaTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Company
              </label>
              <select
                value={form.company}
                onChange={(e) =>
                  updateField("company", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-xl"
              >
                <option value="">Select Company</option>
                {MRC.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Answer / Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  updateField("description", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-600 font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="px-8 py-2 text-white rounded-xl font-bold shadow-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              {saving
                ? "Processing..."
                : isEditMode
                ? "UPDATE QUESTION"
                : "ADD QUESTION"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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