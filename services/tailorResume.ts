/**
 * Tailor resume for a job portal row: ATS analyze (synthetic JD from portal metadata) → Fix Resume (JSON + PDF).
 * Real per-posting JDs are not in JobPortal — see buildPortalTailoringJd.
 */

import type { JobPortal } from '../data/preparationMockData';
import {
  analyzeAtsWithProvider,
  coerceMissingKeywordDetails,
  fixResumeWithProvider,
  type AtsProvider,
  type AtsResult,
  type FixResumeResult,
} from './atsService';

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
  const nameWords = portal.name.split(/[\s,.&/-]+/).filter((w) => w.length > 2);
  parts.push(...nameWords.slice(0, 8));
  const descWords = portal.description.split(/\s+/).filter((w) => w.length > 4).slice(0, 4);
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
