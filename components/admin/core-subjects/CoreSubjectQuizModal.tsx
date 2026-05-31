import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  type CoreSubjectQuizQuestion,
  type CoreSubjectTopicQuiz,
} from "../../../data/coreSubjectQuizTypes";

export interface CoreSubjectQuizModalProps {
  topic: string;
  subjectSlug: string;
  subjectTitle: string;
  quiz: CoreSubjectTopicQuiz | null;
  saving: boolean;
  onSave: (quiz: Omit<CoreSubjectTopicQuiz, "questionCount" | "id"> & { id?: string }) => void;
  onClose: () => void;
}

function emptyQuestion(): CoreSubjectQuizQuestion {
  return {
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  };
}

export default function CoreSubjectQuizModal({
  topic,
  subjectSlug,
  subjectTitle,
  quiz,
  saving,
  onSave,
  onClose,
}: CoreSubjectQuizModalProps) {
  const [title, setTitle] = useState(quiz?.title ?? `Quiz ${topic}`);
  const [description, setDescription] = useState(
    quiz?.description ?? `Let's get started and see how much you've learned.`,
  );
  const [passingScore, setPassingScore] = useState(quiz?.passingScore ?? 70);
  const [questions, setQuestions] = useState<CoreSubjectQuizQuestion[]>(
    quiz?.questions?.length ? quiz.questions : [emptyQuestion()],
  );

  useEffect(() => {
    setTitle(quiz?.title ?? `Quiz ${topic}`);
    setDescription(
      quiz?.description ?? `Let's get started and see how much you've learned.`,
    );
    setPassingScore(quiz?.passingScore ?? 70);
    setQuestions(quiz?.questions?.length ? quiz.questions : [emptyQuestion()]);
  }, [quiz, topic]);

  const updateQuestion = (index: number, patch: Partial<CoreSubjectQuizQuestion>) => {
    setQuestions((prev) => prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((entry, i) => {
        if (i !== questionIndex) return entry;
        const nextOptions = [...entry.options];
        nextOptions[optionIndex] = value;
        return { ...entry, options: nextOptions };
      }),
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = questions
      .map((entry) => ({
        ...entry,
        question: entry.question.trim(),
        options: entry.options.map((opt) => opt.trim()).filter(Boolean),
      }))
      .filter((entry) => entry.question && entry.options.length >= 2);

    if (cleaned.length === 0) return;

    onSave({
      ...(quiz?.id ? { id: quiz.id } : {}),
      title: title.trim() || `Quiz ${topic}`,
      description: description.trim(),
      subject: subjectSlug,
      topic,
      scope: "core_subjects",
      passingScore,
      duration: 0,
      questions: cleaned,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {quiz?.id ? "Edit Topic Quiz" : "Add Topic Quiz"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {subjectTitle} / {topic}
              </p>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Quiz title</span>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Passing score (%)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value) || 70)}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">Questions</p>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100"
              >
                <Plus className="h-4 w-4" />
                Add question
              </button>
            </div>

            {questions.map((entry, questionIndex) => (
              <div key={questionIndex} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-gray-700">Question {questionIndex + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-gray-400 hover:text-red-500"
                    title="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  required
                  value={entry.question}
                  onChange={(e) => updateQuestion(questionIndex, { question: e.target.value })}
                  rows={2}
                  placeholder="Enter the question"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
                <div className="space-y-2">
                  {entry.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={entry.correctAnswer === optionIndex}
                        onChange={() => updateQuestion(questionIndex, { correctAnswer: optionIndex })}
                      />
                      <input
                        value={option}
                        onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </label>
                  ))}
                </div>
                <input
                  value={entry.explanation ?? ""}
                  onChange={(e) => updateQuestion(questionIndex, { explanation: e.target.value })}
                  placeholder="Explanation (optional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
            >
              {saving ? "Saving…" : quiz?.id ? "Save quiz" : "Create quiz"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
