/**
 * ATS (Applicant Tracking System) Score service.
 * Uses Settings Lambda for key status; ATS Lambda for scoring.
 */

import type { ResumeInfo } from '../context/ResumeInfoContext';

const UPDATE_SETTINGS_ENDPOINT = 'https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings';

// ATS resume scorer Lambda (override with VITE_ATS_SCORER_ENDPOINT if needed)
const ATS_SCORER_ENDPOINT =
  (import.meta.env?.VITE_ATS_SCORER_ENDPOINT as string) ||
  'https://b238hguu88.execute-api.ap-south-2.amazonaws.com/default/ats_resume_scorer';

export interface LlmProvider {
  id: string;
  name: string;
  hasKey: boolean;
}

export interface LlmKeysStatus {
  success: boolean;
  hasOpenAiKey: boolean;
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
