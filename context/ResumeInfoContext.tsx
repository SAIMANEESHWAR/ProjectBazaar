import { createContext, useContext, useState, ReactNode } from 'react';

export interface Experience {
  id: string;
  title: string;
  companyName: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  workSummary: string;
}

export interface Education {
  id: string;
  universityName: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  rating: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export type ResumeTemplate = 
  | 'classic'      // Jake's Resume style - clean, traditional
  | 'modern'       // Awesome CV style - contemporary with accents
  | 'professional' // ModernCV Classic - corporate/banking
  | 'minimal'      // Wilson style - simple, elegant
  | 'executive'    // Senior leadership style
  | 'tech'         // Developer-focused
  | 'academic'     // Research/education focused
  | 'creative'     // Modern professional
  | 'elegant'      // Sophisticated serif design
  | 'bold'         // Strong impactful headings
  | 'compact'      // Space-efficient dense layout
  | 'timeline'     // Visual timeline experience
  | 'sidebar'      // Left sidebar for contact/skills
  | 'infographic'  // Visual skills representation
  | 'corporate'    // Big company style
  | 'startup'      // Modern tech startup
  | 'consultant'   // Business consulting
  | 'healthcare'   // Medical professional
  | 'finance'      // Banking/finance
  | 'marketing'    // Marketing/advertising
  | 'gradient'     // Modern gradient header
  | 'boxed'        // Sections in boxes
  | 'metro'        // Metro tile style
  | 'swiss'        // Swiss minimalist design
  | 'retro'        // Vintage typewriter
  | 'architect'    // Blueprint technical
  | 'magazine'     // Editorial magazine
  | 'neon'         // Dark mode neon
  | 'legal'        // Law professional
  | 'newspaper';   // Column layout

export interface ResumeInfo {
  id?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  address: string;
  phone: string;
  email: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  profileImage?: string; // Base64 encoded image or URL
  themeColor: string;
  template: ResumeTemplate;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  createdAt?: string;
  updatedAt?: string;
}

interface ResumeInfoContextType {
  resumeInfo: ResumeInfo;
  setResumeInfo: (info: ResumeInfo) => void;
  updateResumeField: <K extends keyof ResumeInfo>(field: K, value: ResumeInfo[K]) => void;
  resetResume: () => void;
  savedResumes: ResumeInfo[];
  saveResume: () => void;
  loadResume: (id: string) => void;
  deleteResume: (id: string) => void;
}

const defaultResumeInfo: ResumeInfo = {
  firstName: 'James',
  lastName: 'Carter',
  jobTitle: 'Full Stack Developer',
  address: '525 N Tryon Street, Charlotte, NC 28117',
  phone: '(123) 456-7890',
  email: 'james.carter@example.com',
  linkedIn: '',
  github: '',
  portfolio: '',
  profileImage: '',
  themeColor: '#9f5bff',
  template: 'classic',
  summary: 'A dedicated and results-driven professional with a passion for excellence. Experienced in delivering high-quality solutions and driving innovation. Strong problem-solving skills and a commitment to continuous learning and professional growth.',
  experience: [
    {
      id: 'exp_1',
      title: 'Full Stack Developer',
      companyName: 'Amazon',
      city: 'New York',
      state: 'NY',
      startDate: '2021-01',
      endDate: '',
      currentlyWorking: true,
      workSummary: '<ul><li>Designed, developed, and maintained full-stack applications using React and Node.js</li><li>Implemented responsive user interfaces with React, ensuring seamless user experiences across various devices and browsers</li><li>Maintained the React Native in-house organization application</li><li>Created RESTful APIs with Node.js and Express, facilitating data communication between the front-end and back-end systems</li></ul>',
    },
    {
      id: 'exp_2',
      title: 'Frontend Developer',
      companyName: 'Google',
      city: 'Charlotte',
      state: 'NC',
      startDate: '2019-05',
      endDate: '2021-01',
      currentlyWorking: false,
      workSummary: '<ul><li>Developed and maintained frontend applications using React and modern JavaScript frameworks</li><li>Collaborated with cross-functional teams to deliver high-quality software solutions</li><li>Optimized application performance and improved user experience</li></ul>',
    },
  ],
  education: [
    {
      id: 'edu_1',
      universityName: 'Western Illinois University',
      startDate: '2018-08',
      endDate: '2019-12',
      degree: 'Master',
      major: 'Computer Science',
      description: 'Relevant coursework: Data Structures, Algorithms, Database Systems, Software Engineering. Graduated with honors.',
    },
  ],
  skills: [
    {
      id: 'skill_1',
      name: 'React',
      rating: 5,
    },
    {
      id: 'skill_2',
      name: 'Node.js',
      rating: 5,
    },
    {
      id: 'skill_3',
      name: 'JavaScript',
      rating: 5,
    },
    {
      id: 'skill_4',
      name: 'TypeScript',
      rating: 4,
    },
    {
      id: 'skill_5',
      name: 'MongoDB',
      rating: 4,
    },
  ],
  projects: [
    {
      id: 'proj_1',
      name: 'E-Commerce Platform',
      description: 'Developed a full-stack e-commerce platform with React and Node.js, featuring user authentication, payment integration, and admin dashboard.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      link: 'https://example.com',
    },
    {
      id: 'proj_2',
      name: 'Task Management App',
      description: 'Built a collaborative task management application with real-time updates and team collaboration features.',
      technologies: ['React', 'Firebase', 'Material-UI'],
      link: 'https://example.com',
    },
  ],
};

const ResumeInfoContext = createContext<ResumeInfoContextType | undefined>(undefined);

export const ResumeInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resumeInfo, setResumeInfoState] = useState<ResumeInfo>(() => {
    const stored = localStorage.getItem('currentResume');
    if (stored) {
      const parsed = JSON.parse(stored);
      // If stored resume is essentially empty (no firstName and no experience/education/skills/projects), use default
      const isEmpty = !parsed.firstName && 
                      parsed.experience?.length === 0 && 
                      parsed.education?.length === 0 && 
                      parsed.skills?.length === 0 && 
                      parsed.projects?.length === 0;
      return isEmpty ? defaultResumeInfo : parsed;
    }
    return defaultResumeInfo;
  });

  const [savedResumes, setSavedResumes] = useState<ResumeInfo[]>(() => {
    const stored = localStorage.getItem('savedResumes');
    return stored ? JSON.parse(stored) : [];
  });

  const setResumeInfo = (info: ResumeInfo) => {
    setResumeInfoState(info);
    localStorage.setItem('currentResume', JSON.stringify(info));
  };

  const updateResumeField = <K extends keyof ResumeInfo>(field: K, value: ResumeInfo[K]) => {
    const updated = { ...resumeInfo, [field]: value };
    setResumeInfo(updated);
  };

  const resetResume = () => {
    setResumeInfo({ ...defaultResumeInfo, id: `resume_${Date.now()}` });
  };

  const saveResume = () => {
    const resumeToSave = {
      ...resumeInfo,
      id: resumeInfo.id || `resume_${Date.now()}`,
      updatedAt: new Date().toISOString(),
      createdAt: resumeInfo.createdAt || new Date().toISOString(),
    };

    const existingIndex = savedResumes.findIndex(r => r.id === resumeToSave.id);
    let updatedResumes: ResumeInfo[];

    if (existingIndex >= 0) {
      updatedResumes = [...savedResumes];
      updatedResumes[existingIndex] = resumeToSave;
    } else {
      updatedResumes = [resumeToSave, ...savedResumes];
    }

    setSavedResumes(updatedResumes);
    localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
    setResumeInfo(resumeToSave);
  };

  const loadResume = (id: string) => {
    const resume = savedResumes.find(r => r.id === id);
    if (resume) {
      setResumeInfo(resume);
    }
  };

  const deleteResume = (id: string) => {
    const updatedResumes = savedResumes.filter(r => r.id !== id);
    setSavedResumes(updatedResumes);
    localStorage.setItem('savedResumes', JSON.stringify(updatedResumes));
  };

  return (
    <ResumeInfoContext.Provider
      value={{
        resumeInfo,
        setResumeInfo,
        updateResumeField,
        resetResume,
        savedResumes,
        saveResume,
        loadResume,
        deleteResume,
      }}
    >
      {children}
    </ResumeInfoContext.Provider>
  );
};

export const useResumeInfo = (): ResumeInfoContextType => {
  const context = useContext(ResumeInfoContext);
  if (!context) {
    throw new Error('useResumeInfo must be used within a ResumeInfoProvider');
  }
  return context;
};

export default ResumeInfoContext;
