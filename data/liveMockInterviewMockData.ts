/**
 * Mock data for the Live Mock Interview with AI demo flow (no backend).
 */

export type InterviewTrackId = 'swe' | 'data' | 'pm';
export type InterviewLevelId = 'junior' | 'mid' | 'senior';

export interface TrackOption {
  id: InterviewTrackId;
  label: string;
  description: string;
  icon: string;
}

export interface LevelOption {
  id: InterviewLevelId;
  label: string;
  hint: string;
}

export interface ConversationTurn {
  speaker: 'ai' | 'you';
  text: string;
}

export interface InterviewSegment {
  id: string;
  topic: string;
  turns: ConversationTurn[];
}

export const TRACK_OPTIONS: TrackOption[] = [
  {
    id: 'swe',
    label: 'Software Engineering',
    description: 'System design snippets, coding mindset, and ownership stories.',
    icon: '⚙️',
  },
  {
    id: 'data',
    label: 'Data & Analytics',
    description: 'Metrics, experimentation, SQL thinking, and stakeholder clarity.',
    icon: '📊',
  },
  {
    id: 'pm',
    label: 'Product Management',
    description: 'Prioritization, tradeoffs, discovery, and outcome framing.',
    icon: '🎯',
  },
];

export const LEVEL_OPTIONS: LevelOption[] = [
  { id: 'junior', label: 'Junior', hint: '0–2 years' },
  { id: 'mid', label: 'Mid', hint: '2–5 years' },
  { id: 'senior', label: 'Senior', hint: '5+ years' },
];

export interface RoleCard {
  id: string;
  title: string;
  track: InterviewTrackId;
  searchText: string;
}

export const MOCK_ROLE_CARDS: RoleCard[] = [
  { id: 'r1', title: 'Software Engineer', track: 'swe', searchText: 'software engineer backend frontend coding' },
  { id: 'r2', title: 'Full Stack Developer', track: 'swe', searchText: 'full stack react node typescript web' },
  { id: 'r3', title: 'Frontend Engineer', track: 'swe', searchText: 'frontend ui react css javascript' },
  { id: 'r4', title: 'Backend Engineer', track: 'swe', searchText: 'backend api microservices java go' },
  { id: 'r5', title: 'DevOps Engineer', track: 'swe', searchText: 'devops kubernetes ci cd infrastructure' },
  { id: 'r6', title: 'Mobile Developer', track: 'swe', searchText: 'mobile ios android swift kotlin' },
  { id: 'r7', title: 'Data Analyst', track: 'data', searchText: 'data analyst sql tableau dashboards metrics' },
  { id: 'r8', title: 'Data Scientist', track: 'data', searchText: 'data scientist machine learning python modeling' },
  { id: 'r9', title: 'Analytics Engineer', track: 'data', searchText: 'analytics dbt etl warehouse snowflake' },
  { id: 'r10', title: 'Business Intelligence', track: 'data', searchText: 'bi reporting looker power bi stakeholder' },
  { id: 'r11', title: 'Product Manager', track: 'pm', searchText: 'product manager roadmap prioritization discovery' },
  { id: 'r12', title: 'Technical Program Manager', track: 'pm', searchText: 'tpm program delivery cross functional agile' },
  { id: 'r13', title: 'Product Owner', track: 'pm', searchText: 'product owner backlog scrum requirements' },
  { id: 'r14', title: 'Web Designer', track: 'swe', searchText: 'web designer figma ux ui prototyping' },
  { id: 'r15', title: 'UX Researcher', track: 'pm', searchText: 'ux research usability interviews journey' },
  { id: 'r16', title: 'Account Manager', track: 'pm', searchText: 'account manager sales client success b2b' },
  { id: 'r17', title: 'Solutions Engineer', track: 'swe', searchText: 'solutions engineer presales demos integrations' },
  { id: 'r18', title: 'QA Engineer', track: 'swe', searchText: 'qa quality assurance testing automation selenium' },
];

