import type { JobListing } from '../services/buyerApi';
import { splitSkillsToChips } from './jobSkills';

export type Job = JobListing;

export type Corpus = {
  idf: Map<string, number>;
  /** jobId (or `__i{n}` when id empty) → TF-IDF vector */
  jobVectors: Map<string, Map<string, number>>;
  /** Same job references as passed to `buildCorpus` (for vector lookup by reference). */
  jobs: Job[];
};

export type MatchResult = {
  score: number | null;
  matchedSkills: string[];
  missingSkills: string[];
};

const SKILL_JOIN = '  ';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Lowercase, collapse whitespace — chip matching (same as job skill corpus pipeline). */
function normalizeSkillCorpus(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Token pipeline: lowercase, trim, drop tokens shorter than 2 chars, deduplicate (first-seen order).
 */
export function normalize(text: string): string[] {
  const raw = text.trim().toLowerCase();
  if (!raw) return [];
  const parts = raw.split(/\W+/).filter((t) => t.length >= 2);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of parts) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function termFrequencies(text: string): { total: number; counts: Map<string, number> } {
  const raw = text.trim().toLowerCase();
  const parts = raw.split(/\W+/).filter((t) => t.length >= 2);
  const counts = new Map<string, number>();
  for (const t of parts) {
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return { total: parts.length, counts };
}

function buildJobDocumentText(job: Job): string {
  const chunks: string[] = [];
  if (job.description?.trim()) chunks.push(job.description.trim());
  if (job.skills?.trim()) chunks.push(...splitSkillsToChips(job.skills.trim()));
  return chunks.join(' ');
}

function skillChipMatchesCorpus(skillNorm: string, corpusNorm: string): boolean {
  if (skillNorm.length < 2) return false;
  if (skillNorm.includes(' ')) {
    return corpusNorm.includes(skillNorm);
  }
  if (/[^a-z0-9]/.test(skillNorm)) {
    return corpusNorm.includes(skillNorm);
  }
  return new RegExp(`\\b${escapeRegExp(skillNorm)}\\b`, 'i').test(corpusNorm);
}

function parseCandidateSkills(candidateText: string): string[] {
  const t = candidateText.trim();
  if (!t) return [];
  return t
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function idfForTerm(
  term: string,
  idfMap: Map<string, number>,
  totalDocs: number,
  skipIdf: boolean
): number {
  if (skipIdf) return 1;
  const v = idfMap.get(term);
  if (v !== undefined) return v;
  return Math.log(totalDocs / (1 + 0)) + 1;
}

function buildTfidfVector(
  documentText: string,
  idfMap: Map<string, number>,
  totalDocs: number,
  skipIdf: boolean
): Map<string, number> {
  const { total, counts } = termFrequencies(documentText);
  const vec = new Map<string, number>();
  if (total === 0) return vec;
  for (const [term, c] of counts) {
    const tf = c / total;
    const idf = idfForTerm(term, idfMap, totalDocs, skipIdf);
    vec.set(term, tf * idf);
  }
  return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  // TODO: move buildCorpus + scoreJob to a web worker if corpus exceeds 500 jobs
  const union = new Set<string>([...a.keys(), ...b.keys()]);
  if (union.size === 0) return NaN;

  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [k, va] of smaller) {
    const vb = larger.get(k);
    if (vb !== undefined) dot += va * vb;
  }

  let magA = 0;
  for (const v of a.values()) magA += v * v;
  magA = Math.sqrt(magA);

  let magB = 0;
  for (const v of b.values()) magB += v * v;
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) return NaN;
  return dot / (magA * magB);
}

export function buildCorpus(jobs: Job[]): Corpus {
  const idf = new Map<string, number>();
  const jobVectors = new Map<string, Map<string, number>>();
  const jobList = [...jobs];
  const totalDocs = jobList.length;
  if (totalDocs === 0) {
    return { idf, jobVectors, jobs: jobList };
  }

  const skipIdf = totalDocs <= 1;
  const texts = jobList.map((j, i) => ({
    key: j.id?.trim() || `__i${i}`,
    text: buildJobDocumentText(j),
  }));

  const df = new Map<string, number>();
  for (const { text } of texts) {
    const terms = normalize(text);
    for (const t of terms) {
      df.set(t, (df.get(t) ?? 0) + 1);
    }
  }

  if (!skipIdf) {
    for (const [term, dfc] of df) {
      idf.set(term, Math.log(totalDocs / (1 + dfc)) + 1);
    }
  }

  for (const { key, text } of texts) {
    jobVectors.set(key, buildTfidfVector(text, idf, totalDocs, skipIdf));
  }

  return { idf, jobVectors, jobs: jobList };
}

export function scoreJob(corpus: Corpus, candidateText: string, job: Job): MatchResult {
  const emptyLists = (): MatchResult => ({
    score: null,
    matchedSkills: [],
    missingSkills: [],
  });

  const trimmed = candidateText.trim();
  if (!trimmed) {
    return emptyLists();
  }

  const candidateSkills = parseCandidateSkills(candidateText);
  const jobText = buildJobDocumentText(job);
  const jobCorpusNorm = normalizeSkillCorpus(jobText);
  const candidateCorpusNorm = normalizeSkillCorpus(candidateSkills.join(' '));

  const jobChips = job.skills?.trim() ? splitSkillsToChips(job.skills.trim()) : [];

  const matchedSkills: string[] = [];
  for (const raw of candidateSkills) {
    const n = normalizeSkillCorpus(raw);
    if (n.length < 2) continue;
    if (skillChipMatchesCorpus(n, jobCorpusNorm)) {
      matchedSkills.push(raw.trim());
    }
  }

  const missingSkills: string[] = [];
  for (const chip of jobChips) {
    const n = normalizeSkillCorpus(chip);
    if (n.length < 2) continue;
    if (!skillChipMatchesCorpus(n, candidateCorpusNorm)) {
      missingSkills.push(chip.trim());
    }
  }

  if (!jobText.trim()) {
    return { score: 0, matchedSkills, missingSkills };
  }

  const totalDocs = corpus.jobVectors.size;
  const skipIdf = totalDocs <= 1;
  const candidateVec = buildTfidfVector(trimmed, corpus.idf, Math.max(1, totalDocs), skipIdf);

  const idx = corpus.jobs.indexOf(job);
  const vecKey = job.id?.trim() || (idx >= 0 ? `__i${idx}` : '');
  const jobVec = vecKey ? corpus.jobVectors.get(vecKey) : undefined;
  if (!jobVec) {
    return { score: null, matchedSkills, missingSkills };
  }

  const sim = cosine(candidateVec, jobVec);
  if (Number.isNaN(sim)) {
    return { score: null, matchedSkills, missingSkills };
  }

  const score = Math.round(Math.max(0, Math.min(1, sim)) * 100);
  return { score, matchedSkills, missingSkills };
}

/** Join resume skill names for `scoreJob` candidateText (double-space delimiter preserves multi-word skills). */
export function joinCandidateSkillText(skills: readonly string[]): string {
  return skills.map((s) => s.trim()).filter(Boolean).join(SKILL_JOIN);
}
