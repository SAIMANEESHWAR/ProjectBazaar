import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useNavigation } from '../App';
import Sidebar from './Sidebar';
import type { DashboardView } from './DashboardPage';
import { CartProvider, WishlistProvider } from './DashboardPage';
import SkeletonDashboard from './ui/skeleton-dashboard';

// Lambda API endpoint for Mock Assessments
const MOCK_ASSESSMENTS_API = 'https://w7k9vplo2j.execute-api.ap-south-2.amazonaws.com/default/mock_assessment_handler';

// Logo helper (same as admin page)
const technologyLogoMap: Record<string, string> = {
  'java': 'java', 'python': 'python', 'javascript': 'javascript', 'typescript': 'typescript',
  'c++': 'cplusplus', 'cpp': 'cplusplus', 'c': 'c', 'go': 'go', 'rust': 'rust',
  'react': 'react', 'vue': 'vuedotjs', 'angular': 'angular',
  'node.js': 'nodedotjs', 'nodejs': 'nodedotjs', 'node js': 'nodedotjs', 'node': 'nodedotjs',
  'next.js': 'nextdotjs', 'nextjs': 'nextdotjs', 'express': 'express', 'django': 'django', 'flask': 'flask',
  'spring': 'spring', 'mysql': 'mysql', 'postgresql': 'postgresql', 'mongodb': 'mongodb',
  'redis': 'redis', 'docker': 'docker', 'kubernetes': 'kubernetes', 'aws': 'amazonaws',
  'azure': 'microsoftazure', 'gcp': 'googlecloud', 'git': 'git', 'google': 'google',
  'microsoft': 'microsoft', 'amazon': 'amazon', 'apple': 'apple', 'meta': 'meta',
  'netflix': 'netflix', 'uber': 'uber', 'linkedin': 'linkedin',
};

const normalizeLogoKey = (value: string) => value.toLowerCase().trim().replace(/[.\s_-]+/g, '');

const getLogoFromTitle = (title: string): string => {
  if (!title) return '';
  const titleLower = title.toLowerCase().trim();
  const titleNorm = normalizeLogoKey(title);

  if (technologyLogoMap[titleLower]) {
    return `https://cdn.simpleicons.org/${technologyLogoMap[titleLower]}/000000`;
  }

  // Prefer longer keys first so "nodejs" wins over "node"/"c"
  const entries = Object.entries(technologyLogoMap).sort((a, b) => b[0].length - a[0].length);
  for (const [key, iconName] of entries) {
    const keyNorm = normalizeLogoKey(key);
    if (titleNorm === keyNorm) {
      return `https://cdn.simpleicons.org/${iconName}/000000`;
    }
    // Avoid short ambiguous keys like "c" matching inside other words
    if (keyNorm.length >= 3 && (titleNorm.includes(keyNorm) || (titleNorm.length >= 3 && keyNorm.includes(titleNorm)))) {
      return `https://cdn.simpleicons.org/${iconName}/000000`;
    }
  }

  // Prefer company/topic word before "Assessment" e.g. "Google Assessment"
  const firstWord = titleLower.split(/\s+/)[0] || '';
  if (firstWord && technologyLogoMap[firstWord]) {
    return `https://cdn.simpleicons.org/${technologyLogoMap[firstWord]}/000000`;
  }

  return '';
};

