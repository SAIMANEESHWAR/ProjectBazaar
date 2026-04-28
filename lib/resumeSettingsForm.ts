import type { Education, Experience, Project, ResumeInfo, Skill } from '../context/ResumeInfoContext';

export const RESUME_SETTINGS_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const currentY = new Date().getFullYear();
export const RESUME_SETTINGS_YEARS: string[] = [];
for (let y = currentY + 8; y >= 1970; y--) RESUME_SETTINGS_YEARS.push(String(y));

function newRowId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface ResumePersonalForm {
  fullName: string;
  phone: string;
  email: string;
  linkedIn: string;
  github: string;
  website: string;
  /** Headline under name on resume / PDF */
  jobTitle: string;
}

export interface ResumeExperienceFormRow {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  present: boolean;
  details: string;
}

export interface ResumeEducationFormRow {
  id: string;
  degree: string;
  school: string;
  location: string;
  gpa: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
}

export interface ResumeProjectFormRow {
  id: string;
  title: string;
  details: string;
}

export interface ResumeFullForm {
  personal: ResumePersonalForm;
  skillsText: string;
  summary: string;
  experience: ResumeExperienceFormRow[];
  education: ResumeEducationFormRow[];
  projects: ResumeProjectFormRow[];
}

export function emptyExperienceRow(): ResumeExperienceFormRow {
  return {
    id: newRowId('exp'),
    jobTitle: '',
    company: '',
    location: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    present: false,
    details: '',
  };
}

export function emptyEducationRow(): ResumeEducationFormRow {
  return {
    id: newRowId('edu'),
    degree: '',
    school: '',
    location: '',
    gpa: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
  };
}

export function emptyProjectRow(): ResumeProjectFormRow {
  return { id: newRowId('proj'), title: '', details: '' };
}

export function emptyResumeFullForm(): ResumeFullForm {
  return {
    personal: {
      fullName: '',
      phone: '',
      email: '',
      linkedIn: '',
      github: '',
      website: '',
      jobTitle: '',
    },
    skillsText: '',
    summary: '',
    experience: [emptyExperienceRow()],
    education: [emptyEducationRow()],
    projects: [emptyProjectRow()],
  };
}

/** Settings “User profile” fields used to pre-fill empty Resume personal rows. */
export interface UserProfileResumePrefill {
  fullName?: string;
  phone?: string;
  email?: string;
  linkedIn?: string;
  github?: string;
  website?: string;
  jobTitle?: string;
}

/**
 * For each personal field, uses the profile value only when the resume field is blank (after trim).
 */
export function applyUserProfileToResumePersonal(
  form: ResumeFullForm,
  profile: UserProfileResumePrefill
): ResumeFullForm {
  const pick = (current: string, fromProfile: string | undefined): string => {
    if ((current || '').trim()) return current;
    const p = (fromProfile || '').trim();
    return p;
  };
  const p = form.personal;
  return {
    ...form,
    personal: {
      fullName: pick(p.fullName, profile.fullName),
      phone: pick(p.phone, profile.phone),
      email: pick(p.email, profile.email),
      linkedIn: pick(p.linkedIn, profile.linkedIn),
      github: pick(p.github, profile.github),
      website: pick(p.website, profile.website),
      jobTitle: pick(p.jobTitle, profile.jobTitle),
    },
  };
}

function monthYearToYyyyMm(month: string, year: string): string {
  if (!year.trim()) return '';
  const idx = RESUME_SETTINGS_MONTHS.indexOf(month as (typeof RESUME_SETTINGS_MONTHS)[number]);
  if (idx < 0) return '';
  return `${year.trim()}-${String(idx + 1).padStart(2, '0')}`;
}

function splitYyyyMm(s: string): { month: string; year: string } {
  if (!s || !/^\d{4}-\d{2}$/.test(s)) return { month: '', year: '' };
  const [y, m] = s.split('-');
  const mi = parseInt(m, 10) - 1;
  return { month: RESUME_SETTINGS_MONTHS[mi] ?? '', year: y };
}

function escapeHtmlLite(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain / line-based details → HTML bullets for PDF pipeline */
export function plainDetailsToWorkSummary(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^\s*[•\-\u2022]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length === 0) return '';
  return '<ul>' + lines.map((l) => `<li>${escapeHtmlLite(l)}</li>`).join('') + '</ul>';
}

export function workSummaryToPlainText(html: string): string {
  if (!html || !html.includes('<')) {
    return (html || '').trim();
  }
  return html
    .replace(/<li[^>]*>/gi, '\n')
    .replace(/<\/li>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*\n+/, '')
    .trim();
}

function skillsTextToSkills(text: string): Skill[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name, i) => ({ id: `sk_${i}_${name.slice(0, 8)}`, name, rating: 5 }));
}

function skillsToText(skills: Skill[]): string {
  return skills.map((s) => s.name).join(', ');
}

