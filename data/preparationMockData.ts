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
  // BTech Freshers
  { id: 'dm-1', title: 'BTech Fresher - Formal Introduction', content: 'Dear [Name],\n\nI hope this email finds you well.\n\nI am currently in my final year of the BTech program at [University]. Over the past [duration], I have developed a strong proficiency in [Tech Stack] through various academic and independent projects.\n\nI have been closely following [Company]\'s recent advancements in [specific area], and I am very interested in the fresh graduate opportunities within your engineering team. I would appreciate the chance to discuss how my academic background and technical skills align with your current objectives.\n\nThank you for your time and consideration.', category: 'BTech Freshers', isCopied: false },
  { id: 'dm-2', title: 'Campus to Corporate Alignment', content: 'Dear [Recruiter Name],\n\nI hope you are having a productive week.\n\nI am reaching out to express my strong interest in the [Role] position at [Company], as I approach my graduation with a BTech degree in [Month/Year]. My final year capstone project, which focused on [Topic], mirrors the innovative work your team is currently executing.\n\nI have attached my resume for your review. I would welcome the opportunity to connect briefly and learn more about your expectations for early-career engineers at [Company].\n\nBest regards,\n[Your Name]', category: 'BTech Freshers', isCopied: false },
  { id: 'dm-3', title: 'Junior Developer Portfolio Share', content: 'Dear [Name],\n\nI am writing to express my enthusiasm for the Junior Developer roles at [Company].\n\nAs a recent BTech graduate, I have built a solid foundation in [Skill 1] and [Skill 2]. I am particularly drawn to [Company] because of your commitment to [Company Value/Recent Project].\n\nI have compiled my recent technical projects and open-source contributions in my portfolio [Link]. I would be grateful if you could take a moment to review it when convenient. I am eager to bring my dedication and technical aptitude to your team.\n\nSincerely,\n[Your Name]', category: 'BTech Freshers', isCopied: false },

  // Internships
  { id: 'dm-4', title: 'Strategic Internship Pitch', content: 'Dear [Name],\n\nI am writing to express my interest in pursuing a summer internship with the [Department/Team] at [Company].\n\nI have closely followed your team\'s work on [Project], and I am highly impressed by [specific detail]. As a student specializing in [Field], I have cultivated hands-on experience with [Skill/Tool]. I am confident that my background will allow me to contribute meaningfully to your upcoming initiatives.\n\nAre you currently considering candidates for summer internship roles? I would appreciate the opportunity to share my resume.\n\nBest regards,\n[Your Name]', category: 'Internships', isCopied: false },
  { id: 'dm-5', title: 'Pre-final Year Proactive Inquiry', content: 'Dear [Recruiter Name],\n\nI hope this message finds you well.\n\nI am a pre-final year student deeply invested in [Domain]. Your recent engineering blog post regarding [Topic] resonated strongly with me and highlighted the caliber of work at [Company].\n\nI am proactively seeking internship opportunities for the upcoming term and would value the chance to discuss how my skill set in [Skill] might align with your team\'s needs. \n\nThank you for your time.\n\nSincerely,\n[Your Name]', category: 'Internships', isCopied: false },
  { id: 'dm-6', title: 'Off-campus Value Proposition', content: 'Dear [Name],\n\nI am writing to inquire about potential off-campus internship opportunities within your team at [Company].\n\nThrough my academic coursework and independent projects, I have developed a strong competency in [Field]. For instance, I recently engineered a [Project type] that achieved [specific result/metric]. \n\nI am eager to apply this proactive, problem-solving mindset to the [Department] at [Company]. I have attached my resume and would be delighted to schedule a brief call to discuss potential synergies.\n\nBest,\n[Your Name]', category: 'Internships', isCopied: false },

  // Referral
  { id: 'dm-7', title: 'Alumni Network Referral', content: 'Dear [Name],\n\nI hope you are doing well.\n\nAs a fellow alumnus of [University], I have been admiring your career progression at [Company]. I am currently preparing to apply for the [Role] position and was hoping to connect.\n\nIf you have a few moments, I would greatly appreciate your insights on the team culture. Furthermore, if you feel my background in [Skill] is a strong fit, I would be very grateful if you might consider submitting a referral on my behalf.\n\nThank you for considering this request.\n\nBest regards,\n[Your Name]', category: 'Referral', isCopied: false },
  { id: 'dm-8', title: 'Performance-Based Referral Request', content: 'Dear [Name],\n\nI hope this email finds you well.\n\nI have been closely following your impactful work regarding [Project/Topic]. I am reaching out because I intend to apply for the [Role] opening at [Company], and I believe my recent success in driving [Metric/Result] at [Current Company] aligns well with this position.\n\nI have attached my resume for your perusal. Should you find my profile compelling, would you be open to providing a referral? I would be happy to provide any additional context you might need.\n\nSincerely,\n[Your Name]', category: 'Referral', isCopied: false },
  { id: 'dm-9', title: 'Professional Acquaintance Outreach', content: 'Dear [Name],\n\nIt has been quite some time since we last connected regarding [Past Interaction]. I hope you have been thriving at [Company].\n\nI recently noticed the opening for the [Role] on your team. Over the past year, I have deepened my expertise in [Skill] and successfully managed [Project]. Given our past interactions and my current trajectory, I plan to submit my application this week.\n\nWould you be open to supporting my application with a referral? I value your endorsement highly.\n\nBest,\n[Your Name]', category: 'Referral', isCopied: false },

  // Networking
  { id: 'dm-10', title: 'Informational Interview Request', content: 'Dear [Name],\n\nI recently read your publication on [Topic] and was thoroughly impressed by your perspective on [specific point].\n\nI am currently a [Your Role] actively exploring opportunities in the [Field] sector. I admire the trajectory of your career at [Company] and would be incredibly grateful for the opportunity to have a brief, 15-minute informational interview to hear your insights on the industry.\n\nAre you available for a brief virtual coffee next week?\n\nThank you for your time,\n[Your Name]', category: 'Networking', isCopied: false },
  { id: 'dm-11', title: 'Strategic Industry Connection', content: 'Dear [Name],\n\nI hope this message finds you well.\n\nAs a professional working in [Your Industry], I closely monitor the leaders driving innovation in [Field]. [Company]\'s recent strategic move regarding [Topic] is highly commendable.\n\nI am seeking to broaden my professional network with forward-thinking individuals in this space. I would appreciate the opportunity to connect and stay updated on your work.\n\nBest regards,\n[Your Name]', category: 'Networking', isCopied: false },
  { id: 'dm-12', title: 'Post-Event Professional Follow-up', content: 'Dear [Name],\n\nIt was a pleasure meeting you at the recent [Event Name]. Our discussion regarding the challenges in [Topic] was highly insightful.\n\nI am keen to stay in touch as we both navigate the evolving landscape of [Field]. I look forward to following your continued success at [Company] and hope we can cross paths again in the near future.\n\nSincerely,\n[Your Name]', category: 'Networking', isCopied: false },

  // Professionals
  { id: 'dm-13', title: 'Senior Contributor Transition', content: 'Dear [Recruiter Name],\n\nI hope this email finds you well.\n\nI am an experienced [Role] with [X] years of tenure in the [Industry] sector, currently at [Current Company]. Over my career, I have specialized in [Key Skill] and consistently delivered [Key Metric/Impact].\n\nI am currently evaluating new opportunities where I can leverage this expertise to drive strategic value, and [Company]\'s vision aligns perfectly with my ambitions. I would welcome the opportunity to connect and discuss potential synergies.\n\nBest regards,\n[Your Name]', category: 'Professionals', isCopied: false },
  { id: 'dm-14', title: 'Leadership Opportunity Exploration', content: 'Dear [Name],\n\nI am reaching out regarding potential leadership opportunities within the [Department] at [Company].\n\nIn my current capacity as [Role], I have successfully scaled teams and spearheaded initiatives that resulted in [Quantifiable Result]. I am highly impressed by [Company]\'s recent market expansion and am seeking a role where I can contribute to this accelerated growth.\n\nI have attached my executive summary for your review. Are you open to a brief introductory conversation?\n\nSincerely,\n[Your Name]', category: 'Professionals', isCopied: false },
  { id: 'dm-15', title: 'Niche Domain Expert Proposition', content: 'Dear [Name],\n\nI hope you are having a productive week.\n\nWith over [X] years of specialized experience in [Niche Tech/Domain], I have architected solutions that resolved [Complex Problem]. I note that [Company] is currently focusing heavily on [Related Area].\n\nI am interested in roles that demand deep domain expertise and would appreciate the opportunity to discuss how my highly specialized background could serve as an asset to your team.\n\nBest regards,\n[Your Name]', category: 'Professionals', isCopied: false },

  // Startups
  { id: 'dm-16', title: 'Founder Pitch - Scaling Operations', content: 'Dear [Founder Name],\n\nCongratulations on the successful close of your recent funding round. \n\nI am a [Role] with a proven track record of operating effectively in zero-to-one environments. I specialize in building scalable [Systems/Processes] that support hyper-growth, as demonstrated during my tenure at [Previous Startup].\n\nI am deeply passionate about your mission at [Startup] and would welcome the opportunity to discuss how I might contribute to accelerating your immediate roadmap.\n\nBest,\n[Your Name]', category: 'Startups', isCopied: false },
  { id: 'dm-17', title: 'Founding Team Inquiry', content: 'Dear [Name],\n\nI have been following [Startup]\'s progress, and your approach to solving [Problem] is exceptionally innovative.\n\nI am a seasoned [Role] who thrives in ambiguous, fast-paced environments. I noticed you are expanding your core engineering team and I am highly interested in bringing my expertise in [Skill] to your foundation.\n\nAre you available for a brief discussion this week regarding your technical challenges?\n\nSincerely,\n[Your Name]', category: 'Startups', isCopied: false },
  { id: 'dm-18', title: 'Startup Value Add Proposition', content: 'Dear [Name],\n\nI am writing to express my enthusiasm for the product you are building at [Startup].\n\nAs a [Role] accustomed to wearing multiple hats, I excel at bridging the gap between [Function A] and [Function B] to drive product velocity. I am eager to apply this cross-functional expertise to help scale your operations.\n\nI would be grateful for the opportunity to share my resume and discuss your upcoming hiring needs.\n\nBest regards,\n[Your Name]', category: 'Startups', isCopied: false },

  // Freelance
  { id: 'dm-19', title: 'B2B Freelance Consultation', content: 'Dear [Name],\n\nI have been observing [Company]\'s recent expansion into [Domain].\n\nI operate as an independent [Role] consultant, and I recently partnered with [Client] to optimize their [Process/Metric], resulting in a [X]% improvement within [Timeframe]. \n\nI believe there is significant potential to drive similar results for your team. Would you be open to a 10-minute discovery call next week to explore potential contract collaborations?\n\nBest,\n[Your Name]', category: 'Freelance', isCopied: false },
  { id: 'dm-20', title: 'Contract Bandwidth Support', content: 'Dear [Name],\n\nI hope this email finds you well.\n\nI specialize in providing robust, on-demand freelance [Service] for enterprise-level platforms. If your engineering or design teams anticipate needing specialized expertise or temporary bandwidth for upcoming quarterly initiatives, I would love to connect.\n\nI have attached a brief overview of my recent contract deliverables for your reference.\n\nSincerely,\n[Your Name]', category: 'Freelance', isCopied: false },
  { id: 'dm-21', title: 'Targeted Portfolio Submission', content: 'Dear [Name],\n\nI am an independent [Role] with a strong affinity for [Company]\'s brand aesthetic and technical execution.\n\nI recently delivered a [Project Type] that bears striking similarities to your upcoming [Target Initiative]. I have detailed a case study of this engagement in my portfolio: [Link].\n\nI am currently onboarding new clients for Q3 and would appreciate the opportunity to discuss how we might collaborate.\n\nBest regards,\n[Your Name]', category: 'Freelance', isCopied: false },

  // Skill Showcase
  { id: 'dm-22', title: 'Open Source Contribution Leverage', content: 'Dear [Name],\n\nI am reaching out regarding the open roles on your engineering team.\n\nI am a consistent contributor to [Open Source Project], which I understand serves as a core technology in [Company]\'s stack. My deep familiarity with its architecture and recent commits regarding [Feature] position me to add immediate value to your infrastructure.\n\nI would welcome an opportunity to discuss my technical background in greater detail.\n\nSincerely,\n[Your Name]', category: 'Skill Showcase', isCopied: false },
  { id: 'dm-23', title: 'Data-Backed Side Project Reality', content: 'Dear [Recruiter Name],\n\nI am writing to express my interest in the [Role] position.\n\nTo demonstrate my proficiency in [Tech Stack], I recently independently engineered a solution for [Problem], which scaled to [X] active users in its first month while maintaining high performance. \n\nI am eager to bring this same level of initiative, architectural focus, and problem-solving capability to the enterprise challenges at [Company]. My resume is attached for your review.\n\nBest,\n[Your Name]', category: 'Skill Showcase', isCopied: false },
  { id: 'dm-24', title: 'Competitive Hackathon Success', content: 'Dear [Name],\n\nI hope this message finds you well.\n\nRecently, my team was awarded first place at [Hackathon] for developing a scalable solution addressing [Problem]. This required rapid iteration, robust architecture in [Tech Stack], and flawless cross-functional execution.\n\nAs a highly capable [Role], I am looking to apply this rigorous, solutions-oriented mindset to the engineering organization at [Company]. I would welcome a brief conversation.\n\nBest regards,\n[Your Name]', category: 'Skill Showcase', isCopied: false },

  // Follow-up
  { id: 'dm-25', title: 'Formal Post-Interview Gratitude', content: 'Dear [Name],\n\nThank you sincerely for taking the time to speak with me yesterday regarding the [Role] position.\n\nOur conversation regarding your team\'s approach to [Specific Project discussed] reinforced my strong interest in joining [Company]. I am highly confident that my background in [Skill] will allow me to contribute immediately and effectively to those goals.\n\nI look forward to discussing the next steps in the process.\n\nSincerely,\n[Your Name]', category: 'Follow-up', isCopied: false },
  { id: 'dm-26', title: 'Application Status Update Check', content: 'Dear [Recruiter Name],\n\nI hope you are having a productive week.\n\nI am writing to respectfully follow up on the application I submitted two weeks ago for the [Role] position. I remain highly enthusiastic about the prospect of joining [Company].\n\nAdditionally, I wanted to share a recent case study I completed [Link] that directly reflects the core competencies outlined in your job description. \n\nThank you for your time and continued consideration.\n\nBest regards,\n[Your Name]', category: 'Follow-up', isCopied: false },
  { id: 'dm-27', title: 'Professional Rejection Follow-up', content: 'Dear [Name],\n\nThank you for updating me regarding the [Role] position. \n\nWhile I am naturally disappointed not to be advancing, I greatly appreciated the opportunity to learn more about [Company] and the innovative work your team is doing.\n\nI remain very interested in your organization and would be honored to stay connected for future opportunities where my skills might be a better alignment.\n\nWishing you and the team continued success.\n\nBest,\n[Your Name]', category: 'Follow-up', isCopied: false },

  // Feedback
  { id: 'dm-28', title: 'Executive Resume Review Request', content: 'Dear [Name],\n\nI have profound respect for the leadership you bring to the [Field] industry.\n\nAs an emerging [Role], I am actively refining my professional narrative to ensure it resonates with top-tier organizations. Given your executive perspective, I would be incredibly grateful if you might spare a few minutes to provide candid feedback on the structure and impact of my resume.\n\nI understand your time is valuable, and I appreciate your consideration.\n\nSincerely,\n[Your Name]', category: 'Feedback', isCopied: false },
  { id: 'dm-29', title: 'Design/Technical Portfolio Critique', content: 'Dear [Name],\n\nI have long admired your distinct technical and creative direction at [Company].\n\nI have recently overhauled my [Role] portfolio to better reflect enterprise-level standards. I am seeking perspectives from industry leaders, and a critique from you would be invaluable to my development.\n\nWould you be open to providing a brief review of my work? [Link]\n\nThank you for your time,\n[Your Name]', category: 'Feedback', isCopied: false },
  { id: 'dm-30', title: 'Post-Interview Constructive Feedback', content: 'Dear [Name],\n\nThank you once again for your time during my recent interview process for the [Role].\n\nAs a professional committed to continuous improvement, I am eager to understand areas where I can strengthen my candidacy. If company policy allows, would you be willing to share any specific, constructive feedback regarding my technical assessment or general presentation?\n\nI would deeply appreciate your guidance.\n\nBest regards,\n[Your Name]', category: 'Feedback', isCopied: false },

  // Career Change
  { id: 'dm-31', title: 'Industry Pivot Introduction', content: 'Dear [Name],\n\nI hope this message finds you well.\n\nAfter [X] years building a strong foundation in [Previous Industry], I am making a deliberate transition into [Target Industry]. My background in [Transferable Skill] has given me a unique lens that I believe offers genuine value in this new domain.\n\nI have spent the past [Duration] upskilling in [Relevant Skill/Tool] and recently completed [Certification/Project] to validate this transition.\n\nI would greatly appreciate 15 minutes of your time to hear your perspective on breaking into [Target Industry].\n\nBest regards,\n[Your Name]', category: 'Career Change', isCopied: false },
  { id: 'dm-32', title: 'Adjacent Role Exploration', content: 'Dear [Recruiter Name],\n\nI am writing to express my interest in pivoting from [Current Role] to [Target Role] within the [Industry] space.\n\nWhile my career path may appear non-linear, my experience in [Skill A] and [Skill B] directly underpins the core competencies required for [Target Role]. I recently completed [Project/Course] that has further solidified my technical foundation.\n\nI am confident my cross-disciplinary perspective would be a genuine asset to [Company]. I have attached my resume and a brief transition narrative for your review.\n\nSincerely,\n[Your Name]', category: 'Career Change', isCopied: false },

  // Remote Work
  { id: 'dm-33', title: 'Remote Opportunity Inquiry', content: 'Dear [Name],\n\nI hope you are having a great week.\n\nI am a [Role] with [X] years of experience working in fully distributed teams across multiple time zones. I am currently seeking my next remote engagement and have been particularly drawn to [Company]\'s async-first culture.\n\nI have consistently delivered [Key Metric/Outcome] in remote settings, leveraging tools like [Tools] to maintain seamless collaboration. I would love to explore whether there is a remote opening on your team.\n\nBest,\n[Your Name]', category: 'Remote Work', isCopied: false },
  { id: 'dm-34', title: 'Global Remote Specialist Outreach', content: 'Dear [Name],\n\nWith [X] years of remote work experience spanning clients across [Regions/Time Zones], I have developed a refined ability to deliver high-impact results without geographic constraints.\n\nI recently came across [Company]\'s distributed team model, and I am highly aligned with your working philosophy. My expertise in [Skill] and demonstrated ability to self-manage complex deliverables makes me a strong candidate for any remote openings on your team.\n\nAre you currently expanding your remote workforce?\n\nBest regards,\n[Your Name]', category: 'Remote Work', isCopied: false },

  // Relocation
  { id: 'dm-35', title: 'Relocation Candidate Outreach', content: 'Dear [Recruiter Name],\n\nI am a [Role] currently based in [Current Location] and planning a confirmed relocation to [Target City] in [Month/Year].\n\nI am proactively reaching out to leading organizations in the area, and [Company]\'s work in [Domain] stands out significantly. With [X] years of experience in [Skill], I am eager to contribute to a new market.\n\nI am fully self-funded for the relocation and available for on-site interviews with advance notice. Would you be open to a brief introductory call?\n\nSincerely,\n[Your Name]', category: 'Relocation', isCopied: false },

  // Return to Work
  { id: 'dm-36', title: 'Career Re-entry Narrative', content: 'Dear [Name],\n\nI hope this message finds you well.\n\nAfter a [Duration] career break for [Reason: caregiving, health, personal], I am re-entering the workforce with renewed focus and a commitment to contributing at a high level.\n\nDuring my time away, I remained professionally engaged by [Activity: freelancing, upskilling, volunteering]. I am eager to bring my prior experience in [Skill/Domain] combined with this fresh perspective to a dynamic team at [Company].\n\nI would welcome the opportunity to connect.\n\nBest regards,\n[Your Name]', category: 'Return to Work', isCopied: false },

  // Mentorship
  { id: 'dm-37', title: 'Mentorship Request - Early Career', content: 'Dear [Name],\n\nI have followed your work in [Field] for some time and consistently find your insights on [Topic] to be both practical and forward-thinking.\n\nAs an early-career [Role] navigating the complexities of [Industry], I am seeking a mentor whose experience can help me avoid common pitfalls and accelerate my growth. I am not looking to take up significant time — even a quarterly check-in would be profoundly valuable.\n\nWould you be open to an introductory conversation to see if there is a good fit?\n\nThank you sincerely,\n[Your Name]', category: 'Mentorship', isCopied: false },
  { id: 'dm-38', title: 'Mentorship Offer to Junior Talent', content: 'Dear [Name],\n\nI came across your profile while reviewing contributions to [Community/Project], and I was genuinely impressed by your initiative at such an early stage of your career.\n\nAs someone who has spent [X] years navigating the [Industry] landscape, I understand how challenging the early stages can be. I periodically offer informal mentorship to motivated professionals, and I would be glad to support your development if you are open to it.\n\nFeel free to reach out if this resonates.\n\nBest,\n[Your Name]', category: 'Mentorship', isCopied: false },

  // Internal Mobility
  { id: 'dm-39', title: 'Internal Promotion Advocacy Letter', content: 'Dear [Manager Name],\n\nI would like to formally express my interest in the [Target Role] opening within our team.\n\nOver the past [Duration], I have consistently exceeded my KPIs in [Area], led the successful delivery of [Project], and mentored [X] junior team members. I believe I have demonstrated both the technical competency and leadership maturity required for this step.\n\nI would welcome the opportunity to discuss my candidacy and understand what a successful transition would look like in your view.\n\nBest regards,\n[Your Name]', category: 'Internal Mobility', isCopied: false },
  { id: 'dm-40', title: 'Cross-Department Transfer Request', content: 'Dear [Name],\n\nI hope you are well.\n\nAfter [Duration] in the [Current Department], I am eager to bring my skills to the [Target Department] team. Having closely observed your team\'s work on [Project], I am confident that my background in [Skill] would translate effectively and add immediate value.\n\nI have already spoken informally with [Colleague/Manager] about this interest and received encouraging feedback. I would appreciate the opportunity to discuss this with you directly.\n\nSincerely,\n[Your Name]', category: 'Internal Mobility', isCopied: false },

  // Contract-to-Hire
  { id: 'dm-41', title: 'Contract-to-Hire Interest', content: 'Dear [Recruiter Name],\n\nI am writing to express my interest in the contract-to-hire [Role] opportunity at [Company].\n\nI am a [Role] with [X] years of hands-on experience in [Skill]. I particularly value the contract-to-hire model as it allows both parties to assess fit before making a long-term commitment — an approach I strongly endorse.\n\nI am available to begin immediately and am highly motivated to demonstrate my capabilities quickly. I have attached my resume for your review.\n\nBest,\n[Your Name]', category: 'Contract-to-Hire', isCopied: false },

  // Professionals (additional)
  { id: 'dm-42', title: 'Competitor Talent Outreach', content: 'Dear [Name],\n\nI hope this email finds you well.\n\nI have been tracking [Company]\'s growth trajectory and strategic direction closely, and I am genuinely impressed by the velocity of your recent product launches in [Area].\n\nHaving spent [X] years at [Competitor/Similar Company], I bring direct domain knowledge and a strong strategic understanding of the market dynamics you are navigating. I am confident that this insider perspective would be an asset to your team.\n\nWould you be open to a confidential introductory conversation?\n\nBest regards,\n[Your Name]', category: 'Professionals', isCopied: false },
  { id: 'dm-44', title: 'Executive Cold Outreach', content: 'Dear [Executive Name],\n\nI will be brief, as I understand your time is limited.\n\nI am a [Role] with a demonstrated track record of [Key Result] in the [Industry] sector. Having followed [Company]\'s strategic direction under your leadership, I believe there is a compelling opportunity to discuss how my background could contribute to your [Specific Initiative].\n\nI would welcome 20 minutes on your calendar at your earliest convenience.\n\nRespectfully,\n[Your Name]', category: 'Professionals', isCopied: false },

  // Networking (additional)
  { id: 'dm-43', title: 'Speaking Engagement Proposal', content: 'Dear [Name],\n\nI have been a consistent attendee of [Conference/Event] and deeply admire the caliber of discourse you curate.\n\nI am writing to propose a speaking session on [Topic], a subject where I have developed significant hands-on expertise. I recently presented on this at [Previous Event] to strong audience engagement, and I believe it would resonate powerfully with your [Year] attendees.\n\nI have attached a brief speaker proposal for your consideration. I would be honored to discuss this further.\n\nSincerely,\n[Your Name]', category: 'Networking', isCopied: false },

  // Skill Showcase (additional)
  { id: 'dm-45', title: 'Published Research Outreach', content: 'Dear [Name],\n\nI recently published a paper on [Topic] in [Journal/Platform], which directly intersects with the engineering challenges your team is addressing at [Company].\n\nThe research demonstrates [Key Finding], which I believe has direct practical application to [Company\'s specific challenge]. I am eager to bridge the gap between this research and real-world implementation.\n\nWould you be open to a brief technical discussion? I am happy to share a pre-print of the paper in advance.\n\nBest regards,\n[Your Name]', category: 'Skill Showcase', isCopied: false },
];

