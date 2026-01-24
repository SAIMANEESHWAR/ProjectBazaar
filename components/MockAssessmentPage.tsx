import React, { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';

// Confetti celebration functions (dynamically imported)
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

// Supported programming languages
const supportedLanguages = [
  { id: 'python', name: 'Python 3', pistonId: 'python', version: '3.10.0', monacoId: 'python' },
  { id: 'javascript', name: 'JavaScript', pistonId: 'javascript', version: '18.15.0', monacoId: 'javascript' },
  { id: 'java', name: 'Java', pistonId: 'java', version: '15.0.2', monacoId: 'java' },
  { id: 'cpp', name: 'C++', pistonId: 'cpp', version: '10.2.0', monacoId: 'cpp' },
  { id: 'c', name: 'C', pistonId: 'c', version: '10.2.0', monacoId: 'c' },
  { id: 'typescript', name: 'TypeScript', pistonId: 'typescript', version: '5.0.3', monacoId: 'typescript' },
  { id: 'go', name: 'Go', pistonId: 'go', version: '1.16.2', monacoId: 'go' },
  { id: 'rust', name: 'Rust', pistonId: 'rust', version: '1.68.2', monacoId: 'rust' },
  { id: 'ruby', name: 'Ruby', pistonId: 'ruby', version: '3.0.1', monacoId: 'ruby' },
  { id: 'php', name: 'PHP', pistonId: 'php', version: '8.2.3', monacoId: 'php' },
  { id: 'kotlin', name: 'Kotlin', pistonId: 'kotlin', version: '1.8.20', monacoId: 'kotlin' },
  { id: 'swift', name: 'Swift', pistonId: 'swift', version: '5.3.3', monacoId: 'swift' },
  { id: 'csharp', name: 'C#', pistonId: 'csharp', version: '6.12.0', monacoId: 'csharp' },
  { id: 'scala', name: 'Scala', pistonId: 'scala', version: '3.2.2', monacoId: 'scala' },
  { id: 'r', name: 'R', pistonId: 'r', version: '4.1.1', monacoId: 'r' },
  { id: 'perl', name: 'Perl', pistonId: 'perl', version: '5.36.0', monacoId: 'perl' },
  { id: 'lua', name: 'Lua', pistonId: 'lua', version: '5.4.4', monacoId: 'lua' },
  { id: 'bash', name: 'Bash', pistonId: 'bash', version: '5.2.0', monacoId: 'shell' },
  { id: 'dart', name: 'Dart', pistonId: 'dart', version: '2.19.6', monacoId: 'dart' },
  { id: 'elixir', name: 'Elixir', pistonId: 'elixir', version: '1.14.3', monacoId: 'elixir' },
  { id: 'haskell', name: 'Haskell', pistonId: 'haskell', version: '9.0.1', monacoId: 'haskell' },
  { id: 'clojure', name: 'Clojure', pistonId: 'clojure', version: '1.10.3', monacoId: 'clojure' },
  { id: 'fsharp', name: 'F#', pistonId: 'fsharp', version: '5.0.201', monacoId: 'fsharp' },
  { id: 'julia', name: 'Julia', pistonId: 'julia', version: '1.8.5', monacoId: 'julia' },
  { id: 'ocaml', name: 'OCaml', pistonId: 'ocaml', version: '4.12.0', monacoId: 'ocaml' },
  { id: 'racket', name: 'Racket', pistonId: 'racket', version: '8.3', monacoId: 'scheme' },
  { id: 'erlang', name: 'Erlang', pistonId: 'erlang', version: '23.0', monacoId: 'erlang' },
  { id: 'cobol', name: 'COBOL', pistonId: 'cobol', version: '3.1.2', monacoId: 'cobol' },
  { id: 'fortran', name: 'Fortran', pistonId: 'fortran', version: '10.2.0', monacoId: 'fortran' },
  { id: 'pascal', name: 'Pascal', pistonId: 'pascal', version: '3.2.2', monacoId: 'pascal' },
  { id: 'groovy', name: 'Groovy', pistonId: 'groovy', version: '3.0.7', monacoId: 'groovy' },
];

// Code execution using Piston API (free, no API key required)
const executeCode = async (code: string, language: string, input: string = ''): Promise<{ output: string; error: string; success: boolean }> => {
  const lang = supportedLanguages.find(l => l.id === language);
  if (!lang) {
    return { output: '', error: 'Unsupported language', success: false };
  }

  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: lang.pistonId,
        version: lang.version,
        files: [{ content: code }],
        stdin: input,
      }),
    });

    const data = await response.json();
    
    if (data.run) {
      const output = data.run.stdout || '';
      const error = data.run.stderr || '';
      return {
        output: output.trim(),
        error: error.trim(),
        success: !error && data.run.code === 0,
      };
    }
    
    return { output: '', error: data.message || 'Execution failed', success: false };
  } catch (err) {
    return { output: '', error: 'Network error - please try again', success: false };
  }
};

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
  questionResults: {
    questionId: number;
    topic: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
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

interface StudyResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'flashcard' | 'practice';
  topic: string;
  duration: string;
  url?: string;
}

// ============================================
// MOCK DATA - Assessments
// ============================================