const sweScript: InterviewSegment[] = [
  {
    id: 'behavioral',
    topic: 'Behavioral — Ownership',
    turns: [
      {
        speaker: 'ai',
        text: "Hi, I'm Ava, your AI interviewer today. We'll keep this conversational. Tell me about a time you took ownership of a critical bug or outage. What was your approach?",
      },
      {
        speaker: 'you',
        text: 'At my last role, checkout errors spiked at peak hours. I pulled traces, found a race in our cart service, patched it, added alerting on error budgets, and stayed through deploy. Incidents dropped to zero the next week.',
      },
      {
        speaker: 'ai',
        text: 'Nice. If you only had two hours before a major sale, what would you cut from that playbook?',
      },
      {
        speaker: 'you',
        text: 'I would ship the smallest safe fix behind a feature flag, roll back riskiest changes, and communicate a clear go/no-go checklist to support.',
      },
    ],
  },
  {
    id: 'technical',
    topic: 'Technical — Tradeoffs',
    turns: [
      {
        speaker: 'ai',
        text: 'How would you design a read-heavy feed that must stay fresh within a few seconds? What storage and caching choices would you consider?',
      },
      {
        speaker: 'you',
        text: 'I would use a CDN for static assets, a short-TTL cache for assembled feed pages, and a message queue to invalidate or warm caches on new content. For consistency I would document eventual freshness SLAs.',
      },
      {
        speaker: 'ai',
        text: 'What breaks first at scale, and how would you observe it?',
      },
      {
        speaker: 'you',
        text: 'Hot keys on the cache and fan-out writes. I would shard cache keys, add per-tenant rate limits, and use RED metrics plus tracing on the feed builder path.',
      },
    ],
  },
  {
    id: 'wrap',
    topic: 'Closing',
    turns: [
      {
        speaker: 'ai',
        text: 'Last question: why this role, and what do you want to learn in the next 12 months?',
      },
      {
        speaker: 'you',
        text: 'I want to ship user-facing features with strong reliability culture. In the next year I want to deepen distributed systems debugging and mentoring newer engineers.',
      },
      {
        speaker: 'ai',
        text: "Thanks — that gives me a clear picture. I'll synthesize feedback on structure, depth, and communication. You can end the session whenever you're ready.",
      },
    ],
  },
];

const dataScript: InterviewSegment[] = [
  {
    id: 'behavioral-data',
    topic: 'Behavioral — Influence',
    turns: [
      {
        speaker: 'ai',
        text: "I'm Ava, your AI interviewer. Describe a time you used data to change a stakeholder's mind.",
      },
      {
        speaker: 'you',
        text: 'Leadership wanted to pause a retention experiment. I rebuilt the readout with cohort curves and confidence intervals, showed opportunity cost in revenue, and we extended the test — it became a win two weeks later.',
      },
      {
        speaker: 'ai',
        text: 'How did you handle pushback on sample size?',
      },
      {
        speaker: 'you',
        text: 'I listed power assumptions, proposed a minimum detectable effect, and offered a staged decision if variance stayed high.',
      },
    ],
  },
  {
    id: 'technical-data',
    topic: 'Analytics — Metrics',
    turns: [
      {
        speaker: 'ai',
        text: 'How would you define success for a new onboarding funnel? Give primary and guardrail metrics.',
      },
      {
        speaker: 'you',
        text: 'Primary: activation rate within seven days. Guardrails: support tickets, time-to-first-value, and unsubscribe rate.',
      },
      {
        speaker: 'ai',
        text: 'What experiment would you run first?',
      },
      {
        speaker: 'you',
        text: 'A split test on the first empty state with tracked progression through three key steps, stratified by acquisition channel.',
      },
    ],
  },
  {
    id: 'wrap-data',
    topic: 'Closing',
    turns: [
      {
        speaker: 'ai',
        text: 'What is one analytics skill you are actively improving right now?',
      },
      {
        speaker: 'you',
        text: 'Causal inference and clearer executive summaries — fewer tables, more decisions.',
      },
      {
        speaker: 'ai',
        text: 'Great. I have enough to score clarity and analytical rigor. End the session when you are done reviewing.',
      },
    ],
  },
];