export const collections: Collection[] = [];

export const CompanyNames = [
  "TCS", "Infosys",  "Wipro",  "Cognizant",  "HCL",  "Tech Mahindra",  "Capgemini",  "Accenture",  "L&T", 
   "Zoho",  "IBM",  "Mindtree",  "Google",  "Microsoft",  "Amazon",  "Meta",  "Apple",  "Oracle",  "Adobe",
  "Salesforce",  "Flipkart",  "Paytm",  "Deloitte",  "EY",  "KPMG",  "PwC"];

// export const massRecruitmentCompanies: MassRecruitmentCompany[] = [
//   { id: 'mr-1', name: 'TCS', logo: '🏢', interviewQuestions: 150, dsaProblems: 80, aptitudeQuestions: 120 },
//   { id: 'mr-2', name: 'Infosys', logo: '🏢', interviewQuestions: 130, dsaProblems: 70, aptitudeQuestions: 100 },
//   { id: 'mr-3', name: 'Wipro', logo: '🏢', interviewQuestions: 120, dsaProblems: 65, aptitudeQuestions: 90 },
//   { id: 'mr-4', name: 'Cognizant', logo: '🏢', interviewQuestions: 110, dsaProblems: 60, aptitudeQuestions: 85 },
//   { id: 'mr-5', name: 'HCL', logo: '🏢', interviewQuestions: 100, dsaProblems: 55, aptitudeQuestions: 80 },
//   { id: 'mr-6', name: 'Tech Mahindra', logo: '🏢', interviewQuestions: 95, dsaProblems: 50, aptitudeQuestions: 75 },
//   { id: 'mr-7', name: 'Capgemini', logo: '🏢', interviewQuestions: 90, dsaProblems: 48, aptitudeQuestions: 70 },
//   { id: 'mr-8', name: 'Accenture', logo: '🏢', interviewQuestions: 105, dsaProblems: 58, aptitudeQuestions: 88 },
//   { id: 'mr-9', name: 'L&T', logo: '🏢', interviewQuestions: 85, dsaProblems: 45, aptitudeQuestions: 65 },
//   { id: 'mr-10', name: 'Zoho', logo: '🏢', interviewQuestions: 140, dsaProblems: 90, aptitudeQuestions: 60 },
//   { id: 'mr-11', name: 'IBM', logo: '🏢', interviewQuestions: 115, dsaProblems: 62, aptitudeQuestions: 82 },
//   { id: 'mr-12', name: 'Mindtree', logo: '🏢', interviewQuestions: 80, dsaProblems: 42, aptitudeQuestions: 60 },
// ];