const assessments: Assessment[] = [
  { id: 'sde', title: 'SDE', logo: '/mock_assessments_logo/sde_interview.png', time: '5 Minutes', objective: 5, programming: 2, registrations: 68675, category: 'technical' },
  { id: 'react', title: 'React', logo: '/mock_assessments_logo/react.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 2262, category: 'framework' },
  { id: 'java', title: 'Java', logo: '/mock_assessments_logo/java.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 6626, category: 'language' },
  { id: 'sql', title: 'SQL', logo: '/mock_assessments_logo/sql.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 15902, category: 'database' },
  { id: 'javascript', title: 'JavaScript', logo: '/mock_assessments_logo/nodejs.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 4594, category: 'language' },
  { id: 'cpp', title: 'C++', logo: '/mock_assessments_logo/cpp.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 2416, category: 'language' },
  { id: 'html', title: 'HTML', logo: '/mock_assessments_logo/html.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 4343, category: 'language' },
  { id: 'oops', title: 'OOPs', logo: '/mock_assessments_logo/oops.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 3346, category: 'technical' },
  { id: 'datastructures', title: 'Data Structures', logo: '/mock_assessments_logo/data_structures.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 11608, category: 'technical' },
  { id: 'css', title: 'CSS', logo: '/mock_assessments_logo/css.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 1467, category: 'language' },
  { id: 'android', title: 'Android', logo: '/mock_assessments_logo/android.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 1890, category: 'framework' },
  { id: 'dsml', title: 'DSML', logo: '/mock_assessments_logo/dsml_interview.png', time: '30 Minutes', objective: 10, programming: 0, registrations: 2100, category: 'technical', popular: true },
  { id: 'python', title: 'Python', logo: '/mock_assessments_logo/python.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 8500, category: 'language' },
  { id: 'aws', title: 'AWS', logo: '/mock_assessments_logo/aws.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 3200, category: 'devops' },
  { id: 'dbms', title: 'DBMS', logo: '/mock_assessments_logo/dbms.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 4100, category: 'database' },
  { id: 'machinelearning', title: 'Machine Learning', logo: '/mock_assessments_logo/machine_learning.png', time: '45 Minutes', objective: 15, programming: 0, registrations: 5600, category: 'technical' },
  { id: 'spring', title: 'Spring Boot', logo: '/mock_assessments_logo/spring.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 2800, category: 'framework' },
  { id: 'networking', title: 'Networking', logo: '/mock_assessments_logo/networking.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 1950, category: 'technical' },
  { id: 'cloudcomputing', title: 'Cloud Computing', logo: '/mock_assessments_logo/cloud_computing.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 3400, category: 'devops' },
  { id: 'datascience', title: 'Data Science', logo: '/mock_assessments_logo/data_science.png', time: '45 Minutes', objective: 15, programming: 0, registrations: 4800, category: 'technical' },
  { id: 'softwaretesting', title: 'Software Testing', logo: '/mock_assessments_logo/software_testing.png', time: '30 Minutes', objective: 15, programming: 0, registrations: 2200, category: 'technical' },
];

// Company-specific assessments
const companyAssessments: Assessment[] = [
  { id: 'google', title: 'Google Interview Prep', logo: '/company_logos/google.png', time: '45 Minutes', objective: 20, programming: 5, registrations: 25000, category: 'company', company: 'Google', xpReward: 200 },
  { id: 'amazon', title: 'Amazon SDE Assessment', logo: '/company_logos/amazon.png', time: '60 Minutes', objective: 25, programming: 5, registrations: 32000, category: 'company', company: 'Amazon', xpReward: 250 },
  { id: 'microsoft', title: 'Microsoft Coding Round', logo: '/company_logos/microsoft.png', time: '45 Minutes', objective: 20, programming: 3, registrations: 28000, category: 'company', company: 'Microsoft', xpReward: 200 },
  { id: 'meta', title: 'Meta Interview Prep', logo: '/company_logos/meta.png', time: '50 Minutes', objective: 18, programming: 4, registrations: 18000, category: 'company', company: 'Meta', xpReward: 220 },
  { id: 'flipkart', title: 'Flipkart SDE Test', logo: '/company_logos/flipkart.png', time: '40 Minutes', objective: 15, programming: 3, registrations: 15000, category: 'company', company: 'Flipkart', xpReward: 180 },
  { id: 'infosys', title: 'Infosys Assessment', logo: '/company_logos/infosys.png', time: '35 Minutes', objective: 20, programming: 2, registrations: 45000, category: 'company', company: 'Infosys', xpReward: 150 },
  { id: 'accenture', title: 'Accenture Assessment', logo: '/company_logos/accenture.jpg', time: '40 Minutes', objective: 25, programming: 2, registrations: 55000, category: 'company', company: 'Accenture', xpReward: 150 },
  { id: 'deloitte', title: 'Deloitte Test', logo: '/company_logos/deloitte.png', time: '35 Minutes', objective: 20, programming: 2, registrations: 38000, category: 'company', company: 'Deloitte', xpReward: 140 },
  { id: 'oracle', title: 'Oracle Technical Round', logo: '/company_logos/oracle.png', time: '45 Minutes', objective: 20, programming: 3, registrations: 22000, category: 'company', company: 'Oracle', xpReward: 180 },
  { id: 'ibm', title: 'IBM Cognitive Assessment', logo: '/company_logos/ibm.png', time: '40 Minutes', objective: 22, programming: 2, registrations: 35000, category: 'company', company: 'IBM', xpReward: 160 },
  { id: 'cisco', title: 'Cisco Technical Test', logo: '/company_logos/cisco.jpg', time: '45 Minutes', objective: 18, programming: 4, registrations: 18000, category: 'company', company: 'Cisco', xpReward: 180 },
  { id: 'salesforce', title: 'Salesforce Developer', logo: '/company_logos/salesforce.png', time: '50 Minutes', objective: 20, programming: 3, registrations: 15000, category: 'company', company: 'Salesforce', xpReward: 200 },
];

// Badges data
const allBadges: Badge[] = [
  { id: 'first-test', name: 'First Steps', description: 'Complete your first assessment', icon: '🎯', image: '/badge_logo/target.png', earned: true, earnedDate: '2026-01-10', requirement: 'Complete 1 test', xpReward: 50 },
  { id: 'streak-7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', image: '/badge_logo/fire.png', earned: true, earnedDate: '2026-01-15', requirement: '7 day streak', xpReward: 100 },
  { id: 'perfect-score', name: 'Perfectionist', description: 'Score 100% on any test', icon: '💯', image: '/badge_logo/first_place.png', earned: false, requirement: '100% score', xpReward: 200 },
  { id: 'java-master', name: 'Java Master', description: 'Complete all Java assessments with 80%+', icon: '☕', image: '/badge_logo/java.png', earned: true, earnedDate: '2026-01-12', requirement: 'Master Java', xpReward: 150 },
  { id: 'speed-demon', name: 'Speed Demon', description: 'Complete a test in under 5 minutes', icon: '⚡', image: '/badge_logo/lightning.png', earned: false, requirement: 'Finish < 5 mins', xpReward: 75 },
  { id: 'streak-30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆', image: '/badge_logo/trophy.png', earned: false, requirement: '30 day streak', xpReward: 300 },
  { id: 'ten-tests', name: 'Dedicated Learner', description: 'Complete 10 assessments', icon: '📚', image: '/badge_logo/books.png', earned: true, earnedDate: '2026-01-14', requirement: 'Complete 10 tests', xpReward: 100 },
  { id: 'all-topics', name: 'Well Rounded', description: 'Complete tests in 5 different categories', icon: '🌟', image: '/badge_logo/star.png', earned: false, requirement: '5 categories', xpReward: 150 },
  { id: 'night-owl', name: 'Night Owl', description: 'Complete a test after midnight', icon: '🦉', image: '/badge_logo/owl.png', earned: false, requirement: 'Test after 12 AM', xpReward: 50 },
  { id: 'early-bird', name: 'Early Bird', description: 'Complete a test before 6 AM', icon: '🐦', image: '/badge_logo/bird.png', earned: false, requirement: 'Test before 6 AM', xpReward: 50 },
  { id: 'company-ready', name: 'Company Ready', description: 'Complete 3 company-specific assessments', icon: '💼', image: '/badge_logo/briefcase.png', earned: false, requirement: '3 company tests', xpReward: 200 },
  { id: 'daily-champ', name: 'Daily Champion', description: 'Complete 10 daily challenges', icon: '📅', image: '/badge_logo/calendar.png', earned: false, requirement: '10 daily challenges', xpReward: 150 },
];

// Leaderboard data
const leaderboardData: LeaderboardEntry[] = [
  { rank: 1, name: 'Rahul Sharma', avatar: '👨‍💻', xp: 12500, testsCompleted: 85, avgScore: 92, badges: 10 },
  { rank: 2, name: 'Priya Patel', avatar: '👩‍💻', xp: 11200, testsCompleted: 78, avgScore: 89, badges: 9 },
  { rank: 3, name: 'Amit Kumar', avatar: '🧑‍💻', xp: 10800, testsCompleted: 72, avgScore: 88, badges: 8 },
  { rank: 4, name: 'Sneha Gupta', avatar: '👩‍🎓', xp: 9500, testsCompleted: 65, avgScore: 86, badges: 7 },
  { rank: 5, name: 'Vikram Singh', avatar: '👨‍🎓', xp: 8900, testsCompleted: 60, avgScore: 85, badges: 7 },
  { rank: 6, name: 'Ananya Reddy', avatar: '👩‍💼', xp: 8200, testsCompleted: 55, avgScore: 84, badges: 6 },
  { rank: 7, name: 'Karthik Nair', avatar: '👨‍💼', xp: 7800, testsCompleted: 52, avgScore: 83, badges: 6 },
  { rank: 8, name: 'Divya Menon', avatar: '👩‍🔬', xp: 7200, testsCompleted: 48, avgScore: 82, badges: 5 },
  { rank: 9, name: 'Arjun Verma', avatar: '👨‍🔬', xp: 6800, testsCompleted: 45, avgScore: 81, badges: 5 },
  { rank: 10, name: 'Meera Joshi', avatar: '👩‍🏫', xp: 6500, testsCompleted: 42, avgScore: 80, badges: 4 },
];

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

// Study resources
const studyResources: StudyResource[] = [
  { id: '1', title: 'Understanding Java Collections', type: 'video', topic: 'Java', duration: '15 min' },
  { id: '2', title: 'React Hooks Deep Dive', type: 'article', topic: 'React', duration: '10 min' },
  { id: '3', title: 'SQL Joins Flashcards', type: 'flashcard', topic: 'SQL', duration: '5 min' },
  { id: '4', title: 'Python Basics Practice', type: 'practice', topic: 'Python', duration: '20 min' },
  { id: '5', title: 'Data Structures Overview', type: 'video', topic: 'DSA', duration: '25 min' },
  { id: '6', title: 'System Design Fundamentals', type: 'article', topic: 'System Design', duration: '15 min' },
];

// ============================================
// QUESTION BANKS
// ============================================

const questionBanks: Record<string, Question[]> = {
  java: [
    { id: 1, question: 'Which statement is true about Java?', options: ['Platform independent programming language', 'Sequence dependent programming language', 'Code dependent programming language', 'Platform dependent programming language'], correctAnswer: 0, topic: 'Java Basics', explanation: 'Java is platform independent because Java code is compiled to bytecode which runs on the JVM (Java Virtual Machine). The JVM is available for different platforms, making Java "Write Once, Run Anywhere".', difficulty: 'easy' },
    { id: 2, question: 'What is the component used for compiling, debugging, and executing Java programs?', options: ['JRE', 'JVM', 'JDK', 'JIT'], correctAnswer: 2, topic: 'Java Architecture', explanation: 'JDK (Java Development Kit) contains JRE + development tools like compiler (javac), debugger, etc. JRE is for running Java programs, JVM is the virtual machine, and JIT is the Just-In-Time compiler.', difficulty: 'easy' },
    { id: 3, question: 'Which of the following is not a Java feature?', options: ['Object-oriented', 'Use of pointers', 'Portable', 'Dynamic and Extensible'], correctAnswer: 1, topic: 'Java Features', explanation: 'Java does not support pointers explicitly for security reasons. Pointers can be used to access memory directly which can lead to security vulnerabilities. Java uses references instead.', difficulty: 'easy' },
    { id: 4, question: 'What is the default value of a boolean variable in Java?', options: ['true', 'false', '0', 'null'], correctAnswer: 1, topic: 'Data Types', explanation: 'In Java, boolean instance variables are initialized to false by default. Local variables must be explicitly initialized before use.', difficulty: 'easy' },
    { id: 5, question: 'Which keyword is used to prevent method overriding in Java?', options: ['static', 'final', 'abstract', 'const'], correctAnswer: 1, topic: 'OOP Concepts', explanation: 'The "final" keyword prevents method overriding. When a method is declared final, it cannot be overridden by subclasses. "const" is not a keyword in Java.', difficulty: 'medium' },
    { id: 6, question: 'What is the parent class of all classes in Java?', options: ['Object', 'Class', 'Main', 'Parent'], correctAnswer: 0, topic: 'Inheritance', explanation: 'java.lang.Object is the root of the class hierarchy. Every class has Object as a superclass. All objects inherit methods like toString(), equals(), hashCode() from Object.', difficulty: 'easy' },
    { id: 7, question: 'Which collection class allows you to grow or shrink its size and provides indexed access?', options: ['HashSet', 'HashMap', 'ArrayList', 'LinkedList'], correctAnswer: 2, topic: 'Collections', explanation: 'ArrayList is a resizable array implementation of the List interface. It provides O(1) indexed access and dynamic resizing. LinkedList also allows dynamic sizing but has O(n) indexed access.', difficulty: 'medium' },
    { id: 8, question: 'What is the purpose of the "this" keyword in Java?', options: ['To refer to the parent class', 'To refer to the current object', 'To create a new object', 'To refer to a static method'], correctAnswer: 1, topic: 'Keywords', explanation: '"this" is a reference variable that refers to the current object. It is used to differentiate between instance variables and parameters when they have the same name.', difficulty: 'easy' },
    { id: 9, question: 'Which exception is thrown when dividing by zero in Java?', options: ['NullPointerException', 'ArithmeticException', 'NumberFormatException', 'ClassNotFoundException'], correctAnswer: 1, topic: 'Exception Handling', explanation: 'ArithmeticException is thrown when an exceptional arithmetic condition occurs, such as dividing an integer by zero. Note: Dividing a float/double by zero gives Infinity, not an exception.', difficulty: 'easy' },
    { id: 10, question: 'What is method overloading?', options: ['Methods with same name in parent and child class', 'Methods with same name but different parameters', 'Methods with different names', 'None of the above'], correctAnswer: 1, topic: 'Polymorphism', explanation: 'Method overloading is compile-time polymorphism where multiple methods have the same name but different parameters (number, type, or order). It is different from overriding which involves inheritance.', difficulty: 'medium' },
    { id: 11, question: 'Which access modifier makes a member accessible only within the same class?', options: ['public', 'protected', 'private', 'default'], correctAnswer: 2, topic: 'Access Modifiers', explanation: 'private access modifier restricts access to the declaring class only. public allows access from anywhere, protected allows same package + subclasses, default (no modifier) allows same package only.', difficulty: 'easy' },
    { id: 12, question: 'What is the output of 10 + 20 + "Hello" in Java?', options: ['1020Hello', '30Hello', 'Hello1020', 'Compilation Error'], correctAnswer: 1, topic: 'String Operations', explanation: 'Java evaluates left to right. 10 + 20 = 30 (integer addition), then 30 + "Hello" = "30Hello" (string concatenation). If it was "Hello" + 10 + 20, result would be "Hello1020".', difficulty: 'medium' },
    { id: 13, question: 'Which interface must be implemented for serialization in Java?', options: ['Runnable', 'Comparable', 'Serializable', 'Cloneable'], correctAnswer: 2, topic: 'Serialization', explanation: 'Serializable is a marker interface (no methods) that indicates a class can be serialized. Serialization is the process of converting an object to a byte stream for storage or transmission.', difficulty: 'medium' },
    { id: 14, question: 'What is the default value of an int variable in Java?', options: ['0', '1', 'null', 'undefined'], correctAnswer: 0, topic: 'Data Types', explanation: 'All numeric primitive types (byte, short, int, long, float, double) have a default value of 0 (or 0.0 for floating-point). Only object references have null as default.', difficulty: 'easy' },
    { id: 15, question: 'Which keyword is used to create a thread in Java?', options: ['thread', 'runnable', 'extends Thread', 'All of the above'], correctAnswer: 3, topic: 'Multithreading', explanation: 'Threads can be created by extending the Thread class or implementing Runnable interface. Both approaches are valid. The class can then be instantiated and started with start() method.', difficulty: 'hard' },
  ],
  python: [
    { id: 1, question: 'What is Python?', options: ['A compiled language', 'An interpreted high-level language', 'A low-level language', 'A markup language'], correctAnswer: 1, topic: 'Python Basics' },
    { id: 2, question: 'Which of the following is used to define a block of code in Python?', options: ['Curly braces', 'Parentheses', 'Indentation', 'Quotation marks'], correctAnswer: 2, topic: 'Syntax' },
    { id: 3, question: 'What is the output of print(2 ** 3)?', options: ['5', '6', '8', '9'], correctAnswer: 2, topic: 'Operators' },
    { id: 4, question: 'Which data type is immutable in Python?', options: ['List', 'Dictionary', 'Set', 'Tuple'], correctAnswer: 3, topic: 'Data Types' },
    { id: 5, question: 'What keyword is used to create a function in Python?', options: ['function', 'def', 'func', 'define'], correctAnswer: 1, topic: 'Functions' },
    { id: 6, question: 'Which method is used to add an element to the end of a list?', options: ['add()', 'insert()', 'append()', 'extend()'], correctAnswer: 2, topic: 'Lists' },
    { id: 7, question: 'What is the correct way to create a dictionary in Python?', options: ['dict = []', 'dict = {}', 'dict = ()', 'dict = <>'], correctAnswer: 1, topic: 'Dictionaries' },
    { id: 8, question: 'Which of the following is NOT a valid variable name in Python?', options: ['_myvar', 'myVar', '2myvar', 'my_var'], correctAnswer: 2, topic: 'Variables' },
    { id: 9, question: 'What does the len() function do?', options: ['Returns the length of an object', 'Returns the type of an object', 'Converts to integer', 'None of the above'], correctAnswer: 0, topic: 'Built-in Functions' },
    { id: 10, question: 'Which statement is used for exception handling in Python?', options: ['try-catch', 'try-except', 'catch-throw', 'error-handle'], correctAnswer: 1, topic: 'Exception Handling' },
    { id: 11, question: 'What is the output of bool("")?', options: ['True', 'False', 'None', 'Error'], correctAnswer: 1, topic: 'Boolean' },
    { id: 12, question: 'Which operator is used for floor division in Python?', options: ['/', '//', '%', '**'], correctAnswer: 1, topic: 'Operators' },
    { id: 13, question: 'What is a lambda function?', options: ['A named function', 'An anonymous function', 'A recursive function', 'A generator function'], correctAnswer: 1, topic: 'Functions' },
    { id: 14, question: 'Which module is used for regular expressions in Python?', options: ['regex', 're', 'regexp', 'regular'], correctAnswer: 1, topic: 'Modules' },
    { id: 15, question: 'What is the purpose of __init__ method?', options: ['Destructor', 'Constructor', 'Iterator', 'Generator'], correctAnswer: 1, topic: 'OOP' },
  ],
  react: [
    { id: 1, question: 'What is React?', options: ['A backend framework', 'A JavaScript library for building UIs', 'A database', 'A programming language'], correctAnswer: 1, topic: 'React Basics' },
    { id: 2, question: 'What is JSX?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'], correctAnswer: 0, topic: 'JSX' },
    { id: 3, question: 'Which hook is used for state management in functional components?', options: ['useEffect', 'useState', 'useContext', 'useReducer'], correctAnswer: 1, topic: 'Hooks' },
    { id: 4, question: 'What is the virtual DOM?', options: ['A copy of the real DOM', 'A lightweight representation of the real DOM', 'A browser feature', 'A React component'], correctAnswer: 1, topic: 'Virtual DOM' },
    { id: 5, question: 'Which method is called when a component is first mounted?', options: ['componentDidUpdate', 'componentWillMount', 'componentDidMount', 'render'], correctAnswer: 2, topic: 'Lifecycle' },
    { id: 6, question: 'What is the purpose of keys in React lists?', options: ['Styling', 'Unique identification of elements', 'Event handling', 'State management'], correctAnswer: 1, topic: 'Lists' },
    { id: 7, question: 'Which hook is used for side effects?', options: ['useState', 'useEffect', 'useMemo', 'useCallback'], correctAnswer: 1, topic: 'Hooks' },
    { id: 8, question: 'What is props in React?', options: ['State variables', 'Read-only properties passed to components', 'Event handlers', 'CSS styles'], correctAnswer: 1, topic: 'Props' },
    { id: 9, question: 'What is the correct way to update state in React?', options: ['this.state.name = "new"', 'this.setState({ name: "new" })', 'state.name = "new"', 'setState.name("new")'], correctAnswer: 1, topic: 'State' },
    { id: 10, question: 'What is a controlled component?', options: ['Component controlled by Redux', 'Component where form data is handled by state', 'Component with props', 'Component without state'], correctAnswer: 1, topic: 'Forms' },
    { id: 11, question: 'Which hook is used to access context?', options: ['useReducer', 'useContext', 'useMemo', 'useRef'], correctAnswer: 1, topic: 'Context' },
    { id: 12, question: 'What is React Fragment used for?', options: ['Styling components', 'Grouping children without extra DOM nodes', 'State management', 'Routing'], correctAnswer: 1, topic: 'Fragments' },
    { id: 13, question: 'What is the purpose of useRef hook?', options: ['State management', 'Accessing DOM elements directly', 'Context API', 'Memoization'], correctAnswer: 1, topic: 'Refs' },
    { id: 14, question: 'Which tool is commonly used for React routing?', options: ['React Router', 'Redux', 'Axios', 'Webpack'], correctAnswer: 0, topic: 'Routing' },
    { id: 15, question: 'What is HOC in React?', options: ['High Order Component', 'Higher Order Component', 'Hierarchical Order Component', 'None'], correctAnswer: 1, topic: 'Patterns' },
  ],
  sql: [
    { id: 1, question: 'What does SQL stand for?', options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Language', 'System Query Language'], correctAnswer: 0, topic: 'SQL Basics' },
    { id: 2, question: 'Which SQL statement is used to retrieve data?', options: ['GET', 'FETCH', 'SELECT', 'RETRIEVE'], correctAnswer: 2, topic: 'Queries' },
    { id: 3, question: 'Which clause is used to filter records?', options: ['FILTER', 'WHERE', 'HAVING', 'CONDITION'], correctAnswer: 1, topic: 'Filtering' },
    { id: 4, question: 'What is a primary key?', options: ['A foreign key', 'A unique identifier for a record', 'A composite key', 'An index'], correctAnswer: 1, topic: 'Keys' },
    { id: 5, question: 'Which JOIN returns all records from both tables?', options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'], correctAnswer: 3, topic: 'Joins' },
    { id: 6, question: 'Which SQL statement is used to insert data?', options: ['ADD', 'INSERT INTO', 'PUT', 'CREATE'], correctAnswer: 1, topic: 'DML' },
    { id: 7, question: 'What does GROUP BY do?', options: ['Sorts data', 'Groups rows with same values', 'Filters data', 'Joins tables'], correctAnswer: 1, topic: 'Aggregation' },
    { id: 8, question: 'Which function returns the number of rows?', options: ['SUM()', 'COUNT()', 'TOTAL()', 'NUM()'], correctAnswer: 1, topic: 'Functions' },
    { id: 9, question: 'What is a foreign key?', options: ['Primary key of another table', 'Unique identifier', 'Index column', 'Auto increment field'], correctAnswer: 0, topic: 'Keys' },
    { id: 10, question: 'Which command is used to delete a table?', options: ['DELETE TABLE', 'DROP TABLE', 'REMOVE TABLE', 'TRUNCATE TABLE'], correctAnswer: 1, topic: 'DDL' },
    { id: 11, question: 'What is normalization?', options: ['Adding redundancy', 'Reducing redundancy', 'Indexing', 'Partitioning'], correctAnswer: 1, topic: 'Database Design' },
    { id: 12, question: 'Which clause is used with aggregate functions for filtering?', options: ['WHERE', 'HAVING', 'FILTER', 'GROUP'], correctAnswer: 1, topic: 'Aggregation' },
    { id: 13, question: 'What is an index used for?', options: ['Storing data', 'Faster data retrieval', 'Data validation', 'Data encryption'], correctAnswer: 1, topic: 'Indexing' },
    { id: 14, question: 'Which SQL keyword is used to sort results?', options: ['SORT BY', 'ORDER BY', 'ARRANGE BY', 'GROUP BY'], correctAnswer: 1, topic: 'Sorting' },
    { id: 15, question: 'What is a transaction in SQL?', options: ['A query', 'A unit of work', 'A table', 'A database'], correctAnswer: 1, topic: 'Transactions' },
  ],
};

// Default questions for assessments without specific banks
const defaultQuestions: Question[] = [
  { id: 1, question: 'Which of the following is a correct concept?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 0, topic: 'General' },
  { id: 2, question: 'What is the primary purpose of this technology?', options: ['Performance', 'Security', 'Scalability', 'All of the above'], correctAnswer: 3, topic: 'Concepts' },
  { id: 3, question: 'Which best practice should be followed?', options: ['Practice A', 'Practice B', 'Practice C', 'Practice D'], correctAnswer: 1, topic: 'Best Practices' },
  { id: 4, question: 'What is the recommended approach?', options: ['Approach 1', 'Approach 2', 'Approach 3', 'Approach 4'], correctAnswer: 2, topic: 'Methodology' },
  { id: 5, question: 'Which tool is commonly used?', options: ['Tool A', 'Tool B', 'Tool C', 'Tool D'], correctAnswer: 0, topic: 'Tools' },
  { id: 6, question: 'What is the correct syntax?', options: ['Syntax A', 'Syntax B', 'Syntax C', 'Syntax D'], correctAnswer: 1, topic: 'Syntax' },
  { id: 7, question: 'Which feature is most important?', options: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'], correctAnswer: 0, topic: 'Features' },
  { id: 8, question: 'What is the expected output?', options: ['Output A', 'Output B', 'Output C', 'Output D'], correctAnswer: 2, topic: 'Output' },
  { id: 9, question: 'Which error is commonly encountered?', options: ['Error A', 'Error B', 'Error C', 'Error D'], correctAnswer: 1, topic: 'Debugging' },
  { id: 10, question: 'What is the recommended version?', options: ['v1.0', 'v2.0', 'v3.0', 'Latest'], correctAnswer: 3, topic: 'Versioning' },
  { id: 11, question: 'Which pattern should be used?', options: ['Pattern A', 'Pattern B', 'Pattern C', 'Pattern D'], correctAnswer: 0, topic: 'Patterns' },
  { id: 12, question: 'What is the correct implementation?', options: ['Implementation 1', 'Implementation 2', 'Implementation 3', 'Implementation 4'], correctAnswer: 1, topic: 'Implementation' },
  { id: 13, question: 'Which optimization technique is best?', options: ['Technique A', 'Technique B', 'Technique C', 'Technique D'], correctAnswer: 2, topic: 'Optimization' },
  { id: 14, question: 'What is the security consideration?', options: ['Security A', 'Security B', 'Security C', 'All of the above'], correctAnswer: 3, topic: 'Security' },
  { id: 15, question: 'Which testing approach is recommended?', options: ['Unit Testing', 'Integration Testing', 'E2E Testing', 'All of the above'], correctAnswer: 3, topic: 'Testing' },
];

// ============================================
// PROGRAMMING QUESTION BANKS
// ============================================

const programmingQuestionBanks: Record<string, ProgrammingQuestion[]> = {
  sde: [
    {
      id: 101,
      question: 'Two Sum\n\nGiven an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
      topic: 'Arrays',
      type: 'programming',
      difficulty: 'easy',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
        { input: 'nums = [3,2,4], target = 6', output: '[1, 2]' },
      ],
      starterCode: {
        python: `def two_sum(nums, target):
    # Write your solution here
    pass

# Read input
nums = list(map(int, input().split(',')))
target = int(input())
result = two_sum(nums, target)
print(result)`,
        javascript: `function twoSum(nums, target) {
    // Write your solution here
}

// Read input
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const nums = lines[0].split(',').map(Number);
    const target = parseInt(lines[1]);
    console.log(JSON.stringify(twoSum(nums, target)));
});`,
        java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().split(",");
        int[] nums = new int[parts.length];
        for (int i = 0; i < parts.length; i++) {
            nums[i] = Integer.parseInt(parts[i].trim());
        }
        int target = sc.nextInt();
        int[] result = twoSum(nums, target);
        System.out.println(Arrays.toString(result));
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <sstream>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}

int main() {
    string line;
    getline(cin, line);
    vector<int> nums;
    stringstream ss(line);
    string token;
    while (getline(ss, token, ',')) {
        nums.push_back(stoi(token));
    }
    int target;
    cin >> target;
    vector<int> result = twoSum(nums, target);
    cout << "[" << result[0] << ", " << result[1] << "]" << endl;
    return 0;
}`,
      },
      testCases: [
        { input: '2,7,11,15\n9', expectedOutput: '[0, 1]' },
        { input: '3,2,4\n6', expectedOutput: '[1, 2]' },
        { input: '3,3\n6', expectedOutput: '[0, 1]', hidden: true },
      ],
    },
    {
      id: 102,
      question: 'Reverse a String\n\nWrite a function that reverses a string. The input string is given as an array of characters.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
      topic: 'Strings',
      type: 'programming',
      difficulty: 'easy',
      examples: [
        { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
        { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
      ],
      starterCode: {
        python: `def reverse_string(s):
    # Write your solution here - modify s in-place
    pass

# Read input
s = list(input().strip())
reverse_string(s)
print(s)`,
        javascript: `function reverseString(s) {
    // Write your solution here - modify s in-place
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    const s = line.split('');
    reverseString(s);
    console.log(JSON.stringify(s));
    rl.close();
});`,
        java: `import java.util.*;

public class Main {
    public static void reverseString(char[] s) {
        // Write your solution here - modify s in-place
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        char[] s = sc.nextLine().toCharArray();
        reverseString(s);
        System.out.println(Arrays.toString(s));
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

void reverseString(vector<char>& s) {
    // Write your solution here - modify s in-place
}

int main() {
    string input;
    getline(cin, input);
    vector<char> s(input.begin(), input.end());
    reverseString(s);
    cout << "[";
    for (int i = 0; i < s.size(); i++) {
        cout << "\\"" << s[i] << "\\"";
        if (i < s.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    return 0;
}`,
      },
      testCases: [
        { input: 'hello', expectedOutput: "['o', 'l', 'l', 'e', 'h']" },
        { input: 'Hannah', expectedOutput: "['h', 'a', 'n', 'n', 'a', 'H']" },
      ],
    },
  ],
  google: [
    {
      id: 201,
      question: 'Valid Parentheses\n\nGiven a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
      topic: 'Stacks',
      type: 'programming',
      difficulty: 'easy',
      examples: [
        { input: 's = "()"', output: 'true' },
        { input: 's = "()[]{}"', output: 'true' },
        { input: 's = "(]"', output: 'false' },
      ],
      starterCode: {
        python: `def is_valid(s):
    # Write your solution here
    pass

# Read input
s = input().strip()
print(str(is_valid(s)).lower())`,
        javascript: `function isValid(s) {
    // Write your solution here
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(isValid(line.trim()));
    rl.close();
});`,
        java: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        // Write your solution here
        return false;
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(isValid(s));
    }
}`,
        cpp: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool isValid(string s) {
    // Write your solution here
    return false;
}

int main() {
    string s;
    getline(cin, s);
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
      },
      testCases: [
        { input: '()', expectedOutput: 'true' },
        { input: '()[]{}', expectedOutput: 'true' },
        { input: '(]', expectedOutput: 'false' },
        { input: '([)]', expectedOutput: 'false', hidden: true },
        { input: '{[]}', expectedOutput: 'true', hidden: true },
      ],
    },
  ],
  amazon: [
    {
      id: 301,
      question: 'FizzBuzz\n\nGiven an integer n, return a string array answer (1-indexed) where:\n\n- answer[i] == "FizzBuzz" if i is divisible by 3 and 5.\n- answer[i] == "Fizz" if i is divisible by 3.\n- answer[i] == "Buzz" if i is divisible by 5.\n- answer[i] == i (as a string) if none of the above conditions are true.',
      topic: 'Math',
      type: 'programming',
      difficulty: 'easy',
      examples: [
        { input: 'n = 3', output: '["1","2","Fizz"]' },
        { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' },
        { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
      ],
      starterCode: {
        python: `def fizz_buzz(n):
    # Write your solution here
    pass

# Read input
n = int(input())
result = fizz_buzz(n)
print(result)`,
        javascript: `function fizzBuzz(n) {
    // Write your solution here
}

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
    console.log(JSON.stringify(fizzBuzz(parseInt(line))));
    rl.close();
});`,
        java: `import java.util.*;

public class Main {
    public static List<String> fizzBuzz(int n) {
        // Write your solution here
        return new ArrayList<>();
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(fizzBuzz(n));
    }
}`,
        cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

vector<string> fizzBuzz(int n) {
    // Write your solution here
    return {};
}

int main() {
    int n;
    cin >> n;
    vector<string> result = fizzBuzz(n);
    cout << "[";
    for (int i = 0; i < result.size(); i++) {
        cout << "\\"" << result[i] << "\\"";
        if (i < result.size() - 1) cout << ",";
    }
    cout << "]" << endl;
    return 0;
}`,
      },
      testCases: [
        { input: '3', expectedOutput: '["1", "2", "Fizz"]' },
        { input: '5', expectedOutput: '["1", "2", "Fizz", "4", "Buzz"]' },
        { input: '15', expectedOutput: '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]', hidden: true },
      ],
    },
  ],
};

// ============================================
// ICONS
// ============================================

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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

// ============================================
// MAIN COMPONENT
// ============================================

interface MockAssessmentPageProps {
  initialView?: AssessmentView;
  toggleSidebar?: () => void;
}

const MockAssessmentPage: React.FC<MockAssessmentPageProps> = ({ initialView = 'list', toggleSidebar }) => {
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
  const [activeTab, setActiveTab] = useState<'assessment' | 'interview' | 'history'>(initialView === 'history' ? 'history' : 'assessment');
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'grid'>('grid');
  
  // Code editor state for programming questions
  // Determine if assessment title matches a language
  const getLanguageFromAssessment = (assessmentTitle: string): string | null => {
    const titleLower = assessmentTitle.toLowerCase();
    const matchedLang = supportedLanguages.find(lang => 
      lang.id === titleLower || 
      lang.name.toLowerCase().includes(titleLower) ||
      titleLower.includes(lang.id)
    );
    return matchedLang ? matchedLang.id : null;
  };

  // Get initial language based on assessment
  const getInitialLanguage = (): string => {
    if (selectedAssessment) {
      const lang = getLanguageFromAssessment(selectedAssessment.title);
      if (lang) return lang;
    }
    return 'python';
  };

  const [selectedLanguage, setSelectedLanguage] = useState(getInitialLanguage());
  
  // Update language when assessment changes
  useEffect(() => {
    if (selectedAssessment) {
      const lang = getLanguageFromAssessment(selectedAssessment.title);
      if (lang) {
        setSelectedLanguage(lang);
      }
    }
  }, [selectedAssessment]);
  
  // Check if language is locked based on assessment
  const isLanguageLocked = selectedAssessment ? !!getLanguageFromAssessment(selectedAssessment.title) : false;
  const [codeAnswers, setCodeAnswers] = useState<Record<number, string>>({});
  const [codeTestResults, setCodeTestResults] = useState<Record<number, { passed: boolean; output: string; expected: string; error?: string }[]>>({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(35); // percentage
  const [isResizing, setIsResizing] = useState(false);
  
  // Anti-cheating & proctoring state
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarningModal, setShowTabWarningModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenExitCount, setFullScreenExitCount] = useState(0);
  const [showFullScreenWarning, setShowFullScreenWarning] = useState(false);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [showUnansweredConfirmModal, setShowUnansweredConfirmModal] = useState(false);
  
  // Custom test case input for programming questions
  const [customTestInput, setCustomTestInput] = useState('');
  const [customTestOutput, setCustomTestOutput] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result' | 'custom'>('testcase');
  
  // Code hints feature
  const [showHints, setShowHints] = useState(false);
  const [hintsUsed, setHintsUsed] = useState<Record<number, number>>({});
  
  // Question instructions visibility
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

  const [testHistory, setTestHistory] = useState<TestResult[]>([
    {
      assessmentId: 'react',
      assessmentTitle: 'React',
      score: 13,
      totalQuestions: 15,
      attempted: 15,
      solved: 13,
      duration: '24 mins',
      startTime: '2026-01-15T10:30:00',
      questionResults: []
    },
    {
      assessmentId: 'java',
      assessmentTitle: 'Java',
      score: 12,
      totalQuestions: 15,
      attempted: 15,
      solved: 12,
      duration: '28 mins',
      startTime: '2026-01-12T14:15:00',
      questionResults: []
    },
    {
      assessmentId: 'python',
      assessmentTitle: 'Python',
      score: 14,
      totalQuestions: 15,
      attempted: 15,
      solved: 14,
      duration: '22 mins',
      startTime: '2026-01-10T09:00:00',
      questionResults: []
    },
    {
      assessmentId: 'sql',
      assessmentTitle: 'SQL',
      score: 8,
      totalQuestions: 15,
      attempted: 14,
      solved: 8,
      duration: '30 mins',
      startTime: '2026-01-08T16:45:00',
      questionResults: []
    },
    {
      assessmentId: 'javascript',
      assessmentTitle: 'JavaScript',
      score: 11,
      totalQuestions: 15,
      attempted: 15,
      solved: 11,
      duration: '26 mins',
      startTime: '2026-01-05T11:20:00',
      questionResults: []
    },
  ]);

  // New feature states
  const [testMode, setTestMode] = useState<TestMode>('timed');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [antiCheatMode, setAntiCheatMode] = useState<boolean>(true);
  const [showExplanations, setShowExplanations] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 5,
    currentXP: 2350,
    nextLevelXP: 3000,
    totalXP: 2350,
    streak: 7,
    testsCompleted: 12,
    avgScore: 78,
    badges: allBadges.filter(b => b.earned),
  });
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(dailyChallengeData);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCompanyTests, setShowCompanyTests] = useState(false);

  // Get questions for current assessment
  const getQuestions = useCallback((): AnyQuestion[] => {
    if (!selectedAssessment) return defaultQuestions;
    const mcqQuestions = questionBanks[selectedAssessment.id] || defaultQuestions;
    const programmingQuestions = programmingQuestionBanks[selectedAssessment.id] || [];
    
    // Combine MCQ and programming questions
    return [...mcqQuestions, ...programmingQuestions];
  }, [selectedAssessment]);
  
  // Check if current question is a programming question
  const isProgrammingQuestion = (question: AnyQuestion): question is ProgrammingQuestion => {
    return question.type === 'programming';
  };
  
  // Get current code for a programming question
  const getCurrentCode = (questionIndex: number, question: ProgrammingQuestion) => {
    if (codeAnswers[questionIndex]) {
      return codeAnswers[questionIndex];
    }
    // If language is locked, only use that language's starter code
    if (isLanguageLocked) {
      return question.starterCode[selectedLanguage] || '';
    }
    return question.starterCode[selectedLanguage] || question.starterCode.python || '';
  };
  
  // Handle code change
  const handleCodeChange = (questionIndex: number, code: string) => {
    setCodeAnswers(prev => ({ ...prev, [questionIndex]: code }));
  };
  
  // Run code against test cases
  const runCode = async (questionIndex: number, question: ProgrammingQuestion) => {
    setIsRunningCode(true);
    setCodeOutput('Running...');
    
    const code = getCurrentCode(questionIndex, question);
    const results: { passed: boolean; output: string; expected: string; error?: string }[] = [];
    
    // Run against visible test cases only
    const visibleTestCases = question.testCases.filter(tc => !tc.hidden);
    
    for (const testCase of visibleTestCases) {
      const result = await executeCode(code, selectedLanguage, testCase.input);
      const passed = result.output.trim() === testCase.expectedOutput.trim();
      results.push({
        passed,
        output: result.output || result.error,
        expected: testCase.expectedOutput,
        error: result.error,
      });
    }
    
    setCodeTestResults(prev => ({ ...prev, [questionIndex]: results }));
    setCodeOutput(results.map((r, i) => 
      `Test ${i + 1}: ${r.passed ? '✅ Passed' : '❌ Failed'}\nOutput: ${r.output}\nExpected: ${r.expected}`
    ).join('\n\n'));
    setIsRunningCode(false);
  };
  
  // Submit code (runs against all test cases including hidden)
  const submitCode = async (questionIndex: number, question: ProgrammingQuestion) => {
    setIsRunningCode(true);
    setCodeOutput('Submitting and running all test cases...');
    
    const code = getCurrentCode(questionIndex, question);
    const results: { passed: boolean; output: string; expected: string; error?: string }[] = [];
    
    for (const testCase of question.testCases) {
      const result = await executeCode(code, selectedLanguage, testCase.input);
      const passed = result.output.trim() === testCase.expectedOutput.trim();
      results.push({
        passed,
        output: result.output || result.error,
        expected: testCase.expectedOutput,
        error: result.error,
      });
    }
    
    setCodeTestResults(prev => ({ ...prev, [questionIndex]: results }));
    
    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;
    
    setCodeOutput(
      `${allPassed ? '🎉 All test cases passed!' : `⚠️ ${passedCount}/${results.length} test cases passed`}\n\n` +
      results.map((r, i) => 
        `Test ${i + 1}${question.testCases[i].hidden ? ' (hidden)' : ''}: ${r.passed ? '✅ Passed' : '❌ Failed'}${!question.testCases[i].hidden ? `\nOutput: ${r.output}\nExpected: ${r.expected}` : ''}`
      ).join('\n\n')
    );
    setIsRunningCode(false);
    
    // Mark as answered if at least one test passes
    if (passedCount > 0) {
      setAnswers(prev => ({ ...prev, [questionIndex]: passedCount }));
    }
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'test' && timeLeft > 0 && testMode === 'timed') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
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
            // Auto-submit on max violations
            setTimeout(() => handleSubmitTest(), 100);
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
          setTimeout(() => handleSubmitTest(), 100);
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
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
          e.preventDefault();
          setCopyPasteAttempts(prev => prev + 1);
        }
      }
      // Prevent PrintScreen
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
        // User exited fullscreen
        setFullScreenExitCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_FULLSCREEN_EXITS) {
            setTimeout(() => handleSubmitTest(), 100);
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

  // Enter fullscreen mode function
  const enterFullScreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  // Exit fullscreen mode function
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

  // Run custom test case
  const runCustomTestCase = async (questionIndex: number, question: ProgrammingQuestion) => {
    if (!customTestInput.trim()) {
      setCustomTestOutput('Please enter a test input.');
      return;
    }
    setIsRunningCode(true);
    setCustomTestOutput('Running custom test...');
    
    const code = getCurrentCode(questionIndex, question);
    const result = await executeCode(code, selectedLanguage, customTestInput);
    
    setCustomTestOutput(
      result.success 
        ? `Output:\n${result.output}` 
        : `Error:\n${result.error || 'Execution failed'}`
    );
    setIsRunningCode(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTest = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
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
    setHintsUsed({});
    setCustomTestInput('');
    setCustomTestOutput('');
    
    // Enter fullscreen mode only if anti-cheat is enabled
    if (antiCheatMode) {
      enterFullScreen();
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
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
    questions.forEach((q, index) => {
      if (isProgrammingQuestion(q)) {
        // For programming questions, check if code was written
        const code = codeAnswers[index] || '';
        const hasCode = code.trim().length > 0;
        if (!hasCode) {
          unansweredQuestions.push(index + 1);
        }
      } else {
        // For MCQ questions, check if answer is selected
        if (answers[index] === undefined) {
          unansweredQuestions.push(index + 1);
        }
      }
    });
    
    // If there are unanswered questions, show confirmation modal
    if (unansweredQuestions.length > 0) {
      setShowUnansweredConfirmModal(true);
      return;
    }
    
    // Proceed with submission if all questions are answered
    proceedWithSubmission();
  };

  const proceedWithSubmission = () => {
    // Exit fullscreen when test is submitted
    exitFullScreen();
    
    const questions = getQuestions();
    const questionResults = questions.map((q, index) => {
      if (isProgrammingQuestion(q)) {
        // For programming questions, check if they passed any test cases
        const testResults = codeTestResults[index];
        const passedAll = testResults?.every(r => r.passed) ?? false;
        return {
      questionId: q.id,
      topic: q.topic,
          isCorrect: passedAll,
      userAnswer: answers[index] ?? -1,
          correctAnswer: 0, // Not applicable for programming
        };
      }
      // For MCQ questions
      return {
        questionId: q.id,
        topic: q.topic,
        isCorrect: answers[index] === (q as Question).correctAnswer,
        userAnswer: answers[index] ?? -1,
        correctAnswer: (q as Question).correctAnswer,
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
    
    setUserProgress(prev => ({
      ...prev,
      currentXP: prev.currentXP + xpEarned,
      totalXP: prev.totalXP + xpEarned,
      testsCompleted: prev.testsCompleted + 1,
      avgScore: Math.round((prev.avgScore * prev.testsCompleted + (score / questions.length) * 100) / (prev.testsCompleted + 1)),
    }));

    // Mark daily challenge as completed if applicable
    if (selectedAssessment && dailyChallenge.topic.toLowerCase().includes(selectedAssessment.title.toLowerCase())) {
      setDailyChallenge(prev => ({ ...prev, completed: true }));
    }
    
    // Reset proctoring state
    setShowTabWarningModal(false);
    setShowFullScreenWarning(false);
    setShowHints(false);
    
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

  const renderAssessmentCard = (assessment: Assessment) => (
    <div
      key={assessment.id}
      onClick={() => handleStartTest(assessment)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 relative group cursor-pointer"
    >
      {assessment.popular && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
          <StarIcon />
          Popular
        </div>
      )}
      {assessment.registrations > 5000 && !assessment.popular && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white text-xs font-medium px-3 py-1 rounded-full">
          🎯 {assessment.registrations.toLocaleString()} Registrations
        </div>
      )}
      
      <div className="flex flex-col items-center mb-4">
        <div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-3 overflow-hidden">
          <img
            src={assessment.logo}
            alt={assessment.title}
            className="w-16 h-16 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=' + assessment.title[0];
            }}
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{assessment.title}</h3>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
          <ClockIcon />
          <span>Time: {assessment.time}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
          <GridIcon />
          <span>Objective: {assessment.objective}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
          <CodeIcon />
          <span>Programming: {assessment.programming}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
        <div
          className="w-full text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300 flex items-center justify-center gap-2 group-hover:gap-3 transition-all"
        >
          Attempt Now
          <ArrowRightIcon />
        </div>
      </div>
    </div>
  );

  const renderAssessmentList = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
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
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Mock Assessments</h1>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('assessment')}
                className={`px-5 py-2 rounded-lg font-medium transition text-sm ${
                  activeTab === 'assessment'
                    ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Free Mock Assessment
              </button>
              <button
                onClick={() => setActiveTab('interview')}
                className={`px-5 py-2 rounded-lg font-medium transition text-sm ${
                  activeTab === 'interview'
                    ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Mock Interview
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-2 rounded-lg font-medium transition text-sm ${
                  activeTab === 'history'
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
          {/* Top Stats Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* XP Progress Card */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-xs opacity-80">Level {userProgress.level}</p>
                    <p className="font-semibold">{userProgress.currentXP} / {userProgress.nextLevelXP} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80">Streak</p>
                  <p className="font-bold text-lg">🔥 {userProgress.streak} days</p>
                </div>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${(userProgress.currentXP / userProgress.nextLevelXP) * 100}%` }}
                />
              </div>
            </div>

            {/* Daily Challenge Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-lg">📅</div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Daily Challenge</p>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{dailyChallenge.title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">+{dailyChallenge.xpReward} XP</p>
                  <button 
                    onClick={() => navigateToView('daily-challenge')}
                    className="text-xs px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition mt-1"
                  >
                    {dailyChallenge.completed ? 'Completed ✓' : 'Start'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{userProgress.testsCompleted}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tests</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">{userProgress.avgScore}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-600">{userProgress.badges.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Badges</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigateToView('leaderboard')}
                  className="text-xs px-3 py-1.5 border border-orange-300 dark:border-orange-600 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
                >
                  Leaderboard →
                </button>
              </div>
            </div>
          </div>

          {/* Badges Preview */}
          <div className="bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-800 dark:to-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-800/30 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="font-semibold text-gray-900 dark:text-white">Your Badges</h3>
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                  {allBadges.filter(b => b.earned).length}/{allBadges.length}
                </span>
              </div>
              <button 
                onClick={() => navigateToView('achievements')}
                className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors flex items-center gap-1"
              >
                View All
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {allBadges.slice(0, 8).map((badge, index) => (
                <div 
                  key={badge.id}
                  className={`group flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:-translate-y-1 ${
                    badge.earned 
                      ? 'bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-800/40 dark:via-orange-800/30 dark:to-yellow-800/40 border-2 border-amber-300 dark:border-amber-600 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 grayscale opacity-40 hover:opacity-60'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  title={`${badge.name}${badge.earned ? ' ✓' : ' (Locked)'}`}
                >
                  {badge.image ? (
                    <img 
                      src={badge.image} 
                      alt={badge.name} 
                      className={`w-10 h-10 object-contain transition-transform duration-300 group-hover:scale-110 ${badge.earned ? 'drop-shadow-md' : ''}`} 
                    />
                  ) : (
                    <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{badge.icon}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Test Type Toggle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Test Type:</span>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 shadow-inner">
                  <button
                    onClick={() => { setShowCompanyTests(true); setSelectedCategory('all'); }}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      showCompanyTests
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
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                      !showCompanyTests
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
              
              {/* Test Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Mode:</span>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                  <button
                    onClick={() => setTestMode('timed')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      testMode === 'timed' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    ⏱️ Timed
                  </button>
                  <button
                    onClick={() => setTestMode('practice')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      testMode === 'practice' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    📚 Practice
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-category Filters - Only show for Technical Tests */}
            {!showCompanyTests && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Category:</span>
                <div className="flex flex-wrap gap-2">
                  {['all', 'technical', 'language', 'framework', 'database', 'devops'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                        selectedCategory === cat
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700 shadow-sm'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-600 dark:hover:text-orange-400'
                      }`}
                    >
                      {cat === 'all' ? 'All' : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Difficulty Selector */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-gray-500 dark:text-gray-400">Difficulty:</span>
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition capitalize ${
                  selectedDifficulty === diff
                    ? diff === 'easy' ? 'bg-emerald-500 text-white' : diff === 'medium' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Company Tests Section */}
          {showCompanyTests && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                💼 Company-Specific Assessments
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Interview Prep</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {companyAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    onClick={() => { setSelectedAssessment(assessment); setShowInstructions(true); }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                        <img src={assessment.logo} alt={assessment.title} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = '/mock_assessments_logo/sde_interview.png'; }} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">{assessment.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{assessment.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>⏱️ {assessment.time}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">+{assessment.xpReward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Assessment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {assessments
              .filter(a => selectedCategory === 'all' || a.category === selectedCategory)
              .map(renderAssessmentCard)}
          </div>
        </div>
      )}
      {activeTab === 'interview' && renderMockInterviewSection()}
      {activeTab === 'history' && renderHistorySection()}
      
      {/* Leaderboard View */}
      {view === 'leaderboard' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Leaderboard</h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Top 3 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6">
              <div className="flex justify-center items-end gap-4">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-gray-300 dark:border-gray-500">
                    {leaderboardData[1].avatar}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboardData[1].name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboardData[1].xp} XP</p>
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">2</div>
                </div>
                {/* 1st Place */}
                <div className="text-center -mt-4">
                  <div className="text-2xl mb-1">👑</div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl mb-2 mx-auto border-4 border-amber-300">
                    {leaderboardData[0].avatar}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{leaderboardData[0].name}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">{leaderboardData[0].xp} XP</p>
                  <div className="w-12 h-14 bg-gradient-to-b from-amber-400 to-amber-500 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-xl font-bold text-white">1</div>
                </div>
                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-amber-200 dark:border-amber-700">
                    {leaderboardData[2].avatar}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboardData[2].name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboardData[2].xp} XP</p>
                  <div className="w-10 h-8 bg-amber-200 dark:bg-amber-800 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold text-amber-800 dark:text-amber-200">3</div>
                </div>
              </div>
            </div>
            
            {/* Rest of leaderboard */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaderboardData.slice(3).map((entry) => (
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
      )}

      {/* Achievements View */}
      {view === 'achievements' && (
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
                {allBadges.filter(b => b.earned).length} of {allBadges.length} badges unlocked
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Progress</span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {Math.round((allBadges.filter(b => b.earned).length / allBadges.length) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(allBadges.filter(b => b.earned).length / allBadges.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allBadges.map((badge, index) => (
              <div
                key={badge.id}
                className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  badge.earned
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
                  <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                    badge.earned 
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
                      <span className="text-3xl">{badge.icon}</span>
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
      )}

      {/* Daily Challenge View */}
      {view === 'daily-challenge' && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Daily Challenge</h2>
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
              <span className="px-2 py-1 bg-white/20 rounded text-xs">⏱️ {Math.floor(dailyChallenge.timeLimit / 60)} min</span>
            </div>
            <button
              onClick={() => {
                const challengeAssessment = assessments.find(a => a.title.toLowerCase().includes(dailyChallenge.topic.toLowerCase())) || assessments[0];
                setSelectedAssessment(challengeAssessment);
                setShowInstructions(true);
              }}
              className="w-full py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              {dailyChallenge.completed ? 'Challenge Completed! ✓' : 'Start Challenge'}
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
      )}
    </div>
  );

  const renderMockInterviewSection = () => (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Mock Interview</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Get paired with a suitable peer and interview each other anonymously
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => setView('schedule')}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
          >
            Get An Interview Now
            <ArrowRightIcon />
          </button>
          <button
            onClick={() => setView('schedule')}
            className="px-8 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
          >
            Get An Interview Later
            <CalendarIcon />
          </button>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-8">How It Works</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <UsersIcon />, title: 'Pairup', desc: 'We will match you with the suitable peer based on your preferences. The Interview will be of 1 Hr : 30 Mins' },
            { icon: <VideoIcon />, title: 'Interview Your Peer', desc: 'For the first half (45 Mins), you interview your peer based on the question and answer we provide (or vice versa)' },
            { icon: <VideoIcon />, title: 'Peer Interviews You', desc: 'Second half (45 Mins), your peer interviews you based on the question and answer we provide (or vice versa)' },
            { icon: <StarIcon />, title: 'Evaluate Each Other', desc: 'After completion you and your peer provide feedback. Work on the areas you lack and then repeat until you are confident' },
          ].map((step, index) => (
            <div key={index} className="relative">
              <div className="absolute -top-4 -left-4 text-6xl font-bold text-gray-100 dark:text-gray-700">{index + 1}</div>
              <div className="relative bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400">
                  {step.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistorySection = () => {
    const renderHistoryCard = (result: TestResult, index: number) => {
      const percentage = Math.round((result.score / result.totalQuestions) * 100);
      const isPassed = percentage >= 60;
      const assessment = assessments.find(a => a.id === result.assessmentId);
      
      return (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0">
              <img
                src={assessment?.logo || '/mock_assessments_logo/sde_interview.png'}
                alt={result.assessmentTitle}
                className="w-full h-full object-contain"
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
            <span className={`px-2 py-0.5 rounded text-xs ${
              isPassed
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isPassed ? 'Passed' : 'Failed'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg py-2">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{result.score}/{result.totalQuestions}</p>
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
              onClick={() => {
                setTestResult(result);
                setView('results');
              }}
              className={`${isPassed ? 'flex-1' : 'w-full'} flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
            >
              View Details
            </button>
          </div>
        </div>
      );
    };

    const renderHistoryList = (result: TestResult, index: number) => {
      const percentage = Math.round((result.score / result.totalQuestions) * 100);
      const isPassed = percentage >= 60;
      const assessment = assessments.find(a => a.id === result.assessmentId);
      
      return (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-11 h-11 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 flex-shrink-0">
                <img
                  src={assessment?.logo || '/mock_assessments_logo/sde_interview.png'}
                  alt={result.assessmentTitle}
                  className="w-full h-full object-contain"
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
                <p className="text-base font-semibold text-gray-900 dark:text-white">{result.score}/{result.totalQuestions}</p>
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
              <span className={`px-2.5 py-1 rounded text-xs ${
                isPassed
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
                onClick={() => { setTestResult(result); setView('results'); }}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Assessment History</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">View your attempted assessments, scores, and download certificates</p>
          </div>
          
          {testHistory.length > 0 && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setHistoryViewMode('list')}
                className={`px-3 py-1.5 rounded text-xs transition ${
                  historyViewMode === 'list'
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
                className={`px-3 py-1.5 rounded text-xs transition ${
                  historyViewMode === 'grid'
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

        {testHistory.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Assessments Attempted Yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Start taking mock assessments to build your history!</p>
            <button
              onClick={() => setActiveTab('assessment')}
              className="px-5 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition"
            >
              Take Your First Assessment
            </button>
          </div>
        ) : (
          <>
            {/* List View */}
            {historyViewMode === 'list' && (
              <div className="space-y-3">
                {testHistory.map(renderHistoryList)}
              </div>
            )}

            {/* Grid View */}
            {historyViewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {testHistory.map(renderHistoryCard)}
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        {testHistory.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{testHistory.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tests Attempted</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-emerald-600">
                {testHistory.filter(r => Math.round((r.score / r.totalQuestions) * 100) >= 60).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tests Passed</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-orange-600">
                {Math.round(testHistory.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / testHistory.length)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Score</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
              <p className="text-2xl font-semibold text-amber-600">
                {testHistory.filter(r => Math.round((r.score / r.totalQuestions) * 100) >= 60).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Certificates</p>
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
            <h3 className="font-bold text-xl text-gray-900 dark:text-white">Project Bazaar</h3>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {selectedAssessment?.title} Assessment
        </h2>

        {/* Test Mode Selection */}
        <div className="mb-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📝</span> Test Mode
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTestMode('timed')}
              className={`p-4 rounded-xl border-2 transition ${
                testMode === 'timed'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">⏱️</div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Timed Test</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Real exam experience</p>
            </button>
            <button
              onClick={() => setTestMode('practice')}
              className={`p-4 rounded-xl border-2 transition ${
                testMode === 'practice'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">📚</div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Practice Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No timer, learn at your pace</p>
            </button>
          </div>
        </div>

        {/* Anti-Cheat Mode Selection */}
        <div className="mb-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>🛡️</span> Proctoring Mode
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAntiCheatMode(true)}
              className={`p-4 rounded-xl border-2 transition ${
                antiCheatMode
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">🛡️</div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Anti-Cheat</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No copy/paste, tab switch detection</p>
            </button>
            <button
              onClick={() => setAntiCheatMode(false)}
              className={`p-4 rounded-xl border-2 transition ${
                !antiCheatMode
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-1">🔓</div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Cheated Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Copy/paste, tab switch allowed</p>
            </button>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="mb-5">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>🎯</span> Difficulty Level
          </h4>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`flex-1 py-3 px-4 rounded-xl border-2 transition capitalize ${
                  selectedDifficulty === diff
                    ? diff === 'easy' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' 
                      : diff === 'medium' 
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' 
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-lg mb-0.5">
                  {diff === 'easy' ? '🌱' : diff === 'medium' ? '🌿' : '🌳'}
                </div>
                <p className="font-medium text-sm">{diff}</p>
              </button>
            ))}
          </div>
        </div>

        {/* XP Reward Preview */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-5 border border-purple-200 dark:border-purple-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span className="text-sm text-purple-700 dark:text-purple-400">Potential XP Reward</span>
              </div>
              <span className="font-bold text-purple-700 dark:text-purple-400">
                +{Math.round((selectedDifficulty === 'easy' ? 50 : selectedDifficulty === 'medium' ? 100 : 150) * (antiCheatMode ? 1.5 : 0.5) * (testMode === 'timed' ? 1.2 : 0.8))} - {Math.round((selectedDifficulty === 'easy' ? 100 : selectedDifficulty === 'medium' ? 200 : 300) * (antiCheatMode ? 1.5 : 0.5) * (testMode === 'timed' ? 1.2 : 0.8))} XP
              </span>
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
              <div className="flex items-center gap-2">
                <span>{antiCheatMode ? '🛡️ Anti-Cheat Mode: 1.5x' : '🔓 Cheated Mode: 0.5x'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{testMode === 'timed' ? '⏱️ Timed Mode: 1.2x' : '📚 Practice Mode: 0.8x'}</span>
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
                <span><strong>Cheated Mode:</strong> Copy/paste and tab switching are allowed. No restrictions applied.</span>
              </li>
            )}
          </ol>
        </div>

        <button
          onClick={handleBeginTest}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
        >
          <span>🚀</span>
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
              <span className="text-yellow-500">✨</span>
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
    questions.forEach((q, index) => {
      if (isProgrammingQuestion(q)) {
        const code = codeAnswers[index] || '';
        const hasCode = code.trim().length > 0;
        if (!hasCode) {
          unansweredQuestions.push(index + 1);
        }
      } else {
        if (answers[index] === undefined) {
          unansweredQuestions.push(index + 1);
        }
      }
    });

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
            Unanswered Questions Detected
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            You have <strong className="text-orange-600 dark:text-orange-400">{unansweredQuestions.length}</strong> unanswered question{unansweredQuestions.length > 1 ? 's' : ''}.
          </p>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">Unanswered Questions:</p>
            <p className="text-sm text-orange-800 dark:text-orange-400">
              {unansweredQuestions.length <= 5 
                ? `Question${unansweredQuestions.length > 1 ? 's' : ''}: ${unansweredQuestions.join(', ')}`
                : `Questions: ${unansweredQuestions.slice(0, 5).join(', ')} and ${unansweredQuestions.length - 5} more...`
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowUnansweredConfirmModal(false)}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Go Back to Test
            </button>
            <button
              onClick={() => {
                setShowUnansweredConfirmModal(false);
                proceedWithSubmission();
              }}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange-500/30"
            >
              Submit Anyway
            </button>
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

  // Code hints for programming questions
  const getHintsForQuestion = (questionId: number): string[] => {
    const hintsMap: Record<number, string[]> = {
      101: [
        'Consider using a hash map to store values you\'ve seen',
        'For each number, check if (target - number) exists in the map',
        'Time complexity can be O(n) with this approach'
      ],
      102: [
        'You can use two pointers, one at the start and one at the end',
        'Swap characters at the pointers and move them towards the center',
        'Alternatively, use Python\'s slicing with [::-1]'
      ],
      103: [
        'Use a stack to keep track of opening brackets',
        'When you see a closing bracket, check if it matches the top of the stack',
        'The string is valid if the stack is empty at the end'
      ],
      104: [
        'Use modulo operator (%) to check divisibility',
        'Check divisibility by 15 first (FizzBuzz), then 5, then 3',
        'Build the string based on divisibility conditions'
      ]
    };
    return hintsMap[questionId] || [
      'Break down the problem into smaller steps',
      'Consider edge cases carefully',
      'Think about the time and space complexity'
    ];
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

          {/* Quick actions */}
          <div className="p-2 space-y-1.5 border-b border-slate-700/50">
            <button className="w-full p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 group">
              <svg className="w-4 h-4 mx-auto text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
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
                    className={`relative aspect-square rounded-lg text-sm font-bold transition-all duration-200 flex items-center justify-center ${
                      isActive
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
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
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
              {testMode === 'timed' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                  timeLeft < 300 
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' 
                    : timeLeft < 600 
                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                  <ClockIcon />
                  <span className={`font-mono text-sm ${
                    timeLeft < 300 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}

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
              {/* Section 1 - MCQ Questions */}
              {questions.some((q) => !isProgrammingQuestion(q)) && (
                <>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-lg shadow-sm">S1</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">MCQ</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    {questions.map((q, index) => {
                      if (isProgrammingQuestion(q)) return null;
                      const isActive = currentQuestionIndex === index;
                      const isAnswered = answers[index] !== undefined;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`relative w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                            isActive
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
                </>
              )}
              
              {/* Section 2 - Programming Questions */}
              {questions.some((q) => isProgrammingQuestion(q)) && (
                <>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-lg shadow-sm">S2</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Coding</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    {questions.map((q, index) => {
                      if (!isProgrammingQuestion(q)) return null;
                      const isActive = currentQuestionIndex === index;
                      const isAnswered = answers[index] !== undefined || codeTestResults[index]?.some(r => r.passed);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`relative w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
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
                </>
              )}
            </div>
          </div>

          {/* Question content */}
          <div className={`flex-1 overflow-y-auto ${isProgrammingQuestion(currentQuestion) ? 'p-0' : 'p-6'}`}>
            <div className={isProgrammingQuestion(currentQuestion) ? 'h-full' : 'max-w-3xl mx-auto'}>
              {/* Question card */}
              <div className={`bg-white dark:bg-gray-800 ${isProgrammingQuestion(currentQuestion) ? 'h-full' : 'rounded-2xl shadow-lg shadow-gray-200/30 dark:shadow-none border border-gray-100 dark:border-gray-700'} overflow-hidden`}>
                {/* Question header - Only show for MCQ, programming has its own header */}
                {!isProgrammingQuestion(currentQuestion) && (
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm ${
                      flaggedQuestions.has(currentQuestionIndex)
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <FlagIcon />
                    <span className="font-medium">{flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}</span>
                  </button>
                </div>
                )}

                {/* Question body */}
                <div className={isProgrammingQuestion(currentQuestion) ? "h-full" : "p-5"}>
                  {/* Conditional rendering: MCQ or Programming (LeetCode Style) */}
                  {isProgrammingQuestion(currentQuestion) ? (
                    /* Programming Question - LeetCode Style Split Panel */
                    <div 
                      className="flex flex-col lg:flex-row h-[calc(100vh-200px)] min-h-[600px] overflow-hidden"
                      onMouseMove={(e) => {
                        if (isResizing) {
                          e.preventDefault();
                          const container = e.currentTarget;
                          const containerRect = container.getBoundingClientRect();
                          const containerWidth = containerRect.width;
                          const mouseX = e.clientX - containerRect.left;
                          const newWidthPercent = (mouseX / containerWidth) * 100;
                          // Clamp between 25% and 50%
                          const clampedWidth = Math.max(25, Math.min(50, newWidthPercent));
                          setLeftPanelWidth(clampedWidth);
                        }
                      }}
                      onMouseUp={() => setIsResizing(false)}
                      onMouseLeave={() => setIsResizing(false)}
                    >
                      {/* Left Panel - Problem Description */}
                      <div 
                        className="h-full border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-[#1a1a1a] overflow-hidden"
                        style={{ width: `${leftPanelWidth}%`, flexShrink: 0 }}
                      >
                        {/* Tabs */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#262626]">
                          <button className="px-3 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                            Description
                          </button>
                          <button
                            onClick={() => setShowQuestionInstructions(!showQuestionInstructions)}
                            className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center justify-center transition-colors"
                            title="Show question instructions"
                          >
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Problem Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-5">
                          {/* Difficulty Badge */}
                          <div className="flex items-center gap-3 mb-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                              currentQuestion.difficulty === 'easy' 
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : currentQuestion.difficulty === 'medium'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {currentQuestion.difficulty?.charAt(0).toUpperCase() + currentQuestion.difficulty?.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Topic: {currentQuestion.topic}
                            </span>
                          </div>

                          {/* Problem Title & Description */}
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {currentQuestionIndex + 1}. {currentQuestion.question.split('\n')[0]}
                          </h3>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                              {currentQuestion.question.split('\n').slice(1).join('\n')}
                            </p>
                          </div>

                          {/* Examples */}
                          <div className="mt-6 space-y-4">
                            {currentQuestion.examples.map((ex, i) => (
                              <div key={i} className="bg-gray-50 dark:bg-[#262626] rounded-lg p-4">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Example {i + 1}:</p>
                                <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-md p-3 font-mono text-sm">
                                  <div className="text-gray-600 dark:text-gray-400">
                                    <span className="text-gray-500 dark:text-gray-500">Input: </span>
                                    <span className="text-gray-900 dark:text-gray-200">{ex.input}</span>
                                  </div>
                                  <div className="text-gray-600 dark:text-gray-400 mt-1">
                                    <span className="text-gray-500 dark:text-gray-500">Output: </span>
                                    <span className="text-gray-900 dark:text-gray-200">{ex.output}</span>
                                  </div>
                                  {ex.explanation && (
                                    <div className="text-gray-600 dark:text-gray-400 mt-1">
                                      <span className="text-gray-500 dark:text-gray-500">Explanation: </span>
                                      <span className="text-gray-700 dark:text-gray-300">{ex.explanation}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Constraints */}
                          {currentQuestion.constraints && (
                            <div className="mt-6">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Constraints:</p>
                              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {currentQuestion.constraints.split('\n').map((constraint, i) => (
                                  <li key={i} className="font-mono text-xs">{constraint}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Question Instructions Panel */}
                          {showQuestionInstructions && (
                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
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
                                      <span>Read the problem statement carefully and understand the requirements.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                      <span>Check the examples to understand the expected input/output format.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                      <span>Review the constraints to understand the problem limits.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                      <span>You can use hints, but they may reduce your score.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                      <span>Test your solution with the provided test cases before submitting.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                      <span>Topic: <span className="font-medium">{currentQuestion.topic}</span></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                      <span className="text-blue-600 dark:text-blue-500 mt-0.5">•</span>
                                      <span>Difficulty: <span className="font-medium capitalize">{currentQuestion.difficulty || 'N/A'}</span></span>
                                    </li>
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
                        </div>
                      </div>

                      {/* Resizable Divider */}
                      <div 
                        className={`w-1.5 ${isResizing ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'} hover:bg-orange-400 dark:hover:bg-orange-500 cursor-col-resize transition-colors flex-shrink-0 hidden lg:flex items-center justify-center group`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIsResizing(true);
                        }}
                        title="Drag to resize panels"
                      >
                        <div className="w-0.5 h-8 bg-gray-400 dark:bg-gray-500 group-hover:bg-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Right Panel - Code Editor & Console */}
                      <div className="flex-1 h-full flex flex-col bg-[#1e1e1e] overflow-hidden min-w-0 mr-4 rounded-lg">
                        {/* Editor Header */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-[#2d2d2d]">
                          <div className="flex items-center gap-3">
                            {isLanguageLocked ? (
                              <div className="px-3 py-1.5 bg-[#3c3c3c] border border-gray-600 rounded-md text-sm font-medium text-gray-200">
                                {supportedLanguages.find(l => l.id === selectedLanguage)?.name || selectedLanguage}
                              </div>
                            ) : (
                              <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="px-3 py-1.5 bg-[#3c3c3c] border border-gray-600 rounded-md text-sm font-medium text-gray-200 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer hover:bg-[#4a4a4a] transition"
                              >
                                {supportedLanguages.map(lang => (
                                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                // Reset to starter code for the current language
                                const starterCode = isLanguageLocked 
                                  ? (currentQuestion.starterCode[selectedLanguage] || '')
                                  : (currentQuestion.starterCode[selectedLanguage] || currentQuestion.starterCode.python || '');
                                setCodeAnswers(prev => ({ ...prev, [currentQuestionIndex]: starterCode }));
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition"
                              title="Reset to Default Code"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition"
                              title="Fullscreen"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 min-h-0">
                          <Editor
                            height="100%"
                            language={supportedLanguages.find(l => l.id === selectedLanguage)?.monacoId || 'python'}
                            value={getCurrentCode(currentQuestionIndex, currentQuestion)}
                            onChange={(value) => handleCodeChange(currentQuestionIndex, value || '')}
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
                              renderLineHighlight: 'all',
                              cursorBlinking: 'smooth',
                              smoothScrolling: true,
                            }}
                          />
                        </div>

                        {/* Console Panel */}
                        <div className="h-[220px] border-t border-gray-700 flex flex-col bg-[#1e1e1e]">
                          {/* Console Tabs */}
                          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-[#2d2d2d]">
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setActiveConsoleTab('testcase')}
                                className={`px-3 py-1 text-xs font-medium rounded transition ${
                                  activeConsoleTab === 'testcase' ? 'text-gray-200 bg-gray-700' : 'text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Testcase
                              </button>
                              <button 
                                onClick={() => setActiveConsoleTab('result')}
                                className={`px-3 py-1 text-xs font-medium rounded transition ${
                                  activeConsoleTab === 'result' ? 'text-gray-200 bg-gray-700' : 'text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Result
                              </button>
                              <button 
                                onClick={() => setActiveConsoleTab('custom')}
                                className={`px-3 py-1 text-xs font-medium rounded transition ${
                                  activeConsoleTab === 'custom' ? 'text-gray-200 bg-gray-700' : 'text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Custom Input
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Hints Button */}
                              <button
                                onClick={() => {
                                  setShowHints(!showHints);
                                  if (!showHints) {
                                    setHintsUsed(prev => ({
                                      ...prev,
                                      [currentQuestionIndex]: (prev[currentQuestionIndex] || 0) + 1
                                    }));
                                  }
                                }}
                                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition ${
                                  showHints 
                                    ? 'bg-purple-600 text-white' 
                                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-900/30'
                                }`}
                                title="Get hints (may affect score)"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Hints
                              </button>
                              {codeTestResults[currentQuestionIndex] && (
                                <span className={`text-xs font-medium ${
                                  codeTestResults[currentQuestionIndex].every(r => r.passed)
                                    ? 'text-emerald-400'
                                    : 'text-red-400'
                                }`}>
                                  {codeTestResults[currentQuestionIndex].filter(r => r.passed).length}/{codeTestResults[currentQuestionIndex].length} passed
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Console Content */}
                          <div className="flex-1 overflow-y-auto p-3">
                            {/* Hints Panel */}
                            {showHints && (
                              <div className="mb-3 bg-purple-900/30 border border-purple-700 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-purple-300">Hints</span>
                                  <span className="text-xs text-purple-500">(Using hints may reduce your score)</span>
                                </div>
                                <ul className="space-y-1.5">
                                  {getHintsForQuestion(currentQuestion.id).map((hint, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-purple-200">
                                      <span className="text-purple-400 font-bold">{i + 1}.</span>
                                      {hint}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Testcase Tab */}
                            {activeConsoleTab === 'testcase' && (
                              <div className="space-y-2">
                                {currentQuestion.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                                  <div key={i} className="bg-gray-800 rounded p-2">
                                    <p className="text-xs text-gray-400 mb-1">Case {i + 1}:</p>
                                    <div className="font-mono text-xs">
                                      <span className="text-gray-500">Input: </span>
                                      <span className="text-gray-300">{tc.input}</span>
                                    </div>
                                    <div className="font-mono text-xs">
                                      <span className="text-gray-500">Expected: </span>
                                      <span className="text-emerald-400">{tc.expectedOutput}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Result Tab */}
                            {activeConsoleTab === 'result' && (
                              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                {codeOutput || (
                                  <span className="text-gray-500">
                                    Run your code to see results here.
                                  </span>
                                )}
                              </pre>
                            )}

                            {/* Custom Input Tab */}
                            {activeConsoleTab === 'custom' && (
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">Custom Input:</label>
                                  <textarea
                                    value={customTestInput}
                                    onChange={(e) => setCustomTestInput(e.target.value)}
                                    placeholder="Enter your custom test input here..."
                                    className="w-full h-16 bg-gray-800 border border-gray-600 rounded p-2 text-xs text-gray-200 font-mono resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>
                                <button
                                  onClick={() => runCustomTestCase(currentQuestionIndex, currentQuestion)}
                                  disabled={isRunningCode}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded transition disabled:opacity-50"
                                >
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                  Run Custom Test
                                </button>
                                {customTestOutput && (
                                  <div className="bg-gray-800 rounded p-2 mt-2">
                                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                      {customTestOutput}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-700 bg-[#2d2d2d]">
                            <div className="flex items-center gap-3">
                              {/* Proctoring Status - Only show in anti-cheat mode */}
                              {antiCheatMode && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <div className={`w-2 h-2 rounded-full ${tabSwitchCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                                  <span className={tabSwitchCount > 0 ? 'text-amber-400' : 'text-gray-400'}>
                                    {tabSwitchCount > 0 ? `${tabSwitchCount} warning${tabSwitchCount > 1 ? 's' : ''}` : 'Proctored'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => runCode(currentQuestionIndex, currentQuestion)}
                                disabled={isRunningCode}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3c3c3c] hover:bg-[#4a4a4a] text-gray-200 text-sm font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                              >
                                {isRunningCode ? (
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                )}
                                Run
                              </button>
                              <button
                                onClick={() => submitCode(currentQuestionIndex, currentQuestion)}
                                disabled={isRunningCode}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Submit
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* MCQ Question - Options */
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
                      {(currentQuestion as Question).options.map((option, index) => {
                      const isSelected = answers[currentQuestionIndex] === index;
                      const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-200 flex items-center gap-3 group ${
                            isSelected
                              ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-300 dark:border-orange-500'
                              : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-white dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm transition-all duration-200 flex-shrink-0 ${
                              isSelected
                                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                                : 'bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 group-hover:border-orange-300 group-hover:text-orange-600 dark:group-hover:border-orange-500 dark:group-hover:text-orange-400'
                            }`}
                          >
                            {optionLabel}
                          </div>
                          <span className={`flex-1 text-sm transition-colors ${
                            isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer confirmation */}
              {!isProgrammingQuestion(currentQuestion) && answers[currentQuestionIndex] !== undefined && (
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
      </div>
    );
  };

  const renderResults = () => {
    if (!testResult) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16 px-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-20">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <rect x="40" y="20" width="120" height="160" rx="8" fill="currentColor" />
              <rect x="50" y="40" width="60" height="8" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="50" y="60" width="80" height="4" rx="2" fill="currentColor" opacity="0.3" />
              <rect x="50" y="70" width="70" height="4" rx="2" fill="currentColor" opacity="0.3" />
              <path d="M70 100 L85 115 L120 80" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.5" />
              <path d="M70 130 L85 145 L120 110" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.5" />
            </svg>
          </div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              Mock Coding Interview Assessment - {testResult.assessmentTitle}
            </h1>
            <h2 className="text-2xl text-orange-100">Performance Report</h2>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-8">
          {/* Score Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Score Circle */}
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(testResult.score / 100) * 352} 352`}
                      className={`${testResult.score >= 60 ? 'text-green-500' : testResult.score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{testResult.score.toFixed(1)}</span>
                    <span className="text-gray-500 dark:text-gray-400">/100</span>
                  </div>
                </div>
                <span className="mt-2 font-medium text-gray-900 dark:text-white">SCORE</span>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ClockIcon />
                  <span className="text-gray-600 dark:text-gray-400">Duration: {testResult.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <GridIcon />
                  <span className="text-gray-600 dark:text-gray-400">Total Questions: {testResult.totalQuestions}</span>
                </div>
                <div className="flex gap-4">
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm">
                    Attempted: {testResult.attempted}
                  </span>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                    Solved: {testResult.solved}
                  </span>
                </div>
              </div>

              {/* Start Time */}
              <div className="text-right">
                <p className="text-gray-500 dark:text-gray-400">Start Time</p>
                <p className="font-medium text-gray-900 dark:text-white">{testResult.startTime}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                🏆
              </div>
            </div>
            <button
              onClick={handleViewCertificate}
              className="px-6 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition"
            >
              Know more
            </button>
          </div>

          {/* Question Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">QUESTION STATS</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                  S1
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Default Section ({testResult.solved * 30}/{testResult.totalQuestions * 30})
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 dark:text-gray-400 text-sm border-b border-gray-100 dark:border-gray-700">
                      <th className="pb-3 font-medium">#</th>
                      <th className="pb-3 font-medium">Topic</th>
                      <th className="pb-3 font-medium">Type/Language</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResult.questionResults.map((result, index) => (
                      <tr key={index} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="py-4 text-gray-900 dark:text-white">{index + 1}</td>
                        <td className="py-4 text-gray-900 dark:text-white">{result.topic}</td>
                        <td className="py-4">
                          <GridIcon />
                        </td>
                        <td className="py-4">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {result.isCorrect ? '30.0' : '0.0'} / 30.0
                          </span>
                          <br />
                          <span className="text-red-500 text-sm">
                            {Math.floor(Math.random() * 80 + 10)}% solved this
                          </span>
                        </td>
                        <td className="py-4">
                          {result.isCorrect ? (
                            <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircleIcon />
                              Solved
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <XCircleIcon />
                              Wrong Answer
                            </span>
                          )}
                        </td>
                        <td className="py-4">
                          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Topic-wise Performance Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">📊 TOPIC-WISE PERFORMANCE</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Identify your strengths and areas for improvement</p>
            </div>
            <div className="p-6">
              {(() => {
                const topicStats: Record<string, { correct: number; total: number }> = {};
                testResult.questionResults.forEach(r => {
                  if (!topicStats[r.topic]) topicStats[r.topic] = { correct: 0, total: 0 };
                  topicStats[r.topic].total++;
                  if (r.isCorrect) topicStats[r.topic].correct++;
                });
                return Object.entries(topicStats).map(([topic, stats]) => {
                  const percentage = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={topic} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{topic}</span>
                        <span className={`text-sm font-medium ${percentage >= 70 ? 'text-emerald-600' : percentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {stats.correct}/{stats.total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            percentage >= 70 ? 'bg-emerald-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* XP Earned Card */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">XP Earned from this test</p>
                <p className="text-3xl font-bold">+{testResult.xpEarned || Math.round(testResult.score * 2)} XP</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">New Level Progress</p>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-white/30 rounded-full h-2">
                    <div className="bg-white rounded-full h-2" style={{ width: '78%' }} />
                  </div>
                  <span className="text-sm font-medium">Level 5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Show Explanations Toggle */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">📚 ANSWER EXPLANATIONS</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Learn from your mistakes with detailed explanations</p>
              </div>
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  showExplanations
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {showExplanations ? 'Hide Explanations' : 'Show Explanations'}
              </button>
            </div>
            {showExplanations && (
              <div className="p-6 space-y-4">
                {getQuestions().map((q, idx) => {
                  const result = testResult.questionResults.find(r => r.questionId === q.id);
                  const isCorrect = result?.isCorrect;
                  const isProgramming = isProgrammingQuestion(q);
                  
                  return (
                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm mb-2 whitespace-pre-line">{q.question}</p>
                          
                          {isProgramming ? (
                            /* Programming question result */
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded text-xs font-medium">
                                  💻 Programming
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                {isCorrect ? '✅ All test cases passed' : '❌ Some test cases failed'}
                              </div>
                            </div>
                          ) : (
                            /* MCQ question options */
                          <div className="grid grid-cols-2 gap-2 mb-3">
                              {(q as Question).options.map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                className={`px-3 py-2 rounded-lg text-xs ${
                                    optIdx === (q as Question).correctAnswer
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                    : optIdx === result?.userAnswer && !isCorrect
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                                  {optIdx === (q as Question).correctAnswer && <span className="ml-1">✓</span>}
                                {optIdx === result?.userAnswer && !isCorrect && <span className="ml-1">✗</span>}
                              </div>
                            ))}
                          </div>
                          )}
                          
                          {q.explanation && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">💡 Explanation:</p>
                              <p className="text-xs text-blue-700 dark:text-blue-400">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recommended Resources */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">📖 RECOMMENDED RESOURCES</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Based on your weak areas</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {studyResources.slice(0, 3).map((resource) => (
                <div key={resource.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-md transition cursor-pointer">
                  <div className="text-2xl mb-2">
                    {resource.type === 'video' ? '🎥' : resource.type === 'article' ? '📄' : resource.type === 'flashcard' ? '🃏' : '💻'}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{resource.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{resource.duration}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-12">
            <button
              onClick={handleBackToList}
              className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Back to Assessments
            </button>
            <button
              onClick={handleViewCertificate}
              className="flex-1 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-xl hover:shadow-lg shadow-orange-500/30 transition flex items-center justify-center gap-2"
            >
              <DownloadIcon />
              Download Certificate
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCertificate = () => {
    if (!testResult) return null;

    const isPassed = testResult.score >= 40;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12 px-4">
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
                  Project Bazaar
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
                <strong className="text-orange-600">Mock Coding Interview Assessment - {testResult.assessmentTitle}</strong>
                <br />
                with a score of <strong className="text-2xl">{testResult.score.toFixed(1)}%</strong>
              </p>

              {/* Stats */}
              <div className="flex justify-center gap-12 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{testResult.solved}</p>
                  <p className="text-gray-500 text-sm">Questions Solved</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-orange-600">{testResult.totalQuestions}</p>
                  <p className="text-gray-500 text-sm">Total Questions</p>
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
                    🎯 Keep Practicing!
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
            {allBadges.filter(b => b.earned).length} of {allBadges.length} badges unlocked
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection Progress</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {Math.round((allBadges.filter(b => b.earned).length / allBadges.length) * 100)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(allBadges.filter(b => b.earned).length / allBadges.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allBadges.map((badge, index) => (
          <div
            key={badge.id}
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              badge.earned
                ? 'border-amber-200 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-500'
                : 'border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100'
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {badge.earned && (
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 via-transparent to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl pointer-events-none" />
            )}
            
            <div className="relative flex items-start gap-4">
              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                badge.earned 
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
                  <span className="text-3xl">{badge.icon}</span>
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
        ))}
      </div>
    </div>
  );

  // Main render
  return (
    <>
      {showInstructions && renderInstructionsModal()}
      {showRules && renderRulesModal()}
      
      {view === 'list' && renderAssessmentList()}
      {view === 'test' && renderTestInterface()}
      {view === 'results' && renderResults()}
      {view === 'certificate' && renderCertificate()}
      {view === 'schedule' && renderScheduleInterview()}
      {view === 'achievements' && renderAchievements()}
      
      {/* Leaderboard View */}
      {view === 'leaderboard' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🏆 Leaderboard</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6">
              <div className="flex justify-center items-end gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-2xl mb-2 mx-auto border-4 border-gray-300 dark:border-gray-500">
                    {leaderboardData[1]?.avatar}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboardData[1]?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboardData[1]?.xp} XP</p>
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">2</div>
                </div>
                <div className="text-center -mb-4">
                  <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-3xl mb-2 mx-auto border-4 border-amber-400">
                    {leaderboardData[0]?.avatar}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboardData[0]?.name}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{leaderboardData[0]?.xp} XP</p>
                  <div className="w-12 h-14 bg-amber-400 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-xl font-bold text-white">👑</div>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-xl mb-2 mx-auto border-4 border-orange-300">
                    {leaderboardData[2]?.avatar}
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{leaderboardData[2]?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{leaderboardData[2]?.xp} XP</p>
                  <div className="w-8 h-8 bg-orange-300 dark:bg-orange-700 rounded-t-lg mx-auto mt-2 flex items-center justify-center text-lg font-bold">3</div>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaderboardData.slice(3).map((entry) => (
                <div key={entry.rank} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="w-8 text-center font-semibold text-gray-500 dark:text-gray-400">{entry.rank}</span>
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">{entry.avatar}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{entry.name}</p>
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
      )}
      
      {/* Daily Challenge View */}
      {view === 'daily-challenge' && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigateToView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeftIcon />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📅 Daily Challenge</h2>
          </div>
          <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 ${dailyChallenge.completed ? 'border-green-300 dark:border-green-700' : 'border-orange-300 dark:border-orange-700'}`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${dailyChallenge.completed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                {dailyChallenge.completed ? '✓ Completed' : 'Available'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Expires in 12h</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{dailyChallenge.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Topic: {dailyChallenge.topic}</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">⏱ {dailyChallenge.timeLimit} mins</span>
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
