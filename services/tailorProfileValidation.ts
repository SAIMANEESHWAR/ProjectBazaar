import type { ResumeInfo } from '../context/ResumeInfoContext';

export type TailorRequiredField = 'fullName' | 'email' | 'skills' | 'education' | 'projects';

const FIELD_LABELS: Record<TailorRequiredField, string> = {
  fullName: 'Full Name',
  email: 'Email',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
};

/** Human-readable labels for blocking UI (with minimum hints where applicable). */
const FIELD_DISPLAY: Record<TailorRequiredField, string> = {
  fullName: 'Full Name',
  email: 'Email',
  skills: 'Skills (Minimum 1 Required)',
  education: 'Education (Minimum 1 Required)',
  projects: 'Projects (Minimum 1 Required)',
};

/** Built-in resume builder demo (ResumeInfoContext defaultResumeInfo). */
const DEMO_EMAILS = new Set(['james.carter@example.com']);
const DEMO_PROJECT_NAMES = new Set(['e-commerce platform', 'task management app']);
const DEMO_PHONE = '(123) 456-7890';
const DEMO_ADDRESS_PREFIX = '525 n tryon';

export type TailorRecommendedField =
  | 'experience'
  | 'linkedIn'
  | 'github'
  | 'portfolio'
  | 'summary';

const RECOMMENDED_LABELS: Record<TailorRecommendedField, string> = {
  experience: 'Experience',
  linkedIn: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
  summary: 'Professional Summary',
};

export interface ProfileResumeTailoringOptions {
  /** Signed-in account email — profile email must match when provided. */
  accountEmail?: string | null;
}

export interface ProfileResumeTailoringValidation {
  isValid: boolean;
  missingFields: string[];
  missingRequired: TailorRequiredField[];
  /** Profile still contains the app’s sample/demo resume template. */
  usesSampleData?: boolean;
}

export interface TailorProfileValidationResult {
  valid: boolean;
  missingRequired: TailorRequiredField[];
  missingRecommended: TailorRecommendedField[];
  projectsOnlyMissing: boolean;
  educationOnlyMissing: boolean;
  usesSampleData?: boolean;
  missingRequiredLabels: string[];
  missingRecommendedLabels: string[];
}

function isPlaceholderEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e) return true;
  if (DEMO_EMAILS.has(e)) return true;
  if (e.endsWith('@example.com')) return true;
  return false;
}

/** Detect the default “James Carter” template saved without user edits. */
export function isSampleResumeProfile(profile: ResumeInfo | null | undefined): boolean {
  if (!profile) return false;
  const first = (profile.firstName ?? '').trim().toLowerCase();
  const last = (profile.lastName ?? '').trim().toLowerCase();
  const email = (profile.email ?? '').trim().toLowerCase();
  const phone = (profile.phone ?? '').trim();
  const address = (profile.address ?? '').trim().toLowerCase();

  let signals = 0;
  if (first === 'james' && last === 'carter') signals += 1;
  if (isPlaceholderEmail(email)) signals += 1;
  if (phone === DEMO_PHONE) signals += 1;
  if (address.startsWith(DEMO_ADDRESS_PREFIX)) signals += 1;

  const projectNames = (profile.projects ?? [])
    .map((p) => (p.name ?? '').trim().toLowerCase())
    .filter(Boolean);
  if (
    projectNames.length > 0 &&
    projectNames.every((n) => DEMO_PROJECT_NAMES.has(n))
  ) {
    signals += 1;
  }

  const companies = (profile.experience ?? [])
    .map((e) => (e.companyName ?? '').trim().toLowerCase())
    .filter(Boolean);
  if (companies.includes('amazon') && companies.includes('google')) {
    signals += 1;
  }

  return signals >= 2;
}

function hasFullName(profile: ResumeInfo): boolean {
  const first = profile.firstName?.trim() ?? '';
  const last = profile.lastName?.trim() ?? '';
  if (!first && !last) return false;
  if (first.toLowerCase() === 'james' && last.toLowerCase() === 'carter') return false;
  return true;
}

function hasEmail(profile: ResumeInfo, accountEmail?: string | null): boolean {
  const email = profile.email?.trim() ?? '';
  if (!email || isPlaceholderEmail(email)) return false;
  const account = accountEmail?.trim();
  if (account && email.toLowerCase() !== account.toLowerCase()) return false;
  return true;
}

function hasSkills(profile: ResumeInfo): boolean {
  return (profile.skills ?? []).some((s) => {
    const name = s.name?.trim() ?? '';
    return name.length > 0;
  });
}

