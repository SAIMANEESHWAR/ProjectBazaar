import React, { useState, useEffect, useMemo } from 'react';
import PlacementPrepSection, { PlacementPhase } from './PlacementPrepSection';

// ============================================
// TYPES & INTERFACES
// ============================================

interface OptionItem {
    option: string;
    isSelected: boolean;
}

// RoadmapStep and Roadmap interfaces - kept for potential future use
// interface RoadmapStep {
//     title: string;
//     description: string;
//     skills: string[];
//     sub_steps: {
//         title: string;
//         description: string;
//         skills: string[];
//     }[];
// }
// interface Roadmap {
//     title: string;
//     description: string;
//     steps: RoadmapStep[];
// }

// New Roadmap Interfaces
interface CareerAnalysis {
    careerGoal: string;
    currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    timeCommitment: number; // hours per week
    preferredTechStack: string[];
}

interface WeekResource {
    type: 'gfg' | 'youtube' | 'documentation' | 'practice' | 'article';
    title: string;
    url: string;
}

interface WeekContent {
    weekNumber: number;
    mainTopics: string[];
    subtopics: string[];
    practicalTasks: string[];
    miniProject: string;
    roadmap?: string;
    resources?: WeekResource[];
    quiz?: QuizQuestion[];
    isCompleted: boolean;
    quizCompleted: boolean;
}

interface RoadmapData {
    careerGoal: string;
    totalWeeks: number;
    weeks: WeekContent[];
    createdAt: string;
}



interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer?: number;
}

interface WeeklyQuiz {
    weekNumber: number;
    questions: QuizQuestion[];
    score?: number;
    feedback?: string;
}

interface FinalExam {
    questions: QuizQuestion[];
    userAnswers: number[];
    score?: number;
    completed: boolean;
}

interface Certificate {
    name: string;
    career: string;
    score: number;
    date: string;
}

type CareerTab = 'trending' | 'recommend' | 'roadmap' | 'placement' | 'projects';
type RecommendStep = 0 | 1 | 2 | 3 | 4 | 5;

// Trending Career Data for B.Tech Students
export interface TrendingCareer {
    title: string;
    avgSalary: string;
    growth: string;
    demand: 'Very High' | 'High' | 'Medium';
    skills: string[];
    companies: string[];
    description: string;
    links?: string[]; // roadmap links
}

export interface ProjectIdea {
    title: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    technologies: string[];
    description: string;
    features: string[];
    githubLinks?: string[]; // GitHub repository links
    demoLinks?: string[]; // Live demo links
}



// ============================================
// ICONS
// ============================================

const SparkleIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 20L17.6 14.6L23 13L17.6 11.4L16 5.99999L14.4 11.4L9 13L14.4 14.6L16 20Z" />
        <path d="M7.5 21L8.3 18.3L11 17.5L8.3 16.7L7.5 14L6.7 16.7L4 17.5L6.7 18.3L7.5 21Z" />
        <path d="M7.5 10.8L8.07143 8.87142L10 8.29999L8.07143 7.72856L7.5 5.79999L6.92857 7.72856L5 8.29999L6.92857 8.87142L7.5 10.8Z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const RoadmapIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);


const TargetIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const TrendingIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const PlacementIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const ProjectIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);

const FireIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
);


const CurrencyIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ============================================
// STORAGE HELPERS
// ============================================

const TRENDING_CAREERS_KEY = 'careerTrendingCareers';
const PROJECT_IDEAS_KEY = 'careerProjectIdeas';
const PLACEMENT_PREP_KEY = 'careerPlacementPrep';
const API_ENDPOINT = 'https://kuxbswn0c9.execute-api.ap-south-2.amazonaws.com/default/Trendingcarrers_ProjectIdeas';
const PLACEMENT_PREP_API_ENDPOINT = import.meta.env.VITE_PLACEMENT_PREP_API_URL || 'https://5xg2r5rgol.execute-api.ap-south-2.amazonaws.com/default/PlacementPrep';

const isBrowser = typeof window !== 'undefined';

export const saveTrendingCareers = (items: TrendingCareer[]) => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(TRENDING_CAREERS_KEY, JSON.stringify(items));
    } catch (error) {
        console.error('Failed to save trending careers:', error);
    }
};

export const saveProjectIdeas = (items: ProjectIdea[]) => {
    if (!isBrowser) return;
    try {
        localStorage.setItem(PROJECT_IDEAS_KEY, JSON.stringify(items));
    } catch (error) {
        console.error('Failed to save project ideas:', error);
    }
};

const loadFromStorage = <T,>(key: string, fallback: T[]): T[] => {
    if (!isBrowser) return fallback;
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return fallback;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            return parsed as T[];
        }
        return fallback;
    } catch (error) {
        console.error(`Failed to load ${key} from storage:`, error);
        return fallback;
    }
};

// ============================================
// TRENDING CAREERS DATA
// ============================================

export const defaultTrendingCareers: TrendingCareer[] = [
    {
        title: "AI/ML Engineer",
        avgSalary: "₹8-25 LPA",
        growth: "+40%",
        demand: "Very High",
        skills: ["Python", "TensorFlow", "PyTorch", "Deep Learning", "NLP"],
        companies: ["Google", "Microsoft", "Amazon", "OpenAI", "NVIDIA"],
        description: "Design and build AI models and machine learning systems that power intelligent applications."
    },
    {
        title: "Full Stack Developer",
        avgSalary: "₹6-20 LPA",
        growth: "+25%",
        demand: "Very High",
        skills: ["React", "Node.js", "MongoDB", "TypeScript", "AWS"],
        companies: ["Flipkart", "Swiggy", "Razorpay", "Zerodha", "Atlassian"],
        description: "Build end-to-end web applications handling both frontend and backend development."
    },
    {
        title: "Data Scientist",
        avgSalary: "₹7-22 LPA",
        growth: "+35%",
        demand: "Very High",
        skills: ["Python", "SQL", "Statistics", "Machine Learning", "Tableau"],
        companies: ["Uber", "PhonePe", "Paytm", "Myntra", "LinkedIn"],
        description: "Analyze complex data to help organizations make data-driven decisions."
    },
    {
        title: "Cloud Engineer",
        avgSalary: "₹8-24 LPA",
        growth: "+30%",
        demand: "High",
        skills: ["AWS", "Azure", "Kubernetes", "Docker", "Terraform"],
        companies: ["Amazon", "Microsoft", "Google", "IBM", "Oracle"],
        description: "Design, deploy and manage cloud infrastructure and services."
    },
    {
        title: "DevOps Engineer",
        avgSalary: "₹7-22 LPA",
        growth: "+28%",
        demand: "High",
        skills: ["CI/CD", "Docker", "Kubernetes", "Jenkins", "Linux"],
        companies: ["Netflix", "Adobe", "Salesforce", "VMware", "Red Hat"],
        description: "Bridge development and operations to improve deployment efficiency."
    },
    {
        title: "Cybersecurity Analyst",
        avgSalary: "₹6-18 LPA",
        growth: "+32%",
        demand: "High",
        skills: ["Network Security", "Ethical Hacking", "SIEM", "Cryptography", "Penetration Testing"],
        companies: ["Cisco", "Palo Alto", "CrowdStrike", "Deloitte", "EY"],
        description: "Protect organizations from cyber threats and security breaches."
    },
    {
        title: "Blockchain Developer",
        avgSalary: "₹8-30 LPA",
        growth: "+45%",
        demand: "Medium",
        skills: ["Solidity", "Web3.js", "Smart Contracts", "Ethereum", "Rust"],
        companies: ["Polygon", "Coinbase", "Binance", "ConsenSys", "Chainlink"],
        description: "Build decentralized applications and blockchain-based solutions."
    },
    {
        title: "Mobile App Developer",
        avgSalary: "₹5-18 LPA",
        growth: "+22%",
        demand: "High",
        skills: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"],
        companies: ["Byju's", "Dream11", "Ola", "Zomato", "Dunzo"],
        description: "Create mobile applications for iOS and Android platforms."
    }
];

// ============================================
// PLACEMENT PREP DATA (Default/Fallback)
// ============================================

const defaultPlacementPhases: PlacementPhase[] = [
    {
        id: 'phase-1',
        year: '3rd Year',
        months: 'July - September',
        title: 'Building Strong Foundations',
        description: 'Focus on Data Structures, Algorithms and Basic Mathematics.',
        colorClass: 'from-blue-500 to-indigo-600',
        badgeClass: 'bg-blue-100 text-blue-700',
        icon: '🧱',
        relatedTopics: ['Arrays', 'STL/Collections', 'Recursion', 'Time Complexity'],
        tasks: [
            { id: 'p1t1', title: 'Master Array & Strings', description: 'Solve 20+ problems on LeetCode', completed: false, difficulty: 'Easy' },
            { id: 'p1t2', title: 'Learn Basic Math for Coding', description: 'Prime numbers, GCD, Factorials', completed: false, difficulty: 'Easy' }
        ],
        resources: [
            { name: 'LeetCode Explore', url: 'https://leetcode.com/explore/', type: 'Practice' }
        ]
    },
    {
        id: 'phase-2',
        year: '3rd Year',
        months: 'October - December',
        title: 'Advanced DSA & Core Subjects',
        description: 'Moving to complex data structures and CS fundamentals.',
        colorClass: 'from-green-500 to-emerald-600',
        badgeClass: 'bg-green-100 text-green-700',
        icon: '🧪',
        relatedTopics: ['Trees', 'Graphs', 'Dynamic Programming', 'OS'],
        tasks: [
            { id: 'p2t1', title: 'Advanced Data Structures', description: 'Trees, Graphs and Heap', completed: false, difficulty: 'Medium' },
            { id: 'p2t2', title: 'DBMS Fundamentals', description: 'SQL Queries and Normalization', completed: false, difficulty: 'Medium' }
        ],
        resources: [
            { name: 'Striver A2Z Sheet', url: 'https://takeuforward.org', type: 'Roadmap' }
        ]
    }
];

// ============================================
// PROJECT IDEAS DATA
// ============================================

export const defaultProjectIdeas: ProjectIdea[] = [
    {
        title: "AI-Powered Resume Analyzer",
        difficulty: "Intermediate",
        duration: "4-6 weeks",
        technologies: ["Python", "NLP", "Flask", "React"],
        description: "Build a tool that analyzes resumes using NLP and provides improvement suggestions.",
        features: ["Resume parsing", "Skill extraction", "ATS score", "Improvement tips"]
    },
    {
        title: "Real-time Collaborative Code Editor",
        difficulty: "Advanced",
        duration: "6-8 weeks",
        technologies: ["React", "Node.js", "Socket.io", "Monaco Editor"],
        description: "Create a VS Code-like editor where multiple users can code together in real-time.",
        features: ["Live collaboration", "Syntax highlighting", "Chat", "Video call"]
    },
    {
        title: "Stock Price Predictor",
        difficulty: "Intermediate",
        duration: "3-4 weeks",
        technologies: ["Python", "LSTM", "Streamlit", "yfinance"],
        description: "Use machine learning to predict stock prices based on historical data.",
        features: ["Data visualization", "Price prediction", "Technical indicators", "Portfolio tracker"]
    },
    {
        title: "Smart Attendance System",
        difficulty: "Intermediate",
        duration: "4-5 weeks",
        technologies: ["Python", "OpenCV", "Face Recognition", "Firebase"],
        description: "Automated attendance system using facial recognition technology.",
        features: ["Face detection", "Attendance logging", "Admin dashboard", "Reports"]
    },
    {
        title: "E-Commerce Platform",
        difficulty: "Intermediate",
        duration: "6-8 weeks",
        technologies: ["MERN Stack", "Stripe", "Redux", "AWS S3"],
        description: "Full-featured online shopping platform with payment integration.",
        features: ["User auth", "Product catalog", "Cart & checkout", "Order tracking"]
    },
    {
        title: "Healthcare Chatbot",
        difficulty: "Advanced",
        duration: "5-6 weeks",
        technologies: ["Python", "Rasa/Dialogflow", "React", "MongoDB"],
        description: "AI chatbot for basic health consultations and appointment booking.",
        features: ["Symptom checker", "Doctor recommendations", "Appointment booking", "Health tips"]
    },
    {
        title: "Blockchain Voting System",
        difficulty: "Advanced",
        duration: "6-8 weeks",
        technologies: ["Solidity", "Ethereum", "React", "Web3.js"],
        description: "Secure and transparent voting system using blockchain technology.",
        features: ["Voter registration", "Encrypted voting", "Result verification", "Audit trail"]
    },
    {
        title: "IoT Home Automation",
        difficulty: "Intermediate",
        duration: "4-5 weeks",
        technologies: ["Arduino/ESP32", "MQTT", "React Native", "Firebase"],
        description: "Control home appliances remotely using IoT devices and mobile app.",
        features: ["Device control", "Scheduling", "Energy monitoring", "Voice commands"]
    }
];

// ============================================
// OPTION BUTTON COMPONENT
// ============================================

interface OptionButtonProps {
    option: string;
    isSelected: boolean;
    onToggle: (option: string) => void;
}

