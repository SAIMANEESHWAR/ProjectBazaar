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

/** Dedicated Fix My Resume Lambda (set in .env: VITE_FIX_RESUME_ENDPOINT). Dev uses Vite proxy /dev-api/fix-resume. */
const FIX_RESUME_DIRECT =
  (import.meta.env?.VITE_FIX_RESUME_ENDPOINT as string) || '';

const FIX_RESUME_ENDPOINT = import.meta.env.DEV
  ? '/dev-api/fix-resume'
  : FIX_RESUME_DIRECT || ATS_SCORER_DIRECT;

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

/** One missing JD keyword plus where to add it on the resume (from ATS Lambda). */
export interface MissingKeywordItem {
  keyword: string;
  suggestedSection: string[];
}

export interface AtsResult {
  overallScore: number;
  breakdown: AtsBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  /** Rich missing-keyword rows when the scorer returns section hints. */
  missingKeywordDetails?: MissingKeywordItem[];
  feedback: string[];
}

/** Normalize API payload: strings-only legacy vs objects with suggestedSection (snake_case tolerant). */
export function coerceMissingKeywordDetails(ar: {
  missingKeywords?: string[];
  missingKeywordDetails?: MissingKeywordItem[];
  missing_keyword_details?: unknown;
}): MissingKeywordItem[] {
  const raw =
    ar.missingKeywordDetails ??
    (Array.isArray(ar.missing_keyword_details) ? ar.missing_keyword_details : undefined);
  if (Array.isArray(raw) && raw.length > 0) {
    const out: MissingKeywordItem[] = [];
    const seen = new Set<string>();
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const o = item as Record<string, unknown>;
      const keyword = String(o.keyword ?? o.term ?? '').trim();
      if (!keyword) continue;
      const kl = keyword.toLowerCase();
      if (seen.has(kl)) continue;
      seen.add(kl);
      let suggestedSection: string[] = [];
      const sec = o.suggestedSection ?? o.suggested_section;
      if (Array.isArray(sec)) {
        suggestedSection = sec.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof sec === 'string' && sec.trim()) {
        suggestedSection = [sec.trim()];
      }
      out.push({ keyword, suggestedSection });
    }
    return out;
  }
  const keys = ar.missingKeywords ?? [];
  return keys
    .map((k) => String(k).trim())
    .filter(Boolean)
    .filter((k, i, a) => a.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i)
    .map((keyword) => ({ keyword, suggestedSection: [] as string[] }));
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
      /** No PDF bytes on this path — Lambda stores plain text in S3 as resume-from-builder.txt when configured */
      resumeFileName: 'resume-from-builder.txt',
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

/** Response from the Fix My Resume Lambda. */
export interface FixResumeResult {
  success: boolean;
  message?: string;
  improvedResume?: Record<string, unknown>;
  /** When useLlmRenderHtml is enabled, server returns full HTML doc for preview/print. */
  renderedHtml?: string;
  /** When useLlmRenderResumeJson is enabled, server returns template data for rendering. */
  resumeData?: Record<string, unknown>;
  addedKeywords?: string[];
  previewText?: string;
  pdfUrl?: string | null;
  pdfS3Key?: string | null;
  pdfBase64?: string;
  pdfFileName?: string;
  pdfAvailable?: boolean;
  pdfError?: string;
  /** Present when PDF was built with ReportLab (no LaTeX on server). */
  pdfNote?: string;
}

export interface FixResumeWithProviderParams {
  resumeFile: File;
  missingKeywords: string[];
  userId?: string;
  /** Optional single LLM pass for minimal wording polish (OpenAI / OpenRouter keys only). */
  useLlmEnhance?: boolean;
  /** Optional LLM mapping pass to extract contacts + skills (can use saved keys via userId). */
  useLlmMapFields?: boolean;
  /** Optional LLM render pass that returns the final resume HTML (preferred). */
  useLlmRenderHtml?: boolean;
  /** Optional LLM render pass that returns the resume template JSON (preferred). */
  useLlmRenderResumeJson?: boolean;
  provider?: AtsProvider;
  apiKey?: string;
  model?: string;
}

/**
 * Fix My Resume: dedicated Lambda by default (VITE_FIX_RESUME_ENDPOINT or dev proxy).
 * If VITE_FIX_RESUME_ENDPOINT is unset in production, falls back to the ATS URL (legacy).
 */
export async function fixResumeWithProvider(
  params: FixResumeWithProviderParams
): Promise<FixResumeResult> {
  const { resumeFile, missingKeywords, userId, useLlmEnhance, useLlmMapFields, useLlmRenderHtml, useLlmRenderResumeJson, provider, apiKey, model } = params;
  const resumeBase64 = await fileToBase64(resumeFile);
  const body: Record<string, unknown> = {
    resumeBase64,
    resumeFileName: resumeFile.name || 'resume.pdf',
    missingKeywords,
  };
  if (userId) body.userId = userId;
  if (useLlmRenderResumeJson && provider) {
    body.useLlmRenderResumeJson = true;
    body.provider = provider;
    if (apiKey?.trim()) body.apiKey = apiKey.trim();
    if (model) body.model = model;
  }
  if (useLlmRenderHtml && provider) {
    body.useLlmRenderHtml = true;
    body.provider = provider;
    if (apiKey?.trim()) body.apiKey = apiKey.trim();
    if (model) body.model = model;
  }
  if (useLlmMapFields && provider) {
    body.useLlmMapFields = true;
    body.provider = provider;
    if (apiKey?.trim()) body.apiKey = apiKey.trim();
    if (model) body.model = model;
  }
  if (useLlmEnhance && provider && apiKey?.trim()) {
    body.useLlmEnhance = true;
    body.provider = provider;
    body.apiKey = apiKey.trim();
    if (model) body.model = model;
  }
  const res = await fetch(FIX_RESUME_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: FixResumeResult = { success: false };
  try {
    const text = await res.text();
    data = text ? (JSON.parse(text) as FixResumeResult) : { success: false };
  } catch {
    return { success: false, message: 'Invalid response from fix-resume service' };
  }
  if (!res.ok || !data.success) {
    const raw = data as unknown as Record<string, unknown>;
    const message =
      (typeof raw.message === 'string' && raw.message) ||
      (typeof raw.Message === 'string' && raw.Message) ||
      (typeof raw.errorMessage === 'string' && raw.errorMessage) ||
      `Request failed (${res.status})`;
    return { success: false, message };
  }
  return data;
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
  missingKeywordDetails?: MissingKeywordItem[];
  /** Saved critical-fix sentences (same as live `atsResult.feedback`). */
  feedback?: string[];
  /** Legacy / alternate key if ever stored instead of `feedback`. */
  criticalFixes?: string[];
  resumeFileName?: string;
  /** Same as resumeFileUrl; canonical S3 object URL stored in DynamoDB. Do not use for browser open if bucket is private. */
  resume?: string;
  /** HTTPS S3 object URL (403 in browser when bucket is private). */
  resumeFileUrl?: string;
  /** Presigned GET URL from getAtsScoreHistory — use this for Download links. */
  resumeDownloadUrl?: string;
  resumeS3Bucket?: string;
  resumeS3Key?: string;
  /** AWS region used for SigV4 presign (matches virtual-host URL when set). */
  resumeS3Region?: string;
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
