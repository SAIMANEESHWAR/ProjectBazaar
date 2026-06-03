export interface CoreSubjectQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface CoreSubjectTopicQuiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  scope: "core_subjects" | "global";
  questionCount: number;
  passingScore: number;
  duration: number;
  questions: CoreSubjectQuizQuestion[];
}

export interface CoreSubjectQuizQuestionPublic {
  question: string;
  options: string[];
}

export interface CoreSubjectTopicQuizPublic {
  id: string;
  title: string;
  description: string;
  subject: string;
  topic: string;
  scope: string;
  questionCount: number;
  passingScore: number;
  duration: number;
  questions: CoreSubjectQuizQuestionPublic[];
}

export function mapCoreSubjectQuizFromApi(raw: Record<string, unknown>): CoreSubjectTopicQuiz {
  const questionsRaw = Array.isArray(raw.questions) ? raw.questions : [];
  const questions: CoreSubjectQuizQuestion[] = [];
  for (const entry of questionsRaw) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const options = Array.isArray(item.options)
      ? item.options.map((opt) => String(opt).trim()).filter(Boolean)
      : [];
    const correctAnswer = Number(item.correctAnswer);
    const question = String(item.question ?? "").trim();
    if (!question) continue;
    questions.push({
      question,
      options,
      correctAnswer:
        Number.isFinite(correctAnswer) && correctAnswer >= 0 && correctAnswer < options.length
          ? correctAnswer
          : 0,
      explanation: String(item.explanation ?? "").trim() || undefined,
    });
  }

  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "").trim(),
    description: String(raw.description ?? "").trim(),
    subject: String(raw.subject ?? "").trim(),
    topic: String(raw.topic ?? "").trim(),
    scope: String(raw.scope ?? "core_subjects") === "global" ? "global" : "core_subjects",
    questionCount: questions.length || Number(raw.questionCount) || 0,
    passingScore: Number(raw.passingScore) || 70,
    duration: Number(raw.duration) || 0,
    questions,
  };
}

export function mapCoreSubjectQuizToApi(
  quiz: Omit<CoreSubjectTopicQuiz, "questionCount" | "id"> & { id?: string },
): Record<string, unknown> {
  const questions = quiz.questions.map((entry) => ({
    question: entry.question.trim(),
    options: entry.options.map((opt) => opt.trim()).filter(Boolean),
    correctAnswer: entry.correctAnswer,
    explanation: entry.explanation?.trim() ?? "",
  }));

  return {
    ...(quiz.id ? { id: quiz.id } : {}),
    title: quiz.title.trim(),
    description: quiz.description.trim(),
    subject: quiz.subject.trim(),
    topic: quiz.topic.trim(),
    scope: "core_subjects",
    category: quiz.subject,
    difficulty: "Medium",
    role: "",
    duration: quiz.duration ?? 0,
    passingScore: quiz.passingScore ?? 70,
    questions,
    questionCount: questions.length,
  };
}

export function mapCoreSubjectQuizPublicFromApi(
  raw: Record<string, unknown>,
): CoreSubjectTopicQuizPublic {
  const mapped = mapCoreSubjectQuizFromApi(raw);
  return {
    id: mapped.id,
    title: mapped.title,
    description: mapped.description,
    subject: mapped.subject,
    topic: mapped.topic,
    scope: mapped.scope,
    questionCount: mapped.questionCount,
    passingScore: mapped.passingScore,
    duration: mapped.duration,
    questions: mapped.questions.map(({ question, options }) => ({ question, options })),
  };
}
