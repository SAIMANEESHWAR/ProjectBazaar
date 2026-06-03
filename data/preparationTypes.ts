export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  role: string;
  isSolved: boolean;
  isBookmarked: boolean;
}

export interface DSAProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  company: string[];
  isSolved: boolean;
  isBookmarked: boolean;
  acceptance: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  role: string;
  duration: number;
  completedAt?: string;
  score?: number;
  isBookmarked: boolean;
}

export interface ColdDMTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  isCopied: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  createdAt: string;
  color: string;
}

export interface MassRecruitmentCompany {
  id: string;
  name: string;
  logo: string;
  interviewQuestions: number;
  dsaProblems: number;
  aptitudeQuestions: number;
}

export interface JobPortal {
  id: string;
  name: string;
  logo: string;
  description: string;
  url: string;
  category: string;
  region: string;
  isFavorite: boolean;
  isApplied: boolean;
}

export interface HandwrittenNote {
  id: string;
  title: string;
  description: string;
  topic: string;
  pageCount: number;
  thumbnailUrl: string;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  steps: { title: string; completed: boolean }[];
  isFree: boolean;
}

export interface PositionResource {
  id: string;
  role: string;
  interviewQuestions: number;
  dsaQuestions: number;
  aptitudeQuestions: number;
  sqlQuestions: number;
  coreCSQuestions: number;
}

export interface Concept {
  id: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  topic: string;
  explanation: string;
  codeExample: string;
  language: string;
}

export interface ConceptGroup {
  category: string;
  concepts: Concept[];
}

export interface RecentActivity {
  id: string;
  type: 'question' | 'dsa' | 'quiz' | 'dm';
  title: string;
  description: string;
  timestamp: string;
}