export const jobPortals: JobPortal[] = [
  { id: 'jp-1', name: 'Naukri', logo: 'https://www.google.com/s2/favicons?domain=naukri.com&sz=128', description: "India's leading job portal founded in 1997, offering extensive job listings across various industries.", url: 'https://naukri.com', category: 'General', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-2', name: 'Indeed', logo: 'https://www.google.com/s2/favicons?domain=indeed.com&sz=128', description: "World's largest job board aggregating listings from company websites and job boards globally.", url: 'https://indeed.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-3', name: 'LinkedIn', logo: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=128', description: 'Professional networking platform that transformed into a powerful job search engine.', url: 'https://linkedin.com/jobs', category: 'Networking', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-4', name: 'Glassdoor', logo: 'https://www.google.com/s2/favicons?domain=glassdoor.com&sz=128', description: 'Combines job searching with employee reviews and salary insights for informed decisions.', url: 'https://glassdoor.com', category: 'Research', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-5', name: 'AngelList', logo: 'https://www.google.com/s2/favicons?domain=wellfound.com&sz=128', description: 'The go-to platform for startup jobs. Find roles at early-stage to growth-stage startups.', url: 'https://wellfound.com', category: 'Startups', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-6', name: 'Internshala', logo: 'https://www.google.com/s2/favicons?domain=internshala.com&sz=128', description: 'Leading platform for internships and fresher jobs in India with skill-based learning.', url: 'https://internshala.com', category: 'Internships', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-7', name: 'Unstop', logo: 'https://www.google.com/s2/favicons?domain=unstop.com&sz=128', description: 'Platform for competitions, hackathons, and job opportunities for students and freshers.', url: 'https://unstop.com', category: 'Competitions', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-8', name: 'Hired', logo: 'https://www.google.com/s2/favicons?domain=hired.com&sz=128', description: 'Job marketplace that matches tech talent with companies. Companies apply to you.', url: 'https://hired.com', category: 'Tech', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-9', name: 'Monster', logo: 'https://www.google.com/s2/favicons?domain=monster.com&sz=128', description: 'One of the pioneering job boards established in 1994, connecting millions of job seekers.', url: 'https://monster.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-10', name: 'ZipRecruiter', logo: 'https://www.google.com/s2/favicons?domain=ziprecruiter.com&sz=128', description: 'Modern job board that distributes listings to hundreds of job sites simultaneously.', url: 'https://ziprecruiter.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-11', name: 'Foundit', logo: 'https://www.google.com/s2/favicons?domain=foundit.in&sz=128', description: 'Rebranded Monster India, offering comprehensive job search solutions across industries.', url: 'https://foundit.in', category: 'General', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-12', name: 'TimesJobs', logo: 'https://www.google.com/s2/favicons?domain=timesjobs.com&sz=128', description: 'Backed by the Times Group, catering to diverse industries and career levels.', url: 'https://timesjobs.com', category: 'General', region: 'India', isFavorite: false, isApplied: false },
  { id: 'jp-13', name: 'YC Work at a Startup', logo: 'https://www.google.com/s2/favicons?domain=workatastartup.com&sz=128', description: 'Apply to top Y Combinator startups directly. Get hired by fast-growing companies.', url: 'https://www.workatastartup.com', category: 'Startups', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-14', name: 'Dice', logo: 'https://www.google.com/s2/favicons?domain=dice.com&sz=128', description: 'Leading database for technology professionals, connecting tech talent with employers.', url: 'https://www.dice.com', category: 'Tech', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-15', name: 'Remote OK', logo: 'https://www.google.com/s2/favicons?domain=remoteok.com&sz=128', description: 'The #1 remote job board to find remote jobs and work from anywhere.', url: 'https://remoteok.com', category: 'Remote', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-16', name: 'SimplyHired', logo: 'https://www.google.com/s2/favicons?domain=simplyhired.com&sz=128', description: 'Aggregates job listings from thousands of websites and job boards globally.', url: 'https://www.simplyhired.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-17', name: 'FlexJobs', logo: 'https://www.google.com/s2/favicons?domain=flexjobs.com&sz=128', description: 'Find the best remote, part-time, freelance, and flexible jobs available.', url: 'https://www.flexjobs.com', category: 'Remote', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-18', name: 'Snagajob', logo: 'https://www.google.com/s2/favicons?domain=snagajob.com&sz=128', description: 'The #1 platform for hourly work, connecting job seekers with local opportunities.', url: 'https://www.snagajob.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-19', name: 'Ladders', logo: 'https://www.google.com/s2/favicons?domain=theladders.com&sz=128', description: 'Focused on high-paying jobs ($100K+) for experienced professionals.', url: 'https://www.theladders.com', category: 'Tech', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-20', name: 'CareerBuilder', logo: 'https://www.google.com/s2/favicons?domain=careerbuilder.com&sz=128', description: 'One of the largest online job sites offering AI-driven talent acquisition solutions.', url: 'https://www.careerbuilder.com', category: 'General', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-21', name: 'Upwork', logo: 'https://www.google.com/s2/favicons?domain=upwork.com&sz=128', description: 'The worlds largest work marketplace. Connecting businesses with independent talent.', url: 'https://www.upwork.com', category: 'Freelance', region: 'Global', isFavorite: false, isApplied: false },
  { id: 'jp-22', name: 'Fiverr', logo: 'https://www.google.com/s2/favicons?domain=fiverr.com&sz=128', description: 'Find the perfect freelance services for your business on the premier freelance marketplace.', url: 'https://www.fiverr.com', category: 'Freelance', region: 'Global', isFavorite: false, isApplied: false },
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
  {
    id: 'rm-1', title: 'Freshers Roadmap', description: 'A step-by-step guide for fresh graduates to build skills, projects, and confidence.', category: 'Freshers', isFree: true, steps: [
      { title: 'Learn a Programming Language', completed: false },
      { title: 'Master Data Structures & Algorithms', completed: false },
      { title: 'Build 2-3 Projects', completed: false },
      { title: 'Learn Git & Version Control', completed: false },
      { title: 'Practice Interview Questions', completed: false },
      { title: 'Build Your Resume', completed: false },
      { title: 'Apply to Companies', completed: false },
    ]
  },
  {
    id: 'rm-2', title: 'Backend Developer Roadmap', description: 'A complete roadmap covering programming fundamentals, database mastery, API design, frameworks, and deployment.', category: 'Backend Development', isFree: false, steps: [
      { title: 'Master a Backend Language (Node.js/Python/Java)', completed: false },
      { title: 'Learn SQL & NoSQL Databases', completed: false },
      { title: 'Build RESTful APIs', completed: false },
      { title: 'Learn Authentication & Authorization', completed: false },
      { title: 'Master Docker & Deployment', completed: false },
      { title: 'Learn System Design Basics', completed: false },
      { title: 'Build Production Projects', completed: false },
    ]
  },
  {
    id: 'rm-3', title: 'Data Science Career Roadmap', description: 'A step-by-step guide from beginner to advanced for aspiring data scientists.', category: 'Data Science', isFree: false, steps: [
      { title: 'Learn Python & Statistics', completed: false },
      { title: 'Master Pandas, NumPy, Matplotlib', completed: false },
      { title: 'Learn Machine Learning Algorithms', completed: false },
      { title: 'Practice on Kaggle Competitions', completed: false },
      { title: 'Learn Deep Learning & NLP', completed: false },
      { title: 'Build End-to-End Projects', completed: false },
    ]
  },
  {
    id: 'rm-4', title: 'Frontend Developer Roadmap', description: 'From HTML/CSS basics to React mastery - everything you need to become a frontend expert.', category: 'Frontend Development', isFree: true, steps: [
      { title: 'Master HTML5 & CSS3', completed: false },
      { title: 'Learn JavaScript Fundamentals', completed: false },
      { title: 'Learn React.js', completed: false },
      { title: 'Master State Management', completed: false },
      { title: 'Learn Testing (Jest, RTL)', completed: false },
      { title: 'Build Portfolio Projects', completed: false },
    ]
  },
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
