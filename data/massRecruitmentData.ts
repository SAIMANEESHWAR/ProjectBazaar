export interface MRQuestion {
  id: string;
  question: string;
  category?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isSolved: boolean;
  isRevision: boolean;
}

export interface CompanyData {
  id: string;
  name: string;
  logo: string;
  interviewQuestions: MRQuestion[];
  dsaQuestions: MRQuestion[];
  aptitudeQuestions: MRQuestion[];
  sqlQuestions: MRQuestion[];
  coreCSQuestions: MRQuestion[];
}

export type MRSubTabKey = 'interview' | 'dsa' | 'aptitude' | 'sql' | 'corecs';

export const mrSubTabConfig: { key: MRSubTabKey; label: string; titleTemplate: string; subtitleTemplate: string }[] = [
  { key: 'interview', label: 'Interview Questions', titleTemplate: 'Interview Questions for {company}', subtitleTemplate: 'Most asked interview questions in interviews at {company}. Prepare with role-specific questions.' },
  { key: 'dsa', label: 'DSA', titleTemplate: 'DSA Questions for {company}', subtitleTemplate: 'Most asked DSA questions in interviews at {company}. Practice problem-solving skills.' },
  { key: 'aptitude', label: 'Aptitude', titleTemplate: 'Aptitude Questions for {company}', subtitleTemplate: 'Most asked aptitude questions in assessments at {company}. Sharpen your logical reasoning.' },
  { key: 'sql', label: 'SQL', titleTemplate: 'SQL Questions for {company}', subtitleTemplate: 'Most asked SQL questions in interviews at {company}. Master database querying.' },
  { key: 'corecs', label: 'Core CS', titleTemplate: 'Core CS Subjects for {company}', subtitleTemplate: 'Most asked Core CS Subjects questions in interviews at {company}. Build a strong foundation in computer science fundamentals.' },
];

const q = (prefix: string, id: number, question: string, category: string, difficulty: 'Easy' | 'Medium' | 'Hard'): MRQuestion => ({
  id: `${prefix}-${id}`,
  question,
  category: category || undefined,
  difficulty,
  isSolved: false,
  isRevision: false,
});

const hclInterview: MRQuestion[] = [
  q('hcl-iq', 1, 'What is polymorphism in OOP?', '', 'Easy'),
  q('hcl-iq', 2, 'Explain the difference between abstract class and interface.', '', 'Easy'),
  q('hcl-iq', 3, 'What are the principles of SOLID design?', '', 'Medium'),
  q('hcl-iq', 4, 'Explain multithreading vs multiprocessing.', '', 'Medium'),
  q('hcl-iq', 5, 'What is dependency injection?', '', 'Easy'),
  q('hcl-iq', 6, 'How does garbage collection work in Java?', '', 'Medium'),
  q('hcl-iq', 7, 'What is the difference between stack and heap memory?', '', 'Easy'),
  q('hcl-iq', 8, 'Explain RESTful API design principles.', '', 'Easy'),
  q('hcl-iq', 9, 'What is microservices architecture?', '', 'Medium'),
  q('hcl-iq', 10, 'Explain the MVC design pattern.', '', 'Easy'),
  q('hcl-iq', 11, 'What is the difference between GET and POST requests?', '', 'Easy'),
  q('hcl-iq', 12, 'Explain exception handling in Java.', '', 'Easy'),
  q('hcl-iq', 13, 'What are design patterns? Name a few.', '', 'Medium'),
  q('hcl-iq', 14, 'Explain the Singleton pattern.', '', 'Medium'),
  q('hcl-iq', 15, 'What is CORS and how do you handle it?', '', 'Medium'),
  q('hcl-iq', 16, 'How would you optimize a slow database query?', '', 'Hard'),
  q('hcl-iq', 17, 'Explain CAP theorem.', '', 'Hard'),
  q('hcl-iq', 18, 'What is eventual consistency?', '', 'Hard'),
];