const pmScript: InterviewSegment[] = [
  {
    id: 'behavioral-pm',
    topic: 'Product sense — Priorities',
    turns: [
      {
        speaker: 'ai',
        text: "Hi, I'm Ava. Walk me through how you prioritized a roadmap when engineering capacity dropped by thirty percent.",
      },
      {
        speaker: 'you',
        text: 'I re-scored bets on reach, confidence, and effort, cut nice-to-haves, and negotiated a smaller MVP with design to protect one revenue-critical launch.',
      },
      {
        speaker: 'ai',
        text: 'Who disagreed, and how did you align them?',
      },
      {
        speaker: 'you',
        text: 'Sales wanted a CRM export. I paired them with a CSV interim solution and scheduled the full integration next quarter with written tradeoffs.',
      },
    ],
  },
  {
    id: 'technical-pm',
    topic: 'Execution — Risk',
    turns: [
      {
        speaker: 'ai',
        text: 'How do you de-risk a bet that depends on a partner API with poor documentation?',
      },
      {
        speaker: 'you',
        text: 'Time-box a spike, build a mock service for parallel UI work, and define fallback UX if latency or errors exceed SLOs.',
      },
      {
        speaker: 'ai',
        text: 'What would you ship if the partner misses their date?',
      },
      {
        speaker: 'you',
        text: 'A manual workflow for power users plus telemetry so we know when to reopen the integration.',
      },
    ],
  },
  {
    id: 'wrap-pm',
    topic: 'Closing',
    turns: [
      {
        speaker: 'ai',
        text: 'What product you admire recently and why?',
      },
      {
        speaker: 'you',
        text: 'Tools that collapse setup friction with opinionated defaults but expose escape hatches for pros.',
      },
      {
        speaker: 'ai',
        text: 'Thanks — strong structure. I will summarize strengths and growth areas next.',
      },
    ],
  },
];

export function getInterviewScript(track: InterviewTrackId): InterviewSegment[] {
  switch (track) {
    case 'data':
      return dataScript;
    case 'pm':
      return pmScript;
    case 'swe':
    default:
      return sweScript;
  }
}

export interface ResultBreakdown {
  overall: number;
  dimensions: { label: string; score: number; max: number }[];
  strengths: string[];
  improvements: string[];
  coachNote: string;
}

export function getMockResults(
  track: InterviewTrackId,
  level: InterviewLevelId,
  elapsedSec: number
): ResultBreakdown {
  const levelBoost = level === 'senior' ? 4 : level === 'mid' ? 2 : 0;
  const paceBoost = elapsedSec >= 420 && elapsedSec <= 900 ? 3 : 0;
  const base = 72 + levelBoost + paceBoost;
  const overall = Math.min(94, Math.max(58, base + (track === 'swe' ? 2 : 0)));

  return {
    overall,
    dimensions: [
      { label: 'Communication & clarity', score: Math.min(95, overall + 2), max: 100 },
      { label: 'Technical / analytical depth', score: Math.min(95, overall - 1), max: 100 },
      { label: 'Structure & conciseness', score: Math.min(95, overall + 1), max: 100 },
    ],
    strengths: [
      'You cited concrete outcomes and timelines instead of vague responsibilities.',
      'You answered follow-ups directly before adding supporting detail.',
      level === 'senior'
        ? 'Senior-level framing: tradeoffs, risk, and operational guardrails showed up early.'
        : 'Good instinct to scope MVPs and communicate under uncertainty.',
    ],
    improvements: [
      'Add a one-sentence summary before deep dives so interviewers know where you are headed.',
      'Name one metric or SLA when discussing reliability or experiments.',
      'Practice a 20-second “why this role” that ties to team mission, not only personal growth.',
    ],
    coachNote:
      track === 'data'
        ? 'Data track: push harder on metric definitions and experiment ethics — you are close to a hiring-bar narrative.'
        : track === 'pm'
          ? 'PM track: excellent stakeholder examples; next, quantify impact (revenue, retention, or cycle time).'
          : 'Engineering track: strong ownership story; connect design choices to failure modes more explicitly in system questions.',
  };
}

