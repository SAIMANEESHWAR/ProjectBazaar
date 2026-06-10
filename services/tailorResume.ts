/**
 * Tailor resume for a job portal row: ATS analyze (synthetic JD from portal metadata) → Fix Resume (JSON + PDF).
 * Real per-posting JDs are not in JobPortal — see buildPortalTailoringJd.
 *
 * Job Hunt tailoring (`tailorResumeForJob`) uses saved profile data only — no file upload.
 */

import type { ResumeInfo } from '../context/ResumeInfoContext';
import type { JobPortal } from '../data/preparationTypes';
import type { JobListing } from './buyerApi';
import {
  analyzeAtsWithProvider,
  coerceMissingKeywordDetails,
  fixResumeWithProvider,
  tailorResumeFromProfile,
  type AtsProvider,
  type AtsResult,
  type FixResumeResult,
} from './atsService';
import {
  validateProfileForResumeTailoring,
  type ProfileResumeTailoringValidation,
} from './tailorProfileValidation';

/** Synthetic “job description” from portal listing fields (not a specific requisition). */
export function buildPortalTailoringJd(portal: JobPortal): string {
  return [
    `Title: Apply via ${portal.name}`,
    `Platform summary: ${portal.description}`,
    `Category: ${portal.category}`,
    `Region: ${portal.region}`,
    `Apply at: ${portal.url}`,
  ].join('\n');
}

const FALLBACK_GENERIC = ['communication', 'collaboration', 'problem solving'] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Tokens from portal metadata when ATS returns no gaps (Fix Lambda requires non-empty missingKeywords). */
export function tokenizePortalKeywords(portal: JobPortal): string[] {
  const parts: string[] = [];
  if (portal.category?.trim()) parts.push(portal.category.trim());
  const nameWords = portal.name.split(/[\s,.&/-]+/).filter((w: string) => w.length > 2);
  parts.push(...nameWords.slice(0, 8));
  const descWords = portal.description.split(/\s+/).filter((w: string) => w.length > 4).slice(0, 4);
  parts.push(...descWords);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const k = p.trim();
    if (!k) continue;
    const low = k.toLowerCase();
    if (seen.has(low)) continue;
    seen.add(low);
    out.push(k);
    if (out.length >= 12) break;
  }
  return out;
}

export function resolveMissingKeywordsForTailor(atsResult: AtsResult, portal: JobPortal): string[] {
  const details = coerceMissingKeywordDetails({
    missingKeywords: atsResult.missingKeywords,
    missingKeywordDetails: atsResult.missingKeywordDetails,
  });
  let keys = details.map((d) => d.keyword).filter(Boolean);
  if (keys.length > 0) return keys;
  const fromPortal = tokenizePortalKeywords(portal);
  if (fromPortal.length > 0) return fromPortal;
  return [...FALLBACK_GENERIC];
}

export type TailorPhase = 'analyze' | 'matching' | 'optimizing';

export type TailorResumeForPortalParams = {
  portal: JobPortal;
  resumeFile: File;
  userId?: string;
  provider: AtsProvider;
  apiKey: string;
  useSavedKey: boolean;
  hasSavedProviderKey: boolean;
  /** Same pattern as ATSScorer: optional separate key for render when BYOK differs */
  fixRenderApiKey?: string;
  onPhase?: (phase: TailorPhase) => void;
};

export type TailorResumeSuccess = {
  success: true;
  atsResult: AtsResult;
  fix: FixResumeResult;
  usedFallbackKeywords: boolean;
};

export type TailorResumeFailure = {
  success: false;
  message: string;
  atsResult?: AtsResult;
};

export type TailorResumeOutcome = TailorResumeSuccess | TailorResumeFailure;