const hclCoreCS: MRQuestion[] = [
  q('hcl-cs', 1, 'What is DNS?', 'protocols', 'Easy'),
  q('hcl-cs', 2, 'What is SQL?', 'dbms', 'Easy'),
  q('hcl-cs', 3, 'What is a class and an object in OOP?', 'oop', 'Easy'),
  q('hcl-cs', 4, 'What is a database system?', 'dbms', 'Easy'),
  q('hcl-cs', 5, 'What is a primary key\'s importance?', 'dbms', 'Easy'),
  q('hcl-cs', 6, 'What is Object-Oriented Programming (OOP)?', 'oop', 'Easy'),
  q('hcl-cs', 7, 'What is the OSI model?', 'models', 'Easy'),
  q('hcl-cs', 8, 'What is a primary key in a database?', 'dbms', 'Easy'),
  q('hcl-cs', 9, 'What is a network protocol?', 'protocols', 'Easy'),
  q('hcl-cs', 10, 'What is a RESTful API?', 'api', 'Easy'),
  q('hcl-cs', 11, 'Describe binary search algorithm.', 'algorithms', 'Easy'),
  q('hcl-cs', 12, 'What is virtual memory?', 'memory', 'Medium'),
  q('hcl-cs', 13, 'What is process scheduling?', 'processes', 'Medium'),
  q('hcl-cs', 14, 'What is the TCP three-way handshake?', 'tcp/ip', 'Medium'),
  q('hcl-cs', 15, 'What is a database transaction?', 'dbms', 'Medium'),
  q('hcl-cs', 16, 'Explain deadlock and its prevention.', 'os', 'Medium'),
  q('hcl-cs', 17, 'What is normalization? Explain 3NF.', 'dbms', 'Medium'),
  q('hcl-cs', 18, 'Explain paging and segmentation.', 'memory', 'Hard'),
  q('hcl-cs', 19, 'What is the difference between TCP and UDP?', 'protocols', 'Medium'),
  q('hcl-cs', 20, 'Explain the concept of semaphores.', 'os', 'Hard'),
];

const hclDSA: MRQuestion[] = [
  q('hcl-dsa', 1, 'Reverse a linked list.', 'Linked List', 'Easy'),
  q('hcl-dsa', 2, 'Find the maximum element in an array.', 'Arrays', 'Easy'),
  q('hcl-dsa', 3, 'Check if a string is palindrome.', 'String', 'Easy'),
  q('hcl-dsa', 4, 'Implement binary search.', 'Binary Search', 'Easy'),
  q('hcl-dsa', 5, 'Find the middle of a linked list.', 'Linked List', 'Easy'),
  q('hcl-dsa', 6, 'Two Sum problem.', 'Arrays', 'Easy'),
  q('hcl-dsa', 7, 'Merge two sorted arrays.', 'Arrays', 'Medium'),
  q('hcl-dsa', 8, 'Implement a stack using arrays.', 'Stack', 'Easy'),
  q('hcl-dsa', 9, 'Find the first non-repeating character.', 'String', 'Medium'),
  q('hcl-dsa', 10, 'Level order traversal of binary tree.', 'Trees', 'Medium'),
  q('hcl-dsa', 11, 'Detect a cycle in a linked list.', 'Linked List', 'Medium'),
  q('hcl-dsa', 12, 'Implement queue using two stacks.', 'Stack', 'Medium'),
  q('hcl-dsa', 13, 'Find the longest common subsequence.', 'DP', 'Hard'),
  q('hcl-dsa', 14, 'Lowest common ancestor in BST.', 'Trees', 'Medium'),
  q('hcl-dsa', 15, 'Kth largest element in array.', 'Arrays', 'Medium'),
];

