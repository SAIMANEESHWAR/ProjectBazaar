/**
 * ATS (Applicant Tracking System) Score service.
 * Uses Settings Lambda for key status; ATS Lambda for scoring.
 */

import type { ResumeInfo } from '../context/ResumeInfoContext';

const UPDATE_SETTINGS_ENDPOINT = 'https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings';

// Production / preview: full API URL. Dev: Vite proxy (see vite.config.ts) so localhost avoids CORS.
const ATS_SCORER_DIRECT =
  (import.meta.env?.VITE_ATS_SCORER_ENDPOINT as string) ||
  'https://8ysn1do8kb.execute-api.ap-south-2.amazonaws.com/default/ats_scorer_handler';

const ATS_SCORER_ENDPOINT = import.meta.env.DEV ? '/dev-api/ats-scorer' : ATS_SCORER_DIRECT;

export interface LlmProvider {
  id: string;
  name: string;
  hasKey: boolean;
}

export interface LlmKeysStatus {
  success: boolean;
  hasOpenAiKey: boolean;
  hasOpenrouterKey: boolean;
  hasGeminiKey: boolean;
  hasClaudeKey: boolean;
  /** List of supported LLM providers and whether the user has a key for each */
  providers?: LlmProvider[];
}

export interface AtsBreakdown {
  skillsMatch?: number;
  experience?: number;
  education?: number;
  formatting?: number;
  achievements?: number;
  locationAndSoft?: number;
}

export interface AtsResult {
  overallScore: number;
  breakdown: AtsBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  feedback: string[];
}

export type AtsProvider = 'gemini' | 'openai' | 'openrouter' | 'anthropic';

export async function getLlmKeysStatus(userId: string): Promise<LlmKeysStatus> {
  const res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getLlmKeysStatus', userId }),
  });
  const data = await res.json();
  return {
    success: !!data.success,
    hasOpenAiKey: !!data.hasOpenAiKey,
    hasOpenrouterKey: !!data.hasOpenrouterKey,
    hasGeminiKey: !!data.hasGeminiKey,
    hasClaudeKey: !!data.hasClaudeKey,
    providers: Array.isArray(data.providers) ? data.providers : undefined,
  };
}

export async function getAtsScore(
  userId: string,
  resumeText: string,
  jobDescription: string
): Promise<{ success: boolean; atsResult?: AtsResult; message?: string }> {
  const res = await fetch(ATS_SCORER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      resumeText,
      jobDescription,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, message: data.message || 'Request failed' };
  }
  return {
    success: !!data.success,
    atsResult: data.atsResult,
    message: data.message,
  };
}

/** Read File as base64 (no data URL prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== 'string') {
        reject(new Error('Could not read file'));
        return;
      }
      const i = r.indexOf(',');
      resolve(i >= 0 ? r.slice(i + 1) : r);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

export interface AnalyzeAtsWithProviderParams {
  provider: AtsProvider;
  apiKey?: string;
  userId?: string;
  jobDescription: string;
  resumeFile: File;
  /** Provider model id (optional), e.g. gemini-2.0-flash, gpt-4o-mini, claude-3-haiku-20240307 */
  model?: string;
}

/**
 * ATS score via user-provided LLM API key (BYOK). Sends resume as base64; Lambda extracts text.
 */
export async function analyzeAtsWithProvider(
  params: AnalyzeAtsWithProviderParams
): Promise<{ success: boolean; atsResult?: AtsResult; message?: string }> {
  const { provider, apiKey, userId, jobDescription, resumeFile, model } = params;
  const resumeBase64 = await fileToBase64(resumeFile);
  const hasDirectApiKey = Boolean(apiKey?.trim());
  const providerPayload: Record<string, string> = hasDirectApiKey
    ? provider === 'gemini'
      ? { geminiApiKey: apiKey!.trim() }
      : provider === 'openai'
        ? { openaiApiKey: apiKey!.trim() }
        : provider === 'openrouter'
          ? { openrouterApiKey: apiKey!.trim() }
          : { anthropicApiKey: apiKey!.trim() }
    : {};
  const legacyProvider = provider === 'anthropic' ? 'claude' : provider;
  const res = await fetch(ATS_SCORER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(userId ? { userId } : {}),
      provider: hasDirectApiKey ? provider : userId ? legacyProvider : provider,
      ...providerPayload,
      jobDescription,
      resumeBase64,
      resumeFileName: resumeFile.name || 'resume.pdf',
      ...(model ? { model } : {}),
    }),
  });
  let data: { success?: boolean; atsResult?: AtsResult; message?: string } = {};
  try {
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return {
        success: false,
        message:
          res.status === 500 || res.status === 502
            ? `Server error (${res.status}). If this persists, increase Lambda timeout to 60–90s (Gemini + PDF need time). Raw: ${text.slice(0, 120)}`
            : `Invalid response (${res.status}): ${text.slice(0, 200)}`,
      };
    }
  } catch {
    return { success: false, message: 'Could not read response from server' };
  }
  if (!res.ok || !data.success) {
    return {
      success: false,
      message:
        data.message ||
        (res.status === 502 || res.status === 504
          ? 'Gateway or Lambda timeout. HTTP API times out ~30s even if Lambda is 90s—use a Lambda Function URL (see ATS_RESUME_SCORER_SETUP.md) or retry with a shorter JD/resume.'
          : `Request failed (${res.status})`),
    };
  }
  return {
    success: true,
    atsResult: data.atsResult,
  };
}

