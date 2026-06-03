import { useMemo, useState } from "react";
import { prepUserApi } from "../../services/preparationApi";
import { type CoreSubjectTopicQuizPublic } from "../../data/coreSubjectQuizTypes";

type QuizPhase = "intro" | "questions" | "result";

export interface PrepTopicQuizRunnerProps {
  quiz: CoreSubjectTopicQuizPublic;
  topic: string;
  onExit: () => void;
}

export default function PrepTopicQuizRunner({ quiz, topic, onExit }: PrepTopicQuizRunnerProps) {
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(quiz.questions.length).fill(null),
  );
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    passed: boolean;
    passingScore: number;
  } | null>(null);

  const attemptedCount = useMemo(
    () => answers.filter((value) => value !== null).length,
    [answers],
  );
  const unattemptedCount = quiz.questions.length - attemptedCount;
  const unvisitedCount = quiz.questions.length - visited.size;

  const currentQuestion = quiz.questions[currentIndex];

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => prev.map((value, index) => (index === currentIndex ? optionIndex : value)));
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
    setVisited((prev) => new Set(prev).add(index));
  };

  const saveAndNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      goToQuestion(currentIndex + 1);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const payload = answers.map((value) => (value === null ? -1 : value));
    const response = await prepUserApi.submitQuiz(quiz.id, payload, 0);
    setSubmitting(false);
    if (response) {
      setResult(response);
      setPhase("result");
    }
  };

  if (phase === "intro") {
    return (
      <div className="prep-core-quiz">
        <div className="prep-core-quiz__intro">
          <div className="prep-core-quiz__intro-icon" aria-hidden>
            ?
          </div>
          <h2 className="prep-core-quiz__title">
            Ready for quiz on {topic}?
          </h2>
          <p className="prep-core-quiz__subtitle">{quiz.description}</p>
          <div className="prep-core-quiz__rules">
            <p>This quiz consists of {quiz.questions.length} questions.</p>
            <p>Each question has multiple options, but only one correct answer.</p>
            <p>There is no negative marking for incorrect answers or unanswered questions.</p>
          </div>
          <button type="button" className="prep-core-quiz__start" onClick={() => setPhase("questions")}>
            Start Now
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="prep-core-quiz">
        <div className="prep-core-quiz__result">
          <h2 className="prep-core-quiz__title">{result.passed ? "Quiz passed" : "Quiz completed"}</h2>
          <p className="prep-core-quiz__score">{result.score}%</p>
          <p className="prep-core-quiz__subtitle">
            {result.correctCount} / {result.totalQuestions} correct · Pass mark {result.passingScore}%
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button type="button" className="prep-core-quiz__secondary" onClick={onExit}>
              Back to topic
            </button>
            <button
              type="button"
              className="prep-core-quiz__start"
              onClick={() => {
                setPhase("intro");
                setCurrentIndex(0);
                setAnswers(new Array(quiz.questions.length).fill(null));
                setVisited(new Set([0]));
                setResult(null);
              }}
            >
              Retake
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-core-quiz prep-core-quiz--active">
      <div className="prep-core-quiz__main">
        <div className="prep-core-quiz__question-card">
          <p className="prep-core-quiz__question-label">Question {currentIndex + 1}</p>
          <h3 className="prep-core-quiz__question-text">{currentQuestion?.question}</h3>
          <div className="prep-core-quiz__options">
            {currentQuestion?.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`prep-core-quiz__option ${
                  answers[currentIndex] === optionIndex ? "prep-core-quiz__option--selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name={`quiz-${quiz.id}-${currentIndex}`}
                  checked={answers[currentIndex] === optionIndex}
                  onChange={() => selectAnswer(optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <div className="prep-core-quiz__actions">
            <button type="button" className="prep-core-quiz__secondary" onClick={onExit}>
              Exit
            </button>
            {currentIndex < quiz.questions.length - 1 ? (
              <button type="button" className="prep-core-quiz__primary" onClick={saveAndNext}>
                Save and Next
              </button>
            ) : (
              <button
                type="button"
                className="prep-core-quiz__primary"
                disabled={submitting}
                onClick={() => void submitQuiz()}
              >
                {submitting ? "Submitting…" : "Submit Test"}
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="prep-core-quiz__sidebar">
        <div className="prep-core-quiz__summary">
          <div><span className="prep-core-quiz__dot prep-core-quiz__dot--attempted" /> Attempted: {attemptedCount}</div>
          <div><span className="prep-core-quiz__dot prep-core-quiz__dot--unattempted" /> Unattempted: {unattemptedCount}</div>
          <div><span className="prep-core-quiz__dot prep-core-quiz__dot--unvisited" /> Unvisited: {unvisitedCount}</div>
        </div>
        <div className="prep-core-quiz__palette">
          {quiz.questions.map((_, index) => {
            const isCurrent = index === currentIndex;
            const isAnswered = answers[index] !== null;
            return (
              <button
                key={index}
                type="button"
                onClick={() => goToQuestion(index)}
                className={`prep-core-quiz__palette-btn ${
                  isCurrent
                    ? "prep-core-quiz__palette-btn--current"
                    : isAnswered
                      ? "prep-core-quiz__palette-btn--answered"
                      : visited.has(index)
                        ? "prep-core-quiz__palette-btn--visited"
                        : ""
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="prep-core-quiz__submit"
          disabled={submitting}
          onClick={() => void submitQuiz()}
        >
          Submit Test
        </button>
      </aside>
    </div>
  );
}