const hclAptitude: MRQuestion[] = [
  q('hcl-apt', 1, 'If 5x + 3 = 18, find x.', 'Algebra', 'Easy'),
  q('hcl-apt', 2, 'A train travels 120 km in 2 hours. What is its speed?', 'Speed & Distance', 'Easy'),
  q('hcl-apt', 3, 'Complete the series: 2, 6, 12, 20, 30, ?', 'Series', 'Easy'),
  q('hcl-apt', 4, 'A is taller than B. C is shorter than B. Who is the shortest?', 'Reasoning', 'Easy'),
  q('hcl-apt', 5, 'If PROFIT is coded as 123456, what is RIFT?', 'Coding-Decoding', 'Medium'),
  q('hcl-apt', 6, 'What is 15% of 200?', 'Percentage', 'Easy'),
  q('hcl-apt', 7, 'A pipe fills a tank in 6 hours. How much is filled in 2 hours?', 'Pipes & Cisterns', 'Easy'),
  q('hcl-apt', 8, 'Find the average of 12, 18, 24, 30, 36.', 'Average', 'Easy'),
  q('hcl-apt', 9, 'If the ratio of boys to girls is 3:5 and total is 40, find boys.', 'Ratio', 'Easy'),
  q('hcl-apt', 10, 'A man walks 5 km east, then 3 km north. Find displacement.', 'Distance', 'Medium'),
  q('hcl-apt', 11, 'Find the compound interest on Rs.1000 at 10% for 2 years.', 'Interest', 'Medium'),
  q('hcl-apt', 12, 'In how many ways can 5 people sit in a row?', 'Permutation', 'Medium'),
  q('hcl-apt', 13, 'Find the probability of getting a head in a coin toss.', 'Probability', 'Easy'),
  q('hcl-apt', 14, 'A boat goes 12 km upstream in 3 hours. Speed of current is 2 km/h. Find boat speed.', 'Boats & Streams', 'Medium'),
  q('hcl-apt', 15, 'Find the HCF of 36 and 48.', 'HCF/LCM', 'Easy'),
];

const hclSQL: MRQuestion[] = [
  q('hcl-sql', 1, 'Write a query to find the second highest salary.', 'Subquery', 'Medium'),
  q('hcl-sql', 2, 'Explain INNER JOIN vs LEFT JOIN.', 'Joins', 'Easy'),
  q('hcl-sql', 3, 'Write a query to find duplicate records.', 'Aggregation', 'Medium'),
  q('hcl-sql', 4, 'What are window functions? Give an example.', 'Window Functions', 'Hard'),
  q('hcl-sql', 5, 'Write a query to get the nth row without LIMIT.', 'Advanced', 'Hard'),
  q('hcl-sql', 6, 'Explain the difference between WHERE and HAVING.', 'Basics', 'Easy'),
  q('hcl-sql', 7, 'What is a stored procedure?', 'Procedures', 'Easy'),
  q('hcl-sql', 8, 'Write a query to find employees earning above average salary.', 'Subquery', 'Medium'),
  q('hcl-sql', 9, 'Explain UNION vs UNION ALL.', 'Set Operations', 'Easy'),
  q('hcl-sql', 10, 'What are indexes and how do they improve performance?', 'Indexing', 'Medium'),
  q('hcl-sql', 11, 'Write a query to delete duplicate rows keeping one.', 'Advanced', 'Hard'),
  q('hcl-sql', 12, 'Explain normalization forms (1NF, 2NF, 3NF).', 'Normalization', 'Medium'),
  q('hcl-sql', 13, 'What is a trigger in SQL?', 'Triggers', 'Medium'),
  q('hcl-sql', 14, 'Write a self-join query example.', 'Joins', 'Medium'),
  q('hcl-sql', 15, 'Explain ACID properties of transactions.', 'Transactions', 'Easy'),
];

function cloneQuestionsForCompany(prefix: string, questions: MRQuestion[]): MRQuestion[] {
  return questions.map((q, i) => ({ ...q, id: `${prefix}-${i + 1}` }));
}

