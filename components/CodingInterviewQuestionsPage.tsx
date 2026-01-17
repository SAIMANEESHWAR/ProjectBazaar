import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

// ============================================
// TYPES & INTERFACES
// ============================================

type DifficultyLevel = 'very-easy' | 'easy' | 'medium' | 'hard' | 'very-hard';
type QuestionStatus = 'unsolved' | 'attempted' | 'solved';
type SortOption = 'recently-added' | 'fastest' | 'slowest' | 'easier' | 'harder';
type ProblemTab = 'description' | 'discussion' | 'submissions' | 'hints';

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
}

interface UserProgress {
  solved: number;
  total: number;
  attempted: number;
  accuracy: number;
}

// Supported programming languages
const supportedLanguages = [
  { id: 'python', name: 'Python 3', monacoId: 'python' },
  { id: 'javascript', name: 'JavaScript', monacoId: 'javascript' },
  { id: 'java', name: 'Java', monacoId: 'java' },
  { id: 'cpp', name: 'C++', monacoId: 'cpp' },
  { id: 'c', name: 'C', monacoId: 'c' },
  { id: 'typescript', name: 'TypeScript', monacoId: 'typescript' },
  { id: 'go', name: 'Go', monacoId: 'go' },
  { id: 'rust', name: 'Rust', monacoId: 'rust' },
  { id: 'kotlin', name: 'Kotlin', monacoId: 'kotlin' },
  { id: 'swift', name: 'Swift', monacoId: 'swift' },
];

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

// Problem details for each question
const problemDetailsMap: Record<string, ProblemDetails> = {
  '2': {
    description: 'Given an array of size **N**, find the majority element. The majority element is the element that appears more than **floor(N/2)** times.\n\nYou may assume that the array is non-empty and the majority element always exists in the array.',
    constraints: ['1 <= |A| <= 10^6', '1 <= A[i] <= 10^9'],
    inputFormat: 'First argument is an integer array A.',
    outputFormat: 'Return an integer representing the majority element.',
    examples: [
      { input: 'A = [2, 1, 2]', output: '2', explanation: '2 appears 2 times which is greater than floor(3/2) = 1' },
      { input: 'A = [1, 1, 1, 2, 2]', output: '1', explanation: '1 appears 3 times which is greater than floor(5/2) = 2' }
    ],
    hints: [
      'Think about what happens when you pair up elements that are different.',
      'Consider using Boyer-Moore Voting Algorithm.',
      'Can you solve this in O(1) extra space?'
    ],
    starterCode: {
      python: 'class Solution:\n    def majorityElement(self, A):\n        # Write your code here\n        pass',
      javascript: 'function majorityElement(A) {\n    // Write your code here\n    \n}',
      java: 'public class Solution {\n    public int majorityElement(final int[] A) {\n        // Write your code here\n        return 0;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int majorityElement(const vector<int> &A) {\n        // Write your code here\n        return 0;\n    }\n};'
    },
    testCases: [
      { input: '[2, 1, 2]', expectedOutput: '2' },
      { input: '[1, 1, 1, 2, 2]', expectedOutput: '1' },
      { input: '[3, 3, 4, 2, 4, 4, 2, 4, 4]', expectedOutput: '4', hidden: true }
    ]
  },
  '9': {
    description: 'Given an array of integers **nums** and an integer **target**, return indices of the two numbers such that they add up to **target**.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    inputFormat: 'First argument is an integer array nums.\nSecond argument is an integer target.',
    outputFormat: 'Return an array of two integers representing the indices.',
    examples: [
      { input: 'nums = [2, 7, 11, 15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3, 2, 4], target = 6', output: '[1, 2]' },
      { input: 'nums = [3, 3], target = 6', output: '[0, 1]' }
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow.',
      'Try using a hash map to reduce the time complexity.',
      'What if we store the complement of each number?'
    ],
    starterCode: {
      python: 'class Solution:\n    def twoSum(self, nums, target):\n        # Write your code here\n        pass',
      javascript: 'function twoSum(nums, target) {\n    // Write your code here\n    \n}',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[]{};\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};'
    },
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]' },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]' },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]' }
    ]
  }
};

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