function encodeEducationDescription(location: string, gpa: string): string {
  const parts: string[] = [];
  if (location.trim()) parts.push(`Location: ${location.trim()}`);
  if (gpa.trim()) parts.push(`GPA: ${gpa.trim()}`);
  return parts.join(' · ');
}

function decodeEducationDescription(desc: string): { location: string; gpa: string } {
  let location = '';
  let gpa = '';
  const locM = desc.match(/Location:\s*([^·]+?)(?=\s*·|\s*GPA:|$)/);
  const gpaM = desc.match(/GPA:\s*([^·]+?)(?:\s*·|$)/);
  if (locM) location = locM[1].trim();
  if (gpaM) gpa = gpaM[1].trim();
  if (!locM && !gpaM && desc.trim()) {
    return { location: desc.trim(), gpa: '' };
  }
  return { location, gpa };
}

export function resumeFullFormToResumeInfo(form: ResumeFullForm, base: ResumeInfo | null): ResumeInfo {
  const full = (form.personal.fullName || '').trim();
  const parts = full.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  const experience: Experience[] = form.experience.map((row) => ({
    id: row.id,
    title: row.jobTitle.trim(),
    companyName: row.company.trim(),
    city: row.location.trim(),
    state: '',
    startDate: monthYearToYyyyMm(row.startMonth, row.startYear),
    endDate: row.present ? '' : monthYearToYyyyMm(row.endMonth, row.endYear),
    currentlyWorking: row.present,
    workSummary: plainDetailsToWorkSummary(row.details),
  }));

  const education: Education[] = form.education.map((row) => ({
    id: row.id,
    universityName: row.school.trim(),
    degree: row.degree.trim(),
    major: '',
    startDate: monthYearToYyyyMm(row.startMonth, row.startYear),
    endDate: monthYearToYyyyMm(row.endMonth, row.endYear),
    description: encodeEducationDescription(row.location, row.gpa),
  }));

  const projects: Project[] = form.projects.map((row) => ({
    id: row.id,
    name: row.title.trim(),
    description: row.details.trim(),
    technologies: [],
  }));

  const merged: ResumeInfo = {
    ...(base || ({} as ResumeInfo)),
    firstName,
    lastName,
    jobTitle: form.personal.jobTitle.trim(),
    address: '',
    phone: form.personal.phone.trim(),
    email: form.personal.email.trim(),
    linkedIn: form.personal.linkedIn.trim(),
    github: form.personal.github.trim(),
    portfolio: form.personal.website.trim(),
    themeColor: base?.themeColor || '#6366f1',
    template: base?.template || 'modern',
    profileImage: base?.profileImage,
    summary: form.summary.trim(),
    experience,
    education,
    skills: skillsTextToSkills(form.skillsText),
    projects,
  };

  return merged;
}

export function resumeInfoToResumeFullForm(info: ResumeInfo): ResumeFullForm {
  const fullName = [info.firstName, info.lastName].filter(Boolean).join(' ').trim();

  return {
    personal: {
      fullName,
      phone: info.phone || '',
      email: info.email || '',
      linkedIn: info.linkedIn || '',
      github: info.github || '',
      website: info.portfolio || '',
      jobTitle: info.jobTitle || '',
    },
    skillsText: skillsToText(info.skills || []),
    summary: info.summary || '',
    experience:
      info.experience?.length > 0
        ? info.experience.map((e) => {
            const sm = splitYyyyMm(e.startDate);
            const em = splitYyyyMm(e.endDate);
            return {
              id: e.id || newRowId('exp'),
              jobTitle: e.title || '',
              company: e.companyName || '',
              location: [e.city, e.state].filter(Boolean).join(', ') || e.city || '',
              startMonth: sm.month,
              startYear: sm.year,
              endMonth: em.month,
              endYear: em.year,
              present: e.currentlyWorking === true,
              details: workSummaryToPlainText(e.workSummary || ''),
            };
          })
        : [emptyExperienceRow()],
    education:
      info.education?.length > 0
        ? info.education.map((ed) => {
            const sm = splitYyyyMm(ed.startDate);
            const em = splitYyyyMm(ed.endDate);
            const { location, gpa } = decodeEducationDescription(ed.description || '');
            return {
              id: ed.id || newRowId('edu'),
              degree: ed.degree || '',
              school: ed.universityName || '',
              location: location || '',
              gpa: gpa || '',
              startMonth: sm.month,
              startYear: sm.year,
              endMonth: em.month,
              endYear: em.year,
            };
          })
        : [emptyEducationRow()],
    projects:
      info.projects?.length > 0
        ? info.projects.map((p) => ({
            id: p.id || newRowId('proj'),
            title: p.name || '',
            details: p.description || '',
          }))
        : [emptyProjectRow()],
  };
}

export function resumeFullFormHasMinimumProfile(form: ResumeFullForm): boolean {
  const p = form.personal;
  return Boolean(p.fullName.trim() && p.email.trim() && p.phone.trim());
}

export function moveRow<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}