export const companies: CompanyData[] = [
  {
    id: 'hcl', name: 'HCL', logo: 'https://logo.clearbit.com/hcltech.com',
    interviewQuestions: hclInterview,
    dsaQuestions: hclDSA,
    aptitudeQuestions: hclAptitude,
    sqlQuestions: hclSQL,
    coreCSQuestions: hclCoreCS,
  },
  {
    id: 'ibm', name: 'IBM', logo: 'https://logo.clearbit.com/ibm.com',
    interviewQuestions: cloneQuestionsForCompany('ibm-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('ibm-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('ibm-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('ibm-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('ibm-cs', hclCoreCS),
  },
  {
    id: 'cognizant', name: 'Cognizant', logo: 'https://logo.clearbit.com/cognizant.com',
    interviewQuestions: cloneQuestionsForCompany('cog-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('cog-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('cog-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('cog-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('cog-cs', hclCoreCS),
  },
  {
    id: 'infosys', name: 'Infosys', logo: 'https://logo.clearbit.com/infosys.com',
    interviewQuestions: cloneQuestionsForCompany('inf-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('inf-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('inf-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('inf-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('inf-cs', hclCoreCS),
  },
  {
    id: 'tcs', name: 'TCS', logo: 'https://logo.clearbit.com/tcs.com',
    interviewQuestions: cloneQuestionsForCompany('tcs-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('tcs-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('tcs-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('tcs-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('tcs-cs', hclCoreCS),
  },
  {
    id: 'wipro', name: 'Wipro', logo: 'https://logo.clearbit.com/wipro.com',
    interviewQuestions: cloneQuestionsForCompany('wip-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('wip-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('wip-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('wip-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('wip-cs', hclCoreCS),
  },
  {
    id: 'techmahindra', name: 'Tech Mahindra', logo: 'https://logo.clearbit.com/techmahindra.com',
    interviewQuestions: cloneQuestionsForCompany('tm-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('tm-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('tm-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('tm-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('tm-cs', hclCoreCS),
  },
  {
    id: 'lt', name: 'L&T', logo: 'https://logo.clearbit.com/larsentoubro.com',
    interviewQuestions: cloneQuestionsForCompany('lt-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('lt-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('lt-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('lt-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('lt-cs', hclCoreCS),
  },
  {
    id: 'capgemini', name: 'Capgemini', logo: 'https://logo.clearbit.com/capgemini.com',
    interviewQuestions: cloneQuestionsForCompany('cap-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('cap-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('cap-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('cap-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('cap-cs', hclCoreCS),
  },
  {
    id: 'accenture', name: 'Accenture', logo: 'https://logo.clearbit.com/accenture.com',
    interviewQuestions: cloneQuestionsForCompany('acc-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('acc-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('acc-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('acc-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('acc-cs', hclCoreCS),
  },
  {
    id: 'mindtree', name: 'Mindtree', logo: 'https://logo.clearbit.com/mindtree.com',
    interviewQuestions: cloneQuestionsForCompany('mt-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('mt-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('mt-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('mt-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('mt-cs', hclCoreCS),
  },
  {
    id: 'mphasis', name: 'Mphasis', logo: 'https://logo.clearbit.com/mphasis.com',
    interviewQuestions: cloneQuestionsForCompany('mph-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('mph-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('mph-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('mph-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('mph-cs', hclCoreCS),
  },
  {
    id: 'hexaware', name: 'Hexaware', logo: 'https://logo.clearbit.com/hexaware.com',
    interviewQuestions: cloneQuestionsForCompany('hex-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('hex-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('hex-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('hex-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('hex-cs', hclCoreCS),
  },
  {
    id: 'ltimindtree', name: 'LTIMindtree', logo: 'https://logo.clearbit.com/ltimindtree.com',
    interviewQuestions: cloneQuestionsForCompany('lti-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('lti-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('lti-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('lti-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('lti-cs', hclCoreCS),
  },
  {
    id: 'zoho', name: 'Zoho', logo: 'https://logo.clearbit.com/zoho.com',
    interviewQuestions: cloneQuestionsForCompany('zoho-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('zoho-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('zoho-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('zoho-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('zoho-cs', hclCoreCS),
  },
  {
    id: 'persistent', name: 'Persistent Systems', logo: 'https://logo.clearbit.com/persistent.com',
    interviewQuestions: cloneQuestionsForCompany('per-iq', hclInterview),
    dsaQuestions: cloneQuestionsForCompany('per-dsa', hclDSA),
    aptitudeQuestions: cloneQuestionsForCompany('per-apt', hclAptitude),
    sqlQuestions: cloneQuestionsForCompany('per-sql', hclSQL),
    coreCSQuestions: cloneQuestionsForCompany('per-cs', hclCoreCS),
  },
];