const codingQuestions: CodingQuestion[] = [
  { id: '1', title: 'Gas Station', topic: 'Greedy Algorithm', difficulty: 'medium', avgTime: 56, submissions: 66818, askedIn: ['google', 'amazon', 'microsoft', 'uber', 'flipkart'], status: 'attempted', isBookmarked: true, dateAdded: '2025-12-01', likes: 687, dislikes: 53, successRate: 52.4 },
  { id: '2', title: 'Majority Element', topic: 'Greedy Algorithm', difficulty: 'easy', avgTime: 19, submissions: 107381, askedIn: ['microsoft', 'yahoo', 'google', 'adobe'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-11-15', likes: 892, dislikes: 34, successRate: 68.7 },
  { id: '3', title: 'Distribute Candy', topic: 'Greedy Algorithm', difficulty: 'medium', avgTime: 65, submissions: 49275, askedIn: ['microsoft', 'flipkart', 'amazon'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-10-20', likes: 445, dislikes: 67, successRate: 41.2 },
  { id: '4', title: 'Longest Increasing Subsequence', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 30, submissions: 69063, askedIn: ['meta', 'yahoo', 'google', 'amazon', 'microsoft'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-09-10', likes: 756, dislikes: 45, successRate: 55.8 },
  { id: '5', title: 'Unique Binary Search Trees', topic: 'Dynamic Programming', difficulty: 'easy', avgTime: 62, submissions: 20009, askedIn: ['amazon', 'google', 'uber'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-08-25', likes: 234, dislikes: 23, successRate: 62.3 },
  { id: '6', title: 'Max Rectangle in Binary Matrix', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 79, submissions: 29987, askedIn: ['google', 'microsoft'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-07-15', likes: 389, dislikes: 56, successRate: 38.5 },
  { id: '7', title: 'Distinct Subsequences', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 65, submissions: 41227, askedIn: ['google'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-06-30', likes: 312, dislikes: 41, successRate: 44.7 },
  { id: '8', title: 'Unique Paths in a Grid', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 34, submissions: 40425, askedIn: ['meta'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-05-20', likes: 521, dislikes: 32, successRate: 58.9 },
  { id: '9', title: 'Two Sum', topic: 'Arrays', difficulty: 'easy', avgTime: 15, submissions: 250000, askedIn: ['google', 'amazon', 'meta', 'microsoft', 'apple'], status: 'solved', isBookmarked: true, dateAdded: '2025-12-15', likes: 2341, dislikes: 89, successRate: 78.5 },
  { id: '10', title: 'Valid Parentheses', topic: 'Stack', difficulty: 'easy', avgTime: 20, submissions: 180000, askedIn: ['amazon', 'meta', 'google'], status: 'solved', isBookmarked: false, dateAdded: '2025-12-10', likes: 1876, dislikes: 65, successRate: 72.3 },
  { id: '11', title: 'Merge Intervals', topic: 'Arrays', difficulty: 'medium', avgTime: 35, submissions: 95000, askedIn: ['google', 'meta', 'microsoft', 'uber'], status: 'attempted', isBookmarked: false, dateAdded: '2025-11-28', likes: 987, dislikes: 78, successRate: 54.6 },
  { id: '12', title: 'Trapping Rain Water', topic: 'Dynamic Programming', difficulty: 'hard', avgTime: 45, submissions: 78000, askedIn: ['amazon', 'google', 'microsoft'], status: 'unsolved', isBookmarked: true, dateAdded: '2025-11-20', likes: 1234, dislikes: 98, successRate: 42.1 },
  { id: '13', title: 'Coin Change', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 40, submissions: 120000, askedIn: ['amazon', 'google', 'apple'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-10-15', likes: 1567, dislikes: 87, successRate: 51.4 },
  { id: '14', title: 'Rotate Image', topic: 'Arrays', difficulty: 'medium', avgTime: 25, submissions: 85000, askedIn: ['microsoft', 'amazon', 'apple'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-10-01', likes: 876, dislikes: 54, successRate: 61.2 },
  { id: '15', title: 'Word Break', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 50, submissions: 67000, askedIn: ['meta', 'google', 'amazon'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-09-20', likes: 765, dislikes: 67, successRate: 47.8 },
  { id: '16', title: 'LRU Cache', topic: 'Hashing', difficulty: 'hard', avgTime: 60, submissions: 95000, askedIn: ['amazon', 'google', 'meta', 'microsoft'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-09-01', likes: 1123, dislikes: 112, successRate: 39.5 },
  { id: '17', title: 'Binary Tree Level Order Traversal', topic: 'Tree', difficulty: 'easy', avgTime: 25, submissions: 110000, askedIn: ['amazon', 'meta', 'microsoft'], status: 'solved', isBookmarked: false, dateAdded: '2025-08-15', likes: 1345, dislikes: 56, successRate: 69.8 },
  { id: '18', title: 'Search in Rotated Sorted Array', topic: 'Binary Search', difficulty: 'medium', avgTime: 30, submissions: 88000, askedIn: ['amazon', 'google', 'meta'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-08-01', likes: 923, dislikes: 71, successRate: 52.3 },
  { id: '19', title: 'Maximum Subarray', topic: 'Greedy Algorithm', difficulty: 'easy', avgTime: 18, submissions: 200000, askedIn: ['microsoft', 'amazon', 'linkedin'], status: 'solved', isBookmarked: true, dateAdded: '2025-07-20', likes: 2156, dislikes: 78, successRate: 75.2 },
  { id: '20', title: 'Median of Two Sorted Arrays', topic: 'Binary Search', difficulty: 'very-hard', avgTime: 75, submissions: 55000, askedIn: ['google', 'amazon', 'apple'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-07-01', likes: 678, dislikes: 134, successRate: 28.9 },
  { id: '21', title: 'Climbing Stairs', topic: 'Dynamic Programming', difficulty: 'very-easy', avgTime: 10, submissions: 180000, askedIn: ['amazon', 'google'], status: 'solved', isBookmarked: false, dateAdded: '2025-06-15', likes: 1987, dislikes: 45, successRate: 82.1 },
  { id: '22', title: 'Best Time to Buy and Sell Stock', topic: 'Greedy Algorithm', difficulty: 'easy', avgTime: 15, submissions: 220000, askedIn: ['amazon', 'meta', 'google', 'microsoft'], status: 'solved', isBookmarked: false, dateAdded: '2025-06-01', likes: 2345, dislikes: 67, successRate: 76.8 },
  { id: '23', title: 'Product of Array Except Self', topic: 'Arrays', difficulty: 'medium', avgTime: 28, submissions: 130000, askedIn: ['meta', 'amazon', 'apple'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-05-15', likes: 1234, dislikes: 65, successRate: 57.3 },
  { id: '24', title: 'Decode Ways', topic: 'Dynamic Programming', difficulty: 'medium', avgTime: 42, submissions: 75000, askedIn: ['meta', 'google', 'microsoft'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-05-01', likes: 654, dislikes: 78, successRate: 45.6 },
  { id: '25', title: 'Number of Islands', topic: 'Graph Data Structure & Algorithms', difficulty: 'medium', avgTime: 35, submissions: 145000, askedIn: ['amazon', 'meta', 'microsoft', 'google'], status: 'attempted', isBookmarked: false, dateAdded: '2025-04-15', likes: 1567, dislikes: 89, successRate: 53.2 },
  { id: '26', title: 'Course Schedule', topic: 'Graph Data Structure & Algorithms', difficulty: 'medium', avgTime: 40, submissions: 82000, askedIn: ['amazon', 'meta', 'google'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-04-01', likes: 876, dislikes: 67, successRate: 48.9 },
  { id: '27', title: 'Serialize and Deserialize Binary Tree', topic: 'Tree', difficulty: 'hard', avgTime: 55, submissions: 62000, askedIn: ['meta', 'amazon', 'google', 'linkedin'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-03-15', likes: 789, dislikes: 98, successRate: 38.7 },
  { id: '28', title: 'Minimum Window Substring', topic: 'String', difficulty: 'hard', avgTime: 65, submissions: 58000, askedIn: ['meta', 'google', 'amazon'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-03-01', likes: 923, dislikes: 112, successRate: 35.4 },
  { id: '29', title: 'Longest Palindromic Substring', topic: 'String', difficulty: 'medium', avgTime: 38, submissions: 175000, askedIn: ['amazon', 'microsoft', 'google'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-02-15', likes: 1456, dislikes: 76, successRate: 56.7 },
  { id: '30', title: 'Regular Expression Matching', topic: 'Dynamic Programming', difficulty: 'very-hard', avgTime: 80, submissions: 45000, askedIn: ['google', 'meta', 'amazon'], status: 'unsolved', isBookmarked: false, dateAdded: '2025-02-01', likes: 567, dislikes: 156, successRate: 25.3 },
];

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
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
          isOpen
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
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected(option.value)
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
const CompanyLogo: React.FC<{ companyId: string; size?: 'sm' | 'md' }> = ({ companyId, size = 'sm' }) => {
  const company = companies.find(c => c.id === companyId);
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  
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
      apple: 'bg-gray-800 dark:bg-gray-200 dark:text-gray-800',
      netflix: 'bg-red-600',
      flipkart: 'bg-yellow-500',
      uber: 'bg-black dark:bg-white dark:text-black',
      oracle: 'bg-red-500',
      adobe: 'bg-red-600',
      linkedin: 'bg-blue-700',
      yahoo: 'bg-purple-600',
      deshaw: 'bg-green-600',
      twitter: 'bg-sky-500',
      ibm: 'bg-blue-600',
      salesforce: 'bg-blue-500',
      paypal: 'bg-blue-600',
      ebay: 'bg-blue-600',
      directi: 'bg-orange-500',
    };
    return colors[id] || 'bg-gray-500';
  };

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center ${getCompanyColor(companyId)} text-white text-[10px] font-bold`} title={company?.name || companyId}>
      {getCompanyInitial(companyId)}
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
}

const ProblemSolvingView: React.FC<ProblemSolvingViewProps> = ({
  question,
  questionIndex,
  totalQuestions,
  onBack,
  onNext,
  onPrevious,
  onToggleBookmark,
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
  const [score, setScore] = useState(400);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const problemDetails = problemDetailsMap[question.id] || defaultProblemDetails;

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

  // Handle resize
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftPanelWidth(Math.min(Math.max(newWidth, 25), 75));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Run code
  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    setTestResults(null);
    setShowOutputPanel(true);

    // Simulate running code
    await new Promise(resolve => setTimeout(resolve, 1500));

    // If custom input is provided, run with custom input
    if (showCustomInput && customInput.trim()) {
      // Simulate running with custom input
      setOutput(`Running with custom input:\n${customInput}\n\nOutput: [Simulated output for custom input]`);
    } else {
      // Mock test results
      const results = problemDetails.testCases.filter(tc => !tc.hidden).map(tc => ({
        passed: Math.random() > 0.3,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: Math.random() > 0.3 ? tc.expectedOutput : 'Wrong output',
      }));
      setTestResults(results);
    }

    setIsRunning(false);
  };

  // Submit code
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setOutput(null);
    setTestResults(null);
    setShowOutputPanel(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const allPassed = Math.random() > 0.5;
    if (allPassed) {
      setOutput('✅ Accepted! All test cases passed.\n\nRuntime: 45 ms (beats 78.5% of submissions)\nMemory: 42.1 MB (beats 65.3% of submissions)');
      setScore(400);
    } else {
      const failedTestCase = Math.floor(Math.random() * 3) + 1;
      setOutput(`❌ Wrong Answer\n\nTest case ${failedTestCase} failed.\nInput: ${problemDetails.testCases[0]?.input || '[1,2,3]'}\nExpected: ${problemDetails.testCases[0]?.expectedOutput || '6'}\nGot: Different output`);
      setScore(Math.floor(Math.random() * 300));
    }

    setIsSubmitting(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        {/* Left: Tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: 'description', label: 'Description' },
            { id: 'discussion', label: 'Discussion' },
            { id: 'submissions', label: 'Submissions' },
            { id: 'hints', label: 'Hints' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProblemTab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
            <span className="font-medium">Score: {score} / 400</span>
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
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        selectedLanguage === lang.id ? 'text-teal-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div style={{ width: `${leftPanelWidth}%` }} className="flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
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
                  <button className="flex items-center gap-1 text-gray-500 hover:text-green-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-sm">{question.likes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-red-600">
                    <svg className="w-5 h-5 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Asked In:</span>
                  <div className="flex items-center gap-1">
                    {question.askedIn.map(companyId => (
                      <CompanyLogo key={companyId} companyId={companyId} size="md" />
                    ))}
                  </div>
                </div>

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
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hints</h2>
                {problemDetails.hints.map((hint, i) => (
                  <div key={i} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
                      <p className="text-gray-700 dark:text-gray-300">{hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">Discussion forum coming soon</p>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
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
        <div style={{ width: `${100 - leftPanelWidth}%` }} className="flex flex-col bg-[#1e1e1e] overflow-hidden">
          {/* Editor */}
          <div className={`${showOutputPanel || showCustomInput ? 'flex-1' : 'flex-1'}`} style={{ height: showOutputPanel || showCustomInput ? '60%' : '100%' }}>
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
              }}
            />
          </div>

          {/* Custom Input Panel */}
          {showCustomInput && (
            <div className="border-t border-gray-700 bg-gray-900">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-300">Custom Input</span>
                </div>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter your custom input here..."
                className="w-full h-24 px-4 py-3 bg-gray-800 text-gray-200 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-gray-500"
              />
            </div>
          )}

          {/* Output/Test Results Panel */}
          {showOutputPanel && (
            <div className="h-48 border-t border-gray-700 bg-gray-900 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center gap-4">
                  <button className="text-sm font-medium text-teal-400 border-b-2 border-teal-400 pb-1">
                    {isRunning ? 'Running...' : isSubmitting ? 'Submitting...' : output?.includes('✅') ? 'Accepted' : testResults ? 'Test Results' : 'Output'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowOutputPanel(false);
                    setOutput(null);
                    setTestResults(null);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {(isRunning || isSubmitting) && (
                  <div className="flex items-center gap-3 text-gray-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm">{isRunning ? 'Running your code...' : 'Submitting your solution...'}</span>
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
                              <span className="text-gray-500 w-16">Output:</span>
                              <span className="text-red-400">{result.actual}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-14 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        {/* Left: All Problems */}
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium">All Problems</span>
        </button>

        {/* Center: Navigation */}
        <div className="flex items-center gap-3">
          <button onClick={onPrevious} disabled={questionIndex === 0} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{questionIndex + 1}/{totalQuestions}</span>
          <button onClick={onNext} disabled={questionIndex === totalQuestions - 1} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showCustomInput 
                ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">Custom Input</span>
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50"
          >
            {isRunning ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm font-medium">Run</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
            <span className="text-sm font-medium">Submit</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CodingInterviewQuestionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks' | 'attempted' | 'solved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recently-added');
  const [questions, setQuestions] = useState<CodingQuestion[]>(codingQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<CodingQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

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
  const toggleBookmark = useCallback((questionId: string) => {
    setQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, isBookmarked: !q.isBookmarked } : q
    ));
    // Also update selectedQuestion if it's the current one
    if (selectedQuestion?.id === questionId) {
      setSelectedQuestion(prev => prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null);
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
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/dashboard');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coding Interview Questions</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress & Banner Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Progress Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-6">
            <div className="relative">
              <ProgressRing progress={(userProgress.solved / userProgress.total) * 100} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round((userProgress.solved / userProgress.total) * 100)}%
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Your Progress</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex gap-6">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Solved</span>
                  <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">{userProgress.solved}/{userProgress.total}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Attempted</span>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{userProgress.attempted}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Accuracy</span>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">{userProgress.accuracy.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Career Banner */}
          <div className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg tracking-wider">PROJECT</span>
                <span className="text-teal-400 font-bold text-lg tracking-wider">BAZAAR</span>
              </div>
              <span className="text-gray-300 text-lg ml-4">Get Free personalized Career Roadmap from Project Bazaar</span>
            </div>
            <button className="relative z-10 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-colors shadow-lg">
              Show My Career Plan
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              {[
                { id: 'all', label: 'All Questions', icon: '≡' },
                { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
                { id: 'attempted', label: 'Attempted', icon: '□' },
                { id: 'solved', label: 'Solved', icon: '☑' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'text-teal-600 dark:text-teal-400 border-teal-500'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for problems or keywords"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-3">
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
          <div className="overflow-x-auto">
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
                {filteredQuestions.map((question) => (
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
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Asked in</span>
                        <div className="flex items-center -space-x-1 ml-2">
                          {question.askedIn.slice(0, 3).map((companyId) => (
                            <CompanyLogo key={companyId} companyId={companyId} />
                          ))}
                        </div>
                        {question.askedIn.length > 3 && (
                          <span className="ml-2 text-sm font-medium text-teal-600 dark:text-teal-400">
                            +{question.askedIn.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredQuestions.length === 0 && (
              <div className="py-16 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No questions found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium">{filteredQuestions.length}</span> of <span className="font-medium">{questions.length}</span> questions
            </p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Previous
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600">
                1
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                2
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                3
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CodingInterviewQuestionsPage;
