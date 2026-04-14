import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Lottie from 'lottie-react';
import Editor from '@monaco-editor/react';
import noCodingQuestionAnimation from '../lottiefiles/no_coding_question_animation.json';
import SkeletonDashboard from './ui/skeleton-dashboard';

// Lambda API endpoints
const CODING_QUESTIONS_API = 'https://6918395pal.execute-api.ap-south-2.amazonaws.com/default/coding-questions-service';
const USER_PROGRESS_API = 'https://jzrc9iaj3j.execute-api.ap-south-2.amazonaws.com/default/user_coding_question_progress';

// Helper to get current user ID (from localStorage or auth)
const getCurrentUserId = (): string | null => {
  // Try to get user from localStorage - check both 'userData' and 'user' keys
  const userStr = localStorage.getItem('userData') || localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.userId || user.id || user.email || null;
    } catch {
      return null;
    }
  }
  return null;
};

// ============================================
// TYPES & INTERFACES
// ============================================

type DifficultyLevel = 'very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard';
type QuestionStatus = 'unsolved' | 'attempted' | 'solved';
type SortOption = 'recently-added' | 'fastest' | 'slowest' | 'easier' | 'harder';
type ProblemTab = 'description' | 'discussion' | 'submissions' | 'hints' | 'solution';

interface Company {
  id: string;
  name: string;
  logo: string;
}

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemDetails {
  description: string;
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  examples: Example[];
  hints: string[];
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string; hidden?: boolean }[];
  solution?: string;
}

interface CodingQuestion {
  id: string;
  title: string;
  topic: string;
  difficulty: DifficultyLevel;
  avgTime: number;
  submissions: number;
  askedIn: string[];
  status: QuestionStatus;
  isBookmarked: boolean;
  dateAdded: string;
  likes?: number;
  dislikes?: number;
  successRate?: number;
  problemDetails?: ProblemDetails;
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface UserProgress {
  solved: number;
  total: number;
  attempted: number;
  accuracy: number;
}

// Discussion interfaces
interface DiscussionComment {
  commentId: string;
  questionId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  upvotes: number;
  downvotes: number;
  repliesCount: number;
  replies?: DiscussionComment[];
  parentCommentId?: string;
  createdAt: string;
  updatedAt?: string;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
}

// Discussion API endpoint
const DISCUSSION_API = 'https://fciixra802.execute-api.ap-south-2.amazonaws.com/default/coding-questions-discussion';

// Supported programming languages
const supportedLanguages = [
  { id: 'python', name: 'Python 3', monacoId: 'python' },
  { id: 'java', name: 'Java', monacoId: 'java' },
  { id: 'cpp', name: 'C++', monacoId: 'cpp' }
];

// Judge0 language keys for code execution (see services/codeExecution judge0LanguageIdMap)
const executionLanguageKeys: Record<string, string> = {
  python: 'python',
  java: 'java',
  cpp: 'cpp'
};

const executeCode = async (code: string, language: string, input: string = ''): Promise<{ output: string; error: string; success: boolean }> => {
  const langKey = executionLanguageKeys[language];
  if (!langKey) {
    return { output: '', error: 'Unsupported language for execution', success: false };
  }
  const { executeCodeJudge0 } = await import('../services/codeExecution');
  return executeCodeJudge0({ code, language: langKey, input });
};

/** Classify execution error so we can show "Syntax Error" or "Runtime Error" instead of generic "Got: ..." */
function formatExecutionError(error: string): string {
  if (!error || !error.trim()) return 'Execution failed';
  const e = error.trim();
  const lower = e.toLowerCase();
  if (lower.includes('syntaxerror') || lower.includes('syntax error') || lower.includes('invalid syntax') || lower.includes('indentationerror') || lower.includes('unexpected eof') || lower.includes('unexpected token')) {
    return `Syntax Error: ${e.split('\n').slice(0, 3).join(' ').trim()}`;
  }
  if (lower.includes('nameerror') || lower.includes('typeerror') || lower.includes('valueerror') || lower.includes('runtimeerror') || lower.includes('indexerror') || lower.includes('keyerror') || lower.includes('attributeerror') || lower.includes('zerodivisionerror') || lower.includes('runtime error')) {
    return `Runtime Error: ${e.split('\n').slice(0, 3).join(' ').trim()}`;
  }
  return e.length > 200 ? e.slice(0, 200) + '...' : e;
}

// ============================================
// MOCK DATA
// ============================================

const companies: Company[] = [
  { id: 'google', name: 'Google', logo: '/company_logos/google.png' },
  { id: 'microsoft', name: 'Microsoft', logo: '/company_logos/microsoft.png' },
  { id: 'amazon', name: 'Amazon', logo: '/company_logos/amazon.png' },
  { id: 'meta', name: 'Meta', logo: '/company_logos/meta.png' },
  { id: 'apple', name: 'Apple', logo: '/company_logos/apple.png' },
  { id: 'netflix', name: 'Netflix', logo: '/company_logos/netflix.png' },
  { id: 'deshaw', name: 'DE Shaw', logo: '/company_logos/deshaw.png' },
  { id: 'yahoo', name: 'Yahoo', logo: '/company_logos/yahoo.png' },
  { id: 'linkedin', name: 'LinkedIn', logo: '/company_logos/linkedin.png' },
  { id: 'facebook', name: 'Facebook', logo: '/company_logos/meta.png' },
  { id: 'ebay', name: 'Ebay', logo: '/company_logos/ebay.png' },
  { id: 'directi', name: 'Directi', logo: '/company_logos/directi.png' },
  { id: 'twitter', name: 'Twitter', logo: '/company_logos/twitter.png' },
  { id: 'ibm', name: 'IBM', logo: '/company_logos/ibm.png' },
  { id: 'flipkart', name: 'Flipkart', logo: '/company_logos/flipkart.png' },
  { id: 'uber', name: 'Uber', logo: '/company_logos/uber.png' },
  { id: 'oracle', name: 'Oracle', logo: '/company_logos/oracle.png' },
  { id: 'adobe', name: 'Adobe', logo: '/company_logos/adobe.png' },
  { id: 'salesforce', name: 'Salesforce', logo: '/company_logos/salesforce.png' },
  { id: 'paypal', name: 'PayPal', logo: '/company_logos/paypal.png' },
];

const topics = [
  'Arrays',
  'Backtracking',
  'Binary Search',
  'Bit Manipulation',
  'C/C++',
  'Codersbit',
  'Computer Science Basics',
  'Dynamic Programming',
  'Graph Data Structure & Algorithms',
  'Greedy Algorithm',
  'Hashing',
  'Heap',
  'Linked List',
  'Math',
  'Queue',
  'Recursion',
  'Searching',
  'Sorting',
  'Stack',
  'String',
  'Tree',
  'Two Pointers',
];


// Default problem details template
const defaultProblemDetails: ProblemDetails = {
  description: 'Solve this programming problem efficiently.',
  constraints: ['1 <= N <= 10^5', '1 <= A[i] <= 10^9'],
  inputFormat: 'First argument is an integer array A.',
  outputFormat: 'Return the result as specified.',
  examples: [{ input: 'A = [1, 2, 3]', output: '6' }],
  hints: ['Think about the optimal approach.', 'Consider edge cases.'],
  starterCode: {
    python: 'class Solution:\n    def solve(self, A):\n        # Write your code here\n        pass',
    javascript: 'function solve(A) {\n    // Write your code here\n    \n}',
    java: 'class Solution {\n    public int solve(int[] A) {\n        // Write your code here\n        return 0;\n    }\n}',
    cpp: 'class Solution {\npublic:\n    int solve(vector<int> &A) {\n        // Write your code here\n        return 0;\n    }\n};'
  },
  testCases: [{ input: '[1, 2, 3]', expectedOutput: '6' }]
};


// ============================================
// HELPER FUNCTIONS
// ============================================

const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 'very-easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'hard': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'very-hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 'very-easy': return 'Very easy';
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'hard': return 'Hard';
    case 'very-hard': return 'Very hard';
    default: return difficulty;
  }
};