export async function tailorResumeForPortal(params: TailorResumeForPortalParams): Promise<TailorResumeOutcome> {
  const {
    portal,
    resumeFile,
    userId,
    provider,
    apiKey,
    useSavedKey,
    hasSavedProviderKey,
    fixRenderApiKey,
    onPhase,
  } = params;

  const jobDescription = buildPortalTailoringJd(portal);
  const usingSavedKey = Boolean(useSavedKey && hasSavedProviderKey && userId);
  const fixApiKey = fixRenderApiKey?.trim() || apiKey.trim();
  const fixAiAllowed = Boolean((userId && hasSavedProviderKey) || fixApiKey);

  if (!fixAiAllowed) {
    return {
      success: false,
      message: 'Add an LLM API key or sign in with a saved key to generate a tailored resume.',
    };
  }

  onPhase?.('analyze');
  const analyze = await analyzeAtsWithProvider({
    provider,
    ...(userId ? { userId } : {}),
    ...(!usingSavedKey ? { apiKey: apiKey.trim() } : {}),
    jobDescription,
    resumeFile,
  });

  if (!analyze.success || !analyze.atsResult) {
    return { success: false, message: analyze.message || 'Could not analyze resume.' };
  }

  const atsResult = analyze.atsResult;
  const details = coerceMissingKeywordDetails({
    missingKeywords: atsResult.missingKeywords,
    missingKeywordDetails: atsResult.missingKeywordDetails,
  });
  let missingKeywords = details.map((d) => d.keyword).filter(Boolean);
  let usedFallbackKeywords = false;
  if (missingKeywords.length === 0) {
    missingKeywords = resolveMissingKeywordsForTailor(atsResult, portal);
    usedFallbackKeywords = true;
  }

  onPhase?.('matching');
  await sleep(350);
  onPhase?.('optimizing');

  const fix = await fixResumeWithProvider({
    resumeFile,
    missingKeywords,
    ...(userId ? { userId } : {}),
    useLlmRenderResumeJson: true,
    useLlmMapFields: true,
    useLlmRenderHtml: false,
    provider,
    ...(fixApiKey ? { apiKey: fixApiKey } : {}),
  });

  if (!fix.success) {
    return {
      success: false,
      message: fix.message || 'Could not tailor resume.',
      atsResult,
    };
  }

  return { success: true, atsResult, fix, usedFallbackKeywords };
}

/** Build a job description string from a Job Hunt listing for tailoring. */
export function buildJobTailoringJd(job: JobListing): string {
  const parts: string[] = [];
  if (job.job_title?.trim()) parts.push(`Job Title: ${job.job_title.trim()}`);
  if (job.company?.trim()) parts.push(`Company: ${job.company.trim()}`);
  if (job.location?.trim()) parts.push(`Location: ${job.location.trim()}`);
  if (job.job_type?.trim()) parts.push(`Job Type: ${job.job_type.trim()}`);
  if (job.experience_level?.trim()) parts.push(`Experience Level: ${job.experience_level.trim()}`);
  if (job.salary?.trim()) parts.push(`Salary: ${job.salary.trim()}`);
  if (job.skills?.trim()) parts.push(`Required Skills: ${job.skills.trim()}`);
  if (job.source_platform?.trim()) parts.push(`Source: ${job.source_platform.trim()}`);
  const desc = job.description?.trim();
  if (desc) {
    parts.push('');
    parts.push('Job Description:');
    parts.push(desc);
  }
  return parts.join('\n').trim();
}

export type JobTailorPhase = 'validating' | 'tailoring' | 'rendering';

export type TailorResumeForJobParams = {
  job: JobListing;
  profile: ResumeInfo;
  userId?: string;
  accountEmail?: string | null;
  provider?: AtsProvider;
  onPhase?: (phase: JobTailorPhase) => void;
};

export type TailorJobResumeSuccess = {
  success: true;
  fix: FixResumeResult;
};

export type TailorJobResumeFailure = {
  success: false;
  message: string;
  validation?: ProfileResumeTailoringValidation;
};

export type TailorJobResumeOutcome = TailorJobResumeSuccess | TailorJobResumeFailure;

export async function tailorResumeForJob(params: TailorResumeForJobParams): Promise<TailorJobResumeOutcome> {
  const { job, profile, userId, accountEmail, provider, onPhase } = params;

  onPhase?.('validating');
  const validation = validateProfileForResumeTailoring(profile, { accountEmail });
  if (!validation.isValid) {
    return {
      success: false,
      message: 'Your profile is incomplete. Please update your profile before tailoring your resume.',
      validation,
    };
  }

  const jobDescription = buildJobTailoringJd(job);
  if (!jobDescription) {
    return {
      success: false,
      message: 'This job has no description available. Try another listing or check back later.',
      validation,
    };
  }

  onPhase?.('tailoring');
  await sleep(200);
  onPhase?.('rendering');

  const fix = await tailorResumeFromProfile({
    savedResumeProfile: profile,
    jobDescription,
    ...(userId ? { userId } : {}),
    provider,
  });

  if (!fix.success) {
    return {
      success: false,
      message: fix.message || 'Could not tailor resume for this job.',
      validation,
    };
  }

  return { success: true, fix };
}