const getLetterAvatarDataUrl = (title: string): string => {
  const letter = (title?.trim()?.[0] || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
    <rect width="64" height="64" rx="12" fill="#f3f4f6"/>
    <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="600" fill="#6b7280">${letter}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(svg) : ''}`;
};
const triggerConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });
};

const triggerSuccessConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  const fire = (particleRatio: number, opts: Record<string, unknown>) => {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  };

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

const triggerBadgeConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.5 },
    colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFB347', '#FFDAB9']
  });
};

const triggerCertificateConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  const end = Date.now() + 2000;
  const colors = ['#FFD700', '#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42'];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

// Navigation helper for updating URL
const navigateToRoute = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

// ============================================
// TYPES & INTERFACES
// ============================================

type AssessmentView = 'list' | 'test' | 'results' | 'certificate' | 'interview' | 'schedule' | 'leaderboard' | 'achievements' | 'daily-challenge' | 'study-resources' | 'history';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type TestMode = 'timed' | 'practice';

interface Assessment {
  id: string;
  title: string;
  logo: string;
  time: string;
  objective: number;
  programming: number;
  registrations: number;
  category: 'technical' | 'language' | 'framework' | 'database' | 'devops' | 'company';
  popular?: boolean;
  difficulty?: DifficultyLevel;
  company?: string;
  xpReward?: number;
  questions?: AnyQuestion[]; // Added questions field
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  explanation?: string;
  difficulty?: DifficultyLevel;
  type?: 'mcq'; // Optional, defaults to MCQ
}

interface ProgrammingQuestion {
  id: number;
  question: string;
  topic: string;
  type: 'programming';
  difficulty: DifficultyLevel;
  constraints?: string;
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
  explanation?: string;
}

type AnyQuestion = Question | ProgrammingQuestion;

interface TestResult {
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  totalQuestions: number;
  attempted: number;
  solved: number;
  duration: string;
  startTime: string;
  difficulty?: DifficultyLevel;
  xpEarned?: number;
  terminationReason?: 'completed' | 'tab_switch' | 'fullscreen_exit' | 'time_expired';
  proctoringViolations?: {
    tabSwitchCount: number;
    fullScreenExitCount: number;
  };
  questionResults: {
    questionId: number;
    topic: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
    question?: string;
    options?: string[];
    explanation?: string;
  }[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string; // Path to badge image
  earned: boolean;
  earnedDate?: string;
  requirement: string;
  xpReward: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  profilePicture?: string;
  xp: number;
  testsCompleted: number;
  avgScore: number;
  badges: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  topic: string;
  difficulty: DifficultyLevel;
  xpReward: number;
  timeLimit: number;
  completed: boolean;
  expiresAt: string;
}

interface UserProgress {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  streak: number;
  testsCompleted: number;
  avgScore: number;
  badges: Badge[];
}



// ============================================
// MOCK DATA - Assessments (REMOVED - FETCHED FROM API)
// ============================================

// Static data removed

// Company-specific assessments
// Company assessments data removed

// Badges data
const MOCK_BADGES: Badge[] = [
  {
    id: 'first-win',
    name: 'First Victory',
    description: 'Completed your first assessment successfully',
    icon: '',
    image: 'https://cdn-icons-png.flaticon.com/512/616/616490.png',
    earned: true,
    earnedDate: '2025-01-15T10:00:00Z',
    requirement: 'Complete 1 test',
    xpReward: 100
  },
  {
    id: 'streak-3',
    name: '3 Day Streak',
    description: 'Logged in and practiced for 3 consecutive days',
    icon: '',
    image: 'https://cdn-icons-png.flaticon.com/512/4272/4272841.png',
    earned: true,
    earnedDate: '2025-01-20T10:00:00Z',
    requirement: '3 day streak',
    xpReward: 150
  },
  {
    id: 'python-master',
    name: 'Python Pro',
    description: 'Scored 90%+ in a Python assessment',
    icon: '',
    image: 'https://cdn.simpleicons.org/python/3776AB',
    earned: false,
    requirement: 'Score 90% in Python',
    xpReward: 500
  },
  {
    id: 'react-dev',
    name: 'React Developer',
    description: 'Demonstrated proficiency in React Hooks',
    icon: '',
    image: 'https://cdn.simpleicons.org/react/61DAFB',
    earned: true,
    earnedDate: '2025-01-18T14:30:00Z',
    requirement: 'Pass React Quiz',
    xpReward: 300
  },
  {
    id: 'algo-expert',
    name: 'Algorithm Expert',
    description: 'Solved 5 hard algorithm problems',
    icon: '',
    image: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
    earned: false,
    requirement: '5 Hard Problems',
    xpReward: 1000
  },
  {
    id: 'bug-hunter',
    name: 'Bug Hunter',
    description: 'Fixed a bug in a code challenge',
    icon: '',
    image: 'https://cdn-icons-png.flaticon.com/512/1157/1157077.png',
    earned: true,
    earnedDate: '2025-01-22T09:15:00Z',
    requirement: 'Fix 1 Bug',
    xpReward: 200
  }
];

// Static allBadges removed in favor of dynamic userProgress


// Static leaderboard removed in favor of dynamic data

// Daily challenge data
const dailyChallengeData: DailyChallenge = {
  id: 'daily-2026-01-18',
  title: 'React Hooks Challenge',
  topic: 'React',
  difficulty: 'medium',
  xpReward: 50,
  timeLimit: 300,
  completed: false,
  expiresAt: '2026-01-18T23:59:59',
};



// ============================================
// QUESTION BANKS
// ============================================

// Static questionBanks removed


// Default questions for assessments without specific banks
// Static defaultQuestions removed


// ============================================
// PROGRAMMING QUESTION BANKS
// ============================================

// Static programmingQuestionBanks removed


// ============================================
// ICONS
// ============================================

const ClockIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const FlagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const DocumentIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BookOpenIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ShieldCheckIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const LockOpenIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const TargetIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.485 0a9.485 9.485 0 11-16.97 0M12 2v2m0 16v2M2 12h2m16 0h2" />
  </svg>
);

const BoltIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const PlayIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartBarIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ClipboardIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const LightBulbIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const TrophyIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3h14M9 3v2a3 3 0 003 3v0a3 3 0 003-3V3M5 3a2 2 0 00-2 2v1a4 4 0 004 4M19 3a2 2 0 012 2v1a4 4 0 01-4 4M7 10v1a5 5 0 005 5v0a5 5 0 005-5v-1M9 21h6M12 17v4" />
  </svg>
);

const UserCircleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const SectionIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
    {children}
  </span>
);

const AvatarFallback = () => (
  <UserCircleIcon className="w-6 h-6 text-gray-400" />
);

// ============================================
// MAIN COMPONENT
// ============================================

interface MockAssessmentPageProps {
  initialView?: AssessmentView;
  toggleSidebar?: () => void;
  embedded?: boolean; // When true, skip rendering sidebar (used when embedded in DashboardContent)
}

const MockAssessmentPage: React.FC<MockAssessmentPageProps> = ({ initialView = 'list', toggleSidebar, embedded = false }) => {
  const { userId } = useAuth();
  const { navigateTo } = useNavigation();
  const [view, setView] = useState<AssessmentView>(initialView === 'history' ? 'list' : initialView);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'assessment' | 'history'>(initialView === 'history' ? 'history' : 'assessment');
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'grid'>('grid');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [historySort, setHistorySort] = useState<'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'>('date_desc');

  // Track failed badge images
  const [failedBadgeImages, setFailedBadgeImages] = useState<Record<string, boolean>>({});

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarNavigation = (navView: DashboardView) => {
    if (navView === 'mock-assessment') {
      // Already here, maybe reset to list?
      navigateToView('list');
    } else {
      // Navigate to other pages
      // map dashboard view to app page


      if (navView === 'dashboard') navigateTo('dashboard');
      else if (navView === 'coding-questions') navigateTo('codingQuestions');
      else if (navView === 'build-portfolio') navigateTo('buildPortfolio');
      else if (navView === 'build-resume') navigateTo('buildResume');
      else if (navView === 'purchases') navigateTo('dashboard'); // Placeholder
      else if (navView === 'wishlist') navigateTo('dashboard'); // Placeholder
      else {
        // For others, we might need to use window.location or expand Page type support
        // For now, let's assume specific ones supported in App.tsx
        console.log('Navigating to', navView);
      }
    }
  };

  const [hintsUsed, setHintsUsed] = useState<Record<number, number>>({});

  // Anti-cheating & proctoring state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenExitCount, setFullScreenExitCount] = useState(0);
  const [showFullScreenWarning, setShowFullScreenWarning] = useState(false);
  const [, setCopyPasteAttempts] = useState(0);
  const [showUnansweredConfirmModal, setShowUnansweredConfirmModal] = useState(false);
  const [showTerminationAlert, setShowTerminationAlert] = useState(false);
  const [terminationReason, setTerminationReason] = useState<'completed' | 'tab_switch' | 'fullscreen_exit' | 'time_expired' | null>(null);
  const [showQuestionInstructions, setShowQuestionInstructions] = useState(false);

  // Maximum warnings before auto-submit
  const MAX_TAB_SWITCHES = 1;
  const MAX_FULLSCREEN_EXITS = 2;

  // Handle initial view from route
  useEffect(() => {
    if (initialView === 'leaderboard' || initialView === 'achievements' || initialView === 'daily-challenge') {
      setView(initialView);
    } else if (initialView === 'history') {
      setActiveTab('history');
      setView('list');
    }
  }, [initialView]);

  // Navigation helper that updates both state and URL
  const navigateToView = useCallback((targetView: AssessmentView) => {
    setView(targetView);
    const routes: Record<AssessmentView, string> = {
      'list': '/mock-assessment',
      'test': '/mock-assessment',
      'results': '/mock-assessment',
      'certificate': '/mock-assessment',
      'interview': '/mock-assessment',
      'schedule': '/mock-assessment',
      'history': '/mock-assessment/history',
      'leaderboard': '/mock-assessment/leaderboard',
      'achievements': '/mock-assessment/achievements',
      'daily-challenge': '/mock-assessment/daily-challenge',
      'study-resources': '/mock-assessment'
    };
    navigateToRoute(routes[targetView] || '/mock-assessment');

    // Trigger confetti for achievements view
    if (targetView === 'achievements') {
      setTimeout(() => {
        triggerBadgeConfetti();
      }, 400);
    }
  }, []);

  const [testHistory, setTestHistory] = useState<TestResult[]>([]);

  // Fetch test history
  const fetchTestHistory = useCallback(async () => {
    // Skip if userId is not available yet
    if (!userId) {
      console.log('Skipping fetchTestHistory - userId not available');
      return;
    }
    try {
      setIsLoading(true);
      const output = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_test_history',
          userId
        })
      });

      if (!output.ok) throw new Error('Failed to fetch history');

      const data = await output.json();
      console.log('History API Response:', data);

      let history: any[] = [];
      if (data.success === true && data.data) {
        history = data.data.testHistory || [];
      } else if (data.status === 'success' && data.data) {
        history = data.data.testHistory || [];
      } else if (data.body) {
        try {
          const parsed = JSON.parse(data.body);
          history = parsed.data?.testHistory || [];
        } catch (e) { console.error(e); }
      }

      // Map to TestResult interface if needed, or assume backend matches
      // Ideally we should validate/map fields here
      const mappedHistory: TestResult[] = history.map((item: any) => ({
        assessmentId: item.assessmentId,
        assessmentTitle: item.assessmentTitle || item.assessmentId,
        score: item.score,
        totalQuestions: item.totalQuestions,
        attempted: item.attempted,
        solved: item.solved,
        duration: item.duration || '0 mins',
        startTime: item.startTime,
        xpEarned: item.xpEarned,
        difficulty: item.difficulty,
        questionResults: Array.isArray(item.questionResults) ? item.questionResults : [],
        proctoringViolations: item.proctoringData
          ? {
              tabSwitchCount: item.proctoringData.tabSwitchCount || 0,
              fullScreenExitCount: item.proctoringData.fullScreenExitCount || 0,
            }
          : undefined,
      }));

      setTestHistory(mappedHistory);
    } catch (err) {
      console.error('Error fetching history:', err);
      // setError('Failed to load history'); // Optional: show error in UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch history when view changes to 'history'
  useEffect(() => {
    if (userId && (view === 'history' || activeTab === 'history')) {
      fetchTestHistory();
    }
  }, [userId, view, activeTab, fetchTestHistory]);


  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    currentXP: 0,
    nextLevelXP: 500,
    totalXP: 0,
    streak: 0,
    testsCompleted: 0,
    avgScore: 0,
    badges: [],
    // Add default values for other fields if needed for UI before load
  });

  const fetchUserProgress = useCallback(async () => {
    // Skip if userId is not available yet
    if (!userId) {
      console.log('Skipping fetchUserProgress - userId not available');
      return;
    }
    try {
      const output = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user_progress', userId })
      });

      const mergeBadges = (apiBadges: Badge[] = []) => {
        const badgeMap = new Map(apiBadges.map(b => [b.id, b]));
        MOCK_BADGES.forEach(mockBadge => {
          if (!badgeMap.has(mockBadge.id)) {
            badgeMap.set(mockBadge.id, mockBadge);
          }
        });
        return Array.from(badgeMap.values());
      };

      if (!output.ok) {
        console.warn('get_user_progress failed:', output.status);
        setUserProgress(prev => ({ ...prev, badges: MOCK_BADGES }));
        return;
      }

      if (output.ok) {
        const data = await output.json();
        if (data.success && data.data) {
          const mergedBadges = mergeBadges(data.data.badges);
          setUserProgress({ ...data.data, badges: mergedBadges });
        } else if (data.body) {
          try {
            const parsed = JSON.parse(data.body);
            if (parsed.success && parsed.data) {
              const mergedBadges = mergeBadges(parsed.data.badges);
              setUserProgress({ ...parsed.data, badges: mergedBadges });
            }
          } catch (e) { console.error(e); }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user progress:', error);
      setUserProgress(prev => ({ ...prev, badges: MOCK_BADGES }));
    }
  }, [userId]);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const output = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_leaderboard', limit: 100, timeframe: 'all' })
      });
      if (output.ok) {
        const data = await output.json();
        if (data.success && data.data) {
          setLeaderboard(data.data.leaderboard || []);
        } else if (data.body) {
          try {
            const parsed = JSON.parse(data.body);
            if (parsed.success && parsed.data) setLeaderboard(parsed.data.leaderboard || []);
          } catch (e) { console.error(e); }
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Fetch user progress on mount and when userId becomes available
  useEffect(() => {
    if (userId) {
      fetchUserProgress();
    }
    fetchLeaderboard();
  }, [userId, fetchUserProgress, fetchLeaderboard]);
  const [testMode, setTestMode] = useState<TestMode>('timed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [antiCheatMode, setAntiCheatMode] = useState<boolean>(true);

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  // Duplicate userProgress removed

  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(dailyChallengeData);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompanyTests, setShowCompanyTests] = useState(false);

  // Data State
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [companyAssessments, setCompanyAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assessments from API
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(MOCK_ASSESSMENTS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list_assessments' })
        });

        if (!response.ok) throw new Error('Failed to fetch assessments');

        const data = await response.json();
        console.log('API Response:', data);

        // Determine the array of assessments from various possible response structures
        let fetchedAssessments: any[] = [];

        if (data.body && typeof data.body === 'string') {
          // Handle Lambda Proxy integration where body is a string
          try {
            const parsedBody = JSON.parse(data.body);
            fetchedAssessments = parsedBody.assessments || parsedBody.data?.assessments || [];
          } catch (e) {
            console.error('Error parsing response body:', e);
          }
        } else if (Array.isArray(data.assessments)) {
          // Direct { assessments: [...] }
          fetchedAssessments = data.assessments;
        } else if (data.data && Array.isArray(data.data.assessments)) {
          // Nested { data: { assessments: [...] } }
          fetchedAssessments = data.data.assessments;
        } else if (data.success === true && data.data) {
          // New Lambda Format: { success: true, data: { assessments: [...] } }
          if (Array.isArray(data.data.assessments)) {
            fetchedAssessments = data.data.assessments;
          } else if (Array.isArray(data.data)) {
            fetchedAssessments = data.data;
          }
        } else if (data.status === 'success' && Array.isArray(data.data)) {
          // Old Format fallback
          fetchedAssessments = data.data;
        }

        if (Array.isArray(fetchedAssessments)) {
          const normalizeAssessment = (a: any): Assessment => {
            const mcqQuestions = (a.questions || []).filter((q: AnyQuestion) => q.type !== 'programming');
            return {
              ...a,
              logo: a.logo || getLogoFromTitle(a.company || a.title),
              questions: mcqQuestions,
              objective: mcqQuestions.length || a.objective || 0,
              programming: 0,
            };
          };

          const allAssessments = fetchedAssessments.map(normalizeAssessment);

          setAssessments(allAssessments.filter((a: Assessment) => a.category !== 'company'));
          setCompanyAssessments(allAssessments.filter((a: Assessment) => a.category === 'company'));
        } else {
          throw new Error('Invalid data format received: ' + JSON.stringify(data).substring(0, 100));
        }
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('Failed to load assessments. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const filterMcqQuestions = (questions: AnyQuestion[]): Question[] =>
    questions.filter((q): q is Question => q.type !== 'programming');

  const getQuestions = useCallback((): Question[] => {
    if (!selectedAssessment) return [];
    return filterMcqQuestions(selectedAssessment.questions || []);
  }, [selectedAssessment]);

  // Timer effect — auto-submit when time runs out
  useEffect(() => {
    if (view !== 'test' || testMode !== 'timed') return;

    if (timeLeft <= 0) {
      setTerminationReason('time_expired');
      setShowTerminationAlert(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [view, timeLeft, testMode]);

  // Tab switch detection effect
  useEffect(() => {
    if (view !== 'test' || !antiCheatMode) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_TAB_SWITCHES) {
            setTerminationReason('tab_switch');
            setShowTerminationAlert(true);
          } else {
            setShowTabWarningModal(true);
          }
          return newCount;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchCount(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_TAB_SWITCHES) {
          setTerminationReason('tab_switch');
          setShowTerminationAlert(true);
        } else {
          setShowTabWarningModal(true);
        }
        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [view, antiCheatMode]);

  // Copy/paste prevention effect
  useEffect(() => {
    if (view !== 'test' || !antiCheatMode) return;

    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyPasteAttempts(prev => prev + 1);
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setCopyPasteAttempts(prev => prev + 1);
    };

    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          setCopyPasteAttempts(prev => prev + 1);
        }
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('keydown', preventKeyboardShortcuts);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
    };
  }, [view, antiCheatMode]);

  // Fullscreen mode management
  useEffect(() => {
    if (view !== 'test' || !antiCheatMode) return;

    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;
      if (!isCurrentlyFullScreen && isFullScreen) {
        setFullScreenExitCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_FULLSCREEN_EXITS) {
            setTerminationReason('fullscreen_exit');
            setShowTerminationAlert(true);
          } else {
            setShowFullScreenWarning(true);
          }
          return newCount;
        });
      }
      setIsFullScreen(isCurrentlyFullScreen);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [view, isFullScreen, antiCheatMode]);

  const enterFullScreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  const exitFullScreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullScreen(false);
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch questions for specific assessment
  const fetchQuestions = async (assessmentId: string | number) => {
    try {
      setIsLoading(true);
      const response = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_questions',
          assessmentId: assessmentId
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch questions');

      const data = await response.json();
      let questions = [];

      if (data.body) {
        try {
          const parsed = JSON.parse(data.body);
          questions = parsed.data || parsed.questions || [];
        } catch (e) { questions = []; }
      } else {
        questions = data.data || data.questions || [];
      }

      return filterMcqQuestions(questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const openHistoryDetails = async (result: TestResult) => {
    setTestResult(result);
    setExpandedQuestion(null);
    setView('results');

    const matched =
      assessments.find(a => a.id === result.assessmentId) ||
      companyAssessments.find(a => a.id === result.assessmentId) ||
      assessments.find(a => a.title.toLowerCase() === result.assessmentTitle.toLowerCase()) ||
      companyAssessments.find(a => a.title.toLowerCase() === result.assessmentTitle.toLowerCase());

    // Prefer questions already stored on the result; otherwise load assessment questions
    const snapshotQuestions: Question[] = (result.questionResults || [])
      .filter(r => r.question && Array.isArray(r.options) && r.options.length > 0)
      .map((r, index) => ({
        id: r.questionId || index + 1,
        question: r.question as string,
        options: r.options as string[],
        correctAnswer: Number(r.correctAnswer),
        topic: r.topic || 'General',
        explanation: r.explanation,
        type: 'mcq' as const,
      }));

    if (snapshotQuestions.length > 0) {
      setSelectedAssessment({
        id: result.assessmentId,
        title: result.assessmentTitle,
        logo: matched?.logo || getLogoFromTitle(result.assessmentTitle),
        time: result.duration,
        objective: snapshotQuestions.length,
        programming: 0,
        registrations: matched?.registrations || 0,
        questions: snapshotQuestions,
      });
      return;
    }

    if (matched) {
      const mcqOnly = filterMcqQuestions(matched.questions || []);
      if (mcqOnly.length > 0) {
        setSelectedAssessment({ ...matched, questions: mcqOnly, programming: 0 });
        return;
      }
    }

    if (result.assessmentId) {
      const fetched = await fetchQuestions(result.assessmentId);
      if (fetched.length > 0) {
        setSelectedAssessment({
          id: result.assessmentId,
          title: result.assessmentTitle,
          logo: matched?.logo || getLogoFromTitle(result.assessmentTitle),
          time: result.duration,
          objective: fetched.length,
          programming: 0,
          registrations: matched?.registrations || 0,
          questions: fetched,
        });
      }
    }
  };

  const handleStartTest = async (assessment: Assessment) => {
    const mcqOnly = filterMcqQuestions(assessment.questions || []);
    setSelectedAssessment({ ...assessment, questions: mcqOnly, programming: 0, objective: mcqOnly.length || assessment.objective });

    if (mcqOnly.length === 0) {
      const fetchedQuestions = await fetchQuestions(assessment.id);
      if (fetchedQuestions.length > 0) {
        const updated = { ...assessment, questions: fetchedQuestions, programming: 0, objective: fetchedQuestions.length };
        setSelectedAssessment(updated);
        setAssessments(prev => prev.map(a => a.id === assessment.id ? updated : a));
        setCompanyAssessments(prev => prev.map(a => a.id === assessment.id ? updated : a));
      }
    }

    setShowInstructions(true);
  };

  const handleBeginTest = () => {
    setShowInstructions(false);
    setShowRules(true);
  };

  const handleEnterTest = () => {
    setShowRules(false);
    setView('test');
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFlaggedQuestions(new Set());
    const timeInSeconds = parseInt(selectedAssessment?.time || '30') * 60;
    setTimeLeft(timeInSeconds);
    setTestStartTime(new Date());

    // Reset anti-cheating counters
    setTabSwitchCount(0);
    setFullScreenExitCount(0);
    setCopyPasteAttempts(0);
    setTerminationReason(null);
    setHintsUsed({});

    // Enter fullscreen mode for both anti-cheat and cheated modes
    enterFullScreen();
  };

  const handleAnswerSelect = (optionIndex: number) => {
    console.log(`[Answer Select] Question ${currentQuestionIndex}, Selected Option: ${optionIndex}`);
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const handleFlagQuestion = () => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const handleSubmitTest = () => {
    const questions = getQuestions();

    // Check for unanswered questions
    const unansweredQuestions: number[] = [];
    questions.forEach((_q, index) => {
      if (answers[index] === undefined) {
        unansweredQuestions.push(index + 1);
      }
    });

    // In anti-cheat mode, auto-submit without confirmation
    // In cheated mode, show confirmation modal if there are unanswered questions
    if (unansweredQuestions.length > 0 && !antiCheatMode) {
      setShowUnansweredConfirmModal(true);
      return;
    }

    // Proceed with submission (auto-submit in anti-cheat mode or if all answered)
    proceedWithSubmission();
  };

  const proceedWithSubmission = () => {
    // Exit fullscreen when test is submitted
    exitFullScreen();

    const questions = getQuestions();
    const questionResults = questions.map((q, index) => {
      const userAnswer = answers[index] ?? -1;
      const correctAnswer = q.correctAnswer;
      // Ensure both are numbers for comparison to avoid type mismatches
      const isCorrect = Number(userAnswer) === Number(correctAnswer);

      console.log(`[Question ${index}] User: ${userAnswer}, Correct: ${correctAnswer}, Match: ${isCorrect}`);

      return {
        questionId: q.id,
        topic: q.topic,
        isCorrect,
        userAnswer,
        correctAnswer,
        question: q.question,
        options: q.options,
        explanation: q.explanation,
      };
    });

    const solved = questionResults.filter((r) => r.isCorrect).length;
    const attempted = Object.keys(answers).length;

    // Apply hint penalty (reduce score if hints were used)
    const totalHintsUsed = Object.values(hintsUsed).reduce((a, b) => a + b, 0);
    const hintPenalty = Math.min(totalHintsUsed * 2, 20); // Max 20% penalty
    const baseScore = (solved / questions.length) * 100;
    const score = Math.max(0, baseScore - hintPenalty);

    const result: TestResult = {
      assessmentId: selectedAssessment?.id || '',
      assessmentTitle: selectedAssessment?.title || '',
      score,
      totalQuestions: questions.length,
      attempted,
      solved,
      duration: selectedAssessment?.time || '30 Minutes',
      startTime: testStartTime?.toLocaleString() || new Date().toLocaleString(),
      terminationReason: terminationReason || 'completed',
      proctoringViolations: antiCheatMode ? {
        tabSwitchCount,
        fullScreenExitCount,
      } : undefined,
      questionResults,
    };

    setTestResult(result);
    setTestHistory(prev => [result, ...prev]); // Save to history

    // Calculate XP based on anti-cheat mode and timer mode
    const baseXP = score * 2;

    // Anti-cheat mode multiplier: More XP if anti-cheat is enabled (honest mode)
    const antiCheatMultiplier = antiCheatMode ? 1.5 : 0.5;

    // Timer mode multiplier: More XP if timed mode (challenging)
    const timerMultiplier = testMode === 'timed' ? 1.2 : 0.8;

    // Apply multipliers
    let calculatedXP = baseXP * antiCheatMultiplier * timerMultiplier;

    // Apply violation penalties only in anti-cheat mode
    const violationPenalty = antiCheatMode ? (tabSwitchCount * 10 + fullScreenExitCount * 5) : 0;

    // Final XP earned
    const xpEarned = Math.max(0, Math.round(calculatedXP - violationPenalty));

    // Store XP earned in result
    result.xpEarned = xpEarned;

    setUserProgress(prev => {
      let newXP = prev.currentXP + xpEarned;
      let newLevel = prev.level;
      let newNextLevelXP = prev.nextLevelXP;

      // Level up logic
      while (newXP >= newNextLevelXP) {
        newLevel++;
        newXP -= newNextLevelXP; // Carry over excess XP
        newNextLevelXP = Math.round(newNextLevelXP * 1.5); // Increase XP needed for next level
      }

      // Check for badge achievements
      const updatedBadges = prev.badges.map(badge => {
        if (!badge.earned) {
          if (badge.id === 'first_test' && prev.testsCompleted + 1 >= 1) {
            return { ...badge, earned: true, earnedDate: new Date().toISOString().split('T')[0] };
          }
          if (badge.id === 'high_scorer' && score >= 90) {
            return { ...badge, earned: true, earnedDate: new Date().toISOString().split('T')[0] };
          }
          // Add more badge conditions here based on prev.testsCompleted, prev.totalXP, etc.
        }
        return badge;
      });

      const newProgress = {
        ...prev,
        level: newLevel,
        currentXP: newXP,
        nextLevelXP: newNextLevelXP,
        totalXP: prev.totalXP + xpEarned,
        testsCompleted: prev.testsCompleted + 1,
        // Note: score is already a percentage (0-100), no need to recalculate
        avgScore: Math.round((prev.avgScore * prev.testsCompleted + score) / (prev.testsCompleted + 1)),
        badges: updatedBadges,
      };

      localStorage.setItem('userProgress', JSON.stringify(newProgress));
      return newProgress;
    });


    // Mark daily challenge as completed if applicable
    if (selectedAssessment && dailyChallenge.topic.toLowerCase().includes(selectedAssessment.title.toLowerCase())) {
      setDailyChallenge(prev => ({ ...prev, completed: true }));
    }

    // Submit to backend
    const submitToBackend = async () => {
      try {
        const response = await fetch(MOCK_ASSESSMENTS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit_test_result',
            userId,
            assessmentId: selectedAssessment?.id || '',
            assessmentTitle: selectedAssessment?.title || '',
            score: Math.round((solved / questions.length) * 100), // Send as percentage
            totalQuestions: questions.length,
            attempted,
            solved,
            duration: selectedAssessment?.time || '30 Minutes',
            startTime: testStartTime?.toISOString() || new Date().toISOString(),
            questionResults,
            proctoringData: {
              tabSwitchCount: antiCheatMode ? tabSwitchCount : 0,
              fullScreenExitCount: antiCheatMode ? fullScreenExitCount : 0,
              copyPasteAttempts: 0,
              hintsUsed: Object.values(hintsUsed).reduce((a, b) => a + b, 0)
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Test submission response:', data);

          // Refresh all dynamic data after successful submission
          await Promise.all([
            fetchUserProgress(),
            fetchTestHistory(),
            fetchLeaderboard(),
          ]);
        } else {
          console.error('Failed to submit test result');
        }
      } catch (error) {
        console.error('Error submitting test result:', error);
      }
    };

    // Call backend submission (non-blocking)
    submitToBackend();

    // Reset proctoring state
    setShowTabWarningModal(false);
    setShowFullScreenWarning(false);

    setView('results');

    // Trigger confetti based on score
    setTimeout(() => {
      if (score >= 80) {
        triggerSuccessConfetti();
      } else if (score >= 50) {
        triggerConfetti();
      }
    }, 300);
  };

  const handleBackToList = () => {
    navigateToView('list');
    setSelectedAssessment(null);
    setTestResult(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleViewCertificate = () => {
    setView('certificate');
    // Trigger celebration confetti for certificate
    setTimeout(() => {
      triggerCertificateConfetti();
    }, 500);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const matchesDifficulty = (assessment: Assessment) =>
    !assessment.difficulty || assessment.difficulty === selectedDifficulty ||
    (assessment as Assessment & { difficulties?: DifficultyLevel[] }).difficulties?.includes(selectedDifficulty);

  const renderAssessmentCard = (assessment: Assessment) => (
    <div
      key={assessment.id}
      onClick={() => handleStartTest(assessment)}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 relative group cursor-pointer"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={assessment.logo}
            alt={assessment.title}
            className="w-10 h-10 object-contain"
            onError={(e) => {
              const letter = (assessment.title[0] || '?').toUpperCase();
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
                <rect width="64" height="64" fill="#f3f4f6"/>
                <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial" font-size="32" fill="#9ca3af">${letter}</text>
              </svg>`;
              (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(svg)}`;
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{assessment.title}</h3>
          {assessment.difficulty && (
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              assessment.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              assessment.difficulty === 'hard' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
              'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {assessment.difficulty}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span className="flex items-center gap-1.5">
          <ClockIcon />
          {assessment.time}
        </span>
        <span className="flex items-center gap-1.5">
          <GridIcon />
          {assessment.objective} MCQ
        </span>
      </div>

      <div className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center justify-end gap-1 group-hover:gap-2 transition-all">
        Start Test
        <ArrowRightIcon />
      </div>
    </div>
  );

  const renderAssessmentList = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Menu Button */}
              {toggleSidebar && (
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => window.history.back()}
                className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeftIcon />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('assessment')}
                className={`px-5 py-2 rounded-lg font-medium transition text-sm ${activeTab === 'assessment'
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                Free Mock Assessment
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-2 rounded-lg font-medium transition text-sm ${activeTab === 'history'
                  ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'assessment' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Loading State - Skeleton */}
          {isLoading && (
            <div className="space-y-8">
              <SkeletonDashboard />
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-6 text-center mb-8">
              <p className="font-semibold mb-2">Error Loading Data</p>
              <p>{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mock Assessments</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Objective MCQ tests for company interviews and technical skills
                </p>
              </div>

              {/* Test Type Toggle */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => { setShowCompanyTests(true); setSelectedCategory('all'); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${showCompanyTests
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Company Tests
                      </button>
                      <button
                        onClick={() => { setShowCompanyTests(false); setSelectedCategory('all'); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${!showCompanyTests
                          ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Technical Tests
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Mode:</span>
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setTestMode('timed')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${testMode === 'timed' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                          }`}
                      >
                        Timed
                      </button>
                      <button
                        onClick={() => setTestMode('practice')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${testMode === 'practice' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                          }`}
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                </div>

                {!showCompanyTests && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Category:</span>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'technical', 'language', 'framework', 'database', 'devops'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${selectedCategory === cat
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-orange-300'
                            }`}
                        >
                          {cat === 'all' ? 'All' : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty:</span>
                  {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${selectedDifficulty === diff
                        ? diff === 'easy' ? 'bg-emerald-500 text-white' : diff === 'medium' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Tests Grid */}
              {showCompanyTests && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {companyAssessments.filter(matchesDifficulty).map(renderAssessmentCard)}
                  {companyAssessments.filter(matchesDifficulty).length === 0 && (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No company tests found for this difficulty.</p>
                  )}
                </div>
              )}

              {/* Technical Tests Grid */}
              {!showCompanyTests && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {assessments
                    .filter(a => selectedCategory === 'all' || a.category === selectedCategory)
                    .filter(matchesDifficulty)
                    .map(renderAssessmentCard)}
                  {assessments
                    .filter(a => selectedCategory === 'all' || a.category === selectedCategory)
                    .filter(matchesDifficulty).length === 0 && (
                    <p className="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No technical tests found for this filter.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
      {activeTab === 'history' && renderHistorySection()}

      {/* Leaderboard View */}
      {
        view === 'leaderboard' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeftIcon />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrophyIcon className="w-6 h-6 text-amber-500" />
                Leaderboard
              </h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Top 3 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6">
                <div className="flex justify-center items-end gap-4">
                  {/* 2nd Place */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-gray-300 dark:border-gray-500">
                      {leaderboard[1]?.avatar}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboard[1]?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboard[1]?.xp} XP</p>
                    <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">2</div>
                  </div>
                  {/* 1st Place */}
                  <div className="text-center -mt-4">
                    <div className="flex justify-center mb-1">
                      <TrophyIcon className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mb-2 mx-auto border-4 border-amber-300">
                      {leaderboard[0]?.avatar}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{leaderboard[0]?.name}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{leaderboard[0]?.xp} XP</p>
                    <div className="w-12 h-14 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-xl font-bold text-white">1</div>
                  </div>
                  {/* 3rd Place */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-amber-200 dark:border-amber-700">
                      {leaderboard[2]?.avatar}
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboard[2]?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboard[2]?.xp} XP</p>
                    <div className="w-10 h-8 bg-amber-200 dark:bg-amber-800 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold text-amber-800 dark:text-amber-200">3</div>
                  </div>
                </div>
              </div>

              {/* Rest of leaderboard */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {leaderboard.slice(3).map((entry: LeaderboardEntry) => (
                  <div key={entry.rank} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span className="w-8 text-center font-bold text-gray-400">{entry.rank}</span>
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-lg">
                      {entry.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{entry.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.testsCompleted} tests • {entry.avgScore}% avg</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">{entry.xp} XP</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{entry.badges} badges</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      {/* Achievements View */}
      {
        view === 'achievements' && (
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => navigateToView('list')}
                className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements & Badges</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {userProgress.badges.filter(b => b.earned).length} of {userProgress.badges.length} badges unlocked
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Progress</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  {Math.round((userProgress.badges.filter(b => b.earned).length / userProgress.badges.length) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(userProgress.badges.filter(b => b.earned).length / userProgress.badges.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userProgress.badges.map((badge: Badge, index) => (
                <div
                  key={badge.id}
                  className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${badge.earned
                    ? 'border-amber-200 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-500'
                    : 'border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
                    }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Earned Glow Effect */}
                  {badge.earned && (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-transparent to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl pointer-events-none" />
                  )}

                  <div className="relative flex items-start gap-4">
                    {/* Badge Icon */}
                    <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${badge.earned
                      ? 'bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 dark:from-amber-800/40 dark:via-orange-800/30 dark:to-yellow-800/40 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 grayscale'
                      }`}>
                      {badge.image ? (
                        <img
                          src={badge.image}
                          alt={badge.name}
                          className={`w-11 h-11 object-contain ${badge.earned ? 'drop-shadow-md' : 'opacity-50'}`}
                        />
                      ) : (
                        <TrophyIcon className="w-8 h-8 text-amber-500" />
                      )}
                      {/* Lock Icon for unearned */}
                      {!badge.earned && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{badge.name}</h3>
                        {badge.earned && (
                          <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Earned
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {badge.requirement}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg font-medium">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5zm0-3a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3A.5.5 0 018 9z" />
                          </svg>
                          +{badge.xpReward} XP
                        </span>
                      </div>
                      {badge.earned && badge.earnedDate && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Earned on {new Date(badge.earnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Daily Challenge View */}
      {
        view === 'daily-challenge' && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeftIcon />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon />
                Daily Challenge
              </h2>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">Today's Challenge</p>
                  <h3 className="text-xl font-bold">{dailyChallenge.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">+{dailyChallenge.xpReward}</p>
                  <p className="text-xs opacity-80">XP Reward</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <span className="px-2 py-1 bg-white/20 rounded text-xs">{dailyChallenge.topic}</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs capitalize">{dailyChallenge.difficulty}</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs inline-flex items-center gap-1">
                  <ClockIcon />
                  {Math.floor(dailyChallenge.timeLimit / 60)} min
                </span>
              </div>
              <button
                onClick={() => {
                  const challengeAssessment = assessments.find(a => a.title.toLowerCase().includes(dailyChallenge.topic.toLowerCase())) || assessments[0];
                  setSelectedAssessment(challengeAssessment);
                  setShowInstructions(true);
                }}
                className="w-full py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-100 transition"
              >
                {dailyChallenge.completed ? 'Challenge Completed' : 'Start Challenge'}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Challenge Rules</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Complete the challenge within the time limit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Score at least 70% to earn the full XP reward
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Challenge resets daily at midnight
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Complete 10 daily challenges to earn the "Daily Champion" badge
                </li>
              </ul>
            </div>
          </div>
        )
      }
    </div >
  );

  const renderHistorySection = () => {
    const filteredHistory = testHistory
      .filter((result) => {
        const matchesSearch = result.assessmentTitle.toLowerCase().includes(historySearch.toLowerCase());
        const matchesStatus =
          historyStatusFilter === 'all'
            ? true
            : historyStatusFilter === 'passed'
              ? Math.round(result.score) >= 60
              : Math.round(result.score) < 60;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (historySort === 'date_desc') return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        if (historySort === 'date_asc') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        if (historySort === 'score_desc') return b.score - a.score;
        if (historySort === 'score_asc') return a.score - b.score;
        return 0;
      });

    const resolveHistoryLogo = (result: TestResult): string => {
      const matched =
        assessments.find(a => a.id === result.assessmentId) ||
        companyAssessments.find(a => a.id === result.assessmentId) ||
        assessments.find(a => a.title.toLowerCase() === result.assessmentTitle.toLowerCase()) ||
        companyAssessments.find(a => a.title.toLowerCase() === result.assessmentTitle.toLowerCase());

      return (
        matched?.logo ||
        getLogoFromTitle(result.assessmentTitle) ||
        getLetterAvatarDataUrl(result.assessmentTitle)
      );
    };

    const renderHistoryCard = (result: TestResult, index: number) => {
      // Note: result.score is already a percentage (0-100), not the number of correct answers
      const percentage = Math.round(result.score);
      const isPassed = percentage >= 60;
      const logoSrc = resolveHistoryLogo(result);

      return (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 overflow-hidden">
              <img
                src={logoSrc}
                alt={result.assessmentTitle}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = getLetterAvatarDataUrl(result.assessmentTitle);
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {result.assessmentTitle}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(result.startTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs ${isPassed
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
              {isPassed ? 'Passed' : 'Failed'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.solved}/{result.totalQuestions}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
              <p className={`text-lg font-semibold ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{percentage}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.duration}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
            </div>
          </div>

          <div className="flex gap-2">
            {isPassed && (
              <button
                onClick={() => {
                  setTestResult(result);
                  setView('certificate');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Certificate
              </button>
            )}
            <button
              onClick={() => openHistoryDetails(result)}
              className={`${isPassed ? 'flex-1' : 'w-full'} flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
            >
              View Details
            </button>
          </div>
        </div>
      );
    };

    const renderHistoryList = (result: TestResult, index: number) => {
      // Note: result.score is already a percentage (0-100), not the number of correct answers
      const percentage = Math.round(result.score);
      const isPassed = percentage >= 60;
      const logoSrc = resolveHistoryLogo(result);

      return (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0 overflow-hidden">
                <img
                  src={logoSrc}
                  alt={result.assessmentTitle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).onerror = null;
                    (e.target as HTMLImageElement).src = getLetterAvatarDataUrl(result.assessmentTitle);
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{result.assessmentTitle} Assessment</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Completed on {new Date(result.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 sm:gap-6">
              <div className="text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{result.solved}/{result.totalQuestions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
              </div>
              <div className="text-center">
                <p className={`text-base font-semibold ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>{percentage}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-900 dark:text-white">{result.duration}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs ${isPassed
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                {isPassed ? 'Passed' : 'Failed'}
              </span>
              {isPassed && (
                <button
                  onClick={() => { setTestResult(result); setView('certificate'); }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Certificate
                </button>
              )}
              <button
                onClick={() => openHistoryDetails(result)}
                className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Details
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with View Toggle */}
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Assessment History</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">View your attempted assessments, scores, and download certificates</p>
            </div>

            {testHistory.length > 0 && (
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setHistoryViewMode('list')}
                  className={`px-3 py-1.5 rounded text-xs transition ${historyViewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setHistoryViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-xs transition ${historyViewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Filters */}
          {testHistory.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={historySort}
                onChange={(e) => setHistorySort(e.target.value as any)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="score_desc">Highest Score</option>
                <option value="score_asc">Lowest Score</option>
              </select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-48 relative overflow-hidden">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {testHistory.length === 0 ? 'No Assessments Attempted Yet' : 'No matches found'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {testHistory.length === 0 ? 'Start taking mock assessments to build your history!' : 'Try adjusting your filters.'}
            </p>
            {testHistory.length === 0 && (
              <button
                onClick={() => setActiveTab('assessment')}
                className="px-5 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition"
              >
                Take Your First Assessment
              </button>
            )}
          </div>
        ) : (
          <>
            {/* List View */}
            {historyViewMode === 'list' && (
              <div className="space-y-3">
                {filteredHistory.map(renderHistoryList)}
              </div>
            )}

            {/* Grid View */}
            {historyViewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map(renderHistoryCard)}
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        {filteredHistory.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{filteredHistory.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tests Found</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-emerald-600">
                {filteredHistory.filter(r => Math.round(r.score) >= 60).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tests Passed</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-orange-600">
                {Math.min(100, Math.max(0, Math.round(filteredHistory.reduce((acc, r) => acc + Math.min(100, Math.max(0, r.score)), 0) / filteredHistory.length)))}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Score</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-amber-600">
                {filteredHistory.filter(r => Math.round(r.score) >= 60).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Certificates Earned</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInstructionsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={() => setShowInstructions(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <img
            src={selectedAssessment?.logo}
            alt={selectedAssessment?.title}
            className="w-12 h-12 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = '/mock_assessments_logo/sde_interview.png'; }}
          />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Powered by</p>
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">CodeXCareer</h3>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {selectedAssessment?.title} Assessment
        </h2>

        {/* Test Mode Selection */}
        <div className="mb-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <SectionIcon><DocumentIcon className="w-4 h-4" /></SectionIcon>
            Test Mode
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTestMode('timed')}
              className={`p-4 rounded-xl border-2 transition ${testMode === 'timed'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2 mx-auto">
                <ClockIcon />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Timed Test</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real exam experience</p>
            </button>
            <button
              onClick={() => setTestMode('practice')}
              className={`p-4 rounded-xl border-2 transition ${testMode === 'practice'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2 mx-auto">
                <BookOpenIcon className="w-5 h-5" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Practice Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No timer, learn at your pace</p>
            </button>
          </div>
        </div>

        {/* Anti-Cheat Mode Selection */}
        <div className="mb-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <SectionIcon><ShieldCheckIcon className="w-4 h-4" /></SectionIcon>
            Proctoring Mode
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAntiCheatMode(true)}
              className={`p-4 rounded-xl border-2 transition ${antiCheatMode
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 mx-auto">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Anti-Cheat</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No copy/paste, tab switch detection</p>
            </button>
            <button
              onClick={() => setAntiCheatMode(false)}
              className={`p-4 rounded-xl border-2 transition ${!antiCheatMode
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 mx-auto">
                <LockOpenIcon className="w-5 h-5" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Cheated Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Copy/paste, tab switch allowed</p>
            </button>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <SectionIcon><TargetIcon className="w-4 h-4" /></SectionIcon>
            Difficulty Level
          </h4>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition capitalize ${selectedDifficulty === diff
                  ? diff === 'easy'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : diff === 'medium'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <p className="font-medium text-sm capitalize">{diff}</p>
              </button>
            ))}
          </div>
        </div>

        {/* XP Reward Preview */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-5 border border-purple-200 dark:border-purple-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BoltIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-purple-700 dark:text-purple-400">Potential XP Reward</span>
              </div>
              <span className="font-bold text-purple-700 dark:text-purple-400">
                +{Math.round((selectedDifficulty === 'easy' ? 50 : selectedDifficulty === 'medium' ? 100 : 150) * (antiCheatMode ? 1.5 : 0.5) * (testMode === 'timed' ? 1.2 : 0.8))} - {Math.round((selectedDifficulty === 'easy' ? 100 : selectedDifficulty === 'medium' ? 200 : 300) * (antiCheatMode ? 1.5 : 0.5) * (testMode === 'timed' ? 1.2 : 0.8))} XP
              </span>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>{antiCheatMode ? 'Anti-Cheat Mode: 1.5x' : 'Practice Mode: 0.5x'}</span>
              </div>
              <div className="flex items-center gap-2">
                {testMode === 'timed' ? <ClockIcon /> : <BookOpenIcon className="w-3.5 h-3.5" />}
                <span>{testMode === 'timed' ? 'Timed Mode: 1.2x' : 'Practice Mode: 0.8x'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-5">
          <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-3">Instructions</h4>
          <ol className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
            <li className="flex gap-2">
              <span className="font-medium text-gray-900 dark:text-white">1.</span>
              <span>You will have <strong>{testMode === 'practice' ? 'unlimited time' : selectedAssessment?.time}</strong> to complete the test.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-gray-900 dark:text-white">2.</span>
              <span>Score at least 60% to pass and earn your certificate.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium text-gray-900 dark:text-white">3.</span>
              <span>Review explanations after the test to learn from mistakes.</span>
            </li>
            {antiCheatMode && (
              <li className="flex gap-2">
                <span className="font-medium text-gray-900 dark:text-white">4.</span>
                <span><strong>Anti-Cheat Mode:</strong> Copy/paste, tab switching, and fullscreen exit are restricted. Violations may result in auto-submission.</span>
              </li>
            )}
            {!antiCheatMode && (
              <li className="flex gap-2">
                <span className="font-medium text-gray-900 dark:text-white">4.</span>
                <span><strong>Cheated Mode:</strong> Copy/paste and tab switching are allowed. Fullscreen mode is still required.</span>
              </li>
            )}
          </ol>
        </div>

        <button
          onClick={handleBeginTest}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
        >
          <PlayIcon className="w-5 h-5" />
          Start {testMode === 'practice' ? 'Practice' : 'Test'}
        </button>
      </div>
    </div>
  );

  const renderRulesModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Before You Begin: Important Rules
        </h2>

        <div className="space-y-4 mb-8">
          {[
            'Do not switch tabs or windows during the test',
            'Do not copy or paste any questions or answers',
            'Keep the test in full screen mode at all times',
          ].map((rule, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-gray-700 dark:text-gray-300">{rule}</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <p className="text-amber-800 dark:text-amber-200">
            <strong>Warning:</strong> Violating any rule will result in a warning. Four violations will lead to disqualification and your current attempt will be marked as disqualified.
          </p>
        </div>

        <button
          onClick={handleEnterTest}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition"
        >
          Enter Test
        </button>
      </div>
    </div>
  );

  // Tab switch warning modal
  const renderTabWarningModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-pulse-once">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Tab Switch Detected!
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          You switched away from the test. This has been recorded.
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-red-700 dark:text-red-400 font-medium">Warnings:</span>
            <span className="text-red-700 dark:text-red-400 font-bold text-lg">
              {tabSwitchCount} / {MAX_TAB_SWITCHES}
            </span>
          </div>
          <div className="mt-2 h-2 bg-red-200 dark:bg-red-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${(tabSwitchCount / MAX_TAB_SWITCHES) * 100}%` }}
            />
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            {MAX_TAB_SWITCHES - tabSwitchCount} warning{MAX_TAB_SWITCHES - tabSwitchCount !== 1 ? 's' : ''} remaining before auto-submission
          </p>
        </div>

        <button
          onClick={() => {
            setShowTabWarningModal(false);
            enterFullScreen();
          }}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg shadow-red-500/30"
        >
          Return to Test
        </button>
      </div>
    </div>
  );

  // Unanswered questions confirmation modal
  const renderUnansweredConfirmModal = () => {
    const questions = getQuestions();
    const unansweredQuestions: number[] = [];
    questions.forEach((_q, index) => {
      if (answers[index] === undefined) {
        unansweredQuestions.push(index + 1);
      }
    });

    const totalQuestions = questions.length;
    const answeredQuestions = totalQuestions - unansweredQuestions.length;
    const completionPercentage = Math.round((answeredQuestions / totalQuestions) * 100);

    // Donut chart calculations
    const circumference = 2 * Math.PI * 42;
    const answeredStroke = (answeredQuestions / totalQuestions) * circumference;

    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4"
        onClick={() => setShowUnansweredConfirmModal(false)}
      >
        <div
          className="bg-white dark:bg-[#1c1c1e] rounded-[20px] w-full max-w-[380px] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          }}
        >
          {/* Header Section */}
          <div className="relative pt-8 pb-6 px-6">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent" />

            {/* Icon */}
            <div className="relative flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h3 className="relative text-lg font-semibold text-gray-900 dark:text-white text-center">
              Before You Submit
            </h3>
            <p className="relative text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
              {unansweredQuestions.length} question{unansweredQuestions.length !== 1 ? 's' : ''} still need your attention
            </p>
          </div>

          {/* Progress Ring & Stats */}
          <div className="px-6 pb-5">
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-5">
                {/* Donut Chart */}
                <div className="relative flex-shrink-0">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      className="dark:stroke-gray-700"
                    />
                    {/* Progress arc */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${answeredStroke} ${circumference}`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dasharray 0.6s ease' }}
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#16a34a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center percentage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{completionPercentage}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Answered</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{answeredQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Unanswered</span>
                    </div>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{unansweredQuestions.length}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{totalQuestions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Questions to review */}
          {unansweredQuestions.length > 0 && (
            <div className="px-6 pb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Jump to Question
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {unansweredQuestions.slice(0, 10).map((qNum) => (
                  <button
                    key={qNum}
                    onClick={() => {
                      setShowUnansweredConfirmModal(false);
                      setCurrentQuestionIndex(qNum - 1);
                    }}
                    className="group relative w-9 h-9 rounded-xl text-sm font-medium bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:border-orange-500 dark:hover:text-white transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {qNum}
                  </button>
                ))}
                {unansweredQuestions.length > 10 && (
                  <div className="flex items-center justify-center px-3 h-9 text-xs font-medium text-gray-400 dark:text-gray-500">
                    +{unansweredQuestions.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="px-6 pb-6 pt-2">
            {/* Info notice */}
            <div className="flex items-start gap-2.5 mb-5 p-3 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Unanswered questions will be scored as <span className="font-semibold">0 points</span> each.
              </p>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowUnansweredConfirmModal(false)}
                className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-all duration-150"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowUnansweredConfirmModal(false);
                  proceedWithSubmission();
                }}
                className="py-3 px-4 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-150 shadow-md shadow-orange-500/25"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fullscreen exit warning modal
  const renderFullScreenWarningModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Fullscreen Mode Required
        </h2>

        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          Please stay in fullscreen mode during the test to maintain exam integrity.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-amber-700 dark:text-amber-400 font-medium">Exits:</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold text-lg">
              {fullScreenExitCount} / {MAX_FULLSCREEN_EXITS}
            </span>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            {MAX_FULLSCREEN_EXITS - fullScreenExitCount} exit{MAX_FULLSCREEN_EXITS - fullScreenExitCount !== 1 ? 's' : ''} remaining before auto-submission
          </p>
        </div>

        <button
          onClick={() => {
            setShowFullScreenWarning(false);
            enterFullScreen();
          }}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-amber-700 transition shadow-lg shadow-amber-500/30"
        >
          Re-enter Fullscreen
        </button>
      </div>
    </div>
  );

  // Termination alert modal (shown when test is auto-terminated due to anti-cheat violations)
  const renderTerminationAlertModal = () => {
    const isTabSwitch = terminationReason === 'tab_switch';
    const isFullScreenExit = terminationReason === 'fullscreen_exit';
    const isTimeExpired = terminationReason === 'time_expired';

    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className={`flex items-center justify-center w-20 h-20 mx-auto mb-5 rounded-full ${isTimeExpired ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            <svg className={`w-10 h-10 ${isTimeExpired ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isTimeExpired ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
          </div>

          <h2 className={`text-2xl font-bold text-center mb-3 ${isTimeExpired ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
            {isTimeExpired ? 'Time Up!' : 'Test Terminated'}
          </h2>

          <p className="text-gray-700 dark:text-gray-300 text-center mb-4 font-medium">
            {isTabSwitch && 'Your test has been automatically terminated due to exceeding the maximum tab switch limit.'}
            {isFullScreenExit && 'Your test has been automatically terminated due to exceeding the maximum fullscreen exit limit.'}
            {isTimeExpired && 'Your allotted time has ended. Your answers will be submitted automatically.'}
          </p>

          <div className={`rounded-xl p-4 mb-6 border ${isTimeExpired ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}>
            <div className={`flex items-center gap-3 ${isTimeExpired ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">
                {isTabSwitch && `Tab switches: ${tabSwitchCount}/${MAX_TAB_SWITCHES}`}
                {isFullScreenExit && `Fullscreen exits: ${fullScreenExitCount}/${MAX_FULLSCREEN_EXITS}`}
                {isTimeExpired && 'Timer reached 00:00:00'}
              </span>
            </div>
            <p className={`text-xs mt-3 ${isTimeExpired ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
              {isTimeExpired
                ? 'Your answers have been recorded and will be scored.'
                : 'Your answers will be submitted and scored. This violation has been recorded.'}
            </p>
          </div>

          <button
            onClick={() => {
              setShowTerminationAlert(false);
              proceedWithSubmission();
            }}
            className={`w-full py-3 text-white font-semibold rounded-xl transition shadow-lg ${
              isTimeExpired
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30'
            }`}
          >
            View Results
          </button>
        </div>
      </div>
    );
  };

  const renderTestInterface = () => {
    const questions = getQuestions();
    const currentQuestion = questions[currentQuestionIndex];
    const attemptedCount = Object.keys(answers).length;
    const progressPercent = (attemptedCount / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex">
        {/* Enhanced Sidebar */}
        <div className="w-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl relative">
          {/* Decorative accent */}
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600" />

          {/* Logo/Brand area */}
          <div className="p-3 border-b border-slate-700/50">
            <div className="w-10 h-10 mx-auto bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>



          {/* Section label */}
          <div className="px-2 py-3">
            <div className="text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Questions</span>
            </div>
          </div>

          {/* Question navigation - scrollable */}
          <div className="flex-1 overflow-y-auto px-1.5 py-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            <div className="grid grid-cols-2 gap-1.5">
              {questions.map((_, index) => {
                const isActive = currentQuestionIndex === index;
                const isAnswered = answers[index] !== undefined;
                const isFlagged = flaggedQuestions.has(index);

                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`relative aspect-square rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center ${isActive
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/40'
                      : isAnswered
                        ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-700/40 text-slate-400 hover:bg-slate-600/60 hover:text-white'
                      }`}
                  >
                    {index + 1}
                    {isAnswered && !isActive && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    {isFlagged && (
                      <span className="absolute -top-1 -left-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 text-[8px] font-bold">!</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress summary */}
          <div className="p-2 border-t border-slate-700/50">
            <div className="bg-slate-700/30 rounded-lg p-2">
              <div className="text-center mb-1.5">
                <span className="text-white font-bold text-sm">{attemptedCount}</span>
                <span className="text-slate-400 text-xs">/{questions.length}</span>
              </div>
              <div className="h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Header */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex items-center justify-center">
                <img
                  src={selectedAssessment?.logo}
                  alt={selectedAssessment?.title}
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedAssessment?.title} Assessment
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mock Coding Interview</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer - Only show in timed mode */}
              {testMode === 'timed' && (() => {
                const isCritical = timeLeft <= 60;
                const isLow = timeLeft > 60 && timeLeft <= 300;
                const isWarning = timeLeft > 300 && timeLeft <= 600;
                return (
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                      isCritical
                        ? 'bg-red-100 border-red-400 dark:bg-red-900/40 dark:border-red-500 animate-pulse shadow-md shadow-red-500/20'
                        : isLow
                          ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-600'
                          : isWarning
                            ? 'bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-600'
                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                    title={isCritical ? 'Time almost up!' : isLow ? 'Less than 5 minutes left' : isWarning ? 'Less than 10 minutes left' : 'Time remaining'}
                  >
                    <ClockIcon
                      className={`w-4 h-4 ${
                        isCritical || isLow
                          ? 'text-red-600 dark:text-red-400'
                          : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                    <span
                      className={`font-mono text-sm font-semibold tabular-nums ${
                        isCritical || isLow
                          ? 'text-red-600 dark:text-red-400'
                          : isWarning
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {formatTime(timeLeft)}
                    </span>
                    {(isCritical || isLow) && (
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-red-500 dark:text-red-400'}`}>
                        {isCritical ? 'Hurry!' : 'Low'}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Progress indicator */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {attemptedCount}/{questions.length}
                </span>
              </div>

              {/* End Test button */}
              <button
                onClick={handleSubmitTest}
                className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white font-semibold rounded-xl hover:from-rose-600 hover:to-red-600 transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5"
              >
                End Test
              </button>
            </div>
          </div>

          {/* Question navigation pills */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-8 py-4 border-b border-gray-200/50 dark:border-gray-700/50 overflow-visible">
            <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-lg shadow-sm">MCQ</span>
              </div>
              <div className="flex items-center gap-2 py-1">
                {questions.map((_q, index) => {
                  const isActive = currentQuestionIndex === index;
                  const isAnswered = answers[index] !== undefined;

                  return (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`relative w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center flex-shrink-0 ${isActive
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
                        : isAnswered
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                        }`}
                    >
                      {index + 1}
                      {isAnswered && !isActive && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto">
              {/* Question card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/30 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-750 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-orange-500/25">
                      {currentQuestionIndex + 1}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        {selectedAssessment?.title} • Question {currentQuestion.id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Topic: <span className="font-medium text-gray-700 dark:text-gray-300">{currentQuestion.topic}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleFlagQuestion}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${flaggedQuestions.has(currentQuestionIndex)
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                  >
                    <FlagIcon />
                    <span className="font-medium">{flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}</span>
                  </button>
                </div>

                {/* Question body - MCQ only */}
                <div className="p-5">
                      <div className="flex items-start gap-3 mb-5">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed whitespace-pre-line flex-1">
                          {currentQuestion.question}
                        </h3>
                        <button
                          onClick={() => setShowQuestionInstructions(!showQuestionInstructions)}
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center justify-center transition-colors group"
                          title="Show question instructions"
                        >
                          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>

                      {/* Question Instructions Panel */}
                      {showQuestionInstructions && (
                        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Question Instructions</h4>
                              <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1.5">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                  <span>Read the question carefully before selecting your answer.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                  <span>You can flag questions to review them later.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                  <span>You can change your answer before submitting the test.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                  <span>Topic: <span className="font-medium">{currentQuestion.topic}</span></span>
                                </li>
                                {currentQuestion.difficulty && (
                                  <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                    <span>Difficulty: <span className="font-medium capitalize">{currentQuestion.difficulty}</span></span>
                                  </li>
                                )}
                              </ul>
                            </div>
                            <button
                              onClick={() => setShowQuestionInstructions(false)}
                              className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2.5">
                        {currentQuestion.options.map((option, index) => {
                          const isSelected = answers[currentQuestionIndex] === index;
                          const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

                          return (
                            <button
                              key={index}
                              onClick={() => handleAnswerSelect(index)}
                              className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3 group ${isSelected
                                ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-300 dark:border-orange-500'
                                : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-white dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-200 flex-shrink-0 ${isSelected
                                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                                  : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 group-hover:border-orange-300 group-hover:text-orange-600 dark:group-hover:border-orange-500 dark:group-hover:text-orange-400'
                                  }`}
                              >
                                {optionLabel}
                              </div>
                              <span className={`flex-1 text-sm transition-colors ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {option}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                </div>
              </div>

              {/* Answer confirmation */}
              {answers[currentQuestionIndex] !== undefined && (
                <div className="mt-4 px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Answer saved. You can change it anytime before submitting.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-8 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <ArrowLeftIcon />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  <span>{currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}</span>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Modals */}
        {showTabWarningModal && antiCheatMode && renderTabWarningModal()}
        {showFullScreenWarning && antiCheatMode && renderFullScreenWarningModal()}
        {showUnansweredConfirmModal && renderUnansweredConfirmModal()}
        {showTerminationAlert && (antiCheatMode || terminationReason === 'time_expired') && renderTerminationAlertModal()}
      </div>
    );
  };

  /* Improved Assessment Report UI */
  const renderResults = () => {
    if (!testResult) return null;

    const isPassed = testResult.score >= 40;
    const percentage = Math.round((testResult.score / 100) * 100);
    const accuracy = Math.round((testResult.solved / testResult.attempted) * 100) || 0;


    // Calculate topic stats
    const topicStats: Record<string, { correct: number; total: number }> = {};
    testResult.questionResults.forEach(r => {
      if (!topicStats[r.topic]) topicStats[r.topic] = { correct: 0, total: 0 };
      topicStats[r.topic].total++;
      if (r.isCorrect) topicStats[r.topic].correct++;
    });

    // SVG Circular Progress
    const circumference = 2 * Math.PI * 54; // radius = 54
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Sticky Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <ArrowLeftIcon />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{testResult.assessmentTitle}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Assessment Report</p>
              </div>
            </div>
            {/* Show Certificate button only if passed (>= 60%) */}
            {Math.round(testResult.score) >= 60 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleViewCertificate}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-xl hover:shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5"
                >
                  <DownloadIcon />
                  <span className="hidden sm:inline">Certificate</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Hero Score Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 p-8 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-2xl" />

              <div className="relative flex flex-col md:flex-row items-center gap-8">
                {/* Circular Score */}
                <div className="relative">
                  <svg className="w-36 h-36 transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="54"
                      stroke="url(#scoreGradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isPassed ? '#10b981' : '#f59e0b'} />
                        <stop offset="100%" stopColor={isPassed ? '#059669' : '#d97706'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-white">{percentage}%</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wider mt-1">Score</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircleIcon />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{testResult.solved}</p>
                    <p className="text-xs text-gray-400">Correct</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <XCircleIcon />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{testResult.attempted - testResult.solved}</p>
                    <p className="text-xs text-gray-400">Incorrect</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <ClockIcon />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{testResult.duration}</p>
                    <p className="text-xs text-gray-400">Duration</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <ChartBarIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{accuracy}%</p>
                    <p className="text-xs text-gray-400">Accuracy</p>
                  </div>
                </div>
              </div>

              {/* Result Badge */}
              <div className="relative flex justify-center mt-6">
                {isPassed ? (
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-full font-semibold shadow-lg shadow-emerald-500/30">
                    <CheckCircleIcon />
                    Assessment Passed
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-semibold shadow-lg shadow-amber-500/30">
                    <TargetIcon className="w-5 h-5" />
                    Keep Practicing
                  </div>
                )}
              </div>
            </div>

            {/* XP Earned Banner */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BoltIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">Experience Points Earned</p>
                    <p className="text-2xl font-bold text-white">+{testResult.xpEarned || Math.round(testResult.score * 2)} XP</p>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Level Progress</p>
                    <p className="text-white font-semibold">Level 5</p>
                  </div>
                  <div className="w-32">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: '78%' }} />
                    </div>
                    <p className="text-white/60 text-xs mt-1 text-right">78%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Termination Warning Banner - Show if test was auto-submitted due to violations */}
          {testResult.terminationReason && testResult.terminationReason !== 'completed' && (
            <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-lg shadow-red-500/25 overflow-hidden mb-8">
              <div className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Test Auto-Submitted Due to Policy Violation
                    </h3>
                    <p className="text-white/90 text-sm mt-1">
                      {testResult.terminationReason === 'tab_switch' && (
                        <>Your test was automatically submitted because you switched tabs or left the test window. This violates the anti-cheat policy.</>
                      )}
                      {testResult.terminationReason === 'fullscreen_exit' && (
                        <>Your test was automatically submitted because you exited fullscreen mode multiple times. This violates the proctoring policy.</>
                      )}
                      {testResult.terminationReason === 'time_expired' && (
                        <>Your test was automatically submitted because the time limit expired.</>
                      )}
                    </p>
                  </div>
                </div>
                {testResult.proctoringViolations && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                        <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white/90 text-sm">Tab Switches: <span className="font-bold text-white">{testResult.proctoringViolations.tabSwitchCount}</span></span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                        <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span className="text-white/90 text-sm">Fullscreen Exits: <span className="font-bold text-white">{testResult.proctoringViolations.fullScreenExitCount}</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Questions Results - Main Column */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ClipboardIcon className="w-5 h-5 text-orange-500" />
                      Question Results
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click on a question to see details</p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                    {testResult.solved}/{testResult.totalQuestions}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {(!testResult.questionResults || testResult.questionResults.length === 0) ? (
                    <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      Detailed question answers are not available for this attempt.
                      New tests will save question-by-question results for review.
                    </div>
                  ) : testResult.questionResults.map((result, index) => {
                    const liveQuestion = getQuestions()[index];
                    const question: Question | null = liveQuestion || (result.question && result.options
                      ? {
                          id: result.questionId || index + 1,
                          question: result.question,
                          options: result.options,
                          correctAnswer: Number(result.correctAnswer),
                          topic: result.topic || 'General',
                          explanation: result.explanation,
                          type: 'mcq',
                        }
                      : null);
                    const isExpanded = expandedQuestion === index;

                    return (
                      <div key={index} className="group">
                        <button
                          onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                        >
                          {/* Question Number */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${result.isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                            {index + 1}
                          </div>

                          {/* Question Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                                {result.topic || 'General'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {question?.question || `Question ${index + 1}`}
                            </p>
                          </div>

                          {/* Status & Score */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {result.isCorrect ? '1' : '0'}/1
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">mark</p>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${result.isCorrect ? 'bg-emerald-500' : 'bg-red-500'
                              }`}>
                              {result.isCorrect ? (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-800/50">
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                              {question ? (
                                <>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">{question.question}</p>

                                  <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">Your Answer:</span>
                                      <span className={`px-2 py-1 rounded font-medium ${result.isCorrect
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                        }`}>
                                        {result.userAnswer !== -1 ? String.fromCharCode(65 + Number(result.userAnswer)) : 'Not Answered'}
                                        {result.userAnswer !== -1 && question.options[Number(result.userAnswer)]
                                          ? ` - ${question.options[Number(result.userAnswer)]}`
                                          : ''}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm flex-wrap">
                                      <span className="font-semibold text-gray-700 dark:text-gray-300">Correct Answer:</span>
                                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                                        {String.fromCharCode(65 + Number(question.correctAnswer))}
                                        {question.options[Number(question.correctAnswer)]
                                          ? ` - ${question.options[Number(question.correctAnswer)]}`
                                          : ''}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {question.options.map((opt, optIdx) => (
                                      <div
                                        key={optIdx}
                                        className={`px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${optIdx === Number(question.correctAnswer)
                                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-700'
                                          : optIdx === Number(result.userAnswer) && !result.isCorrect
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                                          }`}
                                      >
                                        <span className="w-6 h-6 rounded-full bg-current/10 flex items-center justify-center text-xs font-bold">
                                          {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <span className="flex-1">{opt}</span>
                                      </div>
                                    ))}
                                  </div>

                                  {question.explanation && (
                                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                                          <LightBulbIcon className="w-4 h-4" />
                                          Explanation
                                        </span>
                                      </p>
                                      <p className="text-sm text-blue-700 dark:text-blue-400">{question.explanation}</p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                  <p>
                                    Your answer:{' '}
                                    <strong>
                                      {result.userAnswer !== -1
                                        ? String.fromCharCode(65 + Number(result.userAnswer))
                                        : 'Not Answered'}
                                    </strong>
                                  </p>
                                  <p>
                                    Correct answer:{' '}
                                    <strong>{String.fromCharCode(65 + Number(result.correctAnswer))}</strong>
                                  </p>
                                  <p className={result.isCorrect ? 'text-emerald-600' : 'text-red-500'}>
                                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Topic-wise Performance */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-orange-500" />
                    Topic Analysis
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  {Object.entries(topicStats).map(([topic, stats]) => {
                    const topicPercentage = Math.round((stats.correct / stats.total) * 100);
                    return (
                      <div key={topic}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{topic}</span>
                          <span className={`text-sm font-bold flex-shrink-0 ${topicPercentage >= 70 ? 'text-emerald-600' : topicPercentage >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                            {stats.correct}/{stats.total}
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${topicPercentage >= 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                              : topicPercentage >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                                : 'bg-gradient-to-r from-red-400 to-red-500'
                              }`}
                            style={{ width: `${topicPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-orange-500" />
                    Performance Stats
                  </h3>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Questions Attempted</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{testResult.attempted}/{testResult.totalQuestions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{accuracy}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time Taken</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{testResult.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(testResult.startTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {/* Download Certificate - Only if passed (score is already a percentage) */}
                {Math.round(testResult.score) >= 60 && (
                  <button
                    onClick={handleViewCertificate}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <DownloadIcon />
                    Download Certificate
                  </button>
                )}
                <button
                  onClick={() => {
                    setTestResult(null);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                    setTimeLeft(0);
                    handleBackToList();
                  }}
                  className="w-full py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retake Assessment
                </button>
                <button
                  onClick={handleBackToList}
                  className="w-full py-3.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                >
                  Back to All Assessments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificate = () => {
    if (!testResult) return null;

    const isPassed = testResult.score >= 40;

    return (
      <div className="bg-gradient-to-br from-slate-100 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setView('results')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition"
          >
            <ArrowLeftIcon />
            Back to Results
          </button>

          {/* Certificate */}
          <div
            id="certificate"
            className="bg-white rounded-3xl shadow-2xl p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
              border: '8px solid #1e3a5f',
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-amber-500/10 to-transparent rounded-full translate-x-1/4 translate-y-1/4" />

            {/* Gold border frame */}
            <div className="absolute inset-4 border-2 border-amber-400/50 rounded-2xl pointer-events-none" />

            <div className="relative text-center">
              {/* Logo */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  CodeXCareer
                </h1>
                <p className="text-gray-500 text-sm mt-1">Excellence in Technology Assessment</p>
              </div>

              {/* Certificate Title */}
              <div className="mb-8">
                <h2 className="text-5xl font-serif text-gray-800 mb-2">Certificate</h2>
                <p className="text-xl text-gray-600">of {isPassed ? 'Achievement' : 'Participation'}</p>
              </div>

              {/* Recipient */}
              <p className="text-gray-600 mb-2">This is to certify that</p>
              <h3 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                Participant
              </h3>

              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                has successfully {isPassed ? 'completed' : 'participated in'} the
                <br />
                <strong className="text-orange-600">Mock Assessment - {testResult.assessmentTitle}</strong>
                <br />
                with marks of{' '}
                <strong className="text-2xl text-gray-900">
                  {testResult.solved}/{testResult.totalQuestions}
                </strong>
                {' '}
                <span className="text-gray-500">
                  ({testResult.score.toFixed(1)}%)
                </span>
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-12 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {testResult.solved}/{testResult.totalQuestions}
                  </p>
                  <p className="text-gray-500 text-sm">Marks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{testResult.score.toFixed(0)}%</p>
                  <p className="text-gray-500 text-sm">Percentage</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{testResult.duration}</p>
                  <p className="text-gray-500 text-sm">Duration</p>
                </div>
              </div>

              {/* Badge */}
              <div className="mb-8">
                {isPassed ? (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium">
                    <CheckCircleIcon />
                    Assessment Passed
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-medium">
                    <TargetIcon className="w-5 h-5" />
                    Keep Practicing
                  </div>
                )}
              </div>

              {/* Date & Signature */}
              <div className="flex justify-between items-end mt-12 pt-8 border-t border-gray-200">
                <div className="text-left">
                  <p className="text-gray-500 text-sm">Date</p>
                  <p className="font-medium text-gray-900">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b-2 border-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">Authorized Signature</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">Certificate ID</p>
                  <p className="font-mono text-sm text-gray-900">PB-{Date.now().toString(36).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                // Simple print-based download
                window.print();
              }}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition inline-flex items-center gap-2"
            >
              <DownloadIcon />
              Download Certificate (PDF)
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderScheduleInterview = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigateToView('list')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition"
        >
          <ArrowLeftIcon />
          Back
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Schedule Programming Interview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            Provide us with your skills and preferences, for us to find the right match for you.
          </p>

          <div className="bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-xl p-4 mb-8 text-center">
            <p className="text-orange-800 dark:text-orange-200">
              To respect your peers' time, <strong>2 No-shows</strong> or <strong>2 Cancellations</strong> will result in your ban from mock interviews for a month.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Mock Interview Type
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option>Programming (DS/Algo)</option>
                <option>System Design</option>
                <option>Frontend Development</option>
                <option>Backend Development</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rate your coding skills
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select languages you are comfortable with
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'C++17 (gcc-9.2)', 'Java7 (open-jdk-1.7.0)', 'C (gcc-4.8)', 'JavaScript (ES6)',
                  'Python 3 (python-3.8)', 'Go (1.17.4)', 'Swift (5.5)', 'Kotlin (openjdk8)',
                ].map((lang) => (
                  <label key={lang} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                You are:
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option>Student</option>
                <option>Working Professional</option>
                <option>Freelancer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Zone
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option>(GMT+05:30) Chennai</option>
                <option>(GMT+00:00) London</option>
                <option>(GMT-05:00) New York</option>
                <option>(GMT-08:00) Los Angeles</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Select time slots (Choose as many, 3 at the least)
              </label>
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                  <div key={day}>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">{day}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">Jan, {18 + i}</p>
                    {['08:30 AM', '09:30 AM', '08:30 PM', '09:30 PM'].map((time) => (
                      <button
                        key={`${day}-${time}`}
                        type="button"
                        className="w-full py-1 mb-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-500 transition"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition"
            >
              Schedule Interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  // Achievements View
  const renderAchievements = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigateToView('list')}
          className="p-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeftIcon />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Achievements & Badges</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {userProgress.badges.filter(b => b.earned).length} of {userProgress.badges.length} badges unlocked
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Progress</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {Math.round((userProgress.badges.filter(b => b.earned).length / userProgress.badges.length) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(userProgress.badges.filter(b => b.earned).length / userProgress.badges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userProgress.badges.map((badge, index) => (
          <div
            key={badge.id}
            className={`group relative perspective-[1000px] bg-transparent p-4 transition-all duration-300 ${badge.earned ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`relative flex items-start gap-5 p-5 rounded-2xl transition-all duration-300 preserve-3d group-hover:-translate-y-2 group-hover:shadow-2xl bg-white dark:bg-gray-800 border-2 ${badge.earned
              ? 'border-amber-200 dark:border-amber-700/50 shadow-lg shadow-amber-100 dark:shadow-amber-900/20'
              : 'border-gray-200 dark:border-gray-700 shadow-sm'
              }`}>

              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 whitespace-nowrap">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg relative">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                  {badge.name}
                </div>
              </div>

              {badge.earned && (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl pointer-events-none" />
              )}

              <div className="relative flex items-start gap-4">
                <div className={`relative w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 ${badge.earned
                  ? 'bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 dark:from-amber-800/40 dark:via-orange-800/30 dark:to-yellow-800/40 shadow-inner'
                  : 'bg-gray-100 dark:bg-gray-700 grayscale'
                  }`}>
                  {badge.image && !failedBadgeImages[badge.id] ? (
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className={`w-12 h-12 object-contain drop-shadow-md transition-transform duration-300 ${badge.earned ? '' : 'opacity-50'}`}
                      onError={() => setFailedBadgeImages(prev => ({ ...prev, [badge.id]: true }))}
                    />
                  ) : (
                    <TrophyIcon className="w-8 h-8 text-amber-500" />
                  )}
                  {!badge.earned && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-400 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{badge.name}</h3>
                    {badge.earned && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white px-2 py-0.5 rounded-full font-medium shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Earned
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                      {badge.requirement}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg font-medium">
                      +{badge.xpReward} XP
                    </span>
                  </div>
                  {badge.earned && badge.earnedDate && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Earned on {new Date(badge.earnedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

  );

  // Wrap content with Sidebar for non-test views (only when NOT embedded in DashboardContent)
  const wrapWithSidebar = (content: React.ReactNode) => {
    // If embedded in DashboardContent, don't render sidebar (parent already has one)
    if (embedded) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden relative h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="flex-1 overflow-y-auto">
            {content}
          </div>
        </div>
      );
    }

    // Standalone mode: render with sidebar, wrapped in required providers
    return (
      <WishlistProvider userId={userId}>
        <CartProvider userId={userId}>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden">
            <Sidebar
              dashboardMode="buyer"
              activeView="mock-assessment"
              setActiveView={handleSidebarNavigation}
              isOpen={isSidebarOpen}
              isCollapsed={isSidebarCollapsed}
              onClose={() => setIsSidebarOpen(false)}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
              onCollapseToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className="flex-1 flex flex-col overflow-hidden relative h-full">
              <div className="flex-1 overflow-y-auto">
                {content}
              </div>
            </div>
          </div>
        </CartProvider>
      </WishlistProvider>
    );
  };

  // Main render
  return (
    <>
      {showInstructions && renderInstructionsModal()}
      {showRules && renderRulesModal()}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Views with Sidebar */}
      {view === 'list' && wrapWithSidebar(renderAssessmentList())}

      {/* Test View - No Sidebar (Fullscreen/Focused) */}
      {view === 'test' && renderTestInterface()}

      {/* Results View - Keep as is or wrap? Usually results are part of flow. 
          If user wants to go back to dashboard, sidebar helps. 
          Let's wrap results for consistency. */}
      {view === 'results' && wrapWithSidebar(renderResults())}
      {view === 'certificate' && wrapWithSidebar(renderCertificate())}
      {view === 'schedule' && wrapWithSidebar(renderScheduleInterview())}
      {view === 'achievements' && wrapWithSidebar(renderAchievements())}

      {/* Leaderboard View */}
      {view === 'leaderboard' && wrapWithSidebar(
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeftIcon />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrophyIcon className="w-6 h-6 text-amber-500" />
                Leaderboard
              </h2>
            </div>
            <button onClick={() => fetchLeaderboard()} disabled={leaderboardLoading} className="text-sm px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition disabled:opacity-50">
              {leaderboardLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Loading State */}
          {leaderboardLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading leaderboard...</p>
            </div>
          )}

          {/* Empty State */}
          {!leaderboardLoading && leaderboard.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4">
                <TrophyIcon className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Rankings Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                Be the first to complete a mock assessment and claim the top spot on the leaderboard!
              </p>
              <button onClick={() => navigateToView('list')} className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition font-medium">
                Start an Assessment
              </button>
            </div>
          )}

          {/* Leaderboard Content */}
          {!leaderboardLoading && leaderboard.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6">
                <div className="flex justify-center items-end gap-4">
                  {/* 2nd Place */}
                  {leaderboard[1] ? (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-gray-300 dark:border-gray-500 overflow-hidden">
                        {leaderboard[1].profilePicture ? <img src={leaderboard[1].profilePicture} alt="" className="w-full h-full object-cover" /> : <AvatarFallback />}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">{leaderboard[1].name || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{Number(leaderboard[1].xp || 0).toLocaleString()} XP</p>
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">2</div>
                    </div>
                  ) : (
                    <div className="text-center opacity-40">
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-gray-300 dark:border-gray-500">?</div>
                      <p className="text-sm font-medium text-gray-500">---</p>
                      <p className="text-xs text-gray-400">0 XP</p>
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">2</div>
                    </div>
                  )}
                  {/* 1st Place */}
                  {leaderboard[0] ? (
                    <div className="text-center -mt-4">
                      <div className="flex justify-center mb-1">
                        <TrophyIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mb-2 mx-auto border-4 border-amber-300 overflow-hidden">
                        {leaderboard[0].profilePicture ? <img src={leaderboard[0].profilePicture} alt="" className="w-full h-full object-cover" /> : <AvatarFallback />}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{leaderboard[0].name || 'User'}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{Number(leaderboard[0].xp || 0).toLocaleString()} XP</p>
                      <div className="w-12 h-14 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-xl font-bold text-white">1</div>
                    </div>
                  ) : (
                    <div className="text-center -mt-4 opacity-40">
                      <div className="flex justify-center mb-1">
                        <TrophyIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-3xl mb-2 mx-auto border-4 border-gray-200">?</div>
                      <p className="text-sm font-semibold text-gray-500">---</p>
                      <p className="text-xs text-gray-400">0 XP</p>
                      <div className="w-12 h-14 bg-gray-300 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-xl font-bold">1</div>
                    </div>
                  )}
                  {/* 3rd Place */}
                  {leaderboard[2] ? (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-amber-200 dark:border-amber-700 overflow-hidden">
                        {leaderboard[2].profilePicture ? <img src={leaderboard[2].profilePicture} alt="" className="w-full h-full object-cover" /> : <AvatarFallback />}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">{leaderboard[2].name || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{Number(leaderboard[2].xp || 0).toLocaleString()} XP</p>
                      <div className="w-10 h-8 bg-amber-200 dark:bg-amber-800 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold text-amber-800 dark:text-amber-200">3</div>
                    </div>
                  ) : (
                    <div className="text-center opacity-40">
                      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-amber-200 dark:border-amber-700">?</div>
                      <p className="text-sm font-medium text-gray-500">---</p>
                      <p className="text-xs text-gray-400">0 XP</p>
                      <div className="w-10 h-8 bg-amber-200 dark:bg-amber-800 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">3</div>
                    </div>
                  )}
                </div>
              </div>
              {/* All Rankings List - Shows all users */}
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Rankings ({leaderboard.length} users)</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {leaderboard.map((entry: LeaderboardEntry, index: number) => (
                    <div key={entry.rank || index} className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${index < 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                      <span className={`w-8 text-center font-semibold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'}`}>
                        {entry.rank || index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl overflow-hidden">
                        {entry.profilePicture ? <img src={entry.profilePicture} alt="" className="w-full h-full object-cover" /> : <AvatarFallback />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{entry.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{entry.testsCompleted || 0} tests · {Number(entry.avgScore || 0).toFixed(1)}% avg</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600 dark:text-orange-400">{Number(entry.xp || 0).toLocaleString()} XP</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{entry.badges || 0} badges</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Challenge View */}
      {view === 'daily-challenge' && wrapWithSidebar(
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon />
              Daily Challenge
            </h2>
          </div>
          <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 ${dailyChallenge.completed ? 'border-green-300 dark:border-green-700' : 'border-orange-300 dark:border-orange-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${dailyChallenge.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                {dailyChallenge.completed ? 'Completed' : 'Available'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Expires in 12h</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{dailyChallenge.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Topic: {dailyChallenge.topic}</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-gray-500 dark:text-gray-400 inline-flex items-center gap-1">
                <ClockIcon />
                {dailyChallenge.timeLimit} mins
              </span>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">+{dailyChallenge.xpReward} XP</span>
            </div>
            {!dailyChallenge.completed && (
              <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl font-semibold transition-all">
                Start Challenge
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MockAssessmentPage;
