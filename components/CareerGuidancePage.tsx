import React, { useState, useEffect } from 'react';

// ============================================
// TYPES & INTERFACES
// ============================================

interface OptionItem {
    option: string;
    isSelected: boolean;
}

interface RoadmapStep {
    title: string;
    description: string;
    skills: string[];
    sub_steps: {
        title: string;
        description: string;
        skills: string[];
    }[];
}

interface Roadmap {
    title: string;
    description: string;
    steps: RoadmapStep[];
}

interface InternshipPhase {
    task: string;
    deadline: string;
    topicsCovered: string;
}

interface InternshipData {
    CompanyName: string;
    companyDescription: string;
    YourRole: string;
    phases: InternshipPhase[];
}

type CareerTab = 'trending' | 'recommend' | 'roadmap' | 'internship' | 'placement' | 'projects';
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

interface PlacementTopic {
    title: string;
    importance: 'Critical' | 'Important' | 'Good to Know';
    timeNeeded: string;
    resources: { name: string; url: string; type: string }[];
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

const InternshipIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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

const BookIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
const API_ENDPOINT = 'https://kuxbswn0c9.execute-api.ap-south-2.amazonaws.com/default/Trendingcarrers_ProjectIdeas';

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
// PLACEMENT PREP DATA
// ============================================

const placementTopics: PlacementTopic[] = [
    {
        title: "Data Structures & Algorithms",
        importance: "Critical",
        timeNeeded: "3-4 months",
        resources: [
            { name: "LeetCode", url: "https://leetcode.com", type: "Practice" },
            { name: "Striver's A2Z DSA Sheet", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", type: "Roadmap" },
            { name: "NeetCode", url: "https://neetcode.io", type: "Video + Practice" },
            { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org", type: "Theory + Practice" }
        ]
    },
    {
        title: "System Design",
        importance: "Important",
        timeNeeded: "1-2 months",
        resources: [
            { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "GitHub" },
            { name: "Gaurav Sen YouTube", url: "https://www.youtube.com/@gaborsen", type: "Video" },
            { name: "ByteByteGo", url: "https://bytebytego.com", type: "Newsletter" }
        ]
    },
    {
        title: "Core CS Subjects",
        importance: "Important",
        timeNeeded: "1-2 months",
        resources: [
            { name: "OS - Gate Smashers", url: "https://www.youtube.com/@GateSmashers", type: "Video" },
            { name: "DBMS - Knowledge Gate", url: "https://www.youtube.com/@TheKnowledgeGate", type: "Video" },
            { name: "CN - Neso Academy", url: "https://www.youtube.com/@nesoacademy", type: "Video" }
        ]
    },
    {
        title: "Aptitude & Reasoning",
        importance: "Good to Know",
        timeNeeded: "2-3 weeks",
        resources: [
            { name: "IndiaBix", url: "https://www.indiabix.com", type: "Practice" },
            { name: "PrepInsta", url: "https://prepinsta.com", type: "Practice" }
        ]
    },
    {
        title: "Communication Skills",
        importance: "Important",
        timeNeeded: "Ongoing",
        resources: [
            { name: "Mock Interviews - Pramp", url: "https://www.pramp.com", type: "Practice" },
            { name: "InterviewBit", url: "https://www.interviewbit.com", type: "Practice" }
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
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            isSelected
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
        <div className="max-w-4xl mx-auto">
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
                    className={`px-8 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                        selectedOptions.length > 0
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
    <div className="max-w-4xl mx-auto text-center">
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
// ROADMAP COMPONENT
// ============================================

interface RoadmapDisplayProps {
    roadmap: Roadmap;
}

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ roadmap }) => {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{roadmap.title}</h2>
                <p className="text-gray-600">{roadmap.description}</p>
            </div>

            {/* Learning Resources */}
            <div className="mb-8 p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">📚 Recommended Courses</h3>
                <div className="flex flex-wrap gap-3">
                    <a 
                        href={`https://www.coursera.org/search?query=${encodeURIComponent(roadmap.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-orange-300 transition-all"
                    >
                        Coursera
                    </a>
                    <a 
                        href={`https://www.udemy.com/courses/search/?q=${encodeURIComponent(roadmap.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-orange-300 transition-all"
                    >
                        Udemy
                    </a>
                </div>
            </div>

            {/* Steps Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                {roadmap.steps.map((_step, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            currentStep === idx
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                : idx < currentStep
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Step {idx + 1}
                    </button>
                ))}
            </div>

            {/* Current Step Content */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {roadmap.steps[currentStep].title}
                </h3>
                <p className="text-gray-600 mb-6">{roadmap.steps[currentStep].description}</p>

                {/* Skills */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills you'll learn</h4>
                    <div className="flex flex-wrap gap-2">
                        {roadmap.steps[currentStep].skills.map((skill, idx) => (
                            <span 
                                key={idx}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Sub-steps */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Topics to Cover</h4>
                    <div className="space-y-4">
                        {roadmap.steps[currentStep].sub_steps.map((subStep, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <h5 className="font-semibold text-gray-900 mb-2">{subStep.title}</h5>
                                <p className="text-sm text-gray-600 mb-3">{subStep.description}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {subStep.skills.map((skill, skillIdx) => (
                                        <span 
                                            key={skillIdx}
                                            className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-gray-500 font-medium">Resources:</span>
                                    <a 
                                        href={`https://www.w3schools.com/search/search_result.asp?query=${encodeURIComponent(subStep.title)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                                    >
                                        W3Schools
                                    </a>
                                    <a 
                                        href={`https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(subStep.title)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium hover:bg-yellow-200 transition-colors"
                                    >
                                        GeeksforGeeks
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                    disabled={currentStep === 0}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        currentStep === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    ← Previous
                </button>
                <button
                    onClick={() => setCurrentStep(prev => Math.min(roadmap.steps.length - 1, prev + 1))}
                    disabled={currentStep === roadmap.steps.length - 1}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${
                        currentStep === roadmap.steps.length - 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30'
                    }`}
                >
                    Next →
                </button>
            </div>
        </div>
    );
};

// ============================================
// INTERNSHIP COMPONENT
// ============================================

interface InternshipDisplayProps {
    internship: InternshipData;
    onStartNew: () => void;
}

const InternshipDisplay: React.FC<InternshipDisplayProps> = ({ internship, onStartNew }) => (
    <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your Virtual Internship</h2>
            <p className="text-gray-600">Gain practical experience through simulated real-world projects</p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 mb-8">
            <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <span className="text-sm font-medium text-orange-600">Company</span>
                    <p className="text-lg font-semibold text-gray-900">{internship.CompanyName}</p>
                </div>
                <div>
                    <span className="text-sm font-medium text-orange-600">Your Role</span>
                    <p className="text-lg font-semibold text-gray-900">{internship.YourRole}</p>
                </div>
                <div>
                    <span className="text-sm font-medium text-orange-600">Duration</span>
                    <p className="text-lg font-semibold text-gray-900">{internship.phases.length} Phases</p>
                </div>
            </div>
            <p className="mt-4 text-gray-700">{internship.companyDescription}</p>
        </div>

        <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Internship Phases</h3>
            <div className="space-y-4">
                {internship.phases.map((phase, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 flex-shrink-0 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold">
                                {idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900">Phase {idx + 1}</h4>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                        {phase.deadline}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-2">{phase.task}</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-gray-500">Topics:</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                        {phase.topicsCovered}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="text-center">
            <button
                onClick={onStartNew}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
                Generate New Internship
            </button>
        </div>
    </div>
);

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
                        className={`bg-white border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            selectedCareer?.title === career.title ? 'border-orange-500 shadow-lg shadow-orange-500/10' : 'border-gray-200'
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
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                career.demand === 'Very High' ? 'bg-red-100 text-red-700' :
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
// PLACEMENT PREP COMPONENT
// ============================================

const PlacementPrepSection: React.FC = () => {
    const [expandedTopic, setExpandedTopic] = useState<string | null>('Data Structures & Algorithms');

    const placementTimeline = [
        { year: "3rd Year", months: "Jan-Jun", task: "Learn DSA fundamentals", color: "blue" },
        { year: "3rd Year", months: "Jul-Dec", task: "Practice 200+ problems, Start projects", color: "green" },
        { year: "4th Year", months: "Jan-Apr", task: "System Design, Mock interviews", color: "orange" },
        { year: "4th Year", months: "May-Aug", task: "Campus placements begin", color: "red" },
    ];

    return (
        <div className="space-y-8">
            {/* Timeline */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    📅 Campus Placement Timeline
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {placementTimeline.map((item, idx) => (
                        <div key={idx} className="relative">
                            <div className={`absolute left-0 top-0 w-1 h-full bg-${item.color}-500 rounded-full`}></div>
                            <div className="pl-4">
                                <div className="text-xs text-gray-400">{item.year}</div>
                                <div className="font-semibold text-sm">{item.months}</div>
                                <div className="text-gray-300 text-sm mt-1">{item.task}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DSA Progress Tracker */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Preparation Checklist</h3>
                <div className="space-y-3">
                    {placementTopics.map((topic, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setExpandedTopic(expandedTopic === topic.title ? null : topic.title)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full ${
                                        topic.importance === 'Critical' ? 'bg-red-500' :
                                        topic.importance === 'Important' ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}></span>
                                    <span className="font-semibold text-gray-900">{topic.title}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        topic.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                                        topic.importance === 'Important' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {topic.importance}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">{topic.timeNeeded}</span>
                                    <svg className={`w-5 h-5 transition-transform ${expandedTopic === topic.title ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            
                            {expandedTopic === topic.title && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <p className="text-sm font-semibold text-gray-500 mb-3">Recommended Resources:</p>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {topic.resources.map((resource, i) => (
                                            <a
                                                key={i}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-sm transition-all"
                                            >
                                                <BookIcon />
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">{resource.name}</div>
                                                    <div className="text-xs text-gray-500">{resource.type}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4">
                <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" 
                   className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 rounded-xl font-semibold text-center hover:shadow-lg transition-all">
                    🏆 LeetCode - Practice DSA
                </a>
                <a href="https://www.pramp.com" target="_blank" rel="noopener noreferrer"
                   className="p-4 bg-gradient-to-br from-green-400 to-green-500 text-white rounded-xl font-semibold text-center hover:shadow-lg transition-all">
                    🎤 Pramp - Mock Interviews
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                   className="p-4 bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-xl font-semibold text-center hover:shadow-lg transition-all">
                    💻 GitHub - Build Projects
                </a>
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
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            filterDifficulty === level
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
                        className={`bg-white border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            selectedProject?.title === project.title ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-200'
                        }`}
                        onClick={() => setSelectedProject(selectedProject?.title === project.title ? null : project)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-bold text-gray-900">{project.title}</h3>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
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

const CareerGuidancePage: React.FC = () => {
    const [trendingCareersData, setTrendingCareersData] = useState<TrendingCareer[]>(defaultTrendingCareers);
    const [projectIdeasData, setProjectIdeasData] = useState<ProjectIdea[]>(defaultProjectIdeas);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<CareerTab>('trending');
    const [recommendStep, setRecommendStep] = useState<RecommendStep>(0);
    const [responses, setResponses] = useState<string[][]>([]);
    const [careerResult, setCareerResult] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
    const [roadmapInput, setRoadmapInput] = useState('');
    const [roadmapLoading, setRoadmapLoading] = useState(false);
    const [internship, setInternship] = useState<InternshipData | null>(null);
    const [internshipLoading, setInternshipLoading] = useState(false);
    const [internshipField, setInternshipField] = useState('');

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
            } catch (error) {
                console.error('Failed to fetch career guidance data from API:', error);
                // Fallback to localStorage or default data
                setTrendingCareersData(loadFromStorage<TrendingCareer>(TRENDING_CAREERS_KEY, defaultTrendingCareers));
                setProjectIdeasData(loadFromStorage<ProjectIdea>(PROJECT_IDEAS_KEY, defaultProjectIdeas));
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

    // Generate roadmap using mock data (in production, use Gemini API)
    const generateRoadmap = async (career: string) => {
        setRoadmapLoading(true);
        setActiveTab('roadmap');
        
        try {
            // In production, this would call the Gemini API
            // For now, we'll use a mock roadmap
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockRoadmap: Roadmap = {
                title: `${career} Learning Roadmap`,
                description: `A comprehensive guide to becoming a ${career}. This roadmap covers all the essential skills and knowledge you need to master.`,
                steps: [
                    {
                        title: "Step 1: Foundation & Basics",
                        description: "Build a strong foundation with core concepts and fundamental skills.",
                        skills: ["Programming Fundamentals", "Problem Solving", "Version Control"],
                        sub_steps: [
                            {
                                title: "Learn Programming Basics",
                                description: "Start with a beginner-friendly programming language and understand core concepts.",
                                skills: ["Variables", "Data Types", "Control Flow", "Functions"]
                            },
                            {
                                title: "Version Control with Git",
                                description: "Learn how to track changes and collaborate using Git and GitHub.",
                                skills: ["Git Commands", "Branching", "Merging", "Pull Requests"]
                            }
                        ]
                    },
                    {
                        title: "Step 2: Core Technologies",
                        description: "Master the core technologies and frameworks used in the industry.",
                        skills: ["Frameworks", "Libraries", "Best Practices"],
                        sub_steps: [
                            {
                                title: "Learn Industry Frameworks",
                                description: "Get hands-on experience with popular frameworks and tools.",
                                skills: ["Framework Basics", "Component Architecture", "State Management"]
                            },
                            {
                                title: "Build Projects",
                                description: "Apply your knowledge by building real-world projects.",
                                skills: ["Project Planning", "Implementation", "Debugging"]
                            }
                        ]
                    },
                    {
                        title: "Step 3: Advanced Concepts",
                        description: "Dive deeper into advanced topics and specialized areas.",
                        skills: ["System Design", "Performance Optimization", "Security"],
                        sub_steps: [
                            {
                                title: "System Architecture",
                                description: "Learn how to design scalable and maintainable systems.",
                                skills: ["Design Patterns", "Architecture", "Scalability"]
                            },
                            {
                                title: "Performance & Security",
                                description: "Optimize applications and implement security best practices.",
                                skills: ["Optimization", "Security Practices", "Testing"]
                            }
                        ]
                    },
                    {
                        title: "Step 4: Professional Skills",
                        description: "Develop professional skills needed for career success.",
                        skills: ["Communication", "Teamwork", "Interview Prep"],
                        sub_steps: [
                            {
                                title: "Soft Skills",
                                description: "Develop communication and collaboration skills.",
                                skills: ["Technical Writing", "Presentation", "Team Collaboration"]
                            },
                            {
                                title: "Career Development",
                                description: "Prepare for job applications and interviews.",
                                skills: ["Resume Building", "Portfolio", "Interview Skills"]
                            }
                        ]
                    }
                ]
            };
            
            setRoadmap(mockRoadmap);
        } catch (error) {
            console.error("Error generating roadmap:", error);
        } finally {
            setRoadmapLoading(false);
        }
    };

    // Generate virtual internship
    const generateInternship = async () => {
        if (!internshipField.trim()) return;
        
        setInternshipLoading(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mockInternship: InternshipData = {
                CompanyName: "TechVenture Labs",
                companyDescription: `TechVenture Labs is a leading technology company specializing in ${internshipField}. We focus on innovative solutions and cutting-edge technology to solve real-world problems.`,
                YourRole: `${internshipField} Intern`,
                phases: [
                    {
                        task: "Onboarding and Environment Setup - Get familiar with the team, tools, and codebase. Complete initial training modules.",
                        deadline: "Week 1-2",
                        topicsCovered: "Company Culture, Development Tools, Codebase Overview"
                    },
                    {
                        task: "Feature Development - Work on a small feature or bug fix under guidance. Learn the development workflow.",
                        deadline: "Week 3-4",
                        topicsCovered: "Agile Methodology, Code Review, Testing"
                    },
                    {
                        task: "Independent Project - Take ownership of a small project. Design, implement, and document your solution.",
                        deadline: "Week 5-6",
                        topicsCovered: "Project Management, Documentation, Presentation"
                    },
                    {
                        task: "Final Presentation - Present your work to the team. Receive feedback and complete internship wrap-up.",
                        deadline: "Week 7-8",
                        topicsCovered: "Presentation Skills, Professional Communication"
                    }
                ]
            };
            
            setInternship(mockInternship);
        } catch (error) {
            console.error("Error generating internship:", error);
        } finally {
            setInternshipLoading(false);
        }
    };

    const tabs = [
        { id: 'trending' as CareerTab, label: 'Trending Careers', icon: <TrendingIcon /> },
        { id: 'recommend' as CareerTab, label: 'Career Match', icon: <TargetIcon /> },
        { id: 'roadmap' as CareerTab, label: 'Roadmap', icon: <RoadmapIcon /> },
        { id: 'placement' as CareerTab, label: 'Placement Prep', icon: <PlacementIcon /> },
        { id: 'projects' as CareerTab, label: 'Project Ideas', icon: <ProjectIcon /> },
        { id: 'internship' as CareerTab, label: 'Virtual Internship', icon: <InternshipIcon /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <SparkleIcon />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Career Guidance Hub</h1>
                        <p className="text-gray-600">For B.Tech Students & Fresh Graduates</p>
                    </div>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl">
                    <p className="text-sm text-gray-700">
                        🎓 <span className="font-semibold">Designed for Engineering Students:</span> Discover trending tech careers, prepare for campus placements, find project ideas, and build your career roadmap.
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-5xl mx-auto mb-8">
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 ${
                                activeTab === tab.id
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
            <div className="max-w-5xl mx-auto">
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
                                    setRoadmapInput(career);
                                    generateRoadmap(career);
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Placement Prep Tab */}
                {activeTab === 'placement' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <PlacementPrepSection />
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
                                onContinueToRoadmap={(career) => {
                                    setRoadmapInput(career);
                                    generateRoadmap(career);
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Roadmap Tab */}
                {activeTab === 'roadmap' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        {!roadmap && !roadmapLoading && (
                            <div className="max-w-2xl mx-auto text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    Tell us what you're aspiring to be
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Enter a career path and we'll generate a personalized learning roadmap for you
                                </p>
                                
                                <div className="flex gap-3 max-w-lg mx-auto">
                                    <input
                                        type="text"
                                        value={roadmapInput}
                                        onChange={(e) => setRoadmapInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && generateRoadmap(roadmapInput)}
                                        placeholder="e.g., Full Stack Developer, Data Scientist..."
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                    />
                                    <button
                                        onClick={() => generateRoadmap(roadmapInput)}
                                        disabled={!roadmapInput.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Generate
                                    </button>
                                </div>

                                <div className="mt-8">
                                    <p className="text-sm text-gray-500 mb-4">Popular career paths:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {['Software Developer', 'Data Scientist', 'Machine Learning Engineer', 'Web Developer', 'Product Manager'].map(career => (
                                            <button
                                                key={career}
                                                onClick={() => {
                                                    setRoadmapInput(career);
                                                    generateRoadmap(career);
                                                }}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                            >
                                                {career}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {roadmapLoading && (
                            <LoadingSpinner message="Generating your personalized roadmap..." />
                        )}

                        {roadmap && !roadmapLoading && (
                            <>
                                <button
                                    onClick={() => setRoadmap(null)}
                                    className="mb-6 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                                >
                                    ← Generate another roadmap
                                </button>
                                <RoadmapDisplay roadmap={roadmap} />
                            </>
                        )}
                    </div>
                )}

                {/* Virtual Internship Tab */}
                {activeTab === 'internship' && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        {!internship && !internshipLoading && (
                            <div className="max-w-2xl mx-auto text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    Start Your Virtual Internship
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Experience a simulated internship with real-world projects and tasks
                                </p>
                                
                                <div className="flex gap-3 max-w-lg mx-auto">
                                    <input
                                        type="text"
                                        value={internshipField}
                                        onChange={(e) => setInternshipField(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && generateInternship()}
                                        placeholder="e.g., Web Development, Data Science..."
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                    />
                                    <button
                                        onClick={generateInternship}
                                        disabled={!internshipField.trim()}
                                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Start
                                    </button>
                                </div>

                                <div className="mt-8">
                                    <p className="text-sm text-gray-500 mb-4">Popular internship fields:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning', 'Cloud Computing'].map(field => (
                                            <button
                                                key={field}
                                                onClick={() => {
                                                    setInternshipField(field);
                                                }}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                                            >
                                                {field}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {internshipLoading && (
                            <LoadingSpinner message="Creating your virtual internship experience..." />
                        )}

                        {internship && !internshipLoading && (
                            <>
                                <button
                                    onClick={() => setInternship(null)}
                                    className="mb-6 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                                >
                                    ← Start a different internship
                                </button>
                                <InternshipDisplay 
                                    internship={internship} 
                                    onStartNew={() => {
                                        setInternship(null);
                                        setInternshipField('');
                                    }}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Features */}
            <div className="max-w-5xl mx-auto mt-12">
                <h3 className="text-center text-lg font-semibold text-gray-900 mb-6">🚀 Everything You Need for Career Success</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[
                        { icon: <TrendingIcon />, title: "Trending Careers", desc: "Hot jobs & salaries" },
                        { icon: <TargetIcon />, title: "AI Career Match", desc: "Find your path" },
                        { icon: <RoadmapIcon />, title: "Learning Roadmap", desc: "Step-by-step guide" },
                        { icon: <PlacementIcon />, title: "Placement Prep", desc: "DSA & interviews" },
                        { icon: <ProjectIcon />, title: "Project Ideas", desc: "Build your portfolio" },
                        { icon: <InternshipIcon />, title: "Virtual Internship", desc: "Gain experience" },
                    ].map((feature, idx) => (
                        <div key={idx} className="text-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-orange-200 transition-all cursor-pointer" onClick={() => setActiveTab(idx === 0 ? 'trending' : idx === 1 ? 'recommend' : idx === 2 ? 'roadmap' : idx === 3 ? 'placement' : idx === 4 ? 'projects' : 'internship')}>
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
    );
};

export default CareerGuidancePage;
