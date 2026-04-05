import type { ResumeInfo } from '../context/ResumeInfoContext';
import { RESUME_PDF_LAYOUT_DEFAULTS, RESUME_PDF_LAYOUT_LIMITS } from '../config/resumePdfLayoutConfig';

const UPDATE_SETTINGS_ENDPOINT =
  'https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings';

export type TitleLineFormat = '1line' | '2line';

export interface ResumeExportSettings {
  projectsCount: number;
  bulletsPerProject: number;
  experienceBulletsDefault: number;
  experienceTitleFormat: TitleLineFormat;
  educationTitleFormat: TitleLineFormat;
  industries: string[];
  /** Per experience row (index-aligned); falls back to experienceBulletsDefault */
  experienceBulletLimits: number[];
  customSections: { title: string; body: string }[];
}

export const defaultResumeExportSettings = (): ResumeExportSettings => ({
  projectsCount: RESUME_PDF_LAYOUT_DEFAULTS.projectsCount,
  bulletsPerProject: RESUME_PDF_LAYOUT_DEFAULTS.bulletsPerProject,
  experienceBulletsDefault: RESUME_PDF_LAYOUT_DEFAULTS.experienceBulletsDefault,
  experienceTitleFormat: RESUME_PDF_LAYOUT_DEFAULTS.experienceTitleFormat,
  educationTitleFormat: RESUME_PDF_LAYOUT_DEFAULTS.educationTitleFormat,
  industries: [],
  experienceBulletLimits: [],
  customSections: [],
});

export function parseResumeExportSettings(raw: unknown): ResumeExportSettings {
  const d = defaultResumeExportSettings();
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown, fallback: number, min: number, max: number) => {
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };
  d.projectsCount = num(
    o.projectsCount,
    d.projectsCount,
    RESUME_PDF_LAYOUT_LIMITS.projectsCount.min,
    RESUME_PDF_LAYOUT_LIMITS.projectsCount.max
  );
  d.bulletsPerProject = num(
    o.bulletsPerProject,
    d.bulletsPerProject,
    RESUME_PDF_LAYOUT_LIMITS.bulletsPerProject.min,
    RESUME_PDF_LAYOUT_LIMITS.bulletsPerProject.max
  );
  d.experienceBulletsDefault = num(
    o.experienceBulletsDefault,
    d.experienceBulletsDefault,
    RESUME_PDF_LAYOUT_LIMITS.experienceBullets.min,
    RESUME_PDF_LAYOUT_LIMITS.experienceBullets.max
  );
  d.experienceTitleFormat = o.experienceTitleFormat === '2line' ? '2line' : '1line';
  d.educationTitleFormat = o.educationTitleFormat === '2line' ? '2line' : '1line';
  d.industries = Array.isArray(o.industries)
    ? o.industries
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, RESUME_PDF_LAYOUT_LIMITS.industriesMax)
    : [];
  d.experienceBulletLimits = Array.isArray(o.experienceBulletLimits)
    ? o.experienceBulletLimits
        .map((x) =>
          num(
            x,
            d.experienceBulletsDefault,
            RESUME_PDF_LAYOUT_LIMITS.experienceBullets.min,
            RESUME_PDF_LAYOUT_LIMITS.experienceBullets.max
          )
        )
        .slice(0, RESUME_PDF_LAYOUT_LIMITS.experienceBulletLimitsMaxLen)
    : [];
  d.customSections = Array.isArray(o.customSections)
    ? o.customSections
        .map((s) => {
          if (!s || typeof s !== 'object') return null;
          const r = s as Record<string, unknown>;
          const title = String(r.title ?? r.name ?? '').trim();
          const body = String(r.body ?? r.content ?? r.text ?? '').trim();
          if (!title && !body) return null;
          return { title: title || 'Section', body };
        })
        .filter(Boolean)
        .slice(0, RESUME_PDF_LAYOUT_LIMITS.customSectionsMax) as { title: string; body: string }[]
    : [];
  return d;
}

export function readCurrentResumeFromLocalStorage(): ResumeInfo | null {
  try {
    const stored = localStorage.getItem('currentResume');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as ResumeInfo;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

const MAX_PROFILE_IMAGE_CHARS = 12_000;

/** Drop oversized base64 photos so DynamoDB user item stays under size limits. */
export function resumeProfileForCloud(info: ResumeInfo): ResumeInfo {
  const profileImage = info.profileImage;
  if (typeof profileImage === 'string' && profileImage.length > MAX_PROFILE_IMAGE_CHARS) {
    return { ...info, profileImage: '' };
  }
  return info;
}

export async function saveResumeProfileToCloud(
  userId: string,
  savedResumeProfile: ResumeInfo,
  resumeExportSettings: ResumeExportSettings
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateSettings',
      userId,
      savedResumeProfile: resumeProfileForCloud(savedResumeProfile),
      resumeExportSettings,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return { ok: false, message: data.message || `Save failed (${res.status})` };
  }
  return { ok: true };
}

export async function saveResumeExportSettingsOnly(
  userId: string,
  resumeExportSettings: ResumeExportSettings
): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateSettings',
      userId,
      resumeExportSettings,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return { ok: false, message: data.message || `Save failed (${res.status})` };
  }
  return { ok: true };
}

export async function generateResumePdf(userId: string): Promise<{ ok: boolean; pdfUrl?: string; message?: string }> {
  const res = await fetch(UPDATE_SETTINGS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generateResumePdf',
      userId,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    return { ok: false, message: data.message || `PDF request failed (${res.status})` };
  }
  if (!data.pdfUrl) {
    return { ok: false, message: 'No download URL returned' };
  }
  return { ok: true, pdfUrl: data.pdfUrl as string };
}
