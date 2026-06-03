import type { LucideIcon } from 'lucide-react';
import {
  Braces,
  Database,
  MessageSquare,
  Presentation,
  Puzzle,
  Users,
} from 'lucide-react';

export type PeerInterviewCategoryId =
  | 'pm'
  | 'dsa'
  | 'system-design'
  | 'behavioral'
  | 'sql'
  | 'dsml'
  | 'frontend';

/** Normalized for filters; maps cleanly to profile / API enums later */
export type PeerExperienceLevelId = 'fresher' | '0-1' | '1-3' | '3+';

/** Broad region buckets for scheduling (future: IANA tz + availability rules) */
export type PeerTimezoneRegionId = 'ist' | 'us' | 'eu' | 'apac' | 'other';

export interface PeerInterviewTypeOption {
  id: PeerInterviewCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
  beta?: boolean;
}

export const PEER_INTERVIEW_TYPE_OPTIONS: PeerInterviewTypeOption[] = [
  {
    id: 'pm',
    label: 'Product Management',
    description: 'Practice product sense, estimation, and more.',
    icon: Users,
  },
  {
    id: 'dsa',
    label: 'Data Structures & Algorithms',
    description: 'Practice coding questions.',
    icon: Braces,
  },
  {
    id: 'system-design',
    label: 'System Design',
    description: 'Practice designing technical architectures.',
    icon: Puzzle,
  },
  {
    id: 'behavioral',
    label: 'Behavioral',
    description: 'Practice questions about your work experiences.',
    icon: MessageSquare,
  },
  {
    id: 'sql',
    label: 'SQL',
    description: 'Practice writing and optimizing SQL queries.',
    icon: Database,
    beta: true,
  },
  {
    id: 'dsml',
    label: 'Data Science & ML',
    description: 'Practice using data to answer questions and design systems.',
    icon: Presentation,
    beta: true,
  },
  {
    id: 'frontend',
    label: 'Frontend',
    description: 'Practice JavaScript with foundational exercises.',
    icon: Braces,
    beta: true,
  },
];

export function labelForPeerCategory(id: PeerInterviewCategoryId): string {
  return PEER_INTERVIEW_TYPE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export const PEER_EXPERIENCE_LEVEL_OPTIONS: { id: PeerExperienceLevelId; label: string }[] = [
  { id: 'fresher', label: 'Fresher' },
  { id: '0-1', label: '0–1 years' },
  { id: '1-3', label: '1–3 years' },
  { id: '3+', label: '3+ years' },
];

export const PEER_TIMEZONE_REGION_OPTIONS: { id: PeerTimezoneRegionId; label: string }[] = [
  { id: 'ist', label: 'India / IST' },
  { id: 'us', label: 'Americas' },
  { id: 'eu', label: 'Europe / UK' },
  { id: 'apac', label: 'APAC (ex-India)' },
  { id: 'other', label: 'Other / flexible' },
];

/** Filter chips / dropdown — subset of skills; future API can return full tag cloud */
export const PEER_TECH_FILTER_SLUGS = [
  'java',
  'python',
  'typescript',
  'react',
  'go',
  'system-design',
  'sql',
  'kubernetes',
] as const;

export type PeerTechFilterSlug = (typeof PEER_TECH_FILTER_SLUGS)[number];

export const PEER_TECH_FILTER_LABELS: Record<PeerTechFilterSlug, string> = {
  java: 'Java',
  python: 'Python',
  typescript: 'TypeScript',
  react: 'React',
  go: 'Go',
  'system-design': 'System design',
  sql: 'SQL',
  kubernetes: 'Kubernetes',
};

/**
 * Future API: userId, avatarUrl, displayName, roleTitle, orgOrContext, category,
 * experienceLevel, timezoneRegion, ianaTimezone, techTags[], availabilityRules[],
 * practiceGoal, queueIntent, mockInterviewRounds[], targetCompanies[], bio, visibility…
 */
export interface MockWaitlistEntry {
  id: string;
  displayName: string;
  /** Profile photo (HTTPS). Falls back to initials in UI if missing or broken. */
  avatarUrl?: string;
  category: PeerInterviewCategoryId;
  /** Topics / stack depth (card body + search) */
  skills: string;
  waitingSince: string;
  experienceLevel?: PeerExperienceLevelId;
  timezoneRegion?: PeerTimezoneRegionId;
  techTags?: string[];
  availabilityWindows?: string[];
  /** Session title shown on card */
  practiceGoal?: string;
  targetCompanies?: string[];
  preferredLanguages?: string[];
  /** Job title or student line — shown under name */
  roleTitle?: string;
  /** Employer, school, or context */
  orgOrContext?: string;
  /** Plain sentence: why they joined this queue */
  queueIntent?: string;
  /** Interview rounds / formats they want to mock */
  mockInterviewRounds?: string[];
  /** Short bio — different from skills (tone / background) */
  bio?: string;
}

/** Mock Google Meet–style link for accepted sessions (placeholder until real links from API). */
export function mockGoogleMeetLink(sessionSeed: string): string {
  const compact = sessionSeed.replace(/[^a-z0-9]/gi, '').slice(0, 9) || 'demo';
  return `https://meet.google.com/${compact.slice(0, 3)}-${compact.slice(3, 7)}-${compact.slice(7, 10) || 'zzz'}`;
}
