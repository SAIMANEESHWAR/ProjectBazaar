export type LlmProvider = 'openrouter' | 'groq';

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
  createdAt: string;
  evaluation: LiveInterviewEvaluation;
}

const LIVE_INTERVIEW_DB_API_URL =
  import.meta.env.VITE_LIVE_INTERVIEW_DB_API_URL ||
  'https://g20pktgtz9.execute-api.ap-south-2.amazonaws.com/default/LiveMockinterview';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openrouter: 'openai/gpt-4o-mini',
  groq: 'llama-3.1-8b-instant',
};

interface EvaluateInput {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
  track: string;
  level: string;
  sessionLabel: string;
  transcript: string;
  durationSec: number;
}

export interface QuestionGenerationInput {
  provider: LlmProvider;
  apiKey: string;
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

function buildPrompt(input: Omit<EvaluateInput, 'apiKey'>): string {
  return [
    'You are an interview coach. Score this mock interview and return ONLY valid JSON.',
    'Schema:',
    '{"overall":"82/100","dimensions":[{"label":"Structure","score":16,"max":20}],"strengths":["..."],"improvements":["..."],"coachNote":"..."}',
    'Rules:',
    '- Exactly 5 dimensions. max always 20.',
    '- score integer from 0 to 20.',
    '- strengths 2-4 concise bullets.',
    '- improvements 2-4 concise bullets.',
    '- coachNote <= 60 words.',
    '',
    `Track: ${input.track}`,
    `Level: ${input.level}`,
    `Session label: ${input.sessionLabel}`,
    `Duration (sec): ${input.durationSec}`,
    'Transcript:',
    input.transcript,
  ].join('\n');
}

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

function buildQuestionGenerationPrompt(input: Omit<QuestionGenerationInput, 'apiKey'>): string {
  return [
    'Generate interview questions and return ONLY valid JSON.',
    'Schema:',
    '{"questions":["..."],"sessionLabel":"..."}',
    `mode: ${input.mode}`,
    `questionCount: ${input.questionCount}`,
    `timeMinutes: ${input.timeMinutes}`,
    `role: ${input.role || ''}`,
    `company: ${input.company || ''}`,
    `jobTitle: ${input.jobTitle || ''}`,
    `jobDescription: ${input.jdText || ''}`,
    `resume: ${input.resumeText || ''}`,
    'Rules:',
    '- Return exactly questionCount items.',
    '- Questions should be concise and interview-realistic.',
    '- Mix behavioral and technical where applicable.',
  ].join('\n');
}

export async function generateInterviewQuestionsWithProvider(
  input: QuestionGenerationInput
): Promise<{ questions: string[]; sessionLabel?: string }> {
  const endpoint = input.provider === 'groq' ? GROQ_API_URL : OPENROUTER_API_URL;
  const model = input.model?.trim() || DEFAULT_MODELS[input.provider];
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: buildQuestionGenerationPrompt({ ...input, model }) }],
    }),
  });
  if (!response.ok) {
    throw new Error(`Question generation failed (${response.status})`);
  }
  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('No generation content');
  }
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
  const endpoint = input.provider === 'groq' ? GROQ_API_URL : OPENROUTER_API_URL;
  const model = input.model?.trim() || DEFAULT_MODELS[input.provider];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey.trim()}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: buildPrompt({
            provider: input.provider,
            model,
            track: input.track,
            level: input.level,
            sessionLabel: input.sessionLabel,
            transcript: input.transcript,
            durationSec: input.durationSec,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed (${response.status})`);
  }

  const payload = await response.json();
  const raw = payload?.choices?.[0]?.message?.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('LLM response missing content');
  }
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
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }
  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