export const AI_INTERVIEWER_NAME = 'Ava';
export const ESTIMATED_DURATION_MIN = 12;

/** Build URL to a file in `public/company_logos/` (respects Vite `base`). */
export function companyLogoPublicUrl(file: string): string {
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null ? import.meta.env.BASE_URL : '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}company_logos/${file}`;
}

/** Role picker card — sample “hiring spotlight” logo from `public/company_logos/` (illustrative). */
export interface MockRolePickerCard {
  title: string;
  logo: string;
  /** File name for reference / tooling */
  logoFile: string;
}

const ROLE_PICKER_LOGO_SEED: { title: string; logoFile: string }[] = [
  { title: 'Web Designer', logoFile: 'adobe.png' },
  { title: 'Account Manager', logoFile: 'salesforce.png' },
  { title: 'Full Stack Developer', logoFile: 'github.png' },
  { title: 'Customer Service Representative', logoFile: 'amazon.png' },
  { title: 'Digital Marketing Specialist', logoFile: 'hubspot.png' },
  { title: 'Software Engineer', logoFile: 'microsoft.png' },
  { title: 'Product Manager', logoFile: 'meta.png' },
  { title: 'Financial Analyst', logoFile: 'jp-morgan-chase.png' },
  { title: 'Marketing Manager', logoFile: 'shopify.png' },
  { title: 'Project Manager', logoFile: 'deloitte.png' },
  { title: 'Cybersecurity Analyst', logoFile: 'cisco.jpg' },
  { title: 'Sales Executive', logoFile: 'linkedin.png' },
  { title: 'Business Analyst', logoFile: 'accenture.jpg' },
  { title: 'Data Analyst', logoFile: 'ibm.png' },
  { title: 'Data Scientist', logoFile: 'google.png' },
];

export const MOCK_ROLE_PICKER_CARDS: MockRolePickerCard[] = ROLE_PICKER_LOGO_SEED.map(({ title, logoFile }) => ({
  title,
  logoFile,
  logo: companyLogoPublicUrl(logoFile),
}));

/** Title list derived from role picker cards (search, legacy helpers). */
export const MOCK_ROLE_TITLES: string[] = MOCK_ROLE_PICKER_CARDS.map((c) => c.title);

/** Company grid (mock) — optional `logo` is a public URL; otherwise initials are used in the UI */
export interface MockCompanyCard {
  id: string;
  name: string;
  logo?: string;
}

export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function companyIdFromName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || `company-${name.length}`;
}

/**
 * Companies shown in the live mock interview picker — **only entries with a file in `public/company_logos/`**.
 * To add a company: drop `yourbrand.png` (or .jpg) in that folder and append a row here.
 */
