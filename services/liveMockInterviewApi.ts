export type LlmProvider = 'openrouter' | 'groq';

const UPDATE_SETTINGS_ENDPOINT =
  'https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings';

export interface InterviewDimensionScore {
  label: string;
  score: number;
  max: number;
}

export interface LiveInterviewEvaluation {
  overall: string;
  dimensions: InterviewDimensionScore[];
  strengths: string[];
  improvements: string[];
  coachNote: string;
}

export interface LiveInterviewRecord {
  interviewId: string;
  userId: string;
  provider?: LlmProvider;
  model?: string;
  track: string;
  level: string;
  sessionLabel: string;
  durationSec: number;
  finishedFullSession: boolean;
  questionCount?: number;
  timeMinutes?: number;
  generatedQuestions?: string[];
  answersByQuestion?: Record<string, string>;
  transcript?: string;
  trialSessionId?: string;
  createdAt: string;
  evaluation: LiveInterviewEvaluation;
}

const LIVE_INTERVIEW_DB_DIRECT =
  (import.meta.env.VITE_LIVE_INTERVIEW_DB_API_URL as string | undefined) ||
  'https://g20pktgtz9.execute-api.ap-south-2.amazonaws.com/default/LiveMockinterview';

/** Dev: Vite proxy avoids browser CORS on localhost. Prod: direct API Gateway URL. */
const LIVE_INTERVIEW_DB_API_URL = import.meta.env.DEV
  ? '/dev-api/live-mock-interview'
  : LIVE_INTERVIEW_DB_DIRECT;

const FALLBACK_EVALUATION: LiveInterviewEvaluation = {
  overall: '74/100',
  dimensions: [
    { label: 'Structure', score: 15, max: 20 },
    { label: 'Communication', score: 14, max: 20 },
    { label: 'Technical Depth', score: 16, max: 20 },
    { label: 'Problem Solving', score: 15, max: 20 },
    { label: 'Impact & Clarity', score: 14, max: 20 },
  ],
  strengths: ['Clear opening summary', 'Good ownership in examples'],
  improvements: ['Use tighter STAR framing', 'Quantify outcomes in final answer'],
  coachNote:
    'Focus on concise, impact-first storytelling. Lead with outcome, then context and trade-offs.',
};

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) return fence[1].trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1).trim();
  return trimmed;
}

function parseEvaluationStrict(raw: string): LiveInterviewEvaluation {
  const parsed = JSON.parse(extractJsonObject(raw)) as LiveInterviewEvaluation;
  if (!parsed || !Array.isArray(parsed.dimensions) || parsed.dimensions.length !== 5) {
    throw new Error('Evaluation shape invalid');
  }
  return {
    overall: typeof parsed.overall === 'string' ? parsed.overall : FALLBACK_EVALUATION.overall,
    dimensions: parsed.dimensions.map((d, idx) => ({
      label: d?.label || FALLBACK_EVALUATION.dimensions[idx]?.label || `Dimension ${idx + 1}`,
      score: Math.max(0, Math.min(20, Math.round(Number(d?.score ?? 0)))),
      max: 20,
    })),
    strengths:
      Array.isArray(parsed.strengths) && parsed.strengths.length > 0
        ? parsed.strengths.slice(0, 4)
        : FALLBACK_EVALUATION.strengths,
    improvements:
      Array.isArray(parsed.improvements) && parsed.improvements.length > 0
        ? parsed.improvements.slice(0, 4)
        : FALLBACK_EVALUATION.improvements,
    coachNote:
      typeof parsed.coachNote === 'string' && parsed.coachNote.trim()
        ? parsed.coachNote
        : FALLBACK_EVALUATION.coachNote,
  };
}

const LIVE_INTERVIEW_JD_MAX_CHARS = 6000;
const LIVE_INTERVIEW_RESUME_MAX_CHARS = 6000;

