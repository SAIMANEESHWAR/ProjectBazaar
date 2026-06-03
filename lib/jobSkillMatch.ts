import type { JobListing } from '../services/buyerApi';
import { splitSkillsToChips } from './jobSkills';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Lowercase, collapse whitespace — for corpus and comparisons */
export function normalizeSkillText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Combined searchable text from job description + structured skills */
export function buildJobSkillCorpus(job: JobListing): string {
  const chunks: string[] = [];
  if (job.description?.trim()) chunks.push(job.description.trim());
  if (job.skills?.trim()) chunks.push(...splitSkillsToChips(job.skills.trim()));
  return normalizeSkillText(chunks.join(' '));
}

function skillAppearsInCorpus(skillNorm: string, corpusNorm: string): boolean {
  if (skillNorm.length < 2) return false;
  if (skillNorm.includes(' ')) {
    return corpusNorm.includes(skillNorm);
  }
  if (/[^a-z0-9]/.test(skillNorm)) {
    return corpusNorm.includes(skillNorm);
  }
  return new RegExp(`\\b${escapeRegExp(skillNorm)}\\b`, 'i').test(corpusNorm);
}

/**
 * Share of the user's distinct skills that appear in the job description or job skills field.
 * Returns null when there are no user skills to compare.
 */
export function computeJobSkillMatchPercent(userSkillNames: string[], job: JobListing): number | null {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const raw of userSkillNames) {
    const n = normalizeSkillText(raw);
    if (!n || n.length < 2) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    unique.push(n);
  }
  if (unique.length === 0) return null;

  const corpus = buildJobSkillCorpus(job);
  if (!corpus.trim()) return 0;

  let hits = 0;
  for (const s of unique) {
    if (skillAppearsInCorpus(s, corpus)) hits += 1;
  }
  return Math.round((hits / unique.length) * 100);
}