function hasEducation(profile: ResumeInfo): boolean {
  return (profile.education ?? []).some((e) => {
    const uni = e.universityName?.trim() ?? '';
    const degree = e.degree?.trim() ?? '';
    const major = e.major?.trim() ?? '';
    return Boolean(uni || degree || major);
  });
}

function hasProjects(profile: ResumeInfo): boolean {
  return (profile.projects ?? []).some((p) => {
    const name = p.name?.trim() ?? '';
    if (!name || DEMO_PROJECT_NAMES.has(name.toLowerCase())) return false;
    const desc = p.description?.trim() ?? '';
    const tech = (p.technologies ?? []).some((t) => Boolean(String(t).trim()));
    return Boolean(desc || tech);
  });
}

/**
 * Primary validator — run before opening tailor UI or calling the server.
 * Rejects empty profiles, sample template data, and shallow placeholder entries.
 */
export function validateProfileForResumeTailoring(
  profile: ResumeInfo | null | undefined,
  options?: ProfileResumeTailoringOptions
): ProfileResumeTailoringValidation {
  const p = profile ?? ({} as ResumeInfo);
  const accountEmail = options?.accountEmail;

  if (!profile || isSampleResumeProfile(p)) {
    return {
      isValid: false,
      missingFields: [
        'Full Name',
        'Email',
        'Skills (Minimum 1 Required)',
        'Education (Minimum 1 Required)',
        'Projects (Minimum 1 Required)',
      ],
      missingRequired: ['fullName', 'email', 'skills', 'education', 'projects'],
      usesSampleData: true,
    };
  }

  const missingRequired: TailorRequiredField[] = [];

  if (!hasFullName(p)) missingRequired.push('fullName');
  if (!hasEmail(p, accountEmail)) missingRequired.push('email');
  if (!hasSkills(p)) missingRequired.push('skills');
  if (!hasEducation(p)) missingRequired.push('education');
  if (!hasProjects(p)) missingRequired.push('projects');

  return {
    isValid: missingRequired.length === 0,
    missingFields: missingRequired.map((f) => FIELD_DISPLAY[f]),
    missingRequired,
    usesSampleData: false,
  };
}

/** Short blocking message for specific single-field cases. */
export function getTailorBlockingMessage(validation: ProfileResumeTailoringValidation): string {
  if (validation.isValid) return '';
  if (validation.usesSampleData) {
    return 'Your profile still contains sample resume data. Open Settings → Resume and replace it with your real name, email, skills, education, and projects before tailoring.';
  }
  const { missingRequired } = validation;
  if (missingRequired.length === 1 && missingRequired[0] === 'projects') {
    return 'Please add at least one project before tailoring your resume.';
  }
  if (missingRequired.length === 1 && missingRequired[0] === 'education') {
    return 'Please add at least one education entry before tailoring your resume.';
  }
  if (missingRequired.includes('email') && validation.missingRequired.length === 1) {
    return 'Please add your email in Settings → Resume. It must match your account email.';
  }
  return 'Your profile does not meet the minimum requirements for Tailor My Resume.';
}

/** @deprecated Prefer validateProfileForResumeTailoring */
export function validateTailorProfile(
  profile: ResumeInfo | null | undefined,
  options?: ProfileResumeTailoringOptions
): TailorProfileValidationResult {
  const base = validateProfileForResumeTailoring(profile, options);
  const p = profile ?? ({} as ResumeInfo);
  const missingRecommended: TailorRecommendedField[] = [];
  if (!(p.experience ?? []).length) missingRecommended.push('experience');
  if (!p.linkedIn?.trim()) missingRecommended.push('linkedIn');
  if (!p.github?.trim()) missingRecommended.push('github');
  if (!p.portfolio?.trim()) missingRecommended.push('portfolio');
  if (!p.summary?.trim()) missingRecommended.push('summary');

  return {
    valid: base.isValid,
    missingRequired: base.missingRequired,
    missingRecommended,
    projectsOnlyMissing:
      base.missingRequired.length === 1 && base.missingRequired[0] === 'projects',
    educationOnlyMissing:
      base.missingRequired.length === 1 && base.missingRequired[0] === 'education',
    usesSampleData: base.usesSampleData,
    missingRequiredLabels: base.missingRequired.map((f) => FIELD_LABELS[f]),
    missingRecommendedLabels: missingRecommended.map((f) => RECOMMENDED_LABELS[f]),
  };
}