function truncateLiveInterviewField(text: string | undefined, maxChars: number): string | undefined {
  if (!text?.trim()) return text;
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars)}\n\n[... truncated for length ...]`;
}

function liveInterviewLlmErrorMessage(status: number, message?: string): string {
  const raw = message?.trim() || `LLM request failed (${status})`;
  if (raw.includes('Invalid action')) {
    return 'Live Interview AI is not available on the server yet. Redeploy the Update_userdetails_in_settings Lambda with the latest code, then try again.';
  }
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /timeout|timed out|task timed out/i.test(raw)
  ) {
    return 'Interview question generation timed out on the server. In AWS Lambda → Update_userdetails_in_settings, set Timeout to at least 60 seconds (90 recommended), then redeploy the latest handler code.';
  }
  return raw;
}

async function invokeLiveInterviewLlm(
  userId: string,
  provider: LlmProvider,
  invokeMode: 'evaluate' | 'generateQuestions',
  payload: Record<string, unknown>
): Promise<string> {
  const body: Record<string, unknown> = {
    action: 'invokeLiveInterviewLlm',
    userId,
    provider,
    invokeMode,
    ...payload,
  };
  if (typeof body.jdText === 'string') {
    body.jdText = truncateLiveInterviewField(body.jdText, LIVE_INTERVIEW_JD_MAX_CHARS);
  }
  if (typeof body.resumeText === 'string') {
    body.resumeText = truncateLiveInterviewField(body.resumeText, LIVE_INTERVIEW_RESUME_MAX_CHARS);
  }

  let res: Response;
  try {
    res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Could not reach the interview server. Check your connection, or ask your admin to set Update_userdetails_in_settings Lambda timeout to at least 60 seconds.'
    );
  }

  let data: { success?: boolean; content?: string; message?: string } = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok || !data.success || typeof data.content !== 'string') {
    throw new Error(liveInterviewLlmErrorMessage(res.status, data.message));
  }
  return data.content;
}

interface EvaluateInput {
  userId: string;
  provider: LlmProvider;
  model?: string;
  track: string;
  level: string;
  sessionLabel: string;
  transcript: string;
  durationSec: number;
}

export interface QuestionGenerationInput {
  userId: string;
  provider: LlmProvider;
  model?: string;
  mode: 'role' | 'company' | 'jd';
  role?: string;
  company?: string;
  jobTitle?: string;
  jdText?: string;
  resumeText?: string;
  questionCount: number;
  timeMinutes: number;
}

export async function generateInterviewQuestionsWithProvider(
  input: QuestionGenerationInput
): Promise<{ questions: string[]; sessionLabel?: string }> {
  const raw = await invokeLiveInterviewLlm(input.userId, input.provider, 'generateQuestions', {
    model: input.model?.trim() || undefined,
    setupMode: input.mode,
    role: input.role,
    company: input.company,
    jobTitle: input.jobTitle,
    jdText: input.jdText,
    resumeText: input.resumeText,
    questionCount: input.questionCount,
    timeMinutes: input.timeMinutes,
  });
  const parsed = JSON.parse(raw) as { questions?: string[]; sessionLabel?: string };
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions.map((q) => String(q).trim()).filter(Boolean)
    : [];
  if (!questions.length) {
    throw new Error('No valid questions returned');
  }
  return { questions, sessionLabel: parsed.sessionLabel };
}

export async function evaluateInterviewWithProvider(
  input: EvaluateInput
): Promise<LiveInterviewEvaluation> {
  const raw = await invokeLiveInterviewLlm(input.userId, input.provider, 'evaluate', {
    model: input.model?.trim() || undefined,
    track: input.track,
    level: input.level,
    sessionLabel: input.sessionLabel,
    transcript: input.transcript,
    durationSec: input.durationSec,
  });
  return parseEvaluationStrict(raw);
}

export async function saveLiveInterviewResult(record: Omit<LiveInterviewRecord, 'interviewId' | 'createdAt'>) {
  const response = await fetch(LIVE_INTERVIEW_DB_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!response.ok) {
    throw new Error(`Save failed (${response.status})`);
  }
  return response.json();
}

export async function fetchLiveInterviewResults(userId: string): Promise<LiveInterviewRecord[]> {
  const response = await fetch(`${LIVE_INTERVIEW_DB_API_URL}?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
  });
  let payload: { success?: boolean; data?: LiveInterviewRecord[]; error?: string; message?: string } = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const detail = payload.error || payload.message || `HTTP ${response.status}`;
    throw new Error(`Could not load interview results: ${detail}`);
  }
  return Array.isArray(payload?.data) ? payload.data : [];
}
