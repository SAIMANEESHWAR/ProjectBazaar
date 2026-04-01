import React, { useState } from "react";

type Difficulty = "easy" | "medium" | "hard";
type Category = "dsa" | "aptitude" | "core cs" | "interview" | "system design";

const companies = ["Google", "Amazon"];
const roles = [
  "Frontend",
  "Backend",
  "Cyber Sec",
  "DevOps",
  "Blockchain",
  "Data Analytics",
  "Data Science",
  "Android",
];

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("dsa");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggle = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(
      list.includes(value)
        ? list.filter((i) => i !== value)
        : [...list, value]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Create Question</h2>

        {/* Title */}
        <input
          type="text"
          placeholder="Enter title"
          className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Description */}
        <textarea
          placeholder="Enter description"
          className="w-full border rounded-lg px-3 py-2 mb-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Category */}
        <select
          className="w-full border rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="dsa">DSA</option>
          <option value="aptitude">Aptitude</option>
          <option value="core cs">Core CS</option>
          <option value="interview">Interview</option>
          <option value="system design">System Design</option>
        </select>

        {/* Difficulty */}
        <select
          className="w-full border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Companies */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Companies</p>
          <div className="flex flex-wrap gap-2">
            {companies.map((c) => (
              <button
                key={c}
                onClick={() => toggle(c, selectedCompanies, setSelectedCompanies)}
                className={`px-3 py-1 rounded-full text-sm border transition
                  ${
                    selectedCompanies.includes(c)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Roles */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Roles</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => toggle(r, selectedRoles, setSelectedRoles)}
                className={`px-3 py-1 rounded-full text-sm border transition
                  ${
                    selectedRoles.includes(r)
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-gray-100 text-gray-700"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              console.log({
                title,
                description,
                category,
                difficulty,
                selectedCompanies,
                selectedRoles,
              });
              onClose();
            }}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-70 flex items-center gap-2"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;