const getStatusColor = (status: QuestionStatus): string => {
  switch (status) {
    case 'solved': return 'border-l-4 border-l-green-500';
    case 'attempted': return 'border-l-4 border-l-amber-500';
    default: return 'border-l-4 border-l-transparent';
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

// ============================================
// COMPONENTS
// ============================================

// Progress Ring Component
const ProgressRing: React.FC<{ progress: number; size?: number }> = ({ progress, size = 120 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="text-teal-500 transition-all duration-500"
      />
    </svg>
  );
};

// Dropdown Component
const Dropdown: React.FC<{
  label: string;
  options: { value: string; label: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
}> = ({ label, options, value, onChange, multiple = false, searchable = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = searchable
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const handleSelect = (optValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optValue)) {
        onChange(currentValues.filter(v => v !== optValue));
      } else {
        onChange([...currentValues, optValue]);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const isSelected = (optValue: string) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optValue);
    }
    return value === optValue;
  };

  const displayLabel = () => {
    if (multiple && Array.isArray(value) && value.length > 0) {
      return `${label} (${value.length})`;
    }
    if (!multiple && value && value !== 'all') {
      const selected = options.find(opt => opt.value === value);
      return selected?.label || label;
    }
    return label;
  };

  return (
    <div className="relative z-30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${isOpen
          ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{displayLabel()}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {searchable && (
              <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={`Search ${label}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {multiple && (
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected(option.value)
                      ? 'bg-teal-500 border-teal-500'
                      : 'border-gray-300 dark:border-gray-600'
                      }`}>
                      {isSelected(option.value) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  <span className={`text-sm ${isSelected(option.value) ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Company Logo Component
const CompanyLogo: React.FC<{ companyId: string; size?: 'sm' | 'md' | 'lg' }> = ({ companyId, size = 'sm' }) => {
  const company = companies.find(c => c.id === companyId);
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-7 h-7' : 'w-8 h-8';
  const [imgError, setImgError] = useState(false);

  // Get the correct logo path
  const getLogoPath = (id: string) => {
    const logoMap: Record<string, string> = {
      google: '/company_logos/google.png',
      microsoft: '/company_logos/microsoft.png',
      amazon: '/company_logos/amazon.png',
      meta: '/company_logos/meta.png',
      apple: '/company_logos/apple.png',
      netflix: '/company_logos/netflix.png',
      flipkart: '/company_logos/flipkart.png',
      uber: '/company_logos/uber.png',
      oracle: '/company_logos/oracle.png',
      adobe: '/company_logos/adobe.png',
      linkedin: '/company_logos/linkedin.png',
      yahoo: '/company_logos/yahoo.png',
      twitter: '/company_logos/twitter.png',
      ibm: '/company_logos/ibm.png',
      salesforce: '/company_logos/salesforce.png',
      paypal: '/company_logos/paypal.png',
      ebay: '/company_logos/ebay.jpg',
      facebook: '/company_logos/meta.png',
    };
    return logoMap[id] || `/company_logos/${id}.png`;
  };

  // Fallback to first letter if logo doesn't load
  const getCompanyInitial = (id: string) => {
    const comp = companies.find(c => c.id === id);
    return comp?.name.charAt(0).toUpperCase() || id.charAt(0).toUpperCase();
  };

  const getCompanyColor = (id: string) => {
    const colors: Record<string, string> = {
      google: 'bg-blue-500',
      microsoft: 'bg-blue-600',
      amazon: 'bg-orange-500',
      meta: 'bg-blue-500',
      apple: 'bg-gray-800',
      netflix: 'bg-red-600',
      flipkart: 'bg-yellow-500',
      uber: 'bg-black',
      oracle: 'bg-red-500',
      adobe: 'bg-red-600',
      linkedin: 'bg-blue-700',
      yahoo: 'bg-purple-600',
      twitter: 'bg-sky-500',
      ibm: 'bg-blue-600',
      salesforce: 'bg-blue-500',
      paypal: 'bg-blue-600',
      ebay: 'bg-blue-600',
    };
    return colors[id] || 'bg-gray-500';
  };

  if (imgError) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center ${getCompanyColor(companyId)} text-white text-xs font-bold shadow-sm`}
        title={company?.name || companyId}
      >
        {getCompanyInitial(companyId)}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-white shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center`} title={company?.name || companyId}>
      <img
        src={getLogoPath(companyId)}
        alt={company?.name || companyId}
        className="w-full h-full object-contain p-0.5"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

// ============================================
// PROBLEM SOLVING VIEW COMPONENT
// ============================================

interface ProblemSolvingViewProps {
  question: CodingQuestion;
  questionIndex: number;
  totalQuestions: number;
  onBack: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleBookmark: () => void;
  onToggleLike?: () => void;
  onToggleDislike?: () => void;
  onStatusUpdate: (questionId: string, status: QuestionStatus, passed: boolean) => void;
}

const ProblemSolvingView: React.FC<ProblemSolvingViewProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onBack,
  onNext,
  onPrevious,
  onToggleBookmark,
  onToggleLike,
  onToggleDislike,
  onStatusUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<ProblemTab>('description');
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ passed: boolean; input: string; expected: string; actual: string }[] | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showOutputPanel, setShowOutputPanel] = useState(false);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(35); // percentage of right panel
  const [isVerticalResizing, setIsVerticalResizing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Discussion state
  const [discussions, setDiscussions] = useState<DiscussionComment[]>([]);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Hints accordion state - only show one at a time
  const [expandedHintIndex, setExpandedHintIndex] = useState<number | null>(null);

  // Submission history state
  const [submissionHistory, setSubmissionHistory] = useState<Array<{
    id: string;
    status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error';
    runtime: string;
    memory: string;
    language: string;
    timestamp: string;
    code?: string;
  }>>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Reset code confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Custom test cases state
  const [customTestCases, setCustomTestCases] = useState<Array<{ id: number; input: string; target: string }>>([
    { id: 1, input: '[2,7,11,15]', target: '9' }
  ]);
  const [activeTestCaseId, setActiveTestCaseId] = useState(1);

  const problemDetails = question.problemDetails || defaultProblemDetails;

  // Use state for user auth to ensure re-render when user logs in
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('Anonymous');

  // Check auth status on mount and when activeTab changes to discussion
  useEffect(() => {
    const checkAuth = () => {
      const userId = getCurrentUserId();
      setCurrentUserId(userId);

      // Check both 'userData' and 'user' keys
      const userStr = localStorage.getItem('userData') || localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setCurrentUserName(user.fullName || user.name || user.email?.split('@')[0] || 'Anonymous');
        } catch {
          setCurrentUserName('Anonymous');
        }
      } else {
        setCurrentUserName('Anonymous');
      }
    };

    // Check auth immediately
    checkAuth();

    // Also listen for storage changes (in case user logs in in another tab/component)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);

    // Re-check when discussion tab is opened
    if (activeTab === 'discussion') {
      checkAuth();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [activeTab]);

  // Fetch submission history from backend (merges with local submissions)
  const fetchSubmissionHistory = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user ID found, skipping submission fetch');
      return;
    }

    setIsLoadingSubmissions(true);
    try {
      const response = await fetch(USER_PROGRESS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_submissions',
          userId,
          questionId: question.id
        })
      });

      const data = await response.json();
      console.log('Submission history response:', data);

      if (data.success && data.data?.submissions && data.data.submissions.length > 0) {
        // Transform backend data to frontend format
        const transformedSubmissions = data.data.submissions.map((sub: {
          submissionId: string;
          passed: boolean;
          runtime?: string;
          memory?: string;
          language?: string;
          submittedAt?: string;
          code?: string;
        }) => ({
          id: sub.submissionId,
          status: sub.passed ? 'Accepted' : 'Wrong Answer' as const,
          runtime: sub.runtime || 'N/A',
          memory: sub.memory || 'N/A',
          language: supportedLanguages.find(l => l.id === sub.language)?.name || sub.language || 'Unknown',
          timestamp: sub.submittedAt || new Date().toISOString(),
          code: sub.code
        }));

        // Merge backend submissions with local session submissions (keep both, avoid duplicates)
        setSubmissionHistory(prev => {
          const backendIds = new Set(transformedSubmissions.map((s: { id: string }) => s.id));
          // Keep local submissions that aren't in backend (local ones start with 'sub-')
          const localSessionSubmissions = prev.filter(s => s.id.startsWith('sub-') && !backendIds.has(s.id));
          return [...localSessionSubmissions, ...transformedSubmissions];
        });
      }
      // If no backend submissions, keep local ones (they'll show from the current session)
    } catch (error) {
      console.error('Error fetching submissions:', error);
      // On error, keep local submissions
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Fetch submission history when submissions tab is opened or question changes
  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissionHistory();
    }
  }, [activeTab, question.id]);

  // Initialize code with starter code
  useEffect(() => {
    const starterCode = problemDetails.starterCode[selectedLanguage] || problemDetails.starterCode.python || '';
    setCode(starterCode);
  }, [selectedLanguage, question.id, problemDetails.starterCode]);

  // Timer effect
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format timer
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle horizontal resize (left-right panels)
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  // Handle vertical resize (editor-bottom panel)
  const handleVerticalMouseDown = () => {
    setIsVerticalResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Horizontal resize
      if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        setLeftPanelWidth(Math.min(Math.max(newWidth, 25), 75));
      }

      // Vertical resize
      if (isVerticalResizing && rightPanelRef.current) {
        const panelRect = rightPanelRef.current.getBoundingClientRect();
        const newHeight = ((panelRect.bottom - e.clientY) / panelRect.height) * 100;
        setBottomPanelHeight(Math.min(Math.max(newHeight, 15), 70));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsVerticalResizing(false);
    };

    if (isResizing || isVerticalResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isVerticalResizing ? 'row-resize' : 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, isVerticalResizing]);

  // Fetch discussions when tab changes to discussion
  useEffect(() => {
    if (activeTab === 'discussion') {
      fetchDiscussions();
    }
  }, [activeTab, question.id]);

  // Fetch discussions from API
  const fetchDiscussions = async () => {
    setIsLoadingDiscussions(true);
    try {
      const url = `${DISCUSSION_API}?questionId=${question.id}${currentUserId ? `&userId=${currentUserId}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.discussions) {
          setDiscussions(data.data.discussions);
        } else {
          setDiscussions([]);
        }
      } else {
        console.error('Failed to fetch discussions');
        setDiscussions([]);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      setDiscussions([]);
    } finally {
      setIsLoadingDiscussions(false);
    }
  };

  // Add a new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    // Store comment content before clearing (to avoid closure issue)
    const commentContent = newComment.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update
    const newDiscussion: DiscussionComment = {
      commentId: tempId,
      questionId: question.id,
      userId: currentUserId,
      userName: currentUserName,
      content: commentContent,
      upvotes: 0,
      downvotes: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      hasUpvoted: false,
      hasDownvoted: false,
    };

    setDiscussions(prev => [newDiscussion, ...prev]);
    setNewComment('');

    // Send to API
    try {
      const response = await fetch(DISCUSSION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          questionId: question.id,
          userId: currentUserId,
          userName: currentUserName,
          content: commentContent
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Replace temp comment with real one
          setDiscussions(prev => prev.map(d =>
            d.commentId === tempId ? data.data : d
          ));
        }
      } else {
        // Remove optimistic update on error
        setDiscussions(prev => prev.filter(d => d.commentId !== tempId));
        console.error('Failed to add comment');
      }
    } catch (error) {
      // Remove optimistic update on error
      setDiscussions(prev => prev.filter(d => d.commentId !== tempId));
      console.error('Error adding comment:', error);
    }
  };

  // Add a reply to a comment
  const handleAddReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !currentUserId) return;

    const replyText = replyContent;
    setReplyContent('');
    setReplyingTo(null);

    // Optimistic update - increment reply count
    setDiscussions(prev => prev.map(d =>
      d.commentId === parentCommentId
        ? { ...d, repliesCount: d.repliesCount + 1 }
        : d
    ));

    // Send to API
    try {
      const response = await fetch(DISCUSSION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_comment',
          questionId: question.id,
          userId: currentUserId,
          userName: currentUserName,
          content: replyText,
          parentCommentId: parentCommentId
        })
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setDiscussions(prev => prev.map(d =>
          d.commentId === parentCommentId
            ? { ...d, repliesCount: Math.max(0, d.repliesCount - 1) }
            : d
        ));
        console.error('Failed to add reply');
      }
    } catch (error) {
      // Revert optimistic update on error
      setDiscussions(prev => prev.map(d =>
        d.commentId === parentCommentId
          ? { ...d, repliesCount: Math.max(0, d.repliesCount - 1) }
          : d
      ));
      console.error('Error adding reply:', error);
    }
  };

  // Vote on a comment
  const handleVote = async (commentId: string, isUpvote: boolean) => {
    if (!currentUserId) return;

    // Get current state for this comment
    const currentComment = discussions.find(d => d.commentId === commentId);
    if (!currentComment) return;

    // Determine vote type to send
    let voteType: 'upvote' | 'downvote' | 'remove';
    if (isUpvote) {
      voteType = currentComment.hasUpvoted ? 'remove' : 'upvote';
    } else {
      voteType = currentComment.hasDownvoted ? 'remove' : 'downvote';
    }

    // Optimistic update
    setDiscussions(prev => prev.map(d => {
      if (d.commentId === commentId) {
        if (isUpvote) {
          if (d.hasUpvoted) {
            return { ...d, upvotes: d.upvotes - 1, hasUpvoted: false };
          } else {
            return {
              ...d,
              upvotes: d.upvotes + 1,
              downvotes: d.hasDownvoted ? d.downvotes - 1 : d.downvotes,
              hasUpvoted: true,
              hasDownvoted: false
            };
          }
        } else {
          if (d.hasDownvoted) {
            return { ...d, downvotes: d.downvotes - 1, hasDownvoted: false };
          } else {
            return {
              ...d,
              downvotes: d.downvotes + 1,
              upvotes: d.hasUpvoted ? d.upvotes - 1 : d.upvotes,
              hasDownvoted: true,
              hasUpvoted: false
            };
          }
        }
      }
      return d;
    }));

    // Send to API
    try {
      const response = await fetch(DISCUSSION_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          commentId,
          userId: currentUserId,
          voteType
        })
      });

      if (!response.ok) {
        // Revert on error - refetch discussions
        fetchDiscussions();
        console.error('Failed to vote');
      }
    } catch (error) {
      // Revert on error - refetch discussions
      fetchDiscussions();
      console.error('Error voting:', error);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  // Run code (visible test cases only)
  const handleRun = async () => {
    const trimmedCode = code.trim();
    const starterCode = problemDetails.starterCode[selectedLanguage] || problemDetails.starterCode.python || '';
    if (!trimmedCode || trimmedCode === starterCode.trim()) {
      setShowOutputPanel(true);
      setOutput('Please write your solution before running.');
      setTestResults(null);
      return;
    }

    setIsRunning(true);
    setOutput(null);
    setTestResults(null);
    setShowOutputPanel(true);

    if (showCustomInput && customInput.trim()) {
      const result = await executeCode(trimmedCode, selectedLanguage, customInput.trim());
      const msg = result.success ? (result.output || '(no output)') : formatExecutionError(result.error);
      setOutput(`Running with custom input:\n${customInput}\n\n${result.success ? 'Output:' : 'Error:'}\n${msg}`);
      setIsRunning(false);
      return;
    }

    const visibleTestCases = problemDetails.testCases.filter(tc => !tc.hidden);
    const results: { passed: boolean; input: string; expected: string; actual: string }[] = [];

    for (const tc of visibleTestCases) {
      const result = await executeCode(trimmedCode, selectedLanguage, tc.input);
      const expected = (tc.expectedOutput || '').trim();
      const actual = result.success ? (result.output || '').trim() : formatExecutionError(result.error);
      const passed = result.success && actual === expected;
      results.push({ passed, input: tc.input, expected, actual });
    }

    setTestResults(results);
    const passedCount = results.filter(r => r.passed).length;
    setOutput(
      passedCount === results.length
        ? `All ${results.length} test case(s) passed.`
        : `${passedCount}/${results.length} test case(s) passed.\n\n` +
        results.map((r, i) => `Test ${i + 1}: ${r.passed ? '✅ Passed' : '❌ Failed'}\nExpected: ${r.expected}\nGot: ${r.actual}`).join('\n\n')
    );
    setIsRunning(false);
  };

  // Submit code (runs against all test cases including hidden)
  const handleSubmit = async () => {
    const trimmedCode = code.trim();
    const starterCode = problemDetails.starterCode[selectedLanguage] || problemDetails.starterCode.python || '';
    if (!trimmedCode || trimmedCode === starterCode.trim()) {
      setShowOutputPanel(true);
      setOutput('Please write your solution before submitting.');
      setTestResults(null);
      return;
    }

    setIsSubmitting(true);
    setOutput(null);
    setTestResults(null);
    setShowOutputPanel(true);
    setOutput('Submitting and running all test cases...');

    const testCases = problemDetails.testCases;
    const results: { passed: boolean; input: string; expected: string; actual: string }[] = [];

    for (const tc of testCases) {
      const result = await executeCode(trimmedCode, selectedLanguage, tc.input);
      const expected = (tc.expectedOutput || '').trim();
      const actual = result.success ? (result.output || '').trim() : formatExecutionError(result.error);
      const passed = result.success && actual === expected;
      results.push({ passed, input: tc.input, expected, actual });
    }

    const passedCount = results.filter(r => r.passed).length;
    const allPassed = passedCount === results.length;
    const totalTests = testCases.length;
    const scoreValue = totalTests > 0 ? Math.round((passedCount / totalTests) * 400) : 0;

    setScore(scoreValue);
    setTestResults(results);

    const runtime = `${Math.floor(Math.random() * 80) + 20} ms`;
    const memory = `${(Math.random() * 20 + 35).toFixed(1)} MB`;
    const timestamp = new Date().toISOString();
    const submissionId = `sub-${Date.now()}`;
    const languageName = supportedLanguages.find(l => l.id === selectedLanguage)?.name || 'Python 3';
    const status: 'Accepted' | 'Wrong Answer' = allPassed ? 'Accepted' : 'Wrong Answer';

    // Create submission object
    const newSubmission = {
      id: submissionId,
      status,
      runtime,
      memory,
      language: languageName,
      timestamp,
      code: trimmedCode
    };

    if (allPassed) {
      setOutput(`✅ Accepted! All test cases passed.\n\nRuntime: ${runtime} (Score: ${scoreValue}/400)\nMemory: ${memory} `);
      // Update status to solved
      onStatusUpdate(question.id, 'solved', true);
    } else {
      const visibleResults = results.map((r, i) => `Test ${i + 1}${testCases[i].hidden ? ' (hidden)' : ''}: ${r.passed ? '✅ Passed' : '❌ Failed'}${!testCases[i].hidden ? `\nExpected: ${r.expected}\nGot: ${r.actual}` : ''}`);
      setOutput(`❌ Wrong Answer\n\nScore: ${scoreValue} / 400\n${passedCount}/${totalTests} test cases passed.\n\n` + visibleResults.join('\n\n'));
      // Update status to attempted
      onStatusUpdate(question.id, 'attempted', false);
    }

    // Add to local submission history immediately (optimistic update)
    setSubmissionHistory(prev => [newSubmission, ...prev]);

    // Save submission to backend
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await fetch(USER_PROGRESS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submit',
            userId,
            questionId: question.id,
            passed: allPassed,
            runtime: newSubmission.runtime,
            memory: newSubmission.memory,
            language: selectedLanguage,
            code: newSubmission.code,
            testsPassed: passedCount,
            testsTotal: totalTests
          })
        });
      } catch (error) {
        console.error('Error saving submission to backend:', error);
      }
    }

    setIsSubmitting(false);
  };

  // Keyboard shortcuts: Ctrl+' Run, Ctrl+Enter Submit (capture phase so they work when editor is focused)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (isRunning || isSubmitting) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit();
        return;
      }
      if (e.key === "'" || e.key === '"') {
        e.preventDefault();
        e.stopPropagation();
        handleRun();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isRunning, isSubmitting, handleRun, handleSubmit]);

  return (
    <div className="h-full min-h-0 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        {/* Left: Back Button + Tabs */}
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <div className="relative group">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
              Return to Problem List
            </div>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: 'description', label: 'Description' },
              { id: 'discussion', label: 'Discussion' },
              { id: 'submissions', label: 'Submissions' },
              { id: 'hints', label: 'Hints' },
              { id: 'solution', label: 'Solution' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProblemTab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Timer & Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono font-medium">{formatTimer(timer)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="font-medium">Score: {score !== null ? score : 0} / 400</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Right: Language Selector & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {supportedLanguages.find(l => l.id === selectedLanguage)?.name}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLanguageDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLanguageDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 max-h-64 overflow-y-auto">
                  {supportedLanguages.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        setShowLanguageDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedLanguage === lang.id ? 'text-teal-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="relative group">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
              Reset Code
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div style={{ width: `${leftPanelWidth}%` }} className="flex flex-col min-h-0 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            {activeTab === 'description' && (
              <div className="space-y-6">
                {/* Title & Meta */}
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{question.title}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Programming • {question.topic}</p>
                </div>

                {/* Badges & Stats */}
                <div className="flex items-center gap-4 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {getDifficultyLabel(question.difficulty)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{question.successRate?.toFixed(1)}% Success</span>
                </div>

                {/* Likes, Dislikes, Bookmark */}
                <div className="flex items-center gap-4">
                  <button onClick={onToggleLike} className={`flex items-center gap-1 transition-colors ${question.isLiked ? 'text-green-600' : 'text-gray-500 hover:text-green-600'}`}>
                    <svg className="w-5 h-5" fill={question.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-sm">{question.likes || 0}</span>
                  </button>
                  <button onClick={onToggleDislike} className={`flex items-center gap-1 transition-colors ${question.isDisliked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}>
                    <svg className="w-5 h-5 transform rotate-180" fill={question.isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-sm">{question.dislikes || 0}</span>
                  </button>
                  <button onClick={onToggleBookmark} className={`flex items-center gap-1 ${question.isBookmarked ? 'text-amber-500' : 'text-gray-500 hover:text-amber-500'}`}>
                    <svg className="w-5 h-5" fill={question.isBookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="text-sm">Bookmark</span>
                  </button>
                </div>

                {/* Asked In */}
                {question.askedIn && question.askedIn.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Asked In:</span>
                    <div className="flex items-center gap-1">
                      {question.askedIn.map(companyId => (
                        <CompanyLogo key={companyId} companyId={companyId} size="md" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Problem Description */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Problem Description</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{problemDetails.description.replace(/\*\*(.*?)\*\*/g, '$1')}</p>
                  </div>
                </div>

                {/* Problem Constraints */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Problem Constraints</h2>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <ul className="space-y-1">
                      {problemDetails.constraints.map((c, i) => (
                        <li key={i} className="text-gray-700 dark:text-gray-300 font-mono text-sm">{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Input/Output Format */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Input Format</h2>
                  <p className="text-gray-700 dark:text-gray-300">{problemDetails.inputFormat}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Output Format</h2>
                  <p className="text-gray-700 dark:text-gray-300">{problemDetails.outputFormat}</p>
                </div>

                {/* Examples */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Examples</h2>
                  {problemDetails.examples.map((ex, i) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Input:</span>
                        <pre className="mt-1 text-sm font-mono text-gray-800 dark:text-gray-200">{ex.input}</pre>
                      </div>
                      <div className="mb-2">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Output:</span>
                        <pre className="mt-1 text-sm font-mono text-gray-800 dark:text-gray-200">{ex.output}</pre>
                      </div>
                      {ex.explanation && (
                        <div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Explanation:</span>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{ex.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'hints' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hints</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Click on a hint to reveal it. Try to solve the problem before viewing hints!</p>
                {problemDetails.hints.map((hint, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedHintIndex(expandedHintIndex === i ? null : i)}
                      className={`w-full flex items-center justify-between p-4 transition-colors ${expandedHintIndex === i
                        ? 'bg-yellow-50 dark:bg-yellow-900/30'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${expandedHintIndex === i
                          ? 'bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                          {i + 1}
                        </span>
                        <span className={`font-medium ${expandedHintIndex === i
                          ? 'text-yellow-800 dark:text-yellow-200'
                          : 'text-gray-700 dark:text-gray-300'
                          }`}>
                          Hint {i + 1}
                        </span>
                      </div>
                      <svg
                        className={`w-5 h-5 transition-transform duration-200 ${expandedHintIndex === i
                          ? 'rotate-180 text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-400'
                          }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedHintIndex === i && (
                      <div className="px-4 pb-4 pt-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800/50">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{hint}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'solution' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Solution / Editorial</h2>
                {problemDetails.solution ? (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <pre className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      <code>{problemDetails.solution}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <h3 className="text-base font-semibold text-amber-800 dark:text-amber-300 mb-1">Editorial Coming Soon</h3>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Detailed solutions with multiple approaches, time/space complexity analysis, and explanations will be available soon.
                    </p>
                    <p className="text-xs text-amber-500 dark:text-amber-500 mt-3">
                      💡 Tip: Try solving the problem yourself first, then check the Discussion tab for community solutions!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="space-y-4">
                {/* Add Comment Section */}
                {currentUserId ? (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts or ask a question..."
                      className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm rounded-lg p-3 min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700"
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Please log in to join the discussion</p>
                  </div>
                )}

                {/* Loading State */}
                {isLoadingDiscussions && (
                  <div className="flex items-center justify-center py-8">
                    <svg className="w-6 h-6 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}

                {/* Comments List */}
                {!isLoadingDiscussions && discussions.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">No discussions yet. Be the first to comment!</p>
                  </div>
                )}

                {!isLoadingDiscussions && discussions.map((comment) => (
                  <div key={comment.commentId} className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                    {/* Comment Header */}
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
                        {comment.userName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* User Info */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">{comment.userName}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs">{formatDate(comment.createdAt)}</span>
                        </div>

                        {/* Comment Content */}
                        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-3">
                          {/* Upvote */}
                          <button
                            onClick={() => handleVote(comment.commentId, true)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${comment.hasUpvoted ? 'text-teal-500' : 'text-gray-400 hover:text-teal-500'
                              }`}
                          >
                            <svg className="w-4 h-4" fill={comment.hasUpvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                            <span>{comment.upvotes}</span>
                          </button>

                          {/* Downvote */}
                          <button
                            onClick={() => handleVote(comment.commentId, false)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${comment.hasDownvoted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                              }`}
                          >
                            <svg className="w-4 h-4" fill={comment.hasDownvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* Show Replies */}
                          {comment.repliesCount > 0 && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedReplies);
                                if (newExpanded.has(comment.commentId)) {
                                  newExpanded.delete(comment.commentId);
                                } else {
                                  newExpanded.add(comment.commentId);
                                }
                                setExpandedReplies(newExpanded);
                              }}
                              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-500 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span>Show {comment.repliesCount} Replies</span>
                            </button>
                          )}

                          {/* Reply Button */}
                          <button
                            onClick={() => setReplyingTo(replyingTo === comment.commentId ? null : comment.commentId)}
                            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-teal-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Reply</span>
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyingTo === comment.commentId && (
                          <div className="mt-4 pl-4 border-l-2 border-teal-200 dark:border-teal-800">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm rounded-lg p-3 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-700"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                                className="px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddReply(comment.commentId)}
                                disabled={!replyContent.trim()}
                                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Submission History</h2>

                {/* Loading State */}
                {isLoadingSubmissions && (
                  <div className="flex items-center justify-center py-12">
                    <svg className="w-8 h-8 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                )}

                {!isLoadingSubmissions && submissionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Submit your solution to see it here</p>
                  </div>
                ) : !isLoadingSubmissions && (
                  <div className="space-y-2">
                    {submissionHistory.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-4 rounded-xl border transition-colors ${submission.status === 'Accepted'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {submission.status === 'Accepted' ? (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                            <span className={`font-semibold ${submission.status === 'Accepted'
                              ? 'text-green-700 dark:text-green-400'
                              : 'text-red-700 dark:text-red-400'
                              }`}>
                              {submission.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(submission.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">{submission.runtime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">{submission.memory}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">{submission.language}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div
          onMouseDown={handleMouseDown}
          className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-teal-500 cursor-col-resize flex items-center justify-center group"
        >
          <div className="w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full group-hover:bg-white" />
        </div>

        {/* Right Panel - Code Editor */}
        <div ref={rightPanelRef} style={{ width: `${100 - leftPanelWidth}%` }} className="flex flex-col min-h-0 bg-[#1e1e1e] overflow-hidden relative">
          {/* Top Action Bar - LeetCode Style */}
          <div className="h-10 bg-[#303030] border-b border-[#404040] flex items-center justify-end px-3 gap-1 shrink-0">
            {/* Run Button */}
            <div className="relative group">
              <button
                onClick={handleRun}
                disabled={isRunning || isSubmitting}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#404040] rounded transition-colors disabled:opacity-50"
              >
                {isRunning ? (
                  <svg className="w-[18px] h-[18px] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                )}
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
                Run Code
              </div>
            </div>

            {/* Submit Button */}
            <div className="relative group">
              <button
                onClick={handleSubmit}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2cbb5d] hover:bg-[#26a34f] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                )}
                Submit
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
                Submit Solution
              </div>
            </div>

            {/* Copy Code */}
            <div className="relative group">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code).then(() => {
                    // Show a brief toast-like feedback
                    const btn = document.getElementById('copy-code-btn');
                    if (btn) {
                      btn.classList.add('text-green-400');
                      setTimeout(() => btn.classList.remove('text-green-400'), 1500);
                    }
                  });
                }}
                id="copy-code-btn"
                className="p-2 text-gray-400 hover:text-gray-200 hover:bg-[#404040] rounded transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
                Copy Code
              </div>
            </div>
          </div>

          {/* Editor - takes remaining space */}
          <div className="flex-1 min-h-0" style={{ height: (showOutputPanel || showCustomInput) ? `${100 - bottomPanelHeight}%` : '100%' }}>
            <Editor
              height="100%"
              language={supportedLanguages.find(l => l.id === selectedLanguage)?.monacoId || 'python'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>

          {/* Draggable Bottom Panel - LeetCode Style */}
          {(showOutputPanel || showCustomInput) && (
            <div
              className="flex flex-col bg-[#1e1e1e] overflow-hidden border-t border-gray-700"
              style={{ height: `${bottomPanelHeight}%` }}
            >
              {/* Vertical Resizer - Drag Handle */}
              <div
                onMouseDown={handleVerticalMouseDown}
                className="h-1 bg-[#303030] hover:bg-teal-500 cursor-row-resize flex items-center justify-center group shrink-0 transition-colors"
              />

              {/* Tab Bar - At Top */}
              <div className="h-10 bg-[#1e1e1e] border-b border-[#303030] flex items-center px-3 shrink-0">
                <div className="flex items-center gap-0.5">
                  {/* Testcase Tab */}
                  <button
                    onClick={() => {
                      setShowCustomInput(true);
                      setShowOutputPanel(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${showCustomInput && !showOutputPanel
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <svg className={`w-4 h-4 ${showCustomInput && !showOutputPanel ? 'text-green-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Testcase
                  </button>

                  <span className="text-gray-600 mx-1">|</span>

                  {/* Test Result Tab */}
                  <button
                    onClick={() => {
                      setShowOutputPanel(true);
                      setShowCustomInput(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${showOutputPanel
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Test Result
                  </button>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-[#1e1e1e]">
                {/* Custom Input Content */}
                {showCustomInput && !showOutputPanel && (
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
                      {customTestCases.map((tc) => (
                        <span
                          key={tc.id}
                          onClick={() => setActiveTestCaseId(tc.id)}
                          className={`px-2.5 py-1 rounded cursor-pointer transition-colors ${activeTestCaseId === tc.id
                            ? 'bg-[#404040] text-white'
                            : 'bg-[#303030] hover:bg-[#3c3c3c] text-gray-300'
                            }`}
                        >
                          Case {tc.id}
                        </span>
                      ))}
                      <button
                        onClick={() => {
                          const newId = Math.max(...customTestCases.map(tc => tc.id)) + 1;
                          setCustomTestCases(prev => [...prev, { id: newId, input: '[]', target: '0' }]);
                          setActiveTestCaseId(newId);
                        }}
                        className="w-6 h-6 flex items-center justify-center hover:bg-[#303030] rounded transition-colors text-gray-500 hover:text-gray-300"
                        title="Add Test Case"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      {customTestCases.length > 1 && (
                        <button
                          onClick={() => {
                            if (customTestCases.length > 1) {
                              setCustomTestCases(prev => prev.filter(tc => tc.id !== activeTestCaseId));
                              setActiveTestCaseId(customTestCases[0].id === activeTestCaseId ? customTestCases[1].id : customTestCases[0].id);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-red-500/20 rounded transition-colors text-gray-500 hover:text-red-400"
                          title="Remove Test Case"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="flex-1 px-4 pb-4">
                      <label className="text-xs text-gray-500 mb-2 block font-medium">nums =</label>
                      <div className="bg-[#303030] rounded-lg p-3 mb-3">
                        <input
                          type="text"
                          value={customTestCases.find(tc => tc.id === activeTestCaseId)?.input || '[]'}
                          onChange={(e) => {
                            setCustomTestCases(prev => prev.map(tc =>
                              tc.id === activeTestCaseId ? { ...tc, input: e.target.value } : tc
                            ));
                            setCustomInput(e.target.value);
                          }}
                          className="w-full bg-transparent text-gray-200 text-sm font-mono focus:outline-none"
                        />
                      </div>
                      <label className="text-xs text-gray-500 mb-2 block font-medium">target =</label>
                      <div className="bg-[#303030] rounded-lg p-3">
                        <input
                          type="text"
                          value={customTestCases.find(tc => tc.id === activeTestCaseId)?.target || '0'}
                          onChange={(e) => {
                            setCustomTestCases(prev => prev.map(tc =>
                              tc.id === activeTestCaseId ? { ...tc, target: e.target.value } : tc
                            ));
                          }}
                          className="w-full bg-transparent text-gray-200 text-sm font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Output/Test Results Content */}
                {showOutputPanel && (
                  <div className="p-4">
                    {(isRunning || isSubmitting) && (
                      <div className="flex items-center gap-3 text-gray-400">
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm">{isRunning ? 'Running your code...' : 'Submitting your solution...'}</span>
                      </div>
                    )}
                    {!isRunning && !isSubmitting && !output && !testResults && (
                      <div className="text-gray-500 text-sm text-center py-8">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Click "Run" to execute your code
                      </div>
                    )}
                    {!isRunning && !isSubmitting && output && (
                      <pre className={`text-sm whitespace-pre-wrap ${output.includes('✅') ? 'text-green-400' : output.includes('❌') ? 'text-red-400' : 'text-gray-300'}`}>{output}</pre>
                    )}
                    {!isRunning && !isSubmitting && testResults && (
                      <div className="space-y-3">
                        {testResults.map((result, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${result.passed ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              {result.passed ? (
                                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className={`text-sm font-semibold ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                Test Case {i + 1} {result.passed ? 'Passed' : 'Failed'}
                              </span>
                            </div>
                            <div className="grid gap-2 text-xs font-mono">
                              <div className="flex gap-2">
                                <span className="text-gray-500 w-16">Input:</span>
                                <span className="text-gray-300">{result.input}</span>
                              </div>
                              <div className="flex gap-2">
                                <span className="text-gray-500 w-16">Expected:</span>
                                <span className="text-gray-300">{result.expected}</span>
                              </div>
                              {!result.passed && (
                                <div className="flex gap-2">
                                  <span className="text-gray-500 w-16">
                                    {result.actual.startsWith('Syntax Error:') || result.actual.startsWith('Runtime Error:') ? 'Error:' : 'Output:'}
                                  </span>
                                  <span className="text-red-400">{result.actual}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-10 bg-[#1e1e1e] border-t border-[#303030] flex items-center justify-between px-4">
        {/* Left: Problem List */}
        <div className="relative group">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#303030] rounded transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span className="text-sm">Back to List</span>
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
            Return to Problem List
          </div>
        </div>

        {/* Center: Navigation */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <button onClick={onPrevious} disabled={questionIndex === 0} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#303030] rounded disabled:opacity-40 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
              Previous Question
            </div>
          </div>
          <span className="text-sm text-gray-500 px-2">{questionIndex + 1} / {totalQuestions}</span>
          <div className="relative group">
            <button onClick={onNext} disabled={questionIndex === totalQuestions - 1} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#303030] rounded disabled:opacity-40 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg border border-gray-200">
              Next Question
            </div>
          </div>
        </div>

        {/* Right: Shortcuts hint */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#303030] rounded text-gray-400">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-[#303030] rounded text-gray-400">'</kbd>
            <span className="ml-1">Run</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#303030] rounded text-gray-400">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-[#303030] rounded text-gray-400">Enter</kbd>
            <span className="ml-1">Submit</span>
          </span>
        </div>
      </div>

      {/* Reset Code Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Reset Code?
            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-center mb-6 text-sm">
              This will reset your code to the starter template. All your changes will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 px-4 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const starterCode = problemDetails.starterCode[selectedLanguage] || problemDetails.starterCode.python || '';
                  setCode(starterCode);
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 px-4 text-white bg-amber-500 hover:bg-amber-600 font-medium rounded-xl transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
interface CodingInterviewQuestionsPageProps {
  toggleSidebar?: () => void;
}

const CodingInterviewQuestionsPage: React.FC<CodingInterviewQuestionsPageProps> = ({ toggleSidebar }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'attempted' | 'solved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recently-added');
  const [questions, setQuestions] = useState<CodingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Fetch questions from API on mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${CODING_QUESTIONS_API}?status=published`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch questions');
        }

        const data = await response.json();

        if (data.success && data.data?.questions && data.data.questions.length > 0) {
          // Map API response to our interface format
          const apiQuestions: CodingQuestion[] = data.data.questions.map((q: any, index: number) => {
            // Map difficulty from API format to our format
            const difficultyMap: Record<string, DifficultyLevel> = {
              'Easy': 'easy',
              'Medium': 'medium',
              'Hard': 'hard'
            };

            return {
              id: q.questionId || q.id || `api-${index}`,
              title: q.title,
              topic: q.topic || 'General',
              difficulty: difficultyMap[q.difficulty] || 'medium',
              avgTime: q.avgTime || 30,
              submissions: q.submissions || 0,
              askedIn: q.companies || [],
              status: 'unsolved' as QuestionStatus,
              isBookmarked: false,
              dateAdded: q.createdAt || new Date().toISOString().split('T')[0],
              likes: q.likes ?? 0,
              dislikes: q.dislikes ?? 0,
              successRate: q.successRate ?? 0,
              problemDetails: {
                description: q.description || '',
                constraints: q.constraints || [],
                inputFormat: q.inputFormat || '',
                outputFormat: q.outputFormat || '',
                examples: q.examples || [],
                hints: q.hints || [],
                starterCode: q.starterCode || defaultProblemDetails.starterCode,
                testCases: (q.testCases || []).map((tc: any) => ({
                  input: tc.input,
                  expectedOutput: tc.expectedOutput,
                  hidden: tc.isHidden
                }))
              }
            };
          });

          // Use API questions
          const allQuestions = [...apiQuestions];

          // Fetch user progress and merge with questions
          const userId = getCurrentUserId();
          if (userId) {
            try {
              const progressResponse = await fetch(USER_PROGRESS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_progress', userId })
              });

              if (progressResponse.ok) {
                const progressData = await progressResponse.json();
                if (progressData.success && progressData.data?.progress) {
                  // Create a map of question progress
                  const progressMap = new Map();
                  progressData.data.progress.forEach((p: any) => {
                    progressMap.set(p.questionId, p);
                  });

                  // Merge progress with questions
                  const mergedQuestions = allQuestions.map(q => {
                    const progress = progressMap.get(q.id);
                    if (progress) {
                      return {
                        ...q,
                        status: progress.status as QuestionStatus,
                        isBookmarked: progress.isBookmarked || false
                      };
                    }
                    return q;
                  });

                  setQuestions(mergedQuestions);
                } else {
                  setQuestions(allQuestions);
                }
              } else {
                setQuestions(allQuestions);
              }
            } catch (progressError) {
              console.error('Error fetching user progress:', progressError);
              setQuestions(allQuestions);
            }
          } else {
            setQuestions(allQuestions);
          }
        } else {
          // No API questions - keep empty state
          setQuestions([]);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        // Keep using mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Calculate user progress
  const userProgress: UserProgress = useMemo(() => {
    const solved = questions.filter(q => q.status === 'solved').length;
    const attempted = questions.filter(q => q.status === 'attempted').length;
    const total = questions.length;
    const accuracy = solved > 0 ? ((solved / (solved + attempted)) * 100) : 0;
    return { solved, total, attempted, accuracy };
  }, [questions]);

  // Filter and sort questions
  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    // Tab filter
    switch (activeTab) {
      case 'bookmarks':
        result = result.filter(q => q.isBookmarked);
        break;
      case 'attempted':
        result = result.filter(q => q.status === 'attempted');
        break;
      case 'solved':
        result = result.filter(q => q.status === 'solved');
        break;
    }

    // Search filter
    if (searchQuery) {
      result = result.filter(q =>
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Difficulty filter
    if (selectedDifficulties.length > 0) {
      result = result.filter(q => selectedDifficulties.includes(q.difficulty));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter(q => q.status === selectedStatus);
    }

    // Topics filter
    if (selectedTopics.length > 0) {
      result = result.filter(q => selectedTopics.includes(q.topic));
    }

    // Companies filter
    if (selectedCompanies.length > 0) {
      result = result.filter(q => q.askedIn.some(c => selectedCompanies.includes(c)));
    }

    // Sort
    switch (sortBy) {
      case 'fastest':
        result.sort((a, b) => a.avgTime - b.avgTime);
        break;
      case 'slowest':
        result.sort((a, b) => b.avgTime - a.avgTime);
        break;
      case 'easier':
        const difficultyOrder = ['very-easy', 'easy', 'medium', 'hard', 'very-hard'];
        result.sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty));
        break;
      case 'harder':
        const difficultyOrderDesc = ['very-hard', 'hard', 'medium', 'easy', 'very-easy'];
        result.sort((a, b) => difficultyOrderDesc.indexOf(a.difficulty) - difficultyOrderDesc.indexOf(b.difficulty));
        break;
      case 'recently-added':
      default:
        result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
    }

    return result;
  }, [questions, activeTab, searchQuery, selectedDifficulties, selectedStatus, selectedTopics, selectedCompanies, sortBy]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedDifficulties, selectedStatus, selectedTopics, selectedCompanies, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Pick random question
  const pickRandomQuestion = useCallback(() => {
    if (filteredQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
      const randomQuestion = filteredQuestions[randomIndex];
      setSelectedQuestion(randomQuestion);
      setCurrentQuestionIndex(randomIndex);
    }
  }, [filteredQuestions]);

  // Toggle bookmark
  const toggleBookmark = useCallback(async (questionId: string) => {
    // Optimistically update UI
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, isBookmarked: !q.isBookmarked } : q
    ));
    // Also update selectedQuestion if it's the current one
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
    }

    // Sync with API
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await fetch(USER_PROGRESS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_bookmark',
            userId,
            questionId
          })
        });
      } catch (error) {
        console.error('Error syncing bookmark:', error);
      }
    }
  }, [selectedQuestion]);

  // Toggle like
  const handleLikeToggle = useCallback(async (questionId: string) => {
    // Optimistically update UI
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const newIsLiked = !q.isLiked;
        return {
          ...q,
          isLiked: newIsLiked,
          isDisliked: false,
          likes: (q.likes || 0) + (newIsLiked ? 1 : -1),
          dislikes: (q.dislikes || 0) + (q.isDisliked ? -1 : 0)
        };
      }
      return q;
    }));

    // Also update selectedQuestion if it's the current one
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => {
        if (!prev) return null;
        const newIsLiked = !prev.isLiked;
        return {
          ...prev,
          isLiked: newIsLiked,
          isDisliked: false,
          likes: (prev.likes || 0) + (newIsLiked ? 1 : -1),
          dislikes: (prev.dislikes || 0) + (prev.isDisliked ? -1 : 0)
        };
      });
    }

    // Sync with API
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await fetch(USER_PROGRESS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_like',
            userId,
            questionId
          })
        });
      } catch (error) {
        console.error('Error syncing like:', error);
      }
    }
  }, [selectedQuestion]);

  // Toggle dislike
  const handleDislikeToggle = useCallback(async (questionId: string) => {
    // Optimistically update UI
    setQuestions(prev => prev.map(q => {
      if (q.id === questionId) {
        const newIsDisliked = !q.isDisliked;
        return {
          ...q,
          isDisliked: newIsDisliked,
          isLiked: false,
          dislikes: (q.dislikes || 0) + (newIsDisliked ? 1 : -1),
          likes: (q.likes || 0) + (q.isLiked ? -1 : 0)
        };
      }
      return q;
    }));

    // Also update selectedQuestion if it's the current one
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => {
        if (!prev) return null;
        const newIsDisliked = !prev.isDisliked;
        return {
          ...prev,
          isDisliked: newIsDisliked,
          isLiked: false,
          dislikes: (prev.dislikes || 0) + (newIsDisliked ? 1 : -1),
          likes: (prev.likes || 0) + (prev.isLiked ? -1 : 0)
        };
      });
    }

    // Sync with API
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await fetch(USER_PROGRESS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'toggle_dislike',
            userId,
            questionId
          })
        });
      } catch (error) {
        console.error('Error syncing dislike:', error);
      }
    }
  }, [selectedQuestion]);

  // Open question in code editor
  const openQuestion = useCallback((question: CodingQuestion) => {
    const index = filteredQuestions.findIndex(q => q.id === question.id);
    setSelectedQuestion(question);
    setCurrentQuestionIndex(index >= 0 ? index : 0);
  }, [filteredQuestions]);

  // Navigate to next/previous question
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedQuestion(filteredQuestions[nextIndex]);
    }
  }, [currentQuestionIndex, filteredQuestions]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setSelectedQuestion(filteredQuestions[prevIndex]);
    }
  }, [currentQuestionIndex, filteredQuestions]);

  // Go back to list view
  const goBackToList = useCallback(() => {
    setSelectedQuestion(null);
  }, []);

  // Update question status (solved/attempted) and sync with API
  const updateQuestionStatus = useCallback(async (questionId: string, status: QuestionStatus, _passed: boolean) => {
    // Update local state
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, status } : q
    ));

    // Also update selected question if it's the current one
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => prev ? { ...prev, status } : null);
    }

    // Sync with API
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await fetch(USER_PROGRESS_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_status',
            userId,
            questionId,
            status
          })
        });
        console.log(`Question ${questionId} status updated to ${status}`);
      } catch (error) {
        console.error('Error syncing status:', error);
      }
    }
  }, [selectedQuestion]);

  // If a question is selected, show the problem solving view
  if (selectedQuestion) {
    return (
      <ProblemSolvingView
        question={selectedQuestion}
        questionIndex={currentQuestionIndex}
        totalQuestions={filteredQuestions.length}
        onBack={goBackToList}
        onNext={goToNextQuestion}
        onPrevious={goToPreviousQuestion}
        onToggleBookmark={() => toggleBookmark(selectedQuestion.id)}
        onToggleLike={() => handleLikeToggle(selectedQuestion.id)}
        onToggleDislike={() => handleDislikeToggle(selectedQuestion.id)}
        onStatusUpdate={updateQuestionStatus}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            {toggleSidebar && (
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading Skeleton State */}
        {isLoading && (
          <div className="space-y-8">
            <SkeletonDashboard />
          </div>
        )}

        {/* Progress & Banner Section */}
        {!isLoading && (
          <>
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              {/* Progress Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <ProgressRing progress={(userProgress.solved / userProgress.total) * 100} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round((userProgress.solved / userProgress.total) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Your Progress</span>
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex gap-3 sm:gap-6">
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Solved</span>
                      <p className="text-sm sm:text-lg font-semibold text-teal-600 dark:text-teal-400">{userProgress.solved}/{userProgress.total}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Attempted</span>
                      <p className="text-sm sm:text-lg font-semibold text-blue-600 dark:text-blue-400">{userProgress.attempted}</p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Accuracy</span>
                      <p className="text-sm sm:text-lg font-semibold text-green-600 dark:text-green-400">{userProgress.accuracy.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Banner */}
              <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 overflow-hidden relative border border-gray-800">
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-500/10 rounded-full blur-3xl"></div>
                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base sm:text-lg">Unlock All Company Questions</h3>
                      <p className="text-gray-400 text-xs sm:text-sm">Get access to 500+ questions from Google, Amazon, Meta & more</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 ml-0 sm:ml-4">
                    {['google', 'amazon', 'meta', 'microsoft'].map((company) => (
                      <div key={company} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                        <img src={`/company_logos/${company}.png`} alt={company} className="w-4 h-4 sm:w-6 sm:h-6 object-contain" />
                      </div>
                    ))}
                    <span className="text-gray-400 text-xs sm:text-sm ml-1 hidden sm:inline">+16 more</span>
                  </div>
                </div>
                <button className="relative z-10 w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="hidden sm:inline">Upgrade to Pro</span>
                  <span className="sm:hidden">Upgrade</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex overflow-x-auto scrollbar-hide">
                  {[
                    { id: 'all', label: 'All Questions', shortLabel: 'All', icon: '≡' },
                    { id: 'bookmarks', label: 'Bookmarks', shortLabel: 'Saved', icon: '🔖' },
                    { id: 'attempted', label: 'Attempted', shortLabel: 'Tried', icon: '□' },
                    { id: 'solved', label: 'Solved', shortLabel: 'Done', icon: '☑' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                        ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                        : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.shortLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters Section */}
              <div className="relative z-20 p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
                  {/* Search */}
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-md">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search problems..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Dropdown
                      label="Difficulty"
                      options={[
                        { value: 'very-easy', label: 'Very easy' },
                        { value: 'easy', label: 'Easy' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'hard', label: 'Hard' },
                        { value: 'very-hard', label: 'Very hard' },
                      ]}
                      value={selectedDifficulties}
                      onChange={(v) => setSelectedDifficulties(v as string[])}
                      multiple
                    />

                    <Dropdown
                      label="Status"
                      options={[
                        { value: 'all', label: 'All' },
                        { value: 'unsolved', label: 'Unsolved' },
                        { value: 'attempted', label: 'Attempted' },
                        { value: 'solved', label: 'Solved' },
                      ]}
                      value={selectedStatus}
                      onChange={(v) => setSelectedStatus(v as string)}
                    />

                    <Dropdown
                      label="Topics"
                      options={topics.map(t => ({ value: t, label: t }))}
                      value={selectedTopics}
                      onChange={(v) => setSelectedTopics(v as string[])}
                      multiple
                      searchable
                    />

                    <Dropdown
                      label="Companies"
                      options={companies.map(c => ({ value: c.id, label: c.name }))}
                      value={selectedCompanies}
                      onChange={(v) => setSelectedCompanies(v as string[])}
                      multiple
                      searchable
                    />

                    <Dropdown
                      label="Sort By"
                      options={[
                        { value: 'recently-added', label: 'Recently Added' },
                        { value: 'fastest', label: 'Fastest to solve' },
                        { value: 'slowest', label: 'Slowest to solve' },
                        { value: 'easier', label: 'Easier Problems' },
                        { value: 'harder', label: 'Harder Problems' },
                      ]}
                      value={sortBy}
                      onChange={(v) => setSortBy(v as SortOption)}
                    />

                    {/* Pick Random Button */}
                    <button
                      onClick={pickRandomQuestion}
                      className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Pick Random
                    </button>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="relative z-10 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Problem</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Topic</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Difficulty</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submissions</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asked In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {paginatedQuestions.map((question) => (
                      <tr
                        key={question.id}
                        onClick={() => openQuestion(question)}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${getStatusColor(question.status)}`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(question.id);
                            }}
                            className="text-gray-400 hover:text-amber-500 transition-colors"
                          >
                            {question.isBookmarked ? (
                              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            {question.title}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            {question.topic}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {getDifficultyLabel(question.difficulty)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {question.avgTime} Mins
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {formatNumber(question.submissions)}
                        </td>
                        <td className="px-6 py-4">
                          {(question.askedIn && question.askedIn.length > 0) ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Asked in</span>
                              <div className="flex items-center -space-x-1 ml-2">
                                {question.askedIn.slice(0, 3).map(companyId => (
                                  <CompanyLogo key={companyId} companyId={companyId} />
                                ))}
                              </div>
                              {question.askedIn.length > 3 ? (
                                <span className="ml-2 text-sm font-medium text-teal-600 dark:text-teal-400">
                                  +{question.askedIn.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredQuestions.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="mx-auto mb-4 w-full max-w-[380px] h-[280px] flex items-center justify-center">
                      <Lottie
                        animationData={noCodingQuestionAnimation}
                        loop
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No questions found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{Math.min(endIndex, filteredQuestions.length)}</span> of <span className="font-medium">{filteredQuestions.length}</span> questions
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* First Page Button */}
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="First Page"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1 text-gray-400 dark:text-gray-500">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`min-w-[36px] px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === page
                          ? 'bg-teal-500 text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  ))}

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Last Page"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div >
  );
};

export default CodingInterviewQuestionsPage;