const OptionButton: React.FC<OptionButtonProps> = ({ option, isSelected, onToggle }) => (
    <button
        onClick={() => onToggle(option)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isSelected
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
    >
        {option}
    </button>
);

// ============================================
// SELECTOR COMPONENT (REUSABLE)
// ============================================

interface SelectorProps {
    title: string;
    subtitle: string;
    options: OptionItem[];
    setOptions: React.Dispatch<React.SetStateAction<OptionItem[]>>;
    onContinue: (selected: string[]) => void;
    placeholder?: string;
}

const Selector: React.FC<SelectorProps> = ({ title, subtitle, options, setOptions, onContinue, placeholder }) => {
    const [newOption, setNewOption] = useState('');

    const toggleOption = (option: string) => {
        setOptions(prev => prev.map(item =>
            item.option === option ? { ...item, isSelected: !item.isSelected } : item
        ));
    };

    const addNewOption = (e: React.FormEvent) => {
        e.preventDefault();
        if (newOption.trim() && !options.some(o => o.option.toLowerCase() === newOption.toLowerCase())) {
            setOptions(prev => [...prev, { option: newOption, isSelected: true }]);
            setNewOption('');
        }
    };

    const selectedOptions = options.filter(item => item.isSelected).map(item => item.option);

    return (
        <div>
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600">{subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center mb-8">
                {options.map((item, idx) => (
                    <OptionButton
                        key={idx}
                        option={item.option}
                        isSelected={item.isSelected}
                        onToggle={toggleOption}
                    />
                ))}
            </div>

            <form onSubmit={addNewOption} className="flex gap-3 max-w-md mx-auto mb-8">
                <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder={placeholder || "Add your own..."}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                    Add
                </button>
            </form>

            <div className="text-center">
                <button
                    onClick={() => onContinue(selectedOptions)}
                    disabled={selectedOptions.length === 0}
                    className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${selectedOptions.length > 0
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Continue ({selectedOptions.length} selected)
                </button>
            </div>
        </div>
    );
};

// ============================================
// LOADING COMPONENT
// ============================================

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Analyzing your profile...' }) => (
    <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <SparkleIcon />
            </div>
        </div>
        <p className="mt-6 text-lg text-gray-600 font-medium">{message}</p>
        <p className="mt-2 text-sm text-gray-500">This may take a few moments...</p>
    </div>
);

// ============================================
// RESULT COMPONENT
// ============================================

interface ResultProps {
    result: string[];
    onGenerateAgain: () => void;
    onContinueToRoadmap: (career: string) => void;
}

const ResultComponent: React.FC<ResultProps> = ({ result, onGenerateAgain, onContinueToRoadmap }) => (
    <div className="text-center">
        <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full text-sm font-medium">
                <SparkleIcon />
                AI Career Recommendation
            </span>
        </div>

        <h2 className="text-xl text-gray-600 mb-4">Based on your profile, we recommend you to be a</h2>

        <div className="relative inline-block mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent animate-pulse">
                {result[0]}
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 blur-2xl -z-10 rounded-3xl" />
        </div>

        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">🚩 Other careers you might be interested in:</h3>
            <div className="flex flex-wrap gap-4 justify-center">
                {result.slice(1, 4).map((career, idx) => (
                    <button
                        key={idx}
                        onClick={() => onContinueToRoadmap(career)}
                        className="px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl font-medium text-gray-700 hover:shadow-lg hover:border-orange-300 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        {career}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
                onClick={onGenerateAgain}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
                Generate Again
            </button>
            <button
                onClick={() => onContinueToRoadmap(result[0])}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
                Continue to Roadmap →
            </button>
        </div>
    </div>
);

// ============================================
// PROGRESS BAR COMPONENT
// ============================================

interface ProgressBarProps {
    step: number;
    totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ step, totalSteps }) => (
    <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
        </div>
    </div>
);

// ============================================
// NEW ROADMAP FEATURE COMPONENT
// ============================================

interface RoadmapFeatureProps {
    roadmapStep: 'analysis' | 'roadmap' | 'progress' | 'exam' | 'evaluation';
    setRoadmapStep: (step: 'analysis' | 'roadmap' | 'progress' | 'exam' | 'evaluation') => void;
    careerAnalysis: CareerAnalysis | null;
    setCareerAnalysis: (analysis: CareerAnalysis | null) => void;
    roadmapData: RoadmapData | null;
    setRoadmapData: (data: RoadmapData | null) => void;
    currentWeek: number | null;
    setCurrentWeek: (week: number | null) => void;
    weeklyQuiz: WeeklyQuiz | null;
    setWeeklyQuiz: (quiz: WeeklyQuiz | null) => void;
    finalExam: FinalExam | null;
    setFinalExam: (exam: FinalExam | null) => void;
    certificate: Certificate | null;
    setCertificate: (cert: Certificate | null) => void;
    isGeneratingRoadmap: boolean;
    setIsGeneratingRoadmap: (loading: boolean) => void;
    isGeneratingQuiz: boolean;
    setIsGeneratingQuiz: (loading: boolean) => void;
    isGeneratingExam: boolean;
    setIsGeneratingExam: (loading: boolean) => void;
    roadmapError: string | null;
    setRoadmapError: (error: string | null) => void;
}

const RoadmapFeature: React.FC<RoadmapFeatureProps> = ({
    roadmapStep,
    setRoadmapStep,
    careerAnalysis,
    setCareerAnalysis,
    roadmapData,
    setRoadmapData,
    currentWeek: _currentWeek,
    setCurrentWeek,
    weeklyQuiz,
    setWeeklyQuiz,
    finalExam,
    setFinalExam,
    certificate,
    setCertificate,
    isGeneratingRoadmap,
    setIsGeneratingRoadmap,
    isGeneratingQuiz: _isGeneratingQuiz,
    setIsGeneratingQuiz,
    isGeneratingExam,
    setIsGeneratingExam,
    roadmapError,
    setRoadmapError,
}) => {
    // API keys no longer needed - using static data

    // Step 1: Category Selection (Duration fixed at 8 weeks)
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
    const [_loadingCategories, setLoadingCategories] = useState(true);

    // API Endpoint
    const ROADMAP_API_ENDPOINT = 'https://07wee2lkxj.execute-api.ap-south-2.amazonaws.com/default/Roadmaps_get_post_put';

    // Load categories from API
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoadingCategories(true);
                const response = await fetch(ROADMAP_API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'categories',
                        action: 'list',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.categories && data.categories.length > 0) {
                        setCategories(data.categories);
                        if (!selectedCategory && data.categories.length > 0) {
                            setSelectedCategory(data.categories[0].id);
                        }
                    } else {
                        // Fallback to default categories if API returns empty
                        setCategories([
                            { id: 'ai-ml', name: 'AI/ML Engineer', icon: '🤖' },
                            { id: 'web-dev', name: 'Web Development', icon: '🌐' },
                            { id: 'data-science', name: 'Data Science', icon: '📊' },
                            { id: 'devops', name: 'DevOps Engineer', icon: '⚙️' },
                            { id: 'mobile-dev', name: 'Mobile Development', icon: '📱' },
                            { id: 'cloud-engineer', name: 'Cloud Engineer', icon: '☁️' },
                            { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
                            { id: 'blockchain', name: 'Blockchain Developer', icon: '⛓️' },
                            { id: 'ui-ux', name: 'UI/UX Designer', icon: '🎨' },
                            { id: 'fullstack', name: 'Full Stack Developer', icon: '💻' },
                        ]);
                    }
                } else {
                    throw new Error('Failed to fetch categories');
                }
            } catch (err) {
                console.error('Failed to load categories:', err);
                // Fallback to default categories on error
                setCategories([
                    { id: 'ai-ml', name: 'AI/ML Engineer', icon: '🤖' },
                    { id: 'web-dev', name: 'Web Development', icon: '🌐' },
                    { id: 'data-science', name: 'Data Science', icon: '📊' },
                    { id: 'devops', name: 'DevOps Engineer', icon: '⚙️' },
                    { id: 'mobile-dev', name: 'Mobile Development', icon: '📱' },
                    { id: 'cloud-engineer', name: 'Cloud Engineer', icon: '☁️' },
                    { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
                    { id: 'blockchain', name: 'Blockchain Developer', icon: '⛓️' },
                    { id: 'ui-ux', name: 'UI/UX Designer', icon: '🎨' },
                    { id: 'fullstack', name: 'Full Stack Developer', icon: '💻' },
                ]);
            } finally {
                setLoadingCategories(false);
            }
        };

        loadCategories();
    }, []);

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setRoadmapError(null); // Clear any previous errors
    };

    const handleGenerateRoadmap = () => {
        if (!selectedCategory) {
            setRoadmapError('Please select a category');
            return;
        }
        // Always use 8 weeks (fixed program duration)
        const fixedDuration = 8;

        const categoryName = categories.find(c => c.id === selectedCategory)?.name || selectedCategory;
        const analysis: CareerAnalysis = {
            careerGoal: categoryName,
            currentLevel: 'Beginner', // Default, not exposed to user
            timeCommitment: 10,
            preferredTechStack: [],
        };
        setCareerAnalysis(analysis);
        setRoadmapStep('roadmap');
        generateRoadmap(analysis, fixedDuration);
    };

    // Generate static roadmap based on career goal and duration
    const generateRoadmap = async (_analysis: CareerAnalysis, totalWeeks: number) => {
        setIsGeneratingRoadmap(true);
        setRoadmapError(null);

        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get roadmap data from API - fully dynamic
        const getRoadmapFromAPI = async (categoryId: string, totalWeeks: number, categoriesList: Array<{ id: string; name: string; icon: string }>): Promise<RoadmapData> => {
            try {
                const response = await fetch(ROADMAP_API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resource: 'roadmap',
                        action: 'get',
                        categoryId: categoryId,
                        duration: String(totalWeeks),
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.roadmap) {
                        if (data.roadmap.weeks && data.roadmap.weeks.length > 0) {
                            // Use the weeks exactly as they come from the duration-specific API
                            const weeksToUse = data.roadmap.weeks.map((w: any) => ({
                                ...w,
                                isCompleted: false,
                                quizCompleted: false,
                            }));

                            return {
                                careerGoal: data.roadmap.categoryName || categoriesList.find(c => c.id === categoryId)?.name || categoryId,
                                totalWeeks: weeksToUse.length,
                                weeks: weeksToUse,
                                createdAt: data.roadmap.createdAt || new Date().toISOString(),
                            };
                        } else {
                            // Roadmap exists but has no weeks - return empty roadmap
                            return {
                                careerGoal: data.roadmap.categoryName || categoriesList.find(c => c.id === categoryId)?.name || categoryId,
                                totalWeeks: 0,
                                weeks: [],
                                createdAt: data.roadmap.createdAt || new Date().toISOString(),
                            };
                        }
                    } else if (data.success === false && (data.error?.includes('not found') || data.error?.includes('No roadmap'))) {
                        // Roadmap doesn't exist - return empty roadmap
                        return {
                            careerGoal: categoriesList.find(c => c.id === categoryId)?.name || categoryId,
                            totalWeeks: 0,
                            weeks: [],
                            createdAt: new Date().toISOString(),
                        };
                    } else {
                        throw new Error(data.error || 'Failed to load roadmap from API');
                    }
                } else if (response.status === 404) {
                    // Roadmap not found - return empty roadmap
                    return {
                        careerGoal: categoriesList.find(c => c.id === categoryId)?.name || categoryId,
                        totalWeeks: 0,
                        weeks: [],
                        createdAt: new Date().toISOString(),
                    };
                } else {
                    throw new Error(`API request failed: ${response.status}`);
                }
            } catch (err: any) {
                console.error('Failed to load roadmap from API:', err);
            }

            // Fallback: Try localStorage
            try {
                const stored = localStorage.getItem('admin_roadmaps');
                if (stored) {
                    const adminRoadmaps: Record<string, { categoryId: string; categoryName: string; weeks: any[] }> = JSON.parse(stored);
                    const adminRoadmap = adminRoadmaps[categoryId];
                    if (adminRoadmap && adminRoadmap.weeks.length > 0) {
                        const weeksToUse = adminRoadmap.weeks.slice(0, totalWeeks).map((w, idx) => ({
                            ...w,
                            weekNumber: idx + 1,
                            isCompleted: false,
                            quizCompleted: false,
                        }));
                        return {
                            careerGoal: adminRoadmap.categoryName,
                            totalWeeks: weeksToUse.length,
                            weeks: weeksToUse,
                            createdAt: new Date().toISOString(),
                        };
                    }
                }
            } catch (err) {
                console.error('Failed to load admin roadmaps from localStorage:', err);
            }

            // Fallback to static data
            // Helper function to generate resources for each week
            const getResourcesForWeek = (categoryId: string, weekIndex: number, _topics: string[]): WeekResource[] => {
                // Common resources for all categories
                const commonResources: Record<string, WeekResource[]> = {
                    'ai-ml': [
                        { type: 'youtube', title: 'Python for Data Science - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI' },
                        { type: 'gfg', title: 'Python Programming - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/python-programming-language/' },
                        { type: 'youtube', title: 'Machine Learning Course - Andrew Ng', url: 'https://www.youtube.com/watch?v=PPLop4L2eGk' },
                        { type: 'gfg', title: 'Machine Learning - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/machine-learning/' },
                        { type: 'documentation', title: 'NumPy Documentation', url: 'https://numpy.org/doc/stable/' },
                        { type: 'documentation', title: 'Pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
                        { type: 'youtube', title: 'Deep Learning Specialization - DeepLearning.AI', url: 'https://www.youtube.com/watch?v=CS4cs9xVecg' },
                        { type: 'gfg', title: 'Deep Learning - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/deep-learning/' },
                        { type: 'practice', title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn' },
                        { type: 'practice', title: 'LeetCode ML Problems', url: 'https://leetcode.com/tag/machine-learning/' },
                    ],
                    'web-dev': [
                        { type: 'youtube', title: 'HTML & CSS Full Course - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=mU6anWqZJcc' },
                        { type: 'gfg', title: 'HTML Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/html-tutorials/' },
                        { type: 'gfg', title: 'CSS Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/css-tutorials/' },
                        { type: 'youtube', title: 'JavaScript Full Course - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=jS4aFq5-91M' },
                        { type: 'gfg', title: 'JavaScript Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/javascript-tutorial/' },
                        { type: 'youtube', title: 'React Course - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8' },
                        { type: 'gfg', title: 'React Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/reactjs-tutorials/' },
                        { type: 'documentation', title: 'React Official Docs', url: 'https://react.dev/' },
                        { type: 'youtube', title: 'Node.js & Express - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=Oe421EPjBEo' },
                        { type: 'gfg', title: 'Node.js Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/nodejs-tutorials/' },
                        { type: 'practice', title: 'Frontend Mentor', url: 'https://www.frontendmentor.io/' },
                        { type: 'practice', title: 'JavaScript30', url: 'https://javascript30.com/' },
                    ],
                    'data-science': [
                        { type: 'youtube', title: 'Data Science Full Course - Simplilearn', url: 'https://www.youtube.com/watch?v=X3paOmcrTjQ' },
                        { type: 'gfg', title: 'Data Science - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/data-science/' },
                        { type: 'youtube', title: 'Python for Data Science - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=LHBE6Q9XlzI' },
                        { type: 'gfg', title: 'Pandas Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/pandas-tutorial/' },
                        { type: 'documentation', title: 'Matplotlib Documentation', url: 'https://matplotlib.org/stable/contents.html' },
                        { type: 'documentation', title: 'Seaborn Documentation', url: 'https://seaborn.pydata.org/' },
                        { type: 'youtube', title: 'Statistics for Data Science - StatQuest', url: 'https://www.youtube.com/c/joshstarmer' },
                        { type: 'gfg', title: 'Statistics Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/statistics-tutorials/' },
                        { type: 'practice', title: 'Kaggle Learn', url: 'https://www.kaggle.com/learn' },
                        { type: 'practice', title: 'DataCamp', url: 'https://www.datacamp.com/' },
                    ],
                    'devops': [
                        { type: 'youtube', title: 'DevOps Full Course - Simplilearn', url: 'https://www.youtube.com/watch?v=5jb9LqXcg4c' },
                        { type: 'gfg', title: 'DevOps Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/devops-tutorial/' },
                        { type: 'youtube', title: 'Docker Tutorial - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo' },
                        { type: 'gfg', title: 'Docker Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/docker-tutorial/' },
                        { type: 'youtube', title: 'Kubernetes Tutorial - TechWorld with Nana', url: 'https://www.youtube.com/watch?v=X48VuDVv0do' },
                        { type: 'gfg', title: 'Kubernetes Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/kubernetes-tutorial/' },
                        { type: 'documentation', title: 'Docker Documentation', url: 'https://docs.docker.com/' },
                        { type: 'documentation', title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/' },
                        { type: 'youtube', title: 'AWS Tutorial - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=ulprqHHWlng' },
                        { type: 'gfg', title: 'AWS Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/aws-tutorial/' },
                    ],
                    'mobile-dev': [
                        { type: 'youtube', title: 'React Native Tutorial - Programming with Mosh', url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
                        { type: 'gfg', title: 'React Native Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/react-native-tutorial/' },
                        { type: 'youtube', title: 'Flutter Tutorial - The Net Ninja', url: 'https://www.youtube.com/watch?v=1ukSR1GRtMU' },
                        { type: 'gfg', title: 'Flutter Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/flutter-tutorial/' },
                        { type: 'documentation', title: 'React Native Docs', url: 'https://reactnative.dev/docs/getting-started' },
                        { type: 'documentation', title: 'Flutter Docs', url: 'https://docs.flutter.dev/' },
                        { type: 'youtube', title: 'iOS Development - CodeWithChris', url: 'https://www.youtube.com/c/CodeWithChris' },
                        { type: 'youtube', title: 'Android Development - Coding with Mitch', url: 'https://www.youtube.com/c/CodingWithMitch' },
                        { type: 'practice', title: 'App Ideas', url: 'https://github.com/florinpop17/app-ideas' },
                    ],
                    'cloud-engineer': [
                        { type: 'youtube', title: 'AWS Full Course - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=ulprqHHWlng' },
                        { type: 'gfg', title: 'AWS Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/aws-tutorial/' },
                        { type: 'youtube', title: 'Azure Tutorial - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=3hHmUes6z9k' },
                        { type: 'gfg', title: 'Azure Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/azure-tutorial/' },
                        { type: 'youtube', title: 'GCP Tutorial - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=18OP6c1hSaI' },
                        { type: 'documentation', title: 'AWS Documentation', url: 'https://docs.aws.amazon.com/' },
                        { type: 'documentation', title: 'Azure Documentation', url: 'https://docs.microsoft.com/azure/' },
                        { type: 'documentation', title: 'GCP Documentation', url: 'https://cloud.google.com/docs' },
                        { type: 'practice', title: 'AWS Hands-On Labs', url: 'https://aws.amazon.com/training/' },
                    ],
                    'cybersecurity': [
                        { type: 'youtube', title: 'Cybersecurity Full Course - Simplilearn', url: 'https://www.youtube.com/watch?v=inWWhr5tnEA' },
                        { type: 'gfg', title: 'Cybersecurity Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/cyber-security-tutorial/' },
                        { type: 'youtube', title: 'Ethical Hacking - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=3Kq1MIfTWCE' },
                        { type: 'gfg', title: 'Ethical Hacking - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/ethical-hacking-tutorial/' },
                        { type: 'practice', title: 'TryHackMe', url: 'https://tryhackme.com/' },
                        { type: 'practice', title: 'HackTheBox', url: 'https://www.hackthebox.com/' },
                        { type: 'article', title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
                    ],
                    'blockchain': [
                        { type: 'youtube', title: 'Blockchain Full Course - Simplilearn', url: 'https://www.youtube.com/watch?v=SyVMma1IkXM' },
                        { type: 'gfg', title: 'Blockchain Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/blockchain-tutorial/' },
                        { type: 'youtube', title: 'Solidity Tutorial - Dapp University', url: 'https://www.youtube.com/c/DappUniversity' },
                        { type: 'gfg', title: 'Solidity Tutorial - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/solidity-basics/' },
                        { type: 'documentation', title: 'Solidity Documentation', url: 'https://docs.soliditylang.org/' },
                        { type: 'documentation', title: 'Ethereum Documentation', url: 'https://ethereum.org/en/developers/docs/' },
                        { type: 'practice', title: 'CryptoZombies', url: 'https://cryptozombies.io/' },
                    ],
                    'ui-ux': [
                        { type: 'youtube', title: 'UI/UX Design Course - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU' },
                        { type: 'gfg', title: 'UI/UX Design - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/ui-ux-design/' },
                        { type: 'youtube', title: 'Figma Tutorial - Flux', url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8' },
                        { type: 'article', title: 'Design Principles', url: 'https://www.interaction-design.org/literature/topics/design-principles' },
                        { type: 'practice', title: 'Dribbble', url: 'https://dribbble.com/' },
                        { type: 'practice', title: 'Behance', url: 'https://www.behance.net/' },
                    ],
                    'fullstack': [
                        { type: 'youtube', title: 'Full Stack Web Development - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=zJSY8tbf_ys' },
                        { type: 'gfg', title: 'Full Stack Development - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/full-stack-development/' },
                        { type: 'youtube', title: 'MERN Stack Tutorial - FreeCodeCamp', url: 'https://www.youtube.com/watch?v=7CqJlxBYj-M' },
                        { type: 'gfg', title: 'MERN Stack - GeeksforGeeks', url: 'https://www.geeksforgeeks.org/mern-stack/' },
                        { type: 'practice', title: 'Full Stack Open', url: 'https://fullstackopen.com/en/' },
                        { type: 'practice', title: 'The Odin Project', url: 'https://www.theodinproject.com/' },
                    ],
                };

                const categoryResources = commonResources[categoryId] || commonResources['web-dev'];

                // Select 4-6 resources based on week index
                const selectedResources = categoryResources.slice(weekIndex % categoryResources.length, (weekIndex % categoryResources.length) + 5);
                if (selectedResources.length < 4) {
                    selectedResources.push(...categoryResources.slice(0, 4 - selectedResources.length));
                }

                return selectedResources.slice(0, 6);
            };

            // Category-specific week templates
            const weekTemplates: Record<string, any[]> = {
                'ai-ml': [
                    { mainTopics: ['Python Fundamentals', 'NumPy & Pandas', 'Data Structures'], subtopics: ['Python Basics', 'NumPy Arrays', 'DataFrames', 'Data Cleaning', 'Data Visualization'], practicalTasks: ['Install Python & libraries', 'Practice NumPy operations', 'Load and clean datasets', 'Create visualizations'], miniProject: 'Build a data analysis script for a dataset' },
                    { mainTopics: ['Machine Learning Basics', 'Scikit-learn', 'Model Training'], subtopics: ['Supervised Learning', 'Classification', 'Regression', 'Model Evaluation', 'Cross-validation'], practicalTasks: ['Train first ML model', 'Evaluate model performance', 'Tune hyperparameters', 'Compare models'], miniProject: 'Create a classification model for predicting outcomes' },
                    { mainTopics: ['Deep Learning', 'Neural Networks', 'TensorFlow/Keras'], subtopics: ['Neural Network Basics', 'CNNs', 'RNNs', 'Transfer Learning', 'Model Architecture'], practicalTasks: ['Build first neural network', 'Train on image data', 'Use pre-trained models', 'Optimize architecture'], miniProject: 'Build an image classifier using deep learning' },
                    { mainTopics: ['Natural Language Processing', 'Text Processing', 'NLP Models'], subtopics: ['Text Preprocessing', 'Tokenization', 'Word Embeddings', 'Transformers', 'BERT/GPT'], practicalTasks: ['Process text data', 'Build sentiment analyzer', 'Use transformer models', 'Fine-tune models'], miniProject: 'Create a text sentiment analysis application' },
                    { mainTopics: ['Computer Vision', 'Image Processing', 'CV Models'], subtopics: ['Image Preprocessing', 'Object Detection', 'Image Segmentation', 'OpenCV', 'YOLO'], practicalTasks: ['Process images', 'Detect objects', 'Segment images', 'Build CV pipeline'], miniProject: 'Build an object detection system' },
                    { mainTopics: ['Model Deployment', 'MLOps', 'Production Systems'], subtopics: ['Model Serving', 'API Development', 'Containerization', 'Monitoring', 'A/B Testing'], practicalTasks: ['Deploy ML model', 'Create prediction API', 'Monitor model performance', 'Set up CI/CD'], miniProject: 'Deploy an ML model to production with API' },
                ],
                'web-dev': [
                    { mainTopics: ['HTML & CSS', 'Responsive Design', 'CSS Frameworks'], subtopics: ['HTML5', 'CSS3', 'Flexbox', 'Grid', 'Bootstrap', 'Tailwind'], practicalTasks: ['Build static pages', 'Create responsive layouts', 'Use CSS frameworks', 'Practice animations'], miniProject: 'Build a responsive portfolio website' },
                    { mainTopics: ['JavaScript Fundamentals', 'DOM Manipulation', 'ES6+'], subtopics: ['Variables & Functions', 'Arrays & Objects', 'DOM API', 'Async/Await', 'Promises', 'Closures'], practicalTasks: ['Write JavaScript functions', 'Manipulate DOM', 'Handle events', 'Work with APIs'], miniProject: 'Create an interactive todo application' },
                    { mainTopics: ['React/Vue Basics', 'Components', 'State Management'], subtopics: ['Component Lifecycle', 'Props & State', 'Hooks', 'Routing', 'Context API'], practicalTasks: ['Build components', 'Manage state', 'Add routing', 'Handle side effects'], miniProject: 'Build a single-page application with React/Vue' },
                    { mainTopics: ['Backend Development', 'Node.js/Express', 'REST APIs'], subtopics: ['Server Setup', 'API Endpoints', 'Database Integration', 'Authentication', 'Middleware'], practicalTasks: ['Create API server', 'Connect to database', 'Implement auth', 'Add validation'], miniProject: 'Build a RESTful API with authentication' },
                    { mainTopics: ['Database Integration', 'MongoDB/PostgreSQL', 'ORM'], subtopics: ['Database Design', 'Queries', 'Relationships', 'Migrations', 'Indexing'], practicalTasks: ['Design schema', 'Write queries', 'Handle relationships', 'Optimize queries'], miniProject: 'Create a full-stack app with database' },
                    { mainTopics: ['Deployment', 'Hosting', 'CI/CD'], subtopics: ['Cloud Platforms', 'Docker', 'CI/CD Pipelines', 'Domain Setup', 'SSL Certificates'], practicalTasks: ['Deploy application', 'Set up CI/CD', 'Configure domain', 'Monitor performance'], miniProject: 'Deploy full-stack application to production' },
                ],
                'data-science': [
                    { mainTopics: ['Python for Data Science', 'Pandas', 'Data Exploration'], subtopics: ['Data Loading', 'Data Cleaning', 'Exploratory Analysis', 'Visualization', 'Statistical Summary'], practicalTasks: ['Load datasets', 'Clean data', 'Create visualizations', 'Identify patterns'], miniProject: 'Perform EDA on a real-world dataset' },
                    { mainTopics: ['Statistics & Probability', 'Hypothesis Testing', 'Statistical Analysis'], subtopics: ['Descriptive Stats', 'Inferential Stats', 'A/B Testing', 'Correlation', 'Regression Analysis'], practicalTasks: ['Calculate statistics', 'Run hypothesis tests', 'Analyze relationships', 'Interpret results'], miniProject: 'Conduct statistical analysis on dataset' },
                    { mainTopics: ['Machine Learning', 'Model Building', 'Evaluation'], subtopics: ['Supervised Learning', 'Unsupervised Learning', 'Model Selection', 'Cross-validation', 'Feature Engineering'], practicalTasks: ['Build ML models', 'Evaluate performance', 'Compare models', 'Feature selection'], miniProject: 'Build and compare multiple ML models' },
                    { mainTopics: ['Data Visualization', 'Matplotlib/Seaborn', 'Dashboards'], subtopics: ['Plotting', 'Interactive Charts', 'Dashboard Creation', 'Storytelling', 'Tableau/PowerBI'], practicalTasks: ['Create visualizations', 'Build dashboards', 'Present insights', 'Share reports'], miniProject: 'Create an interactive data dashboard' },
                    { mainTopics: ['Big Data Tools', 'SQL', 'Data Warehousing'], subtopics: ['SQL Queries', 'Data Warehouses', 'ETL Processes', 'Data Pipelines', 'Apache Spark'], practicalTasks: ['Write complex SQL', 'Design data warehouse', 'Build ETL pipeline', 'Process large datasets'], miniProject: 'Build a data pipeline for analytics' },
                    { mainTopics: ['Advanced Analytics', 'Time Series', 'Predictive Modeling'], subtopics: ['Time Series Analysis', 'Forecasting', 'Advanced ML', 'Model Deployment', 'A/B Testing'], practicalTasks: ['Analyze time series', 'Build forecasts', 'Deploy models', 'Monitor predictions'], miniProject: 'Create a predictive analytics solution' },
                ],
                'devops': [
                    { mainTopics: ['Linux Fundamentals', 'Command Line', 'Shell Scripting'], subtopics: ['Linux Commands', 'File System', 'Permissions', 'Process Management', 'Shell Scripts'], practicalTasks: ['Master Linux commands', 'Write shell scripts', 'Manage processes', 'Configure system'], miniProject: 'Automate system tasks with shell scripts' },
                    { mainTopics: ['Version Control', 'Git', 'CI/CD Basics'], subtopics: ['Git Workflows', 'Branching Strategies', 'GitHub Actions', 'Jenkins', 'GitLab CI'], practicalTasks: ['Set up Git workflows', 'Create CI/CD pipelines', 'Automate builds', 'Configure deployments'], miniProject: 'Set up a complete CI/CD pipeline' },
                    { mainTopics: ['Containerization', 'Docker', 'Container Orchestration'], subtopics: ['Docker Basics', 'Docker Compose', 'Kubernetes', 'Container Registry', 'Orchestration'], practicalTasks: ['Containerize applications', 'Use Docker Compose', 'Deploy to Kubernetes', 'Manage containers'], miniProject: 'Containerize and orchestrate a microservices application' },
                    { mainTopics: ['Cloud Platforms', 'AWS/Azure/GCP', 'Infrastructure as Code'], subtopics: ['Cloud Services', 'EC2/Compute', 'S3/Storage', 'Terraform', 'CloudFormation'], practicalTasks: ['Set up cloud infrastructure', 'Use IaC tools', 'Configure services', 'Manage resources'], miniProject: 'Deploy infrastructure using Terraform' },
                    { mainTopics: ['Monitoring & Logging', 'Observability', 'Alerting'], subtopics: ['Prometheus', 'Grafana', 'ELK Stack', 'CloudWatch', 'Alerting Systems'], practicalTasks: ['Set up monitoring', 'Create dashboards', 'Configure alerts', 'Analyze logs'], miniProject: 'Build a complete monitoring and alerting system' },
                    { mainTopics: ['Security', 'Compliance', 'Best Practices'], subtopics: ['Security Scanning', 'Secrets Management', 'Compliance', 'Security Policies', 'Vulnerability Management'], practicalTasks: ['Implement security measures', 'Manage secrets', 'Scan for vulnerabilities', 'Enforce policies'], miniProject: 'Secure a cloud infrastructure setup' },
                ],
                'mobile-dev': [
                    { mainTopics: ['Mobile Development Basics', 'Platforms', 'Development Tools'], subtopics: ['iOS/Android', 'React Native/Flutter', 'IDE Setup', 'Emulators', 'Device Testing'], practicalTasks: ['Set up development environment', 'Create first app', 'Test on devices', 'Configure build tools'], miniProject: 'Build a simple mobile app' },
                    { mainTopics: ['UI/UX for Mobile', 'Design Patterns', 'Navigation'], subtopics: ['Mobile Design Principles', 'Navigation Patterns', 'Responsive Layouts', 'Material Design', 'iOS Guidelines'], practicalTasks: ['Design mobile UI', 'Implement navigation', 'Create responsive layouts', 'Follow design guidelines'], miniProject: 'Create a mobile app with beautiful UI' },
                    { mainTopics: ['State Management', 'Data Persistence', 'Local Storage'], subtopics: ['State Management', 'AsyncStorage', 'SQLite', 'Realm', 'Redux/MobX'], practicalTasks: ['Implement state management', 'Store data locally', 'Handle offline mode', 'Sync data'], miniProject: 'Build an app with offline data storage' },
                    { mainTopics: ['API Integration', 'Networking', 'Authentication'], subtopics: ['REST APIs', 'GraphQL', 'Authentication', 'Token Management', 'Error Handling'], practicalTasks: ['Integrate APIs', 'Handle authentication', 'Manage tokens', 'Handle errors'], miniProject: 'Build an app with API integration and auth' },
                    { mainTopics: ['Native Features', 'Device APIs', 'Permissions'], subtopics: ['Camera', 'Location', 'Notifications', 'Biometrics', 'Device Sensors'], practicalTasks: ['Access device features', 'Handle permissions', 'Use device APIs', 'Implement features'], miniProject: 'Create an app using native device features' },
                    { mainTopics: ['App Deployment', 'App Stores', 'Testing'], subtopics: ['App Store Submission', 'Play Store', 'Beta Testing', 'App Signing', 'Release Management'], practicalTasks: ['Prepare for release', 'Submit to stores', 'Manage versions', 'Handle updates'], miniProject: 'Deploy an app to app stores' },
                ],
                'cloud-engineer': [
                    { mainTopics: ['Cloud Fundamentals', 'Cloud Models', 'Service Models'], subtopics: ['IaaS, PaaS, SaaS', 'Cloud Providers', 'Regions & Zones', 'Cloud Architecture', 'Cost Management'], practicalTasks: ['Understand cloud models', 'Explore cloud providers', 'Set up accounts', 'Calculate costs'], miniProject: 'Design a cloud architecture for a startup' },
                    { mainTopics: ['AWS Core Services', 'EC2, S3, VPC', 'Networking'], subtopics: ['EC2 Instances', 'S3 Storage', 'VPC Configuration', 'Load Balancers', 'Auto Scaling'], practicalTasks: ['Launch EC2 instances', 'Configure S3 buckets', 'Set up VPC', 'Configure networking'], miniProject: 'Deploy a scalable web application on AWS' },
                    { mainTopics: ['Container Services', 'ECS, EKS', 'Serverless'], subtopics: ['ECS/EKS', 'Lambda Functions', 'API Gateway', 'EventBridge', 'Step Functions'], practicalTasks: ['Deploy containers', 'Create Lambda functions', 'Set up API Gateway', 'Build serverless apps'], miniProject: 'Build a serverless application with Lambda' },
                    { mainTopics: ['Database Services', 'RDS, DynamoDB', 'Data Management'], subtopics: ['RDS Setup', 'DynamoDB', 'ElastiCache', 'Data Migration', 'Backup & Recovery'], practicalTasks: ['Set up databases', 'Configure backups', 'Migrate data', 'Optimize performance'], miniProject: 'Design and implement a database solution' },
                    { mainTopics: ['Security & Compliance', 'IAM', 'Security Best Practices'], subtopics: ['IAM Policies', 'Security Groups', 'Encryption', 'Compliance', 'Security Monitoring'], practicalTasks: ['Configure IAM', 'Set up security', 'Enable encryption', 'Monitor security'], miniProject: 'Secure a cloud infrastructure' },
                    { mainTopics: ['DevOps on Cloud', 'CI/CD', 'Infrastructure Automation'], subtopics: ['CodePipeline', 'CloudFormation', 'Terraform', 'Monitoring', 'Cost Optimization'], practicalTasks: ['Set up CI/CD', 'Automate infrastructure', 'Monitor services', 'Optimize costs'], miniProject: 'Build a complete CI/CD pipeline on cloud' },
                ],
                'cybersecurity': [
                    { mainTopics: ['Security Fundamentals', 'Threats & Vulnerabilities', 'Security Principles'], subtopics: ['Security Concepts', 'Attack Vectors', 'Vulnerability Assessment', 'Risk Management', 'Security Policies'], practicalTasks: ['Understand threats', 'Assess vulnerabilities', 'Create security policies', 'Identify risks'], miniProject: 'Conduct a security assessment' },
                    { mainTopics: ['Network Security', 'Firewalls', 'Intrusion Detection'], subtopics: ['Network Protocols', 'Firewall Configuration', 'IDS/IPS', 'VPN', 'Network Monitoring'], practicalTasks: ['Configure firewalls', 'Set up IDS', 'Implement VPN', 'Monitor networks'], miniProject: 'Secure a network infrastructure' },
                    { mainTopics: ['Cryptography', 'Encryption', 'Digital Signatures'], subtopics: ['Encryption Algorithms', 'Public Key Infrastructure', 'SSL/TLS', 'Hashing', 'Key Management'], practicalTasks: ['Implement encryption', 'Set up PKI', 'Configure SSL/TLS', 'Manage keys'], miniProject: 'Implement encryption for data protection' },
                    { mainTopics: ['Ethical Hacking', 'Penetration Testing', 'Security Tools'], subtopics: ['Penetration Testing', 'Vulnerability Scanning', 'Security Tools', 'Exploitation', 'Reporting'], practicalTasks: ['Perform pentesting', 'Use security tools', 'Identify vulnerabilities', 'Create reports'], miniProject: 'Conduct a penetration test' },
                    { mainTopics: ['Incident Response', 'Forensics', 'Compliance'], subtopics: ['Incident Handling', 'Digital Forensics', 'Compliance Standards', 'Security Audits', 'Recovery'], practicalTasks: ['Handle incidents', 'Perform forensics', 'Ensure compliance', 'Conduct audits'], miniProject: 'Create an incident response plan' },
                    { mainTopics: ['Security Operations', 'SIEM', 'Threat Intelligence'], subtopics: ['SIEM Tools', 'Log Analysis', 'Threat Hunting', 'Security Monitoring', 'Automation'], practicalTasks: ['Set up SIEM', 'Analyze logs', 'Hunt threats', 'Automate responses'], miniProject: 'Build a security operations center' },
                ],
                'blockchain': [
                    { mainTopics: ['Blockchain Fundamentals', 'Cryptography', 'Distributed Systems'], subtopics: ['Blockchain Basics', 'Cryptographic Hash', 'Consensus Mechanisms', 'Distributed Ledger', 'Smart Contracts Intro'], practicalTasks: ['Understand blockchain', 'Study cryptography', 'Learn consensus', 'Explore blockchains'], miniProject: 'Create a simple blockchain implementation' },
                    { mainTopics: ['Ethereum Development', 'Solidity', 'Smart Contracts'], subtopics: ['Solidity Language', 'Smart Contract Development', 'Remix IDE', 'Truffle', 'Hardhat'], practicalTasks: ['Write Solidity code', 'Deploy contracts', 'Test contracts', 'Use development tools'], miniProject: 'Build and deploy a smart contract' },
                    { mainTopics: ['DApp Development', 'Web3.js', 'Frontend Integration'], subtopics: ['DApp Architecture', 'Web3.js', 'Ethers.js', 'MetaMask Integration', 'IPFS'], practicalTasks: ['Build DApp frontend', 'Connect to blockchain', 'Integrate wallet', 'Use IPFS'], miniProject: 'Create a decentralized application' },
                    { mainTopics: ['DeFi Concepts', 'Token Standards', 'DeFi Protocols'], subtopics: ['ERC-20/ERC-721', 'DeFi Protocols', 'Liquidity Pools', 'Yield Farming', 'DEX'], practicalTasks: ['Create tokens', 'Interact with DeFi', 'Build DeFi features', 'Understand protocols'], miniProject: 'Build a DeFi application' },
                    { mainTopics: ['Security & Testing', 'Auditing', 'Best Practices'], subtopics: ['Smart Contract Security', 'Common Vulnerabilities', 'Testing Strategies', 'Auditing', 'Gas Optimization'], practicalTasks: ['Test contracts', 'Find vulnerabilities', 'Optimize gas', 'Audit code'], miniProject: 'Audit and secure a smart contract' },
                    { mainTopics: ['Blockchain Infrastructure', 'Nodes', 'Networks'], subtopics: ['Running Nodes', 'Network Participation', 'Scaling Solutions', 'Layer 2', 'Interoperability'], practicalTasks: ['Run blockchain node', 'Participate in network', 'Explore scaling', 'Use Layer 2'], miniProject: 'Set up and run a blockchain node' },
                ],
                'ui-ux': [
                    { mainTopics: ['Design Fundamentals', 'Principles', 'Color Theory'], subtopics: ['Design Principles', 'Color Theory', 'Typography', 'Layout', 'Visual Hierarchy'], practicalTasks: ['Study design principles', 'Create color palettes', 'Design layouts', 'Practice typography'], miniProject: 'Design a brand identity system' },
                    { mainTopics: ['User Research', 'Personas', 'User Journey'], subtopics: ['User Research Methods', 'Persona Creation', 'User Journey Mapping', 'Usability Testing', 'Interviews'], practicalTasks: ['Conduct research', 'Create personas', 'Map journeys', 'Run usability tests'], miniProject: 'Complete a user research project' },
                    { mainTopics: ['Wireframing & Prototyping', 'Tools', 'Interaction Design'], subtopics: ['Wireframing', 'Prototyping', 'Figma/Sketch', 'Interaction Design', 'User Flows'], practicalTasks: ['Create wireframes', 'Build prototypes', 'Design interactions', 'Test prototypes'], miniProject: 'Design and prototype a mobile app' },
                    { mainTopics: ['Visual Design', 'UI Design', 'Design Systems'], subtopics: ['Visual Design', 'Component Libraries', 'Design Systems', 'Style Guides', 'Iconography'], practicalTasks: ['Create UI designs', 'Build components', 'Develop design system', 'Create style guide'], miniProject: 'Build a complete design system' },
                    { mainTopics: ['Responsive Design', 'Accessibility', 'Usability'], subtopics: ['Responsive Principles', 'Accessibility Standards', 'Usability Testing', 'Cross-platform', 'Performance'], practicalTasks: ['Design responsive layouts', 'Ensure accessibility', 'Test usability', 'Optimize performance'], miniProject: 'Design an accessible, responsive website' },
                    { mainTopics: ['Portfolio & Presentation', 'Case Studies', 'Client Work'], subtopics: ['Portfolio Building', 'Case Study Creation', 'Presentation Skills', 'Client Communication', 'Freelancing'], practicalTasks: ['Build portfolio', 'Create case studies', 'Present work', 'Handle clients'], miniProject: 'Create a professional design portfolio' },
                ],
                'fullstack': [
                    { mainTopics: ['Frontend Basics', 'HTML, CSS, JavaScript', 'Responsive Design'], subtopics: ['HTML5', 'CSS3', 'JavaScript ES6+', 'Responsive Design', 'CSS Frameworks'], practicalTasks: ['Build static pages', 'Style with CSS', 'Add interactivity', 'Make responsive'], miniProject: 'Build a responsive portfolio website' },
                    { mainTopics: ['Frontend Framework', 'React/Vue', 'State Management'], subtopics: ['React/Vue Basics', 'Components', 'State Management', 'Routing', 'Hooks'], practicalTasks: ['Build components', 'Manage state', 'Add routing', 'Handle side effects'], miniProject: 'Create a single-page application' },
                    { mainTopics: ['Backend Development', 'Node.js/Python', 'Server Setup'], subtopics: ['Server Development', 'API Creation', 'Middleware', 'Error Handling', 'Validation'], practicalTasks: ['Set up server', 'Create APIs', 'Handle requests', 'Add validation'], miniProject: 'Build a RESTful API server' },
                    { mainTopics: ['Database Integration', 'SQL/NoSQL', 'ORM'], subtopics: ['Database Design', 'SQL Queries', 'MongoDB/PostgreSQL', 'ORM Usage', 'Migrations'], practicalTasks: ['Design database', 'Write queries', 'Integrate database', 'Handle migrations'], miniProject: 'Create a full-stack app with database' },
                    { mainTopics: ['Authentication & Security', 'JWT', 'Security Best Practices'], subtopics: ['Authentication', 'Authorization', 'JWT Tokens', 'Password Hashing', 'Security Measures'], practicalTasks: ['Implement auth', 'Secure APIs', 'Handle tokens', 'Add security'], miniProject: 'Build a secure full-stack application' },
                    { mainTopics: ['Deployment & DevOps', 'CI/CD', 'Cloud Deployment'], subtopics: ['Deployment Strategies', 'CI/CD Pipelines', 'Cloud Platforms', 'Docker', 'Monitoring'], practicalTasks: ['Deploy application', 'Set up CI/CD', 'Use containers', 'Monitor app'], miniProject: 'Deploy a full-stack application to production' },
                ],
            };

            // Get templates for selected category or default to web-dev
            const templates = weekTemplates[categoryId] || weekTemplates['web-dev'];

            // Generate weeks based on duration
            const generatedWeeks: Array<Omit<WeekContent, 'isCompleted' | 'quizCompleted'>> = [];
            for (let i = 0; i < totalWeeks; i++) {
                const templateIndex = i % templates.length;
                const template = templates[templateIndex];
                const resources = getResourcesForWeek(categoryId, i, template.mainTopics);
                generatedWeeks.push({
                    weekNumber: i + 1,
                    mainTopics: template.mainTopics,
                    subtopics: template.subtopics,
                    practicalTasks: template.practicalTasks,
                    miniProject: template.miniProject,
                    resources: resources,
                });
            }

            // Add revision week for beginners if duration > 8 weeks
            if (currentLevel === 'Beginner' && totalWeeks > 8) {
                const revisionResources: WeekResource[] = [
                    { type: 'practice', title: 'LeetCode', url: 'https://leetcode.com/' },
                    { type: 'practice', title: 'HackerRank', url: 'https://www.hackerrank.com/' },
                    { type: 'practice', title: 'InterviewBit', url: 'https://www.interviewbit.com/' },
                    { type: 'article', title: 'Resume Building Guide', url: 'https://www.geeksforgeeks.org/resume-building-for-freshers/' },
                    { type: 'article', title: 'Interview Preparation', url: 'https://www.geeksforgeeks.org/interview-preparation/' },
                ];
                generatedWeeks.push({
                    weekNumber: generatedWeeks.length + 1,
                    mainTopics: ['Revision & Practice', 'Portfolio Building', 'Interview Preparation'],
                    subtopics: ['Review All Topics', 'Build Portfolio', 'Practice Problems', 'Mock Interviews', 'Resume Building'],
                    practicalTasks: ['Review all concepts', 'Complete portfolio projects', 'Solve coding problems', 'Prepare resume'],
                    miniProject: 'Create a comprehensive portfolio showcasing all your projects',
                    resources: revisionResources,
                });
            }

            // Get category name for display
            const categoryName = categoriesList.find(c => c.id === categoryId)?.name || categoryId;

            return {
                careerGoal: categoryName,
                totalWeeks: generatedWeeks.length,
                weeks: generatedWeeks.map(w => ({
                    ...w,
                    isCompleted: false,
                    quizCompleted: false,
                })),
                createdAt: new Date().toISOString(),
            };
        };

        try {
            // Get category ID from selected category
            if (!selectedCategory) {
                setRoadmapError('Please select a category first');
                setIsGeneratingRoadmap(false);
                return;
            }

            const roadmap = await getRoadmapFromAPI(selectedCategory, totalWeeks, categories);
            setRoadmapData(roadmap);
            // If roadmap has no weeks, show "No data available" message
            if (!roadmap.weeks || roadmap.weeks.length === 0) {
                setRoadmapError('No data available for this category. Please add roadmap data in admin dashboard.');
            }
            setRoadmapStep('roadmap');
        } catch (err: any) {
            console.error('Roadmap generation error:', err);
            setRoadmapError(err.message || 'Failed to generate roadmap. Please ensure the roadmap exists in admin dashboard.');
        } finally {
            setIsGeneratingRoadmap(false);
        }
    };

    // Generate weekly quiz - use admin-managed quiz from API
    const generateWeeklyQuiz = async (weekNumber: number) => {
        setIsGeneratingQuiz(true);
        setRoadmapError(null);

        const week = roadmapData?.weeks.find(w => w.weekNumber === weekNumber);
        if (!week || !roadmapData) {
            setIsGeneratingQuiz(false);
            return;
        }

        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if week has admin-managed quiz questions
        if (week.quiz && week.quiz.length > 0) {
            const quiz: WeeklyQuiz = {
                weekNumber,
                questions: week.quiz.map(q => ({
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                })),
            };
            setWeeklyQuiz(quiz);
            setRoadmapStep('progress');
            setIsGeneratingQuiz(false);
            return;
        }

        // No quiz available - show error
        setRoadmapError(`No quiz available for Week ${weekNumber}. Please add quiz questions in admin dashboard.`);
        setIsGeneratingQuiz(false);
    };

    const submitWeeklyQuiz = () => {
        if (!weeklyQuiz || !roadmapData) return;

        let correct = 0;
        weeklyQuiz.questions.forEach((q) => {
            if (q.userAnswer === q.correctAnswer) correct++;
        });

        const score = Math.round((correct / weeklyQuiz.questions.length) * 100);
        const feedback = score >= 80
            ? "Excellent work! You've mastered this week's content. You can proceed to the next week."
            : `Good effort! You scored ${score}%. Review the topics and try to improve. You can still proceed, but consider reviewing.`;

        const updatedQuiz = { ...weeklyQuiz, score, feedback };
        setWeeklyQuiz(updatedQuiz);

        // Mark quiz as completed and unlock next week
        const updatedWeeks = roadmapData.weeks.map(w =>
            w.weekNumber === weeklyQuiz.weekNumber
                ? { ...w, quizCompleted: true }
                : w
        );
        setRoadmapData({ ...roadmapData, weeks: updatedWeeks });

        // Return to roadmap view
        setTimeout(() => {
            setRoadmapStep('roadmap');
            setWeeklyQuiz(null);
        }, 3000);
    };

    // Generate final exam - using static questions for now
    const generateFinalExam = async () => {
        setIsGeneratingExam(true);
        setRoadmapError(null);

        if (!roadmapData) {
            setRoadmapError('Roadmap data missing');
            setIsGeneratingExam(false);
            return;
        }

        // Simulate loading
        await new Promise(resolve => setTimeout(resolve, 800));

        // Final exam questions (static for now - can be moved to API later)
        const examQuestions: QuizQuestion[] = [
            {
                question: 'What is the primary purpose of version control systems?',
                options: [
                    'To track changes and enable collaboration',
                    'To compile code',
                    'To design interfaces',
                    'To deploy applications'
                ],
                correctAnswer: 0
            },
            {
                question: 'Which principle is NOT part of Object-Oriented Programming?',
                options: [
                    'Sequential Processing',
                    'Encapsulation',
                    'Inheritance',
                    'Polymorphism'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the main advantage of using frameworks?',
                options: [
                    'Provides structure and reusable components',
                    'Makes code run faster automatically',
                    'Reduces file size',
                    'Changes programming language'
                ],
                correctAnswer: 0
            },
            {
                question: 'What does REST API stand for?',
                options: [
                    'Representational State Transfer',
                    'Remote Execution System Transfer',
                    'Resource Exchange Standard Transfer',
                    'Request Execution System Transfer'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the purpose of database normalization?',
                options: [
                    'To reduce data redundancy and improve integrity',
                    'To increase data storage',
                    'To delete old data',
                    'To change data types'
                ],
                correctAnswer: 0
            },
            {
                question: 'Which HTTP method is idempotent?',
                options: [
                    'GET',
                    'POST',
                    'PUT',
                    'DELETE'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is state management used for in frontend?',
                options: [
                    'Managing and sharing data across components',
                    'Managing server resources',
                    'Managing database connections',
                    'Managing file systems'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the purpose of caching?',
                options: [
                    'To improve performance by storing frequently accessed data',
                    'To delete old data',
                    'To compress files',
                    'To encrypt data'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is SQL injection?',
                options: [
                    'A security vulnerability where malicious SQL is injected',
                    'A database query method',
                    'A data type',
                    'A programming language feature'
                ],
                correctAnswer: 0
            },
            {
                question: 'What does CI/CD stand for?',
                options: [
                    'Continuous Integration/Continuous Deployment',
                    'Code Integration/Code Deployment',
                    'Computer Integration/Computer Deployment',
                    'Component Integration/Component Deployment'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is containerization?',
                options: [
                    'Packaging applications with dependencies in isolated containers',
                    'Storing data in databases',
                    'Organizing code files',
                    'Designing user interfaces'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the purpose of API documentation?',
                options: [
                    'To explain how to use API endpoints',
                    'To compile code',
                    'To design interfaces',
                    'To deploy applications'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is responsive design?',
                options: [
                    'Designing websites that work on all screen sizes',
                    'Designing fast websites',
                    'Designing secure websites',
                    'Designing colorful websites'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the purpose of unit testing?',
                options: [
                    'To test individual components in isolation',
                    'To test entire application at once',
                    'To test user interfaces only',
                    'To test network connections'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is scalability?',
                options: [
                    'The ability to handle growing amounts of work',
                    'The size of files',
                    'The number of lines of code',
                    'The complexity of algorithms'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the primary key in a database?',
                options: [
                    'A unique identifier for each row',
                    'A foreign key reference',
                    'A data type',
                    'A query statement'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is JWT used for?',
                options: [
                    'Authentication and authorization',
                    'Database queries',
                    'File storage',
                    'Network routing'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is code profiling?',
                options: [
                    'Analyzing code to identify performance bottlenecks',
                    'Writing code',
                    'Compiling code',
                    'Deploying code'
                ],
                correctAnswer: 0
            },
            {
                question: 'What is the purpose of application monitoring?',
                options: [
                    'To track performance and health',
                    'To write code',
                    'To design UI',
                    'To compile programs'
                ],
                correctAnswer: 0
            },
            {
                question: 'Why are backups important?',
                options: [
                    'To prevent data loss and enable recovery',
                    'To increase performance',
                    'To reduce costs',
                    'To improve security'
                ],
                correctAnswer: 0
            }
        ];

        try {
            const exam: FinalExam = {
                questions: examQuestions,
                userAnswers: new Array(20).fill(undefined),
                completed: false,
            };
            setFinalExam(exam);
        } catch (err: any) {
            setRoadmapError('Failed to generate exam');
        } finally {
            setIsGeneratingExam(false);
        }
    };

    const submitFinalExam = () => {
        if (!finalExam || !roadmapData) return;

        let correct = 0;
        finalExam.questions.forEach((q, idx) => {
            if (finalExam.userAnswers[idx] === q.correctAnswer) correct++;
        });

        const score = Math.round((correct / finalExam.questions.length) * 100);
        const updatedExam = { ...finalExam, score, completed: true };
        setFinalExam(updatedExam);

        if (score >= 80) {
            // Generate certificate
            const cert: Certificate = {
                name: 'Student Name', // Could get from user profile
                career: roadmapData.careerGoal,
                score,
                date: new Date().toLocaleDateString(),
            };
            setCertificate(cert);
        }

        setRoadmapStep('evaluation');
    };

    // Render based on current step
    if (roadmapStep === 'analysis') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8">
                <div>
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Select Your Career Path</h2>
                            <p className="text-gray-600">Choose a category and set your learning duration to generate a personalized roadmap</p>
                        </div>

                        {roadmapError && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {roadmapError}
                                <button onClick={() => setRoadmapError(null)} className="ml-2 font-bold">×</button>
                            </div>
                        )}

                        <div className="space-y-8">
                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-4">
                                    Select Category *
                                    <span className="text-xs font-normal text-gray-500 ml-2">
                                        ({categories.length} {categories.length === 1 ? 'category' : 'categories'} available from API)
                                    </span>
                                </label>
                                {categories.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                                        <div className="text-4xl mb-3">📚</div>
                                        <p className="font-semibold mb-2">No categories available</p>
                                        <p className="text-sm">Please add categories in admin dashboard.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {categories.map((category) => (
                                            <button
                                                key={category.id}
                                                onClick={() => handleCategorySelect(category.id)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 ${selectedCategory === category.id
                                                    ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                                                    : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{category.icon}</div>
                                                <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Program Info Badge */}
                            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
                                        <span className="text-2xl">🎯</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">8-Week Comprehensive Program</h4>
                                        <p className="text-sm text-gray-600">Industry-aligned curriculum designed for skill mastery</p>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button - Premium Styling */}
                            <button
                                onClick={handleGenerateRoadmap}
                                disabled={!selectedCategory || isGeneratingRoadmap}
                                className="w-full py-5 bg-gradient-to-r from-orange-500 via-orange-500 to-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-3"
                            >
                                {isGeneratingRoadmap ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating Your Roadmap...
                                    </span>
                                ) : (
                                    <>
                                        <span>Start Your Learning Journey</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: Roadmap Display
    if (roadmapStep === 'roadmap' && roadmapData) {
        if (isGeneratingRoadmap) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8 flex items-center justify-center">
                    <LoadingSpinner message="Generating your personalized learning roadmap..." />
                </div>
            );
        }

        // Check if roadmap has no data
        if (!roadmapData.weeks || roadmapData.weeks.length === 0) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📚</div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-3">No Data Available</h2>
                                <p className="text-gray-600 text-lg mb-6">
                                    No roadmap data is available for <span className="font-semibold">{roadmapData.careerGoal}</span> category.
                                </p>
                                <p className="text-gray-500 mb-8">
                                    Please add roadmap data in the admin dashboard to view the learning path.
                                </p>
                                <button
                                    onClick={() => {
                                        setRoadmapStep('analysis');
                                        setRoadmapData(null);
                                        setRoadmapError(null);
                                    }}
                                    className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                                >
                                    ← Back to Categories
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const allWeeksCompleted = roadmapData.weeks.every(w => w.isCompleted && w.quizCompleted);
        const canTakeExam = allWeeksCompleted;

        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8">
                <div>
                    {roadmapError && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                            {roadmapError}
                            <button onClick={() => setRoadmapError(null)} className="ml-2 font-bold">×</button>
                        </div>
                    )}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{roadmapData.careerGoal} Roadmap</h2>
                                <p className="text-gray-600 mt-1">{roadmapData.totalWeeks} weeks • {careerAnalysis?.timeCommitment} hours/week</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-orange-600">
                                    {roadmapData.weeks.filter(w => w.isCompleted).length}/{roadmapData.totalWeeks}
                                </div>
                                <div className="text-sm text-gray-600">Weeks Completed</div>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {roadmapData.weeks.map((week, idx) => (
                                <div
                                    key={idx}
                                    className={`border-2 rounded-xl p-6 transition-all ${week.isCompleted && week.quizCompleted
                                        ? 'border-green-500 bg-green-50'
                                        : week.isCompleted
                                            ? 'border-orange-500 bg-orange-50'
                                            : 'border-gray-200 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${week.isCompleted && week.quizCompleted
                                                ? 'bg-green-500 text-white'
                                                : week.isCompleted
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {week.isCompleted && week.quizCompleted ? '✓' : week.weekNumber}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">Week {week.weekNumber}</h3>
                                                {week.isCompleted && week.quizCompleted && (
                                                    <span className="text-sm text-green-600 font-medium">✓ Completed</span>
                                                )}
                                            </div>
                                        </div>
                                        {week.isCompleted && !week.quizCompleted && (
                                            <button
                                                onClick={() => {
                                                    setCurrentWeek(week.weekNumber);
                                                    generateWeeklyQuiz(week.weekNumber);
                                                }}
                                                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600"
                                            >
                                                Take Quiz
                                            </button>
                                        )}
                                        {!week.isCompleted && (
                                            <button
                                                onClick={() => {
                                                    const updatedWeeks = roadmapData.weeks.map((w, i) =>
                                                        i === idx ? { ...w, isCompleted: true } : w
                                                    );
                                                    setRoadmapData({ ...roadmapData, weeks: updatedWeeks });
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                            >
                                                Mark Complete
                                            </button>
                                        )}
                                    </div>

                                    <div className="ml-16 space-y-6">
                                        {/* Cumulative Learning Progress UI */}
                                        {week.weekNumber > 1 && (
                                            <div className="p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-xl">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                                    Baseline: Knowledge from Weeks 1-{week.weekNumber - 1}
                                                </h4>
                                                <div className="flex flex-wrap gap-2 opacity-60 grayscale hover:grayscale-0 transition-all cursor-help" title="These topics were covered in previous weeks and were built upon to reach this stage.">
                                                    {Array.from(new Set(
                                                        roadmapData.weeks
                                                            .slice(0, week.weekNumber - 1)
                                                            .flatMap(w => w.mainTopics || [])
                                                    )).slice(0, 10).map((topic, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-500 font-medium">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                    {week.weekNumber > 2 && <span className="text-[10px] text-gray-400 self-center">...and more</span>}
                                                </div>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-xs">🚀</span>
                                                Current Stage Objective
                                            </h4>

                                            {week.roadmap && (
                                                <div className="bg-white border-2 border-orange-100 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed text-sm relative z-10 whitespace-pre-wrap">
                                                        {week.roadmap}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                                        <h5 className="font-black text-[10px] text-blue-600 uppercase tracking-widest mb-3">Key Concepts</h5>
                                                        <ul className="space-y-2">
                                                            {week.mainTopics.map((topic, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></span>
                                                                    {topic}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                                                        <h5 className="font-black text-[10px] text-purple-600 uppercase tracking-widest mb-3">Active Tasks</h5>
                                                        <ul className="space-y-2">
                                                            {week.practicalTasks.map((task, i) => (
                                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                                    <span className="mt-1 w-4 h-4 rounded border border-purple-300 flex-shrink-0 flex items-center justify-center text-[10px]">✓</span>
                                                                    {task}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-2xl">
                                                        <h5 className="font-black text-[10px] text-yellow-700 uppercase tracking-widest mb-3">Stage Milestone (Project)</h5>
                                                        <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                                                            "{week.miniProject}"
                                                        </p>
                                                    </div>

                                                    {/* Learning Resources Integrated */}
                                                    {week.resources && week.resources.length > 0 && (
                                                        <div className="p-4 bg-green-50/50 border border-green-200 rounded-2xl">
                                                            <h5 className="font-black text-[10px] text-green-700 uppercase tracking-widest mb-3">Support Materials</h5>
                                                            <div className="flex flex-col gap-2">
                                                                {week.resources.map((resource, resIdx) => (
                                                                    <a
                                                                        key={resIdx}
                                                                        href={resource.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center justify-between p-2 bg-white border border-green-100 rounded-lg hover:border-green-300 transition-all group"
                                                                    >
                                                                        <span className="text-xs font-bold text-gray-700 truncate pr-2">{resource.title}</span>
                                                                        <span className="text-[10px] text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">Launch ↗</span>
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {canTakeExam && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => {
                                        setRoadmapStep('exam');
                                        generateFinalExam();
                                    }}
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                                >
                                    Take Final Exam →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Step 3: Progress Tracking (Weekly Quiz)
    if (roadmapStep === 'progress' && weeklyQuiz) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8">
                <div>
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Week {weeklyQuiz.weekNumber} Quiz</h2>
                        {weeklyQuiz.questions.map((q, idx) => (
                            <div key={idx} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="font-semibold text-gray-900 mb-3">{idx + 1}. {q.question}</p>
                                <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-orange-50 border border-gray-200">
                                            <input
                                                type="radio"
                                                name={`question-${idx}`}
                                                value={optIdx}
                                                checked={q.userAnswer === optIdx}
                                                onChange={() => {
                                                    const updated = weeklyQuiz.questions.map((qu, i) =>
                                                        i === idx ? { ...qu, userAnswer: optIdx } : qu
                                                    );
                                                    setWeeklyQuiz({ ...weeklyQuiz, questions: updated });
                                                }}
                                                className="w-4 h-4 text-orange-500"
                                            />
                                            <span className="text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => submitWeeklyQuiz()}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold"
                        >
                            Submit Quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 4: Final Exam
    if (roadmapStep === 'exam' && finalExam) {
        if (isGeneratingExam) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8 flex items-center justify-center">
                    <LoadingSpinner message="Generating final exam..." />
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8">
                <div>
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Final Exam</h2>
                            <p className="text-gray-600">{roadmapData?.careerGoal} - 20 Questions</p>
                        </div>
                        {finalExam.questions.map((q, idx) => (
                            <div key={idx} className="mb-6 p-6 bg-gray-50 rounded-xl">
                                <p className="font-semibold text-gray-900 mb-4">{idx + 1}. {q.question}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-orange-50 border-2 border-gray-200 hover:border-orange-300">
                                            <input
                                                type="radio"
                                                name={`exam-question-${idx}`}
                                                value={optIdx}
                                                checked={finalExam.userAnswers[idx] === optIdx}
                                                onChange={() => {
                                                    const updated = [...finalExam.userAnswers];
                                                    updated[idx] = optIdx;
                                                    setFinalExam({ ...finalExam, userAnswers: updated });
                                                }}
                                                className="w-4 h-4 text-orange-500"
                                            />
                                            <span className="text-gray-700">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => submitFinalExam()}
                            disabled={finalExam.userAnswers.some(a => a === undefined)}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Submit Exam
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Step 5: Evaluation & Certificate
    if (roadmapStep === 'evaluation' && finalExam && finalExam.score !== undefined) {
        const passed = finalExam.score >= 80;
        return (
            <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 -m-6 p-8">
                <div>
                    <div className={`bg-white rounded-2xl shadow-xl border-2 p-8 ${passed ? 'border-green-500' : 'border-red-500'}`}>
                        <div className="text-center mb-8">
                            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {passed ? '✓' : '✗'}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                {passed ? 'Congratulations!' : 'Keep Learning!'}
                            </h2>
                            <p className="text-2xl font-semibold text-gray-700">
                                Your Score: {finalExam.score}%
                            </p>
                        </div>

                        {passed && certificate && (
                            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-8 mb-6 text-center">
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Certificate of Completion</h3>
                                <div className="bg-white rounded-lg p-6 border-2 border-gray-300">
                                    <p className="text-lg text-gray-700 mb-2">This certifies that</p>
                                    <p className="text-3xl font-bold text-gray-900 mb-4">{certificate.name}</p>
                                    <p className="text-lg text-gray-700 mb-2">has successfully completed</p>
                                    <p className="text-2xl font-bold text-orange-600 mb-4">{certificate.career}</p>
                                    <p className="text-lg text-gray-700 mb-2">with a score of</p>
                                    <p className="text-3xl font-bold text-gray-900 mb-4">{certificate.score}%</p>
                                    <p className="text-sm text-gray-600">{certificate.date}</p>
                                </div>
                            </div>
                        )}

                        {!passed && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                                <h3 className="font-semibold text-red-900 mb-3">Areas for Improvement</h3>
                                <p className="text-red-700 mb-4">Your score is below 80%. Review the following weeks and try again:</p>
                                <ul className="list-disc list-inside text-red-700 space-y-1">
                                    {roadmapData?.weeks.slice(0, 3).map((w, i) => (
                                        <li key={i}>Week {w.weekNumber}</li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => {
                                        setRoadmapStep('roadmap');
                                        setFinalExam(null);
                                    }}
                                    className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                                >
                                    Review & Retake Exam
                                </button>
                            </div>
                        )}

                        <div className="text-center">
                            <button
                                onClick={() => {
                                    setRoadmapStep('analysis');
                                    setCareerAnalysis(null);
                                    setRoadmapData(null);
                                    setFinalExam(null);
                                    setCertificate(null);
                                }}
                                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                            >
                                Start New Roadmap
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

// Old components removed


// ============================================
// MAIN CAREER GUIDANCE PAGE
// ============================================

// ============================================
// TRENDING CAREERS COMPONENT
// ============================================

interface TrendingCareersSectionProps {
    careers: TrendingCareer[];
    onExploreRoadmap: (career: string) => void;
}

const TrendingCareersSection: React.FC<TrendingCareersSectionProps> = ({ careers, onExploreRoadmap }) => {
    const [selectedCareer, setSelectedCareer] = useState<TrendingCareer | null>(null);

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">8+</div>
                    <div className="text-sm opacity-90">Hot Careers</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">₹25L+</div>
                    <div className="text-sm opacity-90">Max Salary</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">40%</div>
                    <div className="text-sm opacity-90">Avg Growth</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold">100+</div>
                    <div className="text-sm opacity-90">Companies Hiring</div>
                </div>
            </div>

            {/* Career Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                {careers.map((career, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSelectedCareer(selectedCareer?.title === career.title ? null : career)}
                        className={`bg-white border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedCareer?.title === career.title ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-gray-200'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {career.title}
                                    {career.demand === 'Very High' && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                                            <FireIcon /> Hot
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{career.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1 text-green-600">
                                <CurrencyIcon />
                                <span className="font-semibold">{career.avgSalary}</span>
                            </div>
                            <div className="flex items-center gap-1 text-blue-600">
                                <TrendingIcon />
                                <span className="font-semibold">{career.growth}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${career.demand === 'Very High' ? 'bg-red-100 text-red-700' :
                                career.demand === 'High' ? 'bg-orange-100 text-orange-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {career.demand} Demand
                            </span>
                        </div>

                        {selectedCareer?.title === career.title && (
                            <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
                                <div className="mb-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        {career.skills.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Companies</p>
                                    <div className="flex flex-wrap gap-2">
                                        {career.companies.map((company, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                                {company}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {career.links && career.links.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Roadmap Links</p>
                                        <ul className="space-y-1">
                                            {career.links.map((link, i) => (
                                                <li key={i} className="text-xs">
                                                    <a
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-orange-600 hover:text-orange-700 break-all"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {link}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onExploreRoadmap(career.title);
                                    }}
                                    className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                                >
                                    Explore Roadmap →
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};






// ============================================
// PROJECT IDEAS COMPONENT
// ============================================

interface ProjectIdeasSectionProps {
    ideas: ProjectIdea[];
}

const ProjectIdeasSection: React.FC<ProjectIdeasSectionProps> = ({ ideas }) => {
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [selectedProject, setSelectedProject] = useState<ProjectIdea | null>(null);

    const filteredProjects = filterDifficulty === 'all'
        ? ideas
        : ideas.filter(p => p.difficulty === filterDifficulty);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">💡 B.Tech Project Ideas</h2>
                <p className="text-gray-600">Stand out with impressive projects that showcase your skills</p>
            </div>

            {/* Filter */}
            <div className="flex justify-center gap-2 mb-6">
                {['all', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                    <button
                        key={level}
                        onClick={() => setFilterDifficulty(level)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filterDifficulty === level
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {level === 'all' ? 'All Levels' : level}
                    </button>
                ))}
            </div>

            {/* Project Cards */}
            <div className="grid md:grid-cols-2 gap-5">
                {filteredProjects.map((project, idx) => (
                    <div
                        key={idx}
                        className={`bg-white border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedProject?.title === project.title ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200'
                            }`}
                        onClick={() => setSelectedProject(selectedProject?.title === project.title ? null : project)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                project.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {project.difficulty}
                            </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span>⏱️ {project.duration}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {project.technologies.map((tech, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    {tech}
                                </span>
                            ))}
                        </div>

                        {selectedProject?.title === project.title && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Features to Build:</p>
                                <ul className="space-y-1">
                                    {project.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                            <CheckIcon />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                {(project.githubLinks && project.githubLinks.length > 0) || (project.demoLinks && project.demoLinks.length > 0) ? (
                                    <div className="mt-3 space-y-3">
                                        {project.githubLinks && project.githubLinks.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Helpful GitHub Links</p>
                                                <ul className="space-y-1">
                                                    {project.githubLinks.map((link, i) => (
                                                        <li key={i} className="text-xs break-all">
                                                            <a
                                                                href={link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-orange-600 hover:text-orange-700"
                                                            >
                                                                {link}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {project.demoLinks && project.demoLinks.length > 0 && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Demo Links</p>
                                                <ul className="space-y-1">
                                                    {project.demoLinks.map((link, i) => (
                                                        <li key={i} className="text-xs break-all">
                                                            <a
                                                                href={link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-orange-600 hover:text-orange-700"
                                                            >
                                                                {link}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                                <div className="mt-4 flex gap-2">
                                    <a
                                        href={`https://github.com/topics/${project.technologies[0].toLowerCase().replace(/[^a-z]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2 bg-gray-900 text-white rounded-lg font-medium text-center text-sm hover:bg-gray-800 transition-colors"
                                    >
                                        Find Similar on GitHub
                                    </a>
                                    <a
                                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(project.title + ' tutorial')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium text-center text-sm hover:bg-red-700 transition-colors"
                                    >
                                        Watch Tutorials
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// MAIN CAREER GUIDANCE PAGE
// ============================================

interface CareerGuidancePageProps {
    toggleSidebar?: () => void;
}

const CareerGuidancePage: React.FC<CareerGuidancePageProps> = ({ toggleSidebar }) => {
    const [trendingCareersData, setTrendingCareersData] = useState<TrendingCareer[]>(defaultTrendingCareers);
    const [projectIdeasData, setProjectIdeasData] = useState<ProjectIdea[]>(defaultProjectIdeas);
    const [placementPhasesData, setPlacementPhasesData] = useState<PlacementPhase[]>(defaultPlacementPhases);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<CareerTab>('trending');
    const [recommendStep, setRecommendStep] = useState<RecommendStep>(0);
    const [responses, setResponses] = useState<string[][]>([]);
    const [careerResult, setCareerResult] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // New Roadmap States
    const [roadmapStep, setRoadmapStep] = useState<'analysis' | 'roadmap' | 'progress' | 'exam' | 'evaluation'>('analysis');
    const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysis | null>(null);
    const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
    const [currentWeek, setCurrentWeek] = useState<number | null>(null);
    const [weeklyQuiz, setWeeklyQuiz] = useState<WeeklyQuiz | null>(null);
    const [finalExam, setFinalExam] = useState<FinalExam | null>(null);
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
    const [isGeneratingExam, setIsGeneratingExam] = useState(false);
    const [roadmapError, setRoadmapError] = useState<string | null>(null);

    // Fetch data from API on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                // Fetch trending careers
                const careersResponse = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        section: 'trending',
                        action: 'list',
                    }),
                });

                if (careersResponse.ok) {
                    const careersData = await careersResponse.json();
                    if (careersData.success && Array.isArray(careersData.items) && careersData.items.length > 0) {
                        // Map API response to TrendingCareer interface (ignore id, createdAt, updatedAt)
                        const mappedCareers: TrendingCareer[] = careersData.items.map((item: any) => ({
                            title: item.title || '',
                            avgSalary: item.avgSalary || '',
                            growth: item.growth || '',
                            demand: item.demand || 'High',
                            skills: Array.isArray(item.skills) ? item.skills : [],
                            companies: Array.isArray(item.companies) ? item.companies : [],
                            description: item.description || '',
                            links: Array.isArray(item.links) ? item.links : [],
                        }));
                        setTrendingCareersData(mappedCareers);
                    }
                }

                // Fetch project ideas
                const projectsResponse = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        section: 'projects',
                        action: 'list',
                    }),
                });

                if (projectsResponse.ok) {
                    const projectsData = await projectsResponse.json();
                    if (projectsData.success && Array.isArray(projectsData.items) && projectsData.items.length > 0) {
                        // Map API response to ProjectIdea interface (ignore id, createdAt, updatedAt)
                        const mappedProjects: ProjectIdea[] = projectsData.items.map((item: any) => ({
                            title: item.title || '',
                            difficulty: item.difficulty || 'Intermediate',
                            duration: item.duration || '',
                            technologies: Array.isArray(item.technologies) ? item.technologies : [],
                            description: item.description || '',
                            features: Array.isArray(item.features) ? item.features : [],
                            githubLinks: Array.isArray(item.githubLinks) ? item.githubLinks : [],
                            demoLinks: Array.isArray(item.demoLinks) ? item.demoLinks : [],
                        }));
                        setProjectIdeasData(mappedProjects);
                    }
                }

                // Fetch placement prep phases
                try {
                    // Only fetch if API endpoint is configured (not placeholder)
                    if (PLACEMENT_PREP_API_ENDPOINT && !PLACEMENT_PREP_API_ENDPOINT.includes('YOUR_API_GATEWAY_URL')) {
                        const placementResponse = await fetch(PLACEMENT_PREP_API_ENDPOINT, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                action: 'list',
                            }),
                        });

                        if (placementResponse.ok) {
                            const placementData = await placementResponse.json();
                            if (placementData.success && Array.isArray(placementData.phases)) {
                                // Map API response to PlacementPhase interface
                                const mappedPhases: PlacementPhase[] = placementData.phases.map((item: any) => ({
                                    id: item.id || '',
                                    year: item.year || '',
                                    months: item.months || '',
                                    title: item.title || '',
                                    description: item.description || '',
                                    colorClass: item.colorClass || 'from-blue-500 to-indigo-600',
                                    badgeClass: item.badgeClass || 'bg-blue-100 text-blue-700',
                                    icon: item.icon || '📋',
                                    relatedTopics: Array.isArray(item.relatedTopics) ? item.relatedTopics : [],
                                    tasks: Array.isArray(item.tasks) ? item.tasks.map((task: any) => ({
                                        id: task.id || '',
                                        title: task.title || '',
                                        description: task.description || '',
                                        difficulty: task.difficulty || 'Easy',
                                        practiceLink: task.practiceLink || '',
                                        note: task.note || '',
                                        needsRevision: !!task.needsRevision,
                                        completed: !!task.completed,
                                        helpfulLinks: Array.isArray(task.helpfulLinks) ? task.helpfulLinks : []
                                    })) : [],
                                    resources: Array.isArray(item.resources) ? item.resources.map((r: any) => ({
                                        name: r.name || '',
                                        url: r.url || '',
                                        type: r.type || '',
                                    })) : [],
                                }));
                                if (mappedPhases.length > 0) {
                                    setPlacementPhasesData(mappedPhases);
                                }
                            }
                        }
                    } else {
                        // Use default data if API not configured
                        console.log('Placement prep API not configured, using default data');
                        setPlacementPhasesData(defaultPlacementPhases);
                    }
                } catch (placementError) {
                    console.error('Failed to fetch placement prep data:', placementError);
                    // Fallback to default data
                    setPlacementPhasesData(defaultPlacementPhases);
                }
            } catch (error) {
                console.error('Failed to fetch career guidance data from API:', error);
                // Fallback to localStorage or default data
                setTrendingCareersData(loadFromStorage<TrendingCareer>(TRENDING_CAREERS_KEY, defaultTrendingCareers));
                setProjectIdeasData(loadFromStorage<ProjectIdea>(PROJECT_IDEAS_KEY, defaultProjectIdeas));
                setPlacementPhasesData(loadFromStorage<PlacementPhase>(PLACEMENT_PREP_KEY, defaultPlacementPhases));
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    // Option states for each step
    const [specializationOptions, setSpecializationOptions] = useState<OptionItem[]>([
        { option: "Computer Science (CSE)", isSelected: false },
        { option: "Information Technology (IT)", isSelected: false },
        { option: "Electronics & Communication (ECE)", isSelected: false },
        { option: "Electrical Engineering (EE)", isSelected: false },
        { option: "Mechanical Engineering", isSelected: false },
        { option: "Civil Engineering", isSelected: false },
        { option: "Chemical Engineering", isSelected: false },
        { option: "AI & Machine Learning", isSelected: false },
        { option: "Data Science", isSelected: false },
        { option: "Cybersecurity", isSelected: false },
        { option: "Robotics & Automation", isSelected: false },
        { option: "Biotechnology", isSelected: false },
    ]);

    const [interestOptions, setInterestOptions] = useState<OptionItem[]>([
        { option: "Cloud computing", isSelected: false },
        { option: "Cybersecurity", isSelected: false },
        { option: "Data analytics", isSelected: false },
        { option: "Machine learning", isSelected: false },
        { option: "Research", isSelected: false },
        { option: "Graphic designing", isSelected: false },
        { option: "UI/UX", isSelected: false },
        { option: "Backend", isSelected: false },
        { option: "Frontend", isSelected: false },
        { option: "Full stack development", isSelected: false },
        { option: "Web development", isSelected: false },
        { option: "Content writing", isSelected: false },
        { option: "App development", isSelected: false },
        { option: "Blockchain", isSelected: false },
        { option: "System design", isSelected: false },
        { option: "Game development", isSelected: false },
        { option: "IOT", isSelected: false },
        { option: "DevOps", isSelected: false },
        { option: "AR/VR", isSelected: false },
        { option: "Database Technologies", isSelected: false },
    ]);

    const [skillOptions, setSkillOptions] = useState<OptionItem[]>([
        { option: "Python", isSelected: false },
        { option: "Java", isSelected: false },
        { option: "Kotlin", isSelected: false },
        { option: "Flutter", isSelected: false },
        { option: "SQL", isSelected: false },
        { option: "Programming", isSelected: false },
        { option: "Analytic thinking", isSelected: false },
        { option: "Linux", isSelected: false },
        { option: "C++", isSelected: false },
        { option: "AWS", isSelected: false },
        { option: "HTML/CSS", isSelected: false },
        { option: "JavaScript", isSelected: false },
        { option: "React", isSelected: false },
        { option: "Node.js", isSelected: false },
        { option: "Flask", isSelected: false },
        { option: "Django", isSelected: false },
        { option: "GCP", isSelected: false },
        { option: "DSA", isSelected: false },
        { option: "Figma", isSelected: false },
        { option: "Android/Flutter", isSelected: false },
        { option: "Excel", isSelected: false },
        { option: "Power BI", isSelected: false },
    ]);

    const [certOptions, setCertOptions] = useState<OptionItem[]>([
        { option: "None", isSelected: false },
    ]);

    const questions = [
        { title: "What's your specialization?", subtitle: "Select your current field of study or expertise" },
        { title: "What interests you?", subtitle: "Choose areas that excite you the most" },
        { title: "What skills do you have?", subtitle: "Select skills you've developed or want to develop" },
        { title: "Any certifications?", subtitle: "Add any certifications or courses you've completed" },
    ];

    const handleContinue = (selected: string[]) => {
        if (selected.length === 0) return;
        setResponses(prev => [...prev, selected]);
        setRecommendStep(prev => (prev + 1) as RecommendStep);
    };

    // Submit career recommendation
    useEffect(() => {
        if (recommendStep === 4 && responses.length === 4) {
            submitCareerRecommendation();
        }
    }, [recommendStep, responses]);

    const submitCareerRecommendation = async () => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("specialization", responses[0].toString());
            formData.append("interest", responses[1].toString());
            formData.append("skills", responses[2].toString());
            formData.append("certification", responses[3].toString());

            const res = await fetch("https://harshalnelge.pythonanywhere.com/career/recommend/", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error(res.statusText);

            const data = await res.json();
            setCareerResult(data);
            setRecommendStep(5);
        } catch (error) {
            console.error("Error:", error);
            // Fallback mock result
            setCareerResult([
                "Full Stack Developer",
                "Backend Developer",
                "Cloud Engineer",
                "DevOps Engineer"
            ]);
            setRecommendStep(5);
        } finally {
            setIsLoading(false);
        }
    };

    const resetRecommendation = () => {
        setRecommendStep(0);
        setResponses([]);
        setCareerResult(null);
        // Reset selections
        setSpecializationOptions(prev => prev.map(o => ({ ...o, isSelected: false })));
        setInterestOptions(prev => prev.map(o => ({ ...o, isSelected: false })));
        setSkillOptions(prev => prev.map(o => ({ ...o, isSelected: false })));
        setCertOptions(prev => prev.map(o => ({ ...o, isSelected: false })));
    };

    // Handler to continue to roadmap from career recommendation
    const handleContinueToRoadmap = (career: string) => {
        // Set career analysis with the recommended career
        setCareerAnalysis({
            careerGoal: career,
            currentLevel: 'Beginner',
            timeCommitment: 10,
            preferredTechStack: []
        });
        setActiveTab('roadmap');
    };

    const tabs = [
        { id: 'trending' as CareerTab, label: 'Trending Careers', icon: <TrendingIcon /> },
        { id: 'recommend' as CareerTab, label: 'Career Match', icon: <TargetIcon /> },
        { id: 'roadmap' as CareerTab, label: 'Roadmap', icon: <RoadmapIcon /> },
        { id: 'placement' as CareerTab, label: 'Placement Prep', icon: <PlacementIcon /> },
        { id: 'projects' as CareerTab, label: 'Project Ideas', icon: <ProjectIcon /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        {/* Mobile Menu Button */}
                        {toggleSidebar && (
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                                aria-label="Toggle sidebar"
                            >
                                <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        )}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 flex-shrink-0">
                            <SparkleIcon />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">Career Guidance Hub</h1>
                            <p className="text-sm sm:text-base text-gray-600 truncate">For B.Tech Students & Fresh Graduates</p>
                        </div>
                    </div>
                    <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl">
                        <p className="text-xs sm:text-sm text-gray-700">
                            🎓 <span className="font-semibold">Designed for Engineering Students:</span> Discover trending tech careers, prepare for campus placements, find project ideas, and build your career roadmap.
                        </p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {tab.icon}
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div>
                    {/* Trending Careers Tab */}
                    {activeTab === 'trending' && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            {isLoadingData ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-gray-600">Loading trending careers...</p>
                                    </div>
                                </div>
                            ) : (
                                <TrendingCareersSection
                                    careers={trendingCareersData}
                                    onExploreRoadmap={(career) => {
                                        handleContinueToRoadmap(career);
                                    }}
                                />
                            )}
                        </div>
                    )}

                    {/* Placement Prep Tab */}
                    {activeTab === 'placement' && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            {isLoadingData ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-gray-600">Loading placement preparation data...</p>
                                    </div>
                                </div>
                            ) : placementPhasesData.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📚</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Placement Data Available</h3>
                                    <p className="text-gray-600">Placement preparation content will appear here once it's added by the admin.</p>
                                </div>
                            ) : (
                                <PlacementPrepSection phases={placementPhasesData} />
                            )}
                        </div>
                    )}

                    {/* Project Ideas Tab */}
                    {activeTab === 'projects' && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            {isLoadingData ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-sm text-gray-600">Loading project ideas...</p>
                                    </div>
                                </div>
                            ) : (
                                <ProjectIdeasSection ideas={projectIdeasData} />
                            )}
                        </div>
                    )}

                    {/* Career Recommendation Tab */}
                    {activeTab === 'recommend' && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            {recommendStep < 4 && (
                                <>
                                    <ProgressBar step={recommendStep} totalSteps={4} />

                                    {recommendStep === 0 && (
                                        <Selector
                                            title={questions[0].title}
                                            subtitle={questions[0].subtitle}
                                            options={specializationOptions}
                                            setOptions={setSpecializationOptions}
                                            onContinue={handleContinue}
                                            placeholder="Add your specialization..."
                                        />
                                    )}

                                    {recommendStep === 1 && (
                                        <Selector
                                            title={questions[1].title}
                                            subtitle={questions[1].subtitle}
                                            options={interestOptions}
                                            setOptions={setInterestOptions}
                                            onContinue={handleContinue}
                                            placeholder="Add your interest..."
                                        />
                                    )}

                                    {recommendStep === 2 && (
                                        <Selector
                                            title={questions[2].title}
                                            subtitle={questions[2].subtitle}
                                            options={skillOptions}
                                            setOptions={setSkillOptions}
                                            onContinue={handleContinue}
                                            placeholder="Add a skill..."
                                        />
                                    )}

                                    {recommendStep === 3 && (
                                        <Selector
                                            title={questions[3].title}
                                            subtitle={questions[3].subtitle}
                                            options={certOptions}
                                            setOptions={setCertOptions}
                                            onContinue={handleContinue}
                                            placeholder="Add a certification..."
                                        />
                                    )}
                                </>
                            )}

                            {recommendStep === 4 && isLoading && (
                                <LoadingSpinner message="AI is analyzing your profile..." />
                            )}

                            {recommendStep === 5 && careerResult && (
                                <ResultComponent
                                    result={careerResult}
                                    onGenerateAgain={resetRecommendation}
                                    onContinueToRoadmap={handleContinueToRoadmap}
                                />
                            )}
                        </div>
                    )}

                    {/* Roadmap Tab - New Full-Screen Implementation */}
                    {activeTab === 'roadmap' && (
                        <RoadmapFeature
                            roadmapStep={roadmapStep}
                            setRoadmapStep={setRoadmapStep}
                            careerAnalysis={careerAnalysis}
                            setCareerAnalysis={setCareerAnalysis}
                            roadmapData={roadmapData}
                            setRoadmapData={setRoadmapData}
                            currentWeek={currentWeek}
                            setCurrentWeek={setCurrentWeek}
                            weeklyQuiz={weeklyQuiz}
                            setWeeklyQuiz={setWeeklyQuiz}
                            finalExam={finalExam}
                            setFinalExam={setFinalExam}
                            certificate={certificate}
                            setCertificate={setCertificate}
                            isGeneratingRoadmap={isGeneratingRoadmap}
                            setIsGeneratingRoadmap={setIsGeneratingRoadmap}
                            isGeneratingQuiz={isGeneratingQuiz}
                            setIsGeneratingQuiz={setIsGeneratingQuiz}
                            isGeneratingExam={isGeneratingExam}
                            setIsGeneratingExam={setIsGeneratingExam}
                            roadmapError={roadmapError}
                            setRoadmapError={setRoadmapError}
                        />
                    )}
                </div>

                {/* Features */}
                <div className="mt-12">
                    <h3 className="text-center text-lg font-semibold text-gray-900 mb-6">🚀 Everything You Need for Career Success</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { icon: <TrendingIcon />, title: "Trending Careers", desc: "Hot jobs & salaries" },
                            { icon: <TargetIcon />, title: "AI Career Match", desc: "Find your path" },
                            { icon: <RoadmapIcon />, title: "Learning Roadmap", desc: "Step-by-step guide" },
                            { icon: <PlacementIcon />, title: "Placement Prep", desc: "DSA & interviews" },
                            { icon: <ProjectIcon />, title: "Project Ideas", desc: "Build your portfolio" },
                        ].map((feature, idx) => (
                            <div key={idx} className="text-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-orange-200 transition-all cursor-pointer" onClick={() => setActiveTab(idx === 0 ? 'trending' : idx === 1 ? 'recommend' : idx === 2 ? 'roadmap' : idx === 3 ? 'placement' : 'projects')}>
                                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
                                <p className="text-xs text-gray-500">{feature.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Stats for credibility */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl text-white">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-orange-400">10K+</div>
                                <div className="text-sm text-gray-400">Students Guided</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-green-400">95%</div>
                                <div className="text-sm text-gray-400">Placement Rate</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-blue-400">500+</div>
                                <div className="text-sm text-gray-400">Partner Companies</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-purple-400">₹12L</div>
                                <div className="text-sm text-gray-400">Avg Package</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerGuidancePage;