const MOCK_COMPANY_SEED: { name: string; logoFile: string }[] = [
  { name: 'Accenture', logoFile: 'accenture.jpg' },
  { name: 'Adobe', logoFile: 'adobe.png' },
  { name: 'American Express', logoFile: 'americanexpress.jpg' },
  { name: 'Amazon', logoFile: 'amazon.png' },
  { name: 'Apple', logoFile: 'apple.png' },
  { name: 'Axis Bank', logoFile: 'axis_bank.jpg' },
  { name: 'Capgemini', logoFile: 'capgemini.jpg' },
  { name: 'Cisco', logoFile: 'cisco.jpg' },
  { name: 'Cognizant', logoFile: 'cognizant.jpg' },
  { name: 'Coinbase', logoFile: 'coinbase.png' },
  { name: 'Dell', logoFile: 'dell.png' },
  { name: 'Deloitte', logoFile: 'deloitte.png' },
  { name: 'Flipkart', logoFile: 'flipkart.png' },
  { name: 'GitHub', logoFile: 'github.png' },
  { name: 'Goldman Sachs', logoFile: 'goldmansachs.jpg' },
  { name: 'Google', logoFile: 'google.png' },
  { name: 'HubSpot', logoFile: 'hubspot.png' },
  { name: 'IBM', logoFile: 'ibm.png' },
  { name: 'Infosys', logoFile: 'infosys.png' },
  { name: 'JP Morgan Chase', logoFile: 'jp-morgan-chase.png' },
  { name: 'LinkedIn', logoFile: 'linkedin.png' },
  { name: 'Mastercard', logoFile: 'mastercard.jpg' },
  { name: 'McKinsey & Company', logoFile: 'mckinsey.jpg' },
  { name: 'Meesho', logoFile: 'meesho.jpg' },
  { name: 'Meta', logoFile: 'meta.png' },
  { name: 'Microsoft', logoFile: 'microsoft.png' },
  { name: 'Mindtree', logoFile: 'mindtree.png' },
  { name: 'Oracle', logoFile: 'oracle.png' },
  { name: 'PayPal', logoFile: 'paypal.png' },
  { name: 'Paytm', logoFile: 'paytm.jpg' },
  { name: 'PwC', logoFile: 'pwc.jpg' },
  { name: 'Salesforce', logoFile: 'salesforce.png' },
  { name: 'Samsung', logoFile: 'samsung.png' },
  { name: 'Shopify', logoFile: 'shopify.png' },
  { name: 'Stripe', logoFile: 'stripe.png' },
  { name: 'Swiggy', logoFile: 'swiggy.png' },
  { name: 'Uber', logoFile: 'uber.png' },
  { name: 'Visa', logoFile: 'visa.png' },
  { name: 'VMware', logoFile: 'vmware.jpg' },
  { name: 'Walmart', logoFile: 'walmart.png' },
  { name: 'Wells Fargo', logoFile: 'wellsfargo.jpg' },
  { name: 'Workday', logoFile: 'workday.png' },
  { name: 'Zoho', logoFile: 'zoho.png' },
];

export const MOCK_COMPANIES: MockCompanyCard[] = MOCK_COMPANY_SEED.map(({ name, logoFile }) => ({
  id: companyIdFromName(name),
  name,
  logo: companyLogoPublicUrl(logoFile),
})).sort((a, b) => a.name.localeCompare(b.name));

export interface MockInterviewer {
  id: string;
  name: string;
  locale: string;
  initial: string;
}

export const MOCK_INTERVIEWERS: MockInterviewer[] = [
  { id: 'ava', name: 'Ava', locale: 'US English', initial: 'A' },
  { id: 'kai', name: 'Kai', locale: 'IN English', initial: 'K' },
  { id: 'mia', name: 'Mia', locale: 'UK English', initial: 'M' },
  { id: 'leo', name: 'Leo', locale: 'US English', initial: 'L' },
];

export const MOCK_INTERVIEW_ROUNDS = [
  { id: 'role-related', label: 'Role related' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'technical', label: 'Technical' },
  { id: 'system-design', label: 'System design' },
] as const;

export const PRACTICE_INSTRUCTION_STEPS: string[] = [
  'Your interview will be taken by an AI interviewer — wait for the introduction before starting.',
  'After each prompt, use the button to advance. If your mic is on, you can practice speaking out loud; this build does not send audio to a server.',
  'Give structured answers for clearer feedback in the sample report.',
  'Complete all sections to unlock the full analytics-style summary (demo).',
  'Use headphones to avoid echo while testing speakers and microphone.',
];

export const PREREQUISITE_CHECK_LABELS: string[] = [
  'Browser supports secure camera and microphone access.',
  'Microphone is available and permission granted (or skipped if audio is off).',
  'Camera is available and permission granted (or skipped if video is off).',
  'Microphone is picking up sound — speak when this step runs.',
  'Network reachability to this site looks OK.',
  'Speaker / audio output test (short tone played).',
];

/** Map free-text role / JD title to interview script track */
export function inferTrackFromText(text: string): InterviewTrackId {
  const t = text.toLowerCase();
  if (
    /\bdata\b|\banalyst\b|\bscientist\b|\banalytics\b|\bbi\b|\bsql\b/.test(t)
  ) {
    return 'data';
  }
  if (
    /\bproduct manager\b|\bpm\b|\bproduct\b/.test(t) &&
    !/\bproject manager\b|\baccount\b|\bmarketing manager\b/.test(t)
  ) {
    return 'pm';
  }
  return 'swe';
}