export interface AtsHistoryItem {
  userId: string;
  reportId: string;
  createdAt?: string;
  provider?: string;
  overallScore?: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  resumeFileName?: string;
  jobDescriptionPreview?: string;
}

export async function getAtsScoreHistory(
  userId: string,
  limit = 20
): Promise<{ success: boolean; items?: AtsHistoryItem[]; message?: string }> {
  const res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getAtsScoreHistory', userId, limit }),
  });
  const data = await res.json();
  return {
    success: !!data.success,
    items: Array.isArray(data.items) ? data.items : undefined,
    message: data.message,
  };
}

export async function saveLlmApiKeyForProvider(params: {
  userId: string;
  provider: AtsProvider;
  apiKey: string;
}): Promise<{ success: boolean; message?: string }> {
  const mappedProvider =
    params.provider === 'anthropic' ? 'claude' : params.provider;
  const res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateSettings',
      userId: params.userId,
      llmApiKeys: { [mappedProvider]: params.apiKey.trim() },
    }),
  });
  const data = await res.json();
  return {
    success: !!data.success,
    message: data.message,
  };
}

/** Build plain text resume from ResumeInfo for ATS scoring */
export function buildResumeTextFromInfo(info: ResumeInfo): string {
  const lines: string[] = [];
  lines.push(`${info.firstName} ${info.lastName}`);
  if (info.jobTitle) lines.push(info.jobTitle);
  if (info.address) lines.push(info.address);
  if (info.phone) lines.push(info.phone);
  if (info.email) lines.push(info.email);
  if (info.linkedIn) lines.push(`LinkedIn: ${info.linkedIn}`);
  if (info.github) lines.push(`GitHub: ${info.github}`);
  if (info.portfolio) lines.push(`Portfolio: ${info.portfolio}`);
  lines.push('');

  if (info.summary) {
    lines.push('SUMMARY');
    lines.push(info.summary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    lines.push('');
  }

  if (info.experience?.length) {
    lines.push('EXPERIENCE');
    for (const exp of info.experience) {
      lines.push(`${exp.title} at ${exp.companyName}${exp.city || exp.state ? `, ${[exp.city, exp.state].filter(Boolean).join(', ')}` : ''}`);
      lines.push(`${exp.startDate} - ${exp.currentlyWorking ? 'Present' : exp.endDate}`);
      if (exp.workSummary) {
        lines.push(exp.workSummary.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }
      lines.push('');
    }
  }

  if (info.education?.length) {
    lines.push('EDUCATION');
    for (const edu of info.education) {
      lines.push(`${edu.degree} in ${edu.major}, ${edu.universityName}`);
      lines.push(`${edu.startDate} - ${edu.endDate}`);
      if (edu.description) lines.push(edu.description.replace(/\s+/g, ' ').trim());
      lines.push('');
    }
  }

  if (info.skills?.length) {
    lines.push('SKILLS');
    lines.push(info.skills.map((s) => s.name).join(', '));
    lines.push('');
  }

  if (info.projects?.length) {
    lines.push('PROJECTS');
    for (const proj of info.projects) {
      lines.push(proj.name);
      if (proj.description) lines.push(proj.description.replace(/\s+/g, ' ').trim());
      if (proj.technologies?.length) lines.push(proj.technologies.join(', '));
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}
