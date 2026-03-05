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

export const interviewQuestions: InterviewQuestion[] = [
  { id: 'iq-1', question: 'What is middleware in web frameworks and how is it used?', difficulty: 'Medium', category: 'Backend', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-2', question: 'How does HTTP caching work and which headers control it?', difficulty: 'Medium', category: 'Backend', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-3', question: 'Explain REST vs. GraphQL and trade-offs.', difficulty: 'Hard', category: 'Backend', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-4', question: 'What is CORS and how do you configure it?', difficulty: 'Easy', category: 'Backend', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-5', question: 'Explain the difference between block-level and inline elements in HTML.', difficulty: 'Easy', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-6', question: 'What is the CSS box model and how do its components interact?', difficulty: 'Easy', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-7', question: 'What is CSS specificity and how does the browser resolve conflicts?', difficulty: 'Medium', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-8', question: "What is the difference between 'let', 'const', and 'var' in JavaScript?", difficulty: 'Easy', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-9', question: "Explain the difference between '==' and '===' operators in JavaScript.", difficulty: 'Easy', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-10', question: 'What is the DOM and how does JavaScript interact with it?', difficulty: 'Medium', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-11', question: 'What are React hooks and why were they introduced?', difficulty: 'Medium', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-12', question: 'Explain the virtual DOM and reconciliation in React.', difficulty: 'Hard', category: 'Frontend', role: 'Frontend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-13', question: 'What is the difference between SQL and NoSQL databases?', difficulty: 'Easy', category: 'Database', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-14', question: 'Explain ACID properties in database transactions.', difficulty: 'Medium', category: 'Database', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-15', question: 'What is database indexing and how does it improve performance?', difficulty: 'Medium', category: 'Database', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-16', question: 'What is the difference between process and thread?', difficulty: 'Medium', category: 'OS', role: 'System Design', isSolved: false, isBookmarked: false },
  { id: 'iq-17', question: 'Explain deadlock and how to prevent it.', difficulty: 'Hard', category: 'OS', role: 'System Design', isSolved: false, isBookmarked: false },
  { id: 'iq-18', question: 'What is normalization in DBMS? Explain up to 3NF.', difficulty: 'Medium', category: 'DBMS', role: 'Backend Developer', isSolved: false, isBookmarked: false },
  { id: 'iq-19', question: 'Explain the OSI model and its layers.', difficulty: 'Medium', category: 'Networking', role: 'DevOps', isSolved: false, isBookmarked: false },
  { id: 'iq-20', question: 'What is TCP/IP and how does the handshake work?', difficulty: 'Medium', category: 'Networking', role: 'DevOps', isSolved: false, isBookmarked: false },
  { id: 'iq-21', question: 'Explain the four pillars of OOP.', difficulty: 'Easy', category: 'OOP', role: 'General', isSolved: false, isBookmarked: false },
  { id: 'iq-22', question: 'What is the difference between abstract class and interface?', difficulty: 'Medium', category: 'OOP', role: 'General', isSolved: false, isBookmarked: false },
  { id: 'iq-23', question: 'Explain microservices architecture and its pros/cons.', difficulty: 'Hard', category: 'System Design', role: 'System Design', isSolved: false, isBookmarked: false },
  { id: 'iq-24', question: 'Design a URL shortener system.', difficulty: 'Hard', category: 'System Design', role: 'System Design', isSolved: false, isBookmarked: false },
  { id: 'iq-25', question: 'What is CI/CD and why is it important?', difficulty: 'Easy', category: 'DevOps', role: 'DevOps', isSolved: false, isBookmarked: false },
];

