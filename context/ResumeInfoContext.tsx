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
  firstName: '',
  lastName: '',
  jobTitle: '',
  address: '',
  phone: '',
  email: '',
  linkedIn: '',
  github: '',
  portfolio: '',
  profileImage: '',
  themeColor: '#f97316',
  template: 'classic',
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

const ResumeInfoContext = createContext<ResumeInfoContextType | undefined>(undefined);

export const ResumeInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resumeInfo, setResumeInfoState] = useState<ResumeInfo>(() => {
    const stored = localStorage.getItem('currentResume');
    return stored ? JSON.parse(stored) : defaultResumeInfo;
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
