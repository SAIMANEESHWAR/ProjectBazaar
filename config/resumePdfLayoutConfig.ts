/**
 * Single source for resume PDF export layout (Settings → Resume → PDF layout).
 * Defaults match the product UI (e.g. 1 project, 7 bullets/project, 3 experience bullets).
 */
export const RESUME_PDF_LAYOUT_LIMITS = {
  projectsCount: { min: 0, max: 15 },
  bulletsPerProject: { min: 1, max: 20 },
  experienceBullets: { min: 1, max: 20 },
  industriesMax: 20,
  experienceBulletLimitsMaxLen: 30,
  customSectionsMax: 10,
} as const;

export const RESUME_PDF_LAYOUT_DEFAULTS = {
  projectsCount: 1,
  bulletsPerProject: 7,
  experienceBulletsDefault: 3,
  experienceTitleFormat: '1line' as const,
  educationTitleFormat: '1line' as const,
} as const;

export const RESUME_PDF_LAYOUT_LABELS = {
  sectionTitle: 'PDF layout',
  sectionDescription: 'Choose how projects, bullets, and sections appear in your exported PDF.',
  projectsToInclude: 'Projects to include',
  projectsHint: 'Uses the first N projects from your saved resume.',
  projectsOptionZero: '0 (hide projects)',
  bulletsPerProject: 'Bullet points per project',
  defaultBulletsExperience: 'Default bullets per experience',
  industries: 'Industries (tags)',
  industryPlaceholder: 'e.g. Tech',
  industryAdd: 'Add',
  experienceTitles: 'Experience titles',
  educationTitles: 'Education titles',
  titleOneLine: '1 line',
  titleTwoLines: '2 lines',
  customSections: 'Custom sections',
  customSectionsEmpty: 'No custom sections.',
  addSection: '+ Add section',
  sectionTitlePlaceholder: 'Section title',
  sectionContentPlaceholder: 'Content',
  removeSection: 'Remove',
  saveChanges: 'Save changes',
  saving: 'Saving…',
} as const;

export const TITLE_LINE_FORMAT_UI = [
  { id: '1line' as const, label: RESUME_PDF_LAYOUT_LABELS.titleOneLine },
  { id: '2line' as const, label: RESUME_PDF_LAYOUT_LABELS.titleTwoLines },
] as const;

export function rangeInclusive(min: number, max: number): number[] {
  const out: number[] = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

export function clampProjectsCount(n: number): number {
  const { min, max } = RESUME_PDF_LAYOUT_LIMITS.projectsCount;
  return Math.max(min, Math.min(max, n));
}

export function clampBulletCount(n: number, fallback: number): number {
  const { min, max } = RESUME_PDF_LAYOUT_LIMITS.experienceBullets;
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