export const dsaProblems: DSAProblem[] = [
  { id: 'dsa-1', title: 'Two Sum', description: 'Given an array of integers, return indices of the two numbers such that they add up to a target.', difficulty: 'Easy', topic: 'Arrays', company: ['Google', 'Amazon', 'Meta'], isSolved: false, isBookmarked: false, acceptance: 49.2 },
  { id: 'dsa-2', title: 'Climbing Stairs', description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps.', difficulty: 'Easy', topic: 'Dynamic Programming', company: ['Amazon', 'Microsoft'], isSolved: false, isBookmarked: false, acceptance: 51.8 },
  { id: 'dsa-3', title: 'Coin Change', description: 'Given coins of different denominations and a total amount, return the fewest number of coins needed.', difficulty: 'Medium', topic: 'Dynamic Programming', company: ['Google', 'Amazon'], isSolved: false, isBookmarked: false, acceptance: 41.5 },
  { id: 'dsa-4', title: 'Longest Increasing Subsequence', description: 'Given an integer array, return the length of the longest strictly increasing subsequence.', difficulty: 'Medium', topic: 'Dynamic Programming', company: ['Meta', 'Microsoft'], isSolved: false, isBookmarked: false, acceptance: 52.3 },
  { id: 'dsa-5', title: 'House Robber', description: 'You are a professional robber. Adjacent houses have security system connected. Maximize amount robbed.', difficulty: 'Medium', topic: 'Dynamic Programming', company: ['Amazon', 'Apple'], isSolved: false, isBookmarked: false, acceptance: 49.7 },
  { id: 'dsa-6', title: 'Unique Paths', description: 'Robot on m x n grid. Can only move down or right. How many unique paths to bottom-right?', difficulty: 'Medium', topic: 'Dynamic Programming', company: ['Google', 'Meta'], isSolved: false, isBookmarked: false, acceptance: 63.1 },
  { id: 'dsa-7', title: 'Word Break', description: 'Given a string and dictionary, return true if string can be segmented into dictionary words.', difficulty: 'Medium', topic: 'Dynamic Programming', company: ['Amazon', 'Google', 'Meta'], isSolved: false, isBookmarked: false, acceptance: 45.7 },
  { id: 'dsa-8', title: 'Binary Tree Level Order Traversal', description: 'Given the root of a binary tree, return the level order traversal of its nodes values.', difficulty: 'Medium', topic: 'Trees', company: ['Meta', 'Microsoft', 'Amazon'], isSolved: false, isBookmarked: false, acceptance: 63.5 },
  { id: 'dsa-9', title: 'Valid Parentheses', description: 'Given a string containing just brackets, determine if the input string is valid.', difficulty: 'Easy', topic: 'Stack', company: ['Google', 'Amazon', 'Meta', 'Microsoft'], isSolved: false, isBookmarked: false, acceptance: 40.1 },
  { id: 'dsa-10', title: 'Merge Two Sorted Lists', description: 'Merge two sorted linked lists and return it as a sorted list.', difficulty: 'Easy', topic: 'Linked List', company: ['Amazon', 'Microsoft'], isSolved: false, isBookmarked: false, acceptance: 62.5 },
  { id: 'dsa-11', title: 'Best Time to Buy and Sell Stock', description: 'Find the maximum profit from a single buy and sell transaction.', difficulty: 'Easy', topic: 'Arrays', company: ['Amazon', 'Meta', 'Google'], isSolved: false, isBookmarked: false, acceptance: 54.2 },
  { id: 'dsa-12', title: 'Maximum Subarray', description: 'Find the contiguous subarray with the largest sum.', difficulty: 'Medium', topic: 'Arrays', company: ['Amazon', 'Microsoft', 'Apple'], isSolved: false, isBookmarked: false, acceptance: 50.1 },
  { id: 'dsa-13', title: 'LRU Cache', description: 'Design a data structure that follows the LRU cache eviction policy.', difficulty: 'Hard', topic: 'Design', company: ['Amazon', 'Google', 'Meta', 'Microsoft'], isSolved: false, isBookmarked: false, acceptance: 40.8 },
  { id: 'dsa-14', title: 'Merge Intervals', description: 'Given an array of intervals, merge all overlapping intervals.', difficulty: 'Medium', topic: 'Arrays', company: ['Google', 'Meta', 'Amazon'], isSolved: false, isBookmarked: false, acceptance: 46.2 },
  { id: 'dsa-15', title: 'Reverse Linked List', description: 'Reverse a singly linked list.', difficulty: 'Easy', topic: 'Linked List', company: ['Amazon', 'Microsoft', 'Apple'], isSolved: false, isBookmarked: false, acceptance: 73.4 },
  { id: 'dsa-16', title: 'Number of Islands', description: 'Given a 2D grid map, count the number of islands.', difficulty: 'Medium', topic: 'Graph', company: ['Amazon', 'Google', 'Meta'], isSolved: false, isBookmarked: false, acceptance: 56.7 },
  { id: 'dsa-17', title: 'Trapping Rain Water', description: 'Given elevation map, compute how much water it can trap after raining.', difficulty: 'Hard', topic: 'Arrays', company: ['Amazon', 'Google', 'Microsoft'], isSolved: false, isBookmarked: false, acceptance: 58.9 },
  { id: 'dsa-18', title: 'Median of Two Sorted Arrays', description: 'Find the median of two sorted arrays in O(log(m+n)) time.', difficulty: 'Hard', topic: 'Binary Search', company: ['Google', 'Amazon', 'Apple'], isSolved: false, isBookmarked: false, acceptance: 36.1 },
  { id: 'dsa-19', title: 'Serialize and Deserialize Binary Tree', description: 'Design an algorithm to serialize and deserialize a binary tree.', difficulty: 'Hard', topic: 'Trees', company: ['Meta', 'Amazon', 'Google'], isSolved: false, isBookmarked: false, acceptance: 55.3 },
  { id: 'dsa-20', title: 'Course Schedule', description: 'Determine if you can finish all courses given prerequisites (cycle detection).', difficulty: 'Medium', topic: 'Graph', company: ['Amazon', 'Microsoft', 'Google'], isSolved: false, isBookmarked: false, acceptance: 45.6 },
];

export const quizzes: Quiz[] = [
  { id: 'quiz-1', title: 'Backend: Systems Design Challenge', description: 'Test your senior-level skills. A 20-question Hard quiz on distributed systems, database internals, and advanced architecture.', questionCount: 20, difficulty: 'Hard', category: 'Tech', role: 'Backend Developer', duration: 30, isBookmarked: false },
  { id: 'quiz-2', title: 'Verbal Ability Challenge (Set I)', description: 'Test your language precision. A 20-question Medium quiz on advanced grammar, sentence correction, and vocabulary.', questionCount: 20, difficulty: 'Medium', category: 'Aptitude', role: 'General', duration: 20, isBookmarked: false },
  { id: 'quiz-3', title: 'Frontend: React Mastery', description: 'Deep dive into React concepts including hooks, context, performance optimization, and testing.', questionCount: 15, difficulty: 'Medium', category: 'Tech', role: 'Frontend Developer', duration: 25, isBookmarked: false },
  { id: 'quiz-4', title: 'Data Structures Fundamentals', description: 'Test your understanding of arrays, linked lists, trees, graphs, and hash tables.', questionCount: 25, difficulty: 'Easy', category: 'Tech', role: 'General', duration: 30, isBookmarked: false },
  { id: 'quiz-5', title: 'Quantitative Aptitude (Set I)', description: 'Practice number series, percentages, profit & loss, time & work problems.', questionCount: 20, difficulty: 'Medium', category: 'Aptitude', role: 'General', duration: 25, isBookmarked: false },
  { id: 'quiz-6', title: 'SQL Mastery Quiz', description: 'Test your SQL skills with joins, subqueries, window functions, and optimization.', questionCount: 15, difficulty: 'Hard', category: 'Tech', role: 'Backend Developer', duration: 20, isBookmarked: false },
  { id: 'quiz-7', title: 'Operating Systems Concepts', description: 'Process management, memory management, file systems, and synchronization.', questionCount: 20, difficulty: 'Medium', category: 'Tech', role: 'General', duration: 25, isBookmarked: false },
  { id: 'quiz-8', title: 'Logical Reasoning (Set I)', description: 'Blood relations, coding-decoding, syllogisms, and puzzles.', questionCount: 20, difficulty: 'Easy', category: 'Aptitude', role: 'General', duration: 20, isBookmarked: false },
];

export const coldDMTemplates: ColdDMTemplate[] = [
  { id: 'dm-1', title: 'Achievement Highlight', content: 'Hi [Recruiter Name], I recently achieved [specific accomplishment] in my role at [Company], which resulted in [quantifiable outcome]. I\'m now looking for new challenges where I can apply these skills. Would love to connect!', category: 'Skill Showcase', isCopied: false },
  { id: 'dm-2', title: 'Alumni Network Connection', content: 'Hi [Recruiter Name], I noticed we\'re both [University] alumni! I\'m currently exploring opportunities in [field] and would love to connect with fellow graduates. Your career path at [Company] is particularly inspiring.', category: 'Networking', isCopied: false },
  { id: 'dm-3', title: 'Application Follow-up', content: 'Hi [Recruiter Name], I\'ve submitted my application for [Role]. Just following up to express my enthusiasm for the position and share a bit more about why I\'d be a great fit.', category: 'Follow-up', isCopied: false },
  { id: 'dm-4', title: 'Asking for Feedback', content: 'Hello [Recruiter Name], If possible, could you share feedback on my application or resume to improve my chances? I truly value your expertise and would appreciate any guidance.', category: 'Feedback', isCopied: false },
  { id: 'dm-5', title: 'Coffee Chat Request', content: 'Hello, would you be open to a quick call or coffee chat? I\'d love to learn more about the team culture and possible opportunities at [Company]. I promise to keep it brief!', category: 'Networking', isCopied: false },
  { id: 'dm-6', title: 'Bootcamp Graduate Intro', content: 'Hi [Recruiter Name], I recently completed [bootcamp/program] in [field] and I\'m excited to start my career. What drew me to [Company] is [specific reason]. I\'d love to discuss how my fresh perspective could add value.', category: 'Introduction', isCopied: false },
  { id: 'dm-7', title: 'Career Path Question', content: 'Hello, what\'s the usual career trajectory for someone joining as [Role] at [Company]? I\'m very interested in long-term growth and would love to understand the possibilities.', category: 'Research', isCopied: false },
  { id: 'dm-8', title: 'Certification Completion', content: 'Hi [Recruiter Name], I just completed my [Certification Name] and I\'m excited to apply these new skills. [Company]\'s reputation for [specific area] makes it an ideal place to grow.', category: 'Skill Showcase', isCopied: false },
  { id: 'dm-9', title: 'Referral Request', content: 'Hi [Name], I noticed you work at [Company] and I\'m very interested in the [Role] position. Would you be comfortable referring me? I\'ve attached my resume for your review.', category: 'Referral', isCopied: false },
  { id: 'dm-10', title: 'Open Source Contributor', content: 'Hi [Name], I\'ve been contributing to [Project] and noticed [Company] uses it extensively. I\'d love to bring my deep knowledge of the codebase to your team. Can we chat?', category: 'Skill Showcase', isCopied: false },
  { id: 'dm-11', title: 'Event Follow-up', content: 'Hi [Name], great meeting you at [Event]! I really enjoyed our conversation about [Topic]. I\'d love to continue the discussion and explore how I might contribute to [Company].', category: 'Networking', isCopied: false },
  { id: 'dm-12', title: 'Project Showcase', content: 'Hi [Recruiter Name], I recently built [Project] that [description of impact]. It uses [technologies] and has [metrics]. I\'d love to bring this kind of initiative to [Company].', category: 'Skill Showcase', isCopied: false },
];

export const collections: Collection[] = [];

export const massRecruitmentCompanies: MassRecruitmentCompany[] = [
  { id: 'mr-1', name: 'TCS', logo: '🏢', interviewQuestions: 150, dsaProblems: 80, aptitudeQuestions: 120 },
  { id: 'mr-2', name: 'Infosys', logo: '🏢', interviewQuestions: 130, dsaProblems: 70, aptitudeQuestions: 100 },
  { id: 'mr-3', name: 'Wipro', logo: '🏢', interviewQuestions: 120, dsaProblems: 65, aptitudeQuestions: 90 },
  { id: 'mr-4', name: 'Cognizant', logo: '🏢', interviewQuestions: 110, dsaProblems: 60, aptitudeQuestions: 85 },
  { id: 'mr-5', name: 'HCL', logo: '🏢', interviewQuestions: 100, dsaProblems: 55, aptitudeQuestions: 80 },
  { id: 'mr-6', name: 'Tech Mahindra', logo: '🏢', interviewQuestions: 95, dsaProblems: 50, aptitudeQuestions: 75 },
  { id: 'mr-7', name: 'Capgemini', logo: '🏢', interviewQuestions: 90, dsaProblems: 48, aptitudeQuestions: 70 },
  { id: 'mr-8', name: 'Accenture', logo: '🏢', interviewQuestions: 105, dsaProblems: 58, aptitudeQuestions: 88 },
  { id: 'mr-9', name: 'L&T', logo: '🏢', interviewQuestions: 85, dsaProblems: 45, aptitudeQuestions: 65 },
  { id: 'mr-10', name: 'Zoho', logo: '🏢', interviewQuestions: 140, dsaProblems: 90, aptitudeQuestions: 60 },
  { id: 'mr-11', name: 'IBM', logo: '🏢', interviewQuestions: 115, dsaProblems: 62, aptitudeQuestions: 82 },
  { id: 'mr-12', name: 'Mindtree', logo: '🏢', interviewQuestions: 80, dsaProblems: 42, aptitudeQuestions: 60 },
];

export const jobPortals: JobPortal[] = [
  { id: 'jp-1', name: 'Naukri', description: "India's leading job portal founded in 1997, offering extensive job listings across various industries.", url: 'https://naukri.com', category: 'General', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-2', name: 'Indeed', description: "World's largest job board aggregating listings from company websites and job boards globally.", url: 'https://indeed.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-3', name: 'LinkedIn', description: 'Professional networking platform that transformed into a powerful job search engine.', url: 'https://linkedin.com/jobs', category: 'Networking', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-4', name: 'Glassdoor', description: 'Combines job searching with employee reviews and salary insights for informed decisions.', url: 'https://glassdoor.com', category: 'Research', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-5', name: 'AngelList', description: 'The go-to platform for startup jobs. Find roles at early-stage to growth-stage startups.', url: 'https://wellfound.com', category: 'Startups', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-6', name: 'Internshala', description: 'Leading platform for internships and fresher jobs in India with skill-based learning.', url: 'https://internshala.com', category: 'Internships', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-7', name: 'Unstop', description: 'Platform for competitions, hackathons, and job opportunities for students and freshers.', url: 'https://unstop.com', category: 'Competitions', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-8', name: 'Hired', description: 'Job marketplace that matches tech talent with companies. Companies apply to you.', url: 'https://hired.com', category: 'Tech', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-9', name: 'Monster', description: 'One of the pioneering job boards established in 1994, connecting millions of job seekers.', url: 'https://monster.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-10', name: 'ZipRecruiter', description: 'Modern job board that distributes listings to hundreds of job sites simultaneously.', url: 'https://ziprecruiter.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-11', name: 'Foundit', description: 'Rebranded Monster India, offering comprehensive job search solutions across industries.', url: 'https://foundit.in', category: 'General', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-12', name: 'TimesJobs', description: 'Backed by the Times Group, catering to diverse industries and career levels.', url: 'https://timesjobs.com', category: 'General', region: 'India', isFavorite: false, isApplied: false },
];

export const handwrittenNotes: HandwrittenNote[] = [
  { id: 'note-1', title: 'Beginners DSA Notes', description: 'Complete concepts and topics for beginners to get started with DSA', topic: 'DSA', pageCount: 45, thumbnailUrl: '' },
  { id: 'note-2', title: 'C++ Notes', description: 'Handwritten C++ notes covering all concepts from scratch. Best notes to solve DSA problems.', topic: 'C++', pageCount: 60, thumbnailUrl: '' },
  { id: 'note-3', title: 'JavaScript Notes', description: 'Comprehensive handwritten notes about JavaScript for absolute beginners.', topic: 'JavaScript', pageCount: 55, thumbnailUrl: '' },
  { id: 'note-4', title: 'Python Notes', description: 'Handwritten Python notes for beginners. Covers everything from scratch.', topic: 'Python', pageCount: 50, thumbnailUrl: '' },
  { id: 'note-5', title: 'DSA Advanced Notes', description: 'Master Data Structures & Algorithms with clear, concise handwritten notes.', topic: 'DSA', pageCount: 80, thumbnailUrl: '' },
  { id: 'note-6', title: 'Aptitude Notes', description: 'Sharpen problem-solving skills with notes on quantitative, logical, and verbal reasoning.', topic: 'Aptitude', pageCount: 40, thumbnailUrl: '' },
  { id: 'note-7', title: 'System Design Notes', description: 'Learn system architecture with notes on scalability, databases, caching, and design patterns.', topic: 'System Design', pageCount: 70, thumbnailUrl: '' },
  { id: 'note-8', title: 'Operating System Notes', description: 'Master OS concepts with notes on processes, memory management, concurrency, and more.', topic: 'OS', pageCount: 55, thumbnailUrl: '' },
  { id: 'note-9', title: 'DBMS Notes', description: 'Complete DBMS notes covering normalization, transactions, indexing, and SQL.', topic: 'DBMS', pageCount: 45, thumbnailUrl: '' },
  { id: 'note-10', title: 'Computer Networks Notes', description: 'OSI model, TCP/IP, HTTP, DNS, and networking fundamentals explained clearly.', topic: 'CN', pageCount: 50, thumbnailUrl: '' },
];

export const roadmaps: Roadmap[] = [
  { id: 'rm-1', title: 'Freshers Roadmap', description: 'A step-by-step guide for fresh graduates to build skills, projects, and confidence.', category: 'Freshers', isFree: true, steps: [
    { title: 'Learn a Programming Language', completed: false },
    { title: 'Master Data Structures & Algorithms', completed: false },
    { title: 'Build 2-3 Projects', completed: false },
    { title: 'Learn Git & Version Control', completed: false },
    { title: 'Practice Interview Questions', completed: false },
    { title: 'Build Your Resume', completed: false },
    { title: 'Apply to Companies', completed: false },
  ]},
  { id: 'rm-2', title: 'Backend Developer Roadmap', description: 'A complete roadmap covering programming fundamentals, database mastery, API design, frameworks, and deployment.', category: 'Backend Development', isFree: false, steps: [
    { title: 'Master a Backend Language (Node.js/Python/Java)', completed: false },
    { title: 'Learn SQL & NoSQL Databases', completed: false },
    { title: 'Build RESTful APIs', completed: false },
    { title: 'Learn Authentication & Authorization', completed: false },
    { title: 'Master Docker & Deployment', completed: false },
    { title: 'Learn System Design Basics', completed: false },
    { title: 'Build Production Projects', completed: false },
  ]},
  { id: 'rm-3', title: 'Data Science Career Roadmap', description: 'A step-by-step guide from beginner to advanced for aspiring data scientists.', category: 'Data Science', isFree: false, steps: [
    { title: 'Learn Python & Statistics', completed: false },
    { title: 'Master Pandas, NumPy, Matplotlib', completed: false },
    { title: 'Learn Machine Learning Algorithms', completed: false },
    { title: 'Practice on Kaggle Competitions', completed: false },
    { title: 'Learn Deep Learning & NLP', completed: false },
    { title: 'Build End-to-End Projects', completed: false },
  ]},
  { id: 'rm-4', title: 'Frontend Developer Roadmap', description: 'From HTML/CSS basics to React mastery - everything you need to become a frontend expert.', category: 'Frontend Development', isFree: true, steps: [
    { title: 'Master HTML5 & CSS3', completed: false },
    { title: 'Learn JavaScript Fundamentals', completed: false },
    { title: 'Learn React.js', completed: false },
    { title: 'Master State Management', completed: false },
    { title: 'Learn Testing (Jest, RTL)', completed: false },
    { title: 'Build Portfolio Projects', completed: false },
  ]},
];

export const positionResources: PositionResource[] = [
  { id: 'pr-1', role: 'Backend Developer', interviewQuestions: 120, dsaQuestions: 80, aptitudeQuestions: 40, sqlQuestions: 60, coreCSQuestions: 50 },
  { id: 'pr-2', role: 'Frontend Developer', interviewQuestions: 100, dsaQuestions: 60, aptitudeQuestions: 35, sqlQuestions: 20, coreCSQuestions: 40 },
  { id: 'pr-3', role: 'AI Engineer', interviewQuestions: 90, dsaQuestions: 70, aptitudeQuestions: 30, sqlQuestions: 40, coreCSQuestions: 45 },
  { id: 'pr-4', role: 'Data Scientist', interviewQuestions: 85, dsaQuestions: 50, aptitudeQuestions: 45, sqlQuestions: 55, coreCSQuestions: 35 },
  { id: 'pr-5', role: 'DevOps Engineer', interviewQuestions: 75, dsaQuestions: 40, aptitudeQuestions: 25, sqlQuestions: 30, coreCSQuestions: 50 },
  { id: 'pr-6', role: 'Mobile Developer', interviewQuestions: 80, dsaQuestions: 55, aptitudeQuestions: 30, sqlQuestions: 25, coreCSQuestions: 35 },
  { id: 'pr-7', role: 'System Design & Architecture', interviewQuestions: 70, dsaQuestions: 45, aptitudeQuestions: 20, sqlQuestions: 35, coreCSQuestions: 60 },
  { id: 'pr-8', role: 'QA / SDET', interviewQuestions: 65, dsaQuestions: 35, aptitudeQuestions: 40, sqlQuestions: 30, coreCSQuestions: 30 },
  { id: 'pr-9', role: 'Product Manager', interviewQuestions: 60, dsaQuestions: 20, aptitudeQuestions: 50, sqlQuestions: 15, coreCSQuestions: 20 },
  { id: 'pr-10', role: 'Data Analyst', interviewQuestions: 55, dsaQuestions: 30, aptitudeQuestions: 45, sqlQuestions: 50, coreCSQuestions: 25 },
];

export interface RecentActivity {
  id: string;
  type: 'question' | 'dsa' | 'quiz' | 'dm';
  title: string;
  description: string;
  timestamp: string;
}

export const recentActivity: RecentActivity[] = [
  { id: 'ra-1', type: 'question', title: 'Solved interview question', description: 'What is middleware in web frameworks?', timestamp: '2 hours ago' },
  { id: 'ra-2', type: 'dsa', title: 'Solved DSA problem', description: 'Two Sum - Arrays', timestamp: '5 hours ago' },
  { id: 'ra-3', type: 'quiz', title: 'Completed quiz', description: 'Backend: Systems Design Challenge - 85%', timestamp: 'Yesterday' },
  { id: 'ra-4', type: 'dm', title: 'Copied template', description: 'Achievement Highlight', timestamp: '2 days ago' },
  { id: 'ra-5', type: 'question', title: 'Bookmarked question', description: 'Explain REST vs. GraphQL', timestamp: '3 days ago' },
];

export const prepStats = {
  totalQuestions: 901,
  totalDSA: 668,
  totalQuizzes: 48,
  totalColdDMs: 120,
  questionsEasy: 192,
  questionsMedium: 226,
  questionsHard: 188,
  dsaEasy: 141,
  dsaMedium: 420,
  dsaHard: 107,
  totalJobPortals: 96,
  totalNotes: 10,
  totalRoadmaps: 4,
  totalCompanies: 12,
  totalPositions: 10,
  solvedQuestions: 0,
  solvedDSA: 0,
  completedQuizzes: 0,
  streak: 0,
};
