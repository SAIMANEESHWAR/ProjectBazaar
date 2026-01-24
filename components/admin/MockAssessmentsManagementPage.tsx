import React, { useState, useMemo, useEffect, useRef } from 'react';

// Lambda API endpoint for Mock Assessments
const MOCK_ASSESSMENTS_API = 'https://w7k9vplo2j.execute-api.ap-south-2.amazonaws.com/default/mock_assessment_handler';

// AI Types (shared with other admin pages like CodingQuestions & CareerContent)
type AIProvider = 'gemini' | 'groq';

interface APIKeyConfig {
  provider: AIProvider;
  geminiKey: string;
  groqKey: string;
}

// Types
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type AssessmentCategory = 'technical' | 'language' | 'framework' | 'database' | 'devops' | 'company';

interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  topic: string;
  explanation?: string;
  difficulty?: DifficultyLevel;
  type: 'mcq';
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

type AnyQuestion = MCQQuestion | ProgrammingQuestion;

interface Assessment {
  id: string;
  title: string;
  logo: string;
  time: string; // e.g., "30 Minutes"
  objective: number; // Number of MCQ questions
  programming: number; // Number of programming questions
  registrations: number;
  category: AssessmentCategory;
  popular?: boolean;
  difficulty?: DifficultyLevel; // For backward compatibility
  difficulties?: DifficultyLevel[]; // Multiple difficulty levels
  company?: string;
  xpReward?: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  questions?: AnyQuestion[];
}

const categories: AssessmentCategory[] = ['technical', 'language', 'framework', 'database', 'devops', 'company'];
const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

// Technology name to Simple Icons mapping
const technologyLogoMap: Record<string, string> = {
  // Languages
  'java': 'java',
  'python': 'python',
  'javascript': 'javascript',
  'typescript': 'typescript',
  'c++': 'cplusplus',
  'cpp': 'cplusplus',
  'c': 'c',
  'go': 'go',
  'rust': 'rust',
  'ruby': 'ruby',
  'php': 'php',
  'kotlin': 'kotlin',
  'swift': 'swift',
  'c#': 'csharp',
  'csharp': 'csharp',
  'scala': 'scala',
  'r': 'r',
  'perl': 'perl',
  'lua': 'lua',
  'dart': 'dart',
  'bash': 'gnubash',
  'shell': 'gnubash',

  // Frameworks & Libraries
  'react': 'react',
  'vue': 'vuedotjs',
  'angular': 'angular',
  'node.js': 'nodedotjs',
  'nodejs': 'nodedotjs',
  'next.js': 'nextdotjs',
  'nextjs': 'nextdotjs',
  'express': 'express',
  'django': 'django',
  'flask': 'flask',
  'spring': 'spring',
  'laravel': 'laravel',
  'rails': 'rubyonrails',
  'ruby on rails': 'rubyonrails',

  // Databases
  'mysql': 'mysql',
  'postgresql': 'postgresql',
  'mongodb': 'mongodb',
  'redis': 'redis',
  'sqlite': 'sqlite',
  'oracle': 'oracle',
  'microsoft sql server': 'microsoftsqlserver',
  'sql server': 'microsoftsqlserver',

  // DevOps & Tools
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'aws': 'amazonaws',
  'azure': 'microsoftazure',
  'gcp': 'googlecloud',
  'git': 'git',
  'github': 'github',
  'gitlab': 'gitlab',
  'jenkins': 'jenkins',
  'terraform': 'terraform',
  'ansible': 'ansible',

  // Companies
  'google': 'google',
  'microsoft': 'microsoft',
  'amazon': 'amazon',
  'apple': 'apple',
  'meta': 'meta',
  'facebook': 'meta',
  'netflix': 'netflix',
  'uber': 'uber',
  'airbnb': 'airbnb',
  'twitter': 'x',
  'linkedin': 'linkedin',
};

// Function to get logo URL from title
const getLogoFromTitle = (title: string): string => {
  if (!title) return '';

  const titleLower = title.toLowerCase().trim();

  // Check direct match
  if (technologyLogoMap[titleLower]) {
    return `https://cdn.simpleicons.org/${technologyLogoMap[titleLower]}/000000`;
  }

  // Check partial matches
  for (const [key, iconName] of Object.entries(technologyLogoMap)) {
    if (titleLower.includes(key) || key.includes(titleLower)) {
      return `https://cdn.simpleicons.org/${iconName}/000000`;
    }
  }

  // Default: return empty string (user can manually enter)
  return '';
};

const MockAssessmentsManagementPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssessmentCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = useState<Assessment | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'technical' | 'company'>('all');
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Form state
  const [formData, setFormData] = useState<Partial<Assessment>>({
    title: '',
    logo: '',
    time: '30 Minutes',
    objective: 15,
    programming: 0,
    registrations: 0,
    category: 'technical',
    popular: false,
    difficulties: ['medium'], // Default to medium, but allow multiple
    company: '',
    xpReward: 100,
    status: 'draft',
  });

  const [questions, setQuestions] = useState<AnyQuestion[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionType, setQuestionType] = useState<'mcq' | 'programming'>('mcq');

  // API Key Management State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyConfig, setApiKeyConfig] = useState<APIKeyConfig>({
    provider: 'gemini',
    geminiKey: '',
    groqKey: ''
  });

  // ========================================
  // API Functions
  // ========================================

  const fetchAssessments = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // Call API to fetch assessments
      const response = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_assessments',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.assessments) {
          // Transform API response to match our Assessment interface
          const fetchedAssessments: Assessment[] = data.data.assessments.map((a: any) => {
            // Always try to get a logo - use existing if valid, otherwise auto-fetch
            const existingLogo = a.logo && a.logo.trim() ? a.logo : '';
            const autoLogo = getLogoFromTitle(a.title);
            const finalLogo = existingLogo || autoLogo;

            return {
              id: a.id,
              title: a.title,
              logo: finalLogo, // Always set logo (either from DB or auto-fetched)
              time: a.time || '30 Minutes',
              objective: a.objective || 0,
              programming: a.programming || 0,
              registrations: a.registrations || 0,
              category: a.category || 'technical',
              difficulty: a.difficulty || 'medium',
              difficulties: a.difficulties || [a.difficulty || 'medium'],
              popular: a.popular || false,
              company: a.company,
              xpReward: a.xpReward || 100,
              status: a.status || 'draft',
              createdAt: a.createdAt,
              updatedAt: a.updatedAt,
              questions: a.questions || [],
            };
          });
          setAssessments(fetchedAssessments);
        } else {
          // If API returns empty or error, fallback to empty array
          setAssessments([]);
        }
      } else {
        // If API call fails, fallback to empty array (or could show error)
        console.warn('Failed to fetch assessments from API, using empty list');
        setAssessments([]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
      // On error, show empty list instead of mock data
      setAssessments([]);
      setApiError('Failed to fetch assessments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssessment = async (assessment: Partial<Assessment>) => {
    setIsSaving(true);
    setApiError(null);
    try {
      // TODO: Add 'create_assessment' and 'update_assessment' actions to Lambda handler
      const response = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingAssessment ? 'update_assessment' : 'create_assessment',
          ...assessment,
          questions: questions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh assessments list
          await fetchAssessments();
          // Close modal and reset form
          setShowAddModal(false);
          setEditingAssessment(null);
          setFormData({
            title: '',
            logo: '',
            time: '30 Minutes',
            objective: 15,
            programming: 0,
            registrations: 0,
            category: 'technical',
            popular: false,
            difficulty: 'medium',
            difficulties: ['medium'],
            company: '',
            xpReward: 100,
            status: 'draft',
          });
          setQuestions([]);
        } else {
          throw new Error(data.error?.message || 'Failed to save assessment');
        }
      } else {
        // Fallback to local save if API doesn't support this action yet
        console.warn('Assessment management API not available, using local storage');
        await new Promise(resolve => setTimeout(resolve, 500));

        if (editingAssessment) {
          setAssessments(assessments.map(a =>
            a.id === editingAssessment.id
              ? { ...a, ...assessment, updatedAt: new Date().toISOString().split('T')[0] }
              : a
          ));
        } else {
          const newAssessment: Assessment = {
            id: assessment.id || `assessment-${Date.now()}`,
            title: assessment.title || '',
            logo: assessment.logo || '',
            time: assessment.time || '30 Minutes',
            objective: assessment.objective || 0,
            programming: assessment.programming || 0,
            registrations: 0,
            category: assessment.category || 'technical',
            popular: assessment.popular || false,
            difficulty: assessment.difficulty || 'medium',
            company: assessment.company,
            xpReward: assessment.xpReward || 100,
            status: assessment.status || 'draft',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
            questions: questions,
          };
          setAssessments([...assessments, newAssessment]);
        }

        setShowAddModal(false);
        setEditingAssessment(null);
        setFormData({
          title: '',
          logo: '',
          time: '30 Minutes',
          objective: 15,
          programming: 0,
          registrations: 0,
          category: 'technical',
          popular: false,
          difficulty: 'medium',
          company: '',
          xpReward: 100,
          status: 'draft',
        });
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      setApiError('Failed to save assessment');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      // TODO: Add 'delete_assessment' action to Lambda handler
      const response = await fetch(MOCK_ASSESSMENTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_assessment',
          assessmentId: id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh assessments list
          await fetchAssessments();
        } else {
          throw new Error(data.error?.message || 'Failed to delete assessment');
        }
      } else {
        // Fallback to local delete if API doesn't support this action yet
        console.warn('Assessment management API not available, using local delete');
        setAssessments(assessments.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      setApiError('Failed to delete assessment');
      // Fallback to local delete
      setAssessments(assessments.filter(a => a.id !== id));
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Load API key configuration on mount
  useEffect(() => {
    const loadApiKeyConfig = async () => {
      try {
        const storedConfig = localStorage.getItem('ai_api_config');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          setApiKeyConfig(config);
        }
      } catch (error) {
        console.error('Failed to load API key config:', error);
      }
    };
    loadApiKeyConfig();
  }, []);

  // Save API key configuration
  const saveApiKeyConfig = async (config: APIKeyConfig) => {
    try {
      localStorage.setItem('ai_api_config', JSON.stringify(config));
      setApiKeyConfig(config);
      return true;
    } catch (error) {
      console.error('Failed to save API key config:', error);
      return false;
    }
  };

  // ========================================
  // Filtering and Search
  // ========================================

  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || assessment.status === selectedStatus;

      // Difficulty Check
      const matchesDifficulty = selectedDifficulty === 'all' ||
        (assessment.difficulty === selectedDifficulty) ||
        (assessment.difficulties && assessment.difficulties.includes(selectedDifficulty as DifficultyLevel));

      // Type Check
      const matchesType = selectedType === 'all' ||
        (selectedType === 'company' ? assessment.category === 'company' : assessment.category !== 'company');

      // Popular Check
      const matchesPopular = !showPopularOnly || assessment.popular;

      return matchesSearch && matchesCategory && matchesStatus && matchesDifficulty && matchesType && matchesPopular;
    });
  }, [assessments, searchQuery, selectedCategory, selectedStatus, selectedDifficulty, selectedType, showPopularOnly]);

  // ========================================
  // Question Management
  // ========================================

  const addQuestion = (question: AnyQuestion) => {
    if (editingQuestionIndex !== null) {
      const updated = [...questions];
      updated[editingQuestionIndex] = question;
      setQuestions(updated);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([...questions, question]);
    }
    setShowQuestionModal(false);
  };

  const editQuestion = (index: number) => {
    const question = questions[index];
    setEditingQuestionIndex(index);
    setQuestionType(question.type === 'programming' ? 'programming' : 'mcq');
    setShowQuestionModal(true);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      logo: assessment.logo,
      time: assessment.time,
      objective: assessment.objective,
      programming: assessment.programming,
      category: assessment.category,
      popular: assessment.popular,
      difficulty: assessment.difficulty,
      difficulties: assessment.difficulties || (assessment.difficulty ? [assessment.difficulty] : ['medium']),
      company: assessment.company,
      xpReward: assessment.xpReward,
      status: assessment.status,
    });
    setQuestions(assessment.questions || []);
    setShowAddModal(true);
  };

  const handleNew = () => {
    setEditingAssessment(null);
    setFormData({
      title: '',
      logo: '',
      time: '30 Minutes',
      objective: 15,
      programming: 0,
      registrations: 0,
      category: 'technical',
      popular: false,
      difficulty: 'medium',
      difficulties: ['medium'],
      company: '',
      xpReward: 100,
      status: 'draft',
    });
    setQuestions([]);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </button>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Assessment
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="technical">Technical</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as AssessmentCategory | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={selectedType === 'company'} // Disable category if type is Company (category is implicitly company)
              >
                <option value="all">All Categories</option>
                {categories.filter(c => selectedType !== 'technical' || c !== 'company').map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as DifficultyLevel | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Difficulties</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center pb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPopularOnly}
                  onChange={(e) => setShowPopularOnly(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700 font-medium">Popular Only</span>
              </label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setSelectedDifficulty('all');
                  setSelectedType('all');
                  setShowPopularOnly(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {apiError}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="mt-2 text-gray-500">Loading assessments...</p>
        </div>
      ) : (
        <>
          {/* Assessments List */}
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No assessments found</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {(() => {
                              // Always try to get a logo - use existing or auto-fetch
                              const logoUrl = (assessment.logo && assessment.logo.trim()) || getLogoFromTitle(assessment.title);
                              if (logoUrl) {
                                return (
                                  <img
                                    key={`${assessment.id}-${logoUrl}`}
                                    src={logoUrl}
                                    alt={assessment.title}
                                    className="w-10 h-10 object-contain"
                                    onError={(e) => {
                                      // Try alternative logo sources
                                      const fallbackLogo = getLogoFromTitle(assessment.title);
                                      const img = e.target as HTMLImageElement;
                                      if (fallbackLogo && img.src !== fallbackLogo) {
                                        img.src = fallbackLogo;
                                      } else {
                                        // If all logos fail, replace with placeholder
                                        img.style.display = 'none';
                                        const placeholder = document.createElement('div');
                                        placeholder.className = 'w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium';
                                        placeholder.textContent = assessment.title.charAt(0).toUpperCase();
                                        img.parentElement?.replaceChild(placeholder, img);
                                      }
                                    }}
                                  />
                                );
                              }
                              return (
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs font-medium">
                                  {assessment.title.charAt(0).toUpperCase()}
                                </div>
                              );
                            })()}
                            <div>
                              <div className="font-medium text-gray-900">{assessment.title}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {assessment.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.objective} MCQ, {assessment.programming} Coding
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${assessment.status === 'published' ? 'bg-green-100 text-green-800' :
                            assessment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {assessment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {assessment.registrations.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewingAssessment(assessment)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEdit(assessment)}
                              className="text-orange-600 hover:text-orange-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAssessment(assessment.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssessments.map((assessment) => (
                <div key={assessment.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition">
                  <div className="flex items-center gap-3 mb-3">
                    {assessment.logo ? (
                      <img
                        src={assessment.logo}
                        alt={assessment.title}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          // Fallback to auto-fetched logo if original fails
                          const fallbackLogo = getLogoFromTitle(assessment.title);
                          if (fallbackLogo && (e.target as HTMLImageElement).src !== fallbackLogo) {
                            (e.target as HTMLImageElement).src = fallbackLogo;
                          } else {
                            // If fallback also fails, show placeholder
                            (e.target as HTMLImageElement).style.display = 'none';
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-medium';
                            placeholder.textContent = assessment.title.charAt(0).toUpperCase();
                            (e.target as HTMLImageElement).parentElement?.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-sm font-medium">
                        {assessment.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                      <p className="text-sm text-gray-500">{assessment.category}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Questions:</span>
                      <span className="font-medium">{assessment.objective} MCQ, {assessment.programming} Coding</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium">{assessment.time}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${assessment.status === 'published' ? 'bg-green-100 text-green-800' :
                        assessment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {assessment.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewingAssessment(assessment)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEdit(assessment)}
                      className="flex-1 px-3 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Assessment Modal */}
      {showAddModal && (
        <AssessmentModal
          formData={formData}
          setFormData={setFormData}
          questions={questions}
          setQuestions={setQuestions}
          editingAssessment={editingAssessment}
          onSave={saveAssessment}
          onClose={() => {
            setShowAddModal(false);
            setEditingAssessment(null);
            setFormData({
              title: '',
              logo: '',
              time: '30 Minutes',
              objective: 15,
              programming: 0,
              registrations: 0,
              category: 'technical',
              popular: false,
              difficulty: 'medium',
              company: '',
              xpReward: 100,
              status: 'draft',
            });
            setQuestions([]);
          }}
          onAddQuestion={() => {
            setEditingQuestionIndex(null);
            setQuestionType('mcq');
            setShowQuestionModal(true);
          }}
          onEditQuestion={editQuestion}
          onDeleteQuestion={deleteQuestion}
          isSaving={isSaving}
          apiKeyConfig={apiKeyConfig}
          onRequestApiKey={() => setShowApiKeyModal(true)}
        />
      )}

      {/* Question Modal */}
      {showQuestionModal && (
        <QuestionModal
          questionType={questionType}
          setQuestionType={setQuestionType}
          question={editingQuestionIndex !== null ? questions[editingQuestionIndex] : undefined}
          onSave={addQuestion}
          onClose={() => {
            setShowQuestionModal(false);
            setEditingQuestionIndex(null);
          }}
          onRequestApiKey={() => setShowApiKeyModal(true)}
          apiKeyConfig={apiKeyConfig}
        />
      )}

      {/* API Key Configuration Modal */}
      {showApiKeyModal && (
        <ApiKeyModal
          apiKeyConfig={apiKeyConfig}
          onSave={async (config) => {
            const success = await saveApiKeyConfig(config);
            if (success) {
              setShowApiKeyModal(false);
            }
          }}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {/* View Assessment Modal */}
      {viewingAssessment && (
        <ViewAssessmentModal
          assessment={viewingAssessment}
          onClose={() => setViewingAssessment(null)}
          onEdit={() => {
            setViewingAssessment(null);
            handleEdit(viewingAssessment);
          }}
        />
      )}
    </div>
  );
};

// Helper function to generate MCQ question
const generateMCQQuestion = async (
  apiKeyConfig: APIKeyConfig,
  topic: string,
  difficulty: DifficultyLevel,
  category: AssessmentCategory,
  questionNum: number,
  totalQuestions: number,
  existingQuestions: MCQQuestion[] = []
): Promise<MCQQuestion | null> => {
  // Create a list of existing questions to avoid duplicates
  const existingQuestionsText = existingQuestions.length > 0
    ? `\n\nIMPORTANT: Avoid generating questions similar to these already generated questions:\n${existingQuestions.slice(-5).map((q, i) => `${i + 1}. ${q.question}`).join('\n')}\n\nGenerate a COMPLETELY DIFFERENT question on a different subtopic or aspect.`
    : '';

  // Add variety by requesting different subtopics
  const subtopicHints = [
    'Focus on a different subtopic or concept',
    'Cover a different aspect or use case',
    'Test a different skill or knowledge area',
    'Explore a different edge case or scenario',
    'Ask about a different implementation detail',
  ];
  const varietyHint = subtopicHints[(questionNum - 1) % subtopicHints.length];

  const prompt = `Generate ONE unique multiple choice question for a mock assessment.

Topic: ${topic}
Category: ${category}
Difficulty: ${difficulty}
Question ${questionNum} of ${totalQuestions}
${varietyHint}${existingQuestionsText}

CRITICAL: This question must be UNIQUE and DIFFERENT from any previous questions. Cover a different subtopic, concept, or aspect of ${topic}.

Return ONLY valid JSON (no markdown, no comments, no extra text):
{
  "question": "string - unique question text",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "topic": "string",
  "explanation": "string explaining why the correct answer is right",
  "difficulty": "${difficulty}"
}`;

  try {
    let response: Response | null = null;
    let useGemini = apiKeyConfig.provider === 'gemini' && !!apiKeyConfig.geminiKey;
    let useGroq = !useGemini && !!apiKeyConfig.groqKey;

    // Try Gemini first if available
    if (useGemini) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyConfig.geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429 || errorText.includes('quota') || errorText.includes('exceeded')) {
            // Fallback to Groq if Gemini quota exceeded
            if (apiKeyConfig.groqKey) {
              useGroq = true;
              useGemini = false;
            } else {
              throw new Error('Gemini API quota exceeded. Please update your API key.');
            }
          } else {
            throw new Error(`Gemini API error: ${response.status}`);
          }
        }
      } catch (error: any) {
        if (apiKeyConfig.groqKey && !error.message.includes('quota')) {
          useGroq = true;
          useGemini = false;
        } else {
          throw error;
        }
      }
    }

    // Use Groq if Gemini failed or is not available
    if (useGroq) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyConfig.groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a technical interviewer. Return ONLY valid JSON, no markdown or extra text.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
    }

    if (!response) {
      throw new Error('No API key configured');
    }

    const data = await response.json();
    let rawText: string;

    if (useGemini) {
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      rawText = data?.choices?.[0]?.message?.content || '';
    }

    if (!rawText) {
      throw new Error('No content returned from API');
    }

    const cleaned = rawText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.question || !parsed.options || parsed.options.length < 2) {
      throw new Error('Incomplete MCQ data returned');
    }

    return {
      id: Date.now() + questionNum,
      question: parsed.question,
      options: parsed.options.slice(0, 4),
      correctAnswer: typeof parsed.correctIndex === 'number' ? parsed.correctIndex : 0,
      topic: parsed.topic || topic,
      explanation: parsed.explanation || '',
      difficulty: (parsed.difficulty as DifficultyLevel) || difficulty,
      type: 'mcq',
    };
  } catch (error: any) {
    console.error(`Error generating MCQ question ${questionNum}:`, error);
    return null;
  }
};

// Helper function to generate Programming question
const generateProgrammingQuestion = async (
  apiKeyConfig: APIKeyConfig,
  topic: string,
  difficulty: DifficultyLevel,
  category: AssessmentCategory,
  questionNum: number,
  totalQuestions: number,
  existingQuestions: ProgrammingQuestion[] = []
): Promise<ProgrammingQuestion | null> => {
  // Create a list of existing questions to avoid duplicates
  const existingQuestionsText = existingQuestions.length > 0
    ? `\n\nIMPORTANT: Avoid generating questions similar to these already generated questions:\n${existingQuestions.slice(-5).map((q, i) => `${i + 1}. ${q.question.split('\n')[0]}`).join('\n')}\n\nGenerate a COMPLETELY DIFFERENT problem on a different algorithm, data structure, or concept.`
    : '';

  // Add variety by requesting different problem types
  const problemTypeHints = [
    'Focus on a different algorithm (e.g., sorting, searching, graph traversal)',
    'Cover a different data structure (e.g., arrays, trees, hash maps)',
    'Test a different problem-solving approach (e.g., dynamic programming, greedy, two pointers)',
    'Explore a different complexity requirement (e.g., time/space optimization)',
    'Ask about a different edge case or scenario',
  ];
  const varietyHint = problemTypeHints[(questionNum - 1) % problemTypeHints.length];

  const prompt = `Generate ONE unique programming question for a mock assessment (LeetCode-style).

Topic: ${topic}
Category: ${category}
Difficulty: ${difficulty}
Question ${questionNum} of ${totalQuestions}
${varietyHint}${existingQuestionsText}

CRITICAL: This problem must be UNIQUE and DIFFERENT from any previous questions. Cover a different algorithm, data structure, or problem-solving approach related to ${topic}.

Return ONLY valid JSON (no markdown, no comments, no extra text):
{
  "question": "Title on first line\\n\\nFull problem description",
  "topic": "string",
  "difficulty": "${difficulty}",
  "constraints": "string with constraints",
  "examples": [
    { "input": "string", "output": "string", "explanation": "string" }
  ],
  "testCases": [
    { "input": "string", "expectedOutput": "string", "hidden": false }
  ],
  "starterCode": {
    "python": "def solution(params):\\n    # Your code here\\n    pass",
    "javascript": "function solution(params) {\\n    // Your code here\\n}",
    "java": "class Solution {\\n    public ReturnType solution(ParamType params) {\\n        // Your code here\\n    }\\n}",
    "cpp": "class Solution {\\npublic:\\n    ReturnType solution(ParamType params) {\\n        // Your code here\\n    }\\n};"
  },
  "explanation": "High-level explanation"
}`;

  try {
    let response: Response | null = null;
    let useGemini = apiKeyConfig.provider === 'gemini' && !!apiKeyConfig.geminiKey;
    let useGroq = !useGemini && !!apiKeyConfig.groqKey;

    // Try Gemini first if available
    if (useGemini) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyConfig.geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429 || errorText.includes('quota') || errorText.includes('exceeded')) {
            // Fallback to Groq if Gemini quota exceeded
            if (apiKeyConfig.groqKey) {
              useGroq = true;
              useGemini = false;
            } else {
              throw new Error('Gemini API quota exceeded. Please update your API key.');
            }
          } else {
            throw new Error(`Gemini API error: ${response.status}`);
          }
        }
      } catch (error: any) {
        if (apiKeyConfig.groqKey && !error.message.includes('quota')) {
          useGroq = true;
          useGemini = false;
        } else {
          throw error;
        }
      }
    }

    // Use Groq if Gemini failed or is not available
    if (useGroq) {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyConfig.groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a technical interviewer. Return ONLY valid JSON, no markdown or extra text.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }
    }

    if (!response) {
      throw new Error('No API key configured');
    }

    const data = await response.json();
    let rawText: string;

    if (useGemini) {
      rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else {
      rawText = data?.choices?.[0]?.message?.content || '';
    }

    if (!rawText) {
      throw new Error('No content returned from API');
    }

    const cleaned = rawText.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.question || !parsed.examples || !parsed.testCases || !parsed.starterCode) {
      throw new Error('Incomplete programming question data returned');
    }

    return {
      id: Date.now() + questionNum + 10000,
      question: parsed.question,
      topic: parsed.topic || topic,
      difficulty: (parsed.difficulty as DifficultyLevel) || difficulty,
      constraints: parsed.constraints || '',
      examples: parsed.examples || [],
      starterCode: parsed.starterCode || {
        python: '',
        javascript: '',
        java: '',
        cpp: '',
      },
      testCases: parsed.testCases || [],
      explanation: parsed.explanation || '',
      type: 'programming',
    };
  } catch (error: any) {
    console.error(`Error generating Programming question ${questionNum}:`, error);
    return null;
  }
};

// Assessment Modal Component
interface AssessmentModalProps {
  formData: Partial<Assessment>;
  setFormData: (data: Partial<Assessment>) => void;
  questions: AnyQuestion[];
  setQuestions: (questions: AnyQuestion[]) => void;
  editingAssessment: Assessment | null;
  onSave: (assessment: Partial<Assessment>) => void;
  onClose: () => void;
  onAddQuestion: () => void;
  onEditQuestion: (index: number) => void;
  onDeleteQuestion: (index: number) => void;
  isSaving: boolean;
  apiKeyConfig: APIKeyConfig;
  onRequestApiKey: () => void;
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({
  formData,
  setFormData,
  questions,
  setQuestions,
  editingAssessment,
  onSave,
  onClose,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  isSaving,
  apiKeyConfig,
  onRequestApiKey,
}) => {
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, type: '' });
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, GIF, SVG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData({ ...formData, logo: result });
    };
    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Assessment Type Selection */}
          <div className="col-span-2 mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Type</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${formData.category !== 'company'
                ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <input
                  type="radio"
                  name="assessmentType"
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                  checked={formData.category !== 'company'}
                  onChange={() => setFormData({ ...formData, category: 'technical', company: '' })}
                />
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Technical Assessment
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Subject-based (Java, React, System Design)</p>
                </div>
              </label>

              <label className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${formData.category === 'company'
                ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}>
                <input
                  type="radio"
                  name="assessmentType"
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500"
                  checked={formData.category === 'company'}
                  onChange={() => setFormData({
                    ...formData,
                    category: 'company',
                    objective: 20,
                    programming: 2,
                    time: '45 Minutes'
                  })}
                />
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Company Assessment
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Company-specific (Google, Amazon, Microsoft)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.category === 'company' ? 'Company Name *' : 'Title *'}
              </label>
              <input
                type="text"
                value={formData.category === 'company' ? (formData.company || formData.title) : formData.title}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoLogo = getLogoFromTitle(val);

                  if (formData.category === 'company') {
                    setFormData({
                      ...formData,
                      title: val ? `${val} Assessment` : '',
                      company: val,
                      logo: autoLogo || formData.logo || ''
                    });
                  } else {
                    setFormData({
                      ...formData,
                      title: val,
                      logo: autoLogo || formData.logo || ''
                    });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder={formData.category === 'company' ? "e.g., Google, Amazon" : "e.g., Java, React, Python"}
              />
            </div>

            {/* Logo Upload Section - Keeping existing logic but wrapping properly */}
            <div className="row-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
                {formData.logo && formData.logo.includes('simpleicons.org') && (
                  <span className="ml-2 text-xs text-green-600">(Auto-detected)</span>
                )}
              </label>

              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className={`w-8 h-8 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-orange-500 hover:text-orange-600 font-medium underline"
                      >
                        Click to upload
                      </button>
                      {' or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, SVG up to 5MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* URL Input */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Or enter URL:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.logo && formData.logo.startsWith('data:') ? '' : formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                    placeholder="/mock_assessments_logo/java.png or https://cdn.simpleicons.org/..."
                  />
                  {/* Fetch button logic remains the same */}
                  {formData.title && (
                    <button
                      type="button"
                      onClick={() => {
                        const autoLogo = getLogoFromTitle(formData.company || formData.title || '');
                        if (autoLogo) {
                          setFormData({ ...formData, logo: autoLogo });
                        } else {
                          alert(`No logo found. Please enter manually.`);
                        }
                      }}
                      className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition whitespace-nowrap"
                      title="Auto-fetch logo from Simple Icons"
                    >
                      🔍 Fetch
                    </button>
                  )}
                </div>
              </div>

              {/* Preview */}
              {formData.logo && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={formData.logo}
                    alt="Logo preview"
                    className="w-12 h-12 object-contain border border-gray-200 rounded bg-white p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {formData.logo.startsWith('data:') ? 'Uploaded Image' : 'Logo Preview'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {formData.logo.startsWith('data:')
                        ? `${Math.round(formData.logo.length / 1024)}KB`
                        : formData.logo.length > 50
                          ? formData.logo.substring(0, 50) + '...'
                          : formData.logo}
                    </p>
                  </div>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      title="Remove logo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {formData.category !== 'company' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as AssessmentCategory })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  {categories.filter(c => c !== 'company').map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="30 Minutes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MCQ Questions *</label>
              <input
                type="number"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programming Questions</label>
              <input
                type="number"
                value={formData.programming}
                onChange={(e) => setFormData({ ...formData, programming: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty (Select Multiple)</label>
              <div className="space-y-2">
                {difficulties.map(diff => {
                  const isSelected = formData.difficulties?.includes(diff) || false;
                  return (
                    <label key={diff} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentDifficulties = formData.difficulties || [];
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              difficulties: [...currentDifficulties, diff],
                              difficulty: diff // Keep for backward compatibility
                            });
                          } else {
                            const updated = currentDifficulties.filter(d => d !== diff);
                            setFormData({
                              ...formData,
                              difficulties: updated.length > 0 ? updated : ['medium'], // At least one must be selected
                              difficulty: updated.length > 0 ? updated[0] : 'medium'
                            });
                          }
                        }}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                    </label>
                  );
                })}
              </div>
              {(!formData.difficulties || formData.difficulties.length === 0) && (
                <p className="text-xs text-red-500 mt-1">Please select at least one difficulty level</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
              <input
                type="number"
                value={formData.xpReward}
                onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="popular"
                checked={formData.popular}
                onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="popular" className="ml-2 text-sm text-gray-700">Mark as Popular</label>
            </div>
          </div>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Questions ({questions.length})</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const mcqCount = formData.objective || 0;
                    const progCount = formData.programming || 0;
                    const total = mcqCount + progCount;

                    if (total === 0) {
                      alert('Please specify the number of MCQ and/or Programming questions to generate.');
                      return;
                    }

                    const apiKey = apiKeyConfig.provider === 'gemini' ? apiKeyConfig.geminiKey : apiKeyConfig.groqKey;
                    if (!apiKey) {
                      onRequestApiKey();
                      return;
                    }

                    setIsGeneratingQuestions(true);
                    setGenerationError(null);
                    const generatedQuestions: AnyQuestion[] = [];
                    const selectedDifficulties = formData.difficulties && formData.difficulties.length > 0
                      ? formData.difficulties
                      : ['medium'];
                    const category = formData.category || 'technical';
                    // More specific topic for company assessments to ensure relevant questions
                    const topic = category === 'company' && formData.company
                      ? `${formData.company} Interview Questions`
                      : (formData.title || category);

                    try {
                      // Generate MCQ questions - distribute across selected difficulties
                      if (mcqCount > 0) {
                        setGenerationProgress({ current: 0, total: mcqCount, type: 'MCQ' });
                        const generatedMCQs: MCQQuestion[] = [];
                        for (let i = 0; i < mcqCount; i++) {
                          // Distribute questions across selected difficulties
                          const difficultyIndex = i % selectedDifficulties.length;
                          const difficulty = selectedDifficulties[difficultyIndex] as DifficultyLevel;
                          const mcq = await generateMCQQuestion(apiKeyConfig, topic, difficulty, category, i + 1, mcqCount, generatedMCQs);
                          if (mcq) {
                            generatedMCQs.push(mcq);
                            generatedQuestions.push(mcq);
                          }
                          setGenerationProgress({ current: i + 1, total: mcqCount, type: 'MCQ' });
                          // Small delay to avoid rate limits
                          await new Promise(resolve => setTimeout(resolve, 800));
                        }
                      }

                      // Generate Programming questions - distribute across selected difficulties
                      if (progCount > 0) {
                        setGenerationProgress({ current: 0, total: progCount, type: 'Programming' });
                        const generatedProgs: ProgrammingQuestion[] = [];
                        for (let i = 0; i < progCount; i++) {
                          // Distribute questions across selected difficulties
                          const difficultyIndex = i % selectedDifficulties.length;
                          const difficulty = selectedDifficulties[difficultyIndex] as DifficultyLevel;
                          const prog = await generateProgrammingQuestion(apiKeyConfig, topic, difficulty, category, i + 1, progCount, generatedProgs);
                          if (prog) {
                            generatedProgs.push(prog);
                            generatedQuestions.push(prog);
                          }
                          setGenerationProgress({ current: i + 1, total: progCount, type: 'Programming' });
                          // Small delay to avoid rate limits
                          await new Promise(resolve => setTimeout(resolve, 800));
                        }
                      }

                      setQuestions([...questions, ...generatedQuestions]);
                      setGenerationError(null);
                    } catch (error: any) {
                      console.error('Error generating questions:', error);
                      setGenerationError(error.message || 'Failed to generate some questions. Please try again.');
                    } finally {
                      setIsGeneratingQuestions(false);
                      setGenerationProgress({ current: 0, total: 0, type: '' });
                    }
                  }}
                  disabled={isGeneratingQuestions || !formData.title}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating {generationProgress.type} ({generationProgress.current}/{generationProgress.total})...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                      Generate Questions
                    </>
                  )}
                </button>
                <button
                  onClick={onAddQuestion}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Question
                </button>
              </div>
            </div>

            {generationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {generationError}
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No questions added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {q.type === 'programming' ? 'Coding' : 'MCQ'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {q.type === 'programming' ? (q as ProgrammingQuestion).question.split('\n')[0] : (q as MCQQuestion).question}
                        </span>
                      </div>
                      {q.type === 'mcq' && (q as MCQQuestion).options && (
                        <div className="ml-0 mb-2">
                          <div className="text-xs text-gray-600 mb-1">Options:</div>
                          <div className="grid grid-cols-2 gap-1">
                            {(q as MCQQuestion).options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`text-xs px-2 py-1 rounded ${optIndex === (q as MCQQuestion).correctAnswer
                                  ? 'bg-green-100 text-green-800 font-medium border border-green-300'
                                  : 'bg-white text-gray-700 border border-gray-200'
                                  }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span> {option}
                                {optIndex === (q as MCQQuestion).correctAnswer && (
                                  <span className="ml-1 text-green-600">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Topic: {q.topic} • Difficulty: {q.difficulty || 'medium'}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => onEditQuestion(index)}
                        className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteQuestion(index)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={isSaving || !formData.title}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : editingAssessment ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Question Modal Component
interface QuestionModalProps {
  questionType: 'mcq' | 'programming';
  setQuestionType: (type: 'mcq' | 'programming') => void;
  question?: AnyQuestion;
  onSave: (question: AnyQuestion) => void;
  onClose: () => void;
  onRequestApiKey: () => void;
  apiKeyConfig: APIKeyConfig;
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  questionType,
  setQuestionType,
  question,
  onSave,
  onClose,
  onRequestApiKey,
  apiKeyConfig: parentApiKeyConfig,
}) => {
  const [mcqData, setMcqData] = useState<Partial<MCQQuestion>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    topic: '',
    explanation: '',
    difficulty: 'medium',
    type: 'mcq',
  });

  const [progData, setProgData] = useState<Partial<ProgrammingQuestion>>({
    question: '',
    topic: '',
    type: 'programming',
    difficulty: 'medium',
    constraints: '',
    examples: [{ input: '', output: '', explanation: '' }],
    starterCode: {
      python: '',
      javascript: '',
      java: '',
      cpp: '',
    },
    testCases: [{ input: '', expectedOutput: '', hidden: false }],
    explanation: '',
  });

  // AI / Gemini state
  const [apiKeyConfig, setApiKeyConfig] = useState<APIKeyConfig>(parentApiKeyConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Sync with parent API key config
  useEffect(() => {
    setApiKeyConfig(parentApiKeyConfig);
  }, [parentApiKeyConfig]);

  useEffect(() => {
    if (question) {
      if (question.type === 'programming') {
        setProgData(question as ProgrammingQuestion);
        setQuestionType('programming');
      } else {
        setMcqData(question as MCQQuestion);
        setQuestionType('mcq');
      }
    }
  }, [question]);

  const handleGenerateWithAI = async () => {
    setAiError(null);

    const hasGemini = !!apiKeyConfig.geminiKey;
    const hasGroq = !!apiKeyConfig.groqKey;

    // If no keys at all, open API key modal
    if (!hasGemini && !hasGroq) {
      onRequestApiKey();
      return;
    }

    setIsGenerating(true);

    const difficultyText =
      questionType === 'mcq'
        ? (mcqData.difficulty || 'medium')
        : (progData.difficulty || 'medium');

    const topicText =
      questionType === 'mcq'
        ? (mcqData.topic || 'general programming / web development')
        : (progData.topic || 'data structures and algorithms');

    const basePrompt = questionType === 'mcq'
      ? `You are an experienced technical interviewer. Generate ONE high-quality multiple choice question for a mock assessment.

Topic: ${topicText}
Difficulty: ${difficultyText} (easy, medium, or hard)

Return ONLY valid JSON (no markdown, no comments, no extra text) in the following format:
{
  "question": "string",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "topic": "string",
  "explanation": "string",
  "difficulty": "easy | medium | hard"
}`
      : `You are an experienced technical interviewer. Generate ONE programming question for a mock assessment (LeetCode-style).

Topic: ${topicText}
Difficulty: ${difficultyText} (easy, medium, or hard)

Return ONLY valid JSON (no markdown, no comments, no extra text) in the following format:
{
  "question": "Full problem statement with title on first line and description below",
  "topic": "string",
  "difficulty": "easy | medium | hard",
  "constraints": "string with line breaks",
  "examples": [
    { "input": "string", "output": "string", "explanation": "string" }
  ],
  "testCases": [
    { "input": "string", "expectedOutput": "string", "hidden": false }
  ],
  "starterCode": {
    "python": "string",
    "javascript": "string",
    "java": "string",
    "cpp": "string"
  },
  "explanation": "High-level explanation or hints"
}`;

    const callProvider = async (provider: 'gemini' | 'groq') => {
      let response: Response;

      if (provider === 'gemini') {
        if (!apiKeyConfig.geminiKey) {
          throw new Error('Gemini API key is not configured.');
        }

        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyConfig.geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: basePrompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const text = await response.text();

          try {
            const errJson = JSON.parse(text);
            const rawMessage: string = errJson?.error?.message || '';

            if (
              response.status === 429 ||
              rawMessage.includes('RESOURCE_EXHAUSTED') ||
              rawMessage.toLowerCase().includes('quota')
            ) {
              throw new Error(
                'Gemini API quota has been exceeded for this key. Please check your Google AI Studio plan/limits or use a different API key.'
              );
            }

            if (rawMessage) {
              throw new Error(`Gemini API error: ${rawMessage}`);
            }
          } catch {
            throw new Error(`Gemini API error (${response.status}). Please try again or update your API key.`);
          }
        }

        const data = await response.json();
        const rawText: string | undefined =
          data?.candidates?.[0]?.content?.parts
            ?.map((p: any) => p.text || '')
            .join(' ')
            .trim();

        if (!rawText) {
          throw new Error('No content returned from Gemini API.');
        }

        return rawText;
      } else {
        if (!apiKeyConfig.groqKey) {
          throw new Error('Groq API key is not configured.');
        }

        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKeyConfig.groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  'You are a coding question generator. Always respond with a single valid JSON object only, no markdown or extra text.',
              },
              {
                role: 'user',
                content: basePrompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Groq API request failed: ${response.statusText}. ${errorData.error?.message || ''}`.trim()
          );
        }

        const data = await response.json();
        const rawText: string | undefined = data?.choices?.[0]?.message?.content;

        if (!rawText) {
          throw new Error('No content returned from Groq API.');
        }

        return rawText;
      }
    };

    const applyParsedQuestion = (parsed: any) => {
      if (questionType === 'mcq') {
        const options: string[] = parsed.options || [];
        if (!parsed.question || options.length < 2) {
          throw new Error('AI returned incomplete MCQ data.');
        }
        setMcqData({
          id: mcqData.id,
          question: parsed.question,
          options: options.slice(0, 4),
          correctAnswer: typeof parsed.correctIndex === 'number' ? parsed.correctIndex : 0,
          topic: parsed.topic || topicText,
          explanation: parsed.explanation || '',
          difficulty: (parsed.difficulty as DifficultyLevel) || mcqData.difficulty || 'medium',
          type: 'mcq',
        });
      } else {
        if (!parsed.question || !parsed.examples || !parsed.testCases || !parsed.starterCode) {
          throw new Error('AI returned incomplete programming question data.');
        }
        setProgData({
          id: progData.id,
          question: parsed.question,
          topic: parsed.topic || topicText,
          difficulty: (parsed.difficulty as DifficultyLevel) || progData.difficulty || 'medium',
          constraints: parsed.constraints || '',
          examples: parsed.examples || [],
          starterCode: parsed.starterCode || {
            python: '',
            javascript: '',
            java: '',
            cpp: '',
          },
          testCases: parsed.testCases || [],
          explanation: parsed.explanation || '',
          type: 'programming',
        });
      }
    };

    try {
      // Decide primary provider based on settings and available keys
      const primary: 'gemini' | 'groq' =
        apiKeyConfig.provider === 'groq' && hasGroq
          ? 'groq'
          : hasGemini
            ? 'gemini'
            : 'groq';

      let rawText = await callProvider(primary);

      // Parse JSON (shared for both providers)
      let cleaned = rawText
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim();
      let parsed = JSON.parse(cleaned);

      applyParsedQuestion(parsed);
    } catch (primaryError: any) {
      console.error('Primary AI provider error:', primaryError);

      const primaryMessage = primaryError?.message || '';

      // Try fallback provider automatically if possible
      const canUseFallbackGemini = hasGemini && apiKeyConfig.provider === 'groq';
      const canUseFallbackGroq = hasGroq && apiKeyConfig.provider === 'gemini';

      if (canUseFallbackGemini || canUseFallbackGroq) {
        try {
          const fallbackProvider: 'gemini' | 'groq' =
            apiKeyConfig.provider === 'gemini' ? 'groq' : 'gemini';

          const rawText = await callProvider(fallbackProvider);
          let cleaned = rawText
            .replace(/^```json/i, '')
            .replace(/^```/i, '')
            .replace(/```$/i, '')
            .trim();
          let parsed = JSON.parse(cleaned);

          applyParsedQuestion(parsed);
          setAiError(
            `Primary ${apiKeyConfig.provider === 'gemini' ? 'Gemini' : 'Groq'
            } call failed. Fallback to ${fallbackProvider.toUpperCase()} succeeded.`
          );
          return;
        } catch (fallbackError: any) {
          console.error('Fallback AI provider error:', fallbackError);
          setAiError(
            fallbackError?.message ||
            'Both AI providers failed. Please check your API keys and try again.'
          );
          if (
            fallbackError?.message?.toLowerCase().includes('api key') ||
            fallbackError?.message?.toLowerCase().includes('quota')
          ) {
            onRequestApiKey();
          }
          return;
        }
      }

      // No fallback available or fallback disabled
      const message =
        primaryMessage || 'Failed to generate question with AI provider. Please try again.';
      setAiError(message);

      if (
        message.toLowerCase().includes('api key') ||
        message.toLowerCase().includes('quota') ||
        message.includes('429')
      ) {
        onRequestApiKey();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (questionType === 'mcq') {
      if (!mcqData.question || !mcqData.topic || mcqData.options?.some(opt => !opt)) {
        alert('Please fill all required fields');
        return;
      }
      onSave({
        id: question?.id || Date.now(),
        ...mcqData,
        type: 'mcq',
      } as MCQQuestion);
    } else {
      if (!progData.question || !progData.topic) {
        alert('Please fill all required fields');
        return;
      }
      onSave({
        id: question?.id || Date.now(),
        ...progData,
        type: 'programming',
      } as ProgrammingQuestion);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {question ? 'Edit Question' : 'Add Question'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* AI Generation Helper */}
          <div className="flex items-start justify-between gap-4 border border-dashed border-orange-200 rounded-lg p-3 bg-orange-50/60">
            <div>
              <p className="text-sm font-medium text-gray-900">Generate with Gemini AI</p>
              <p className="text-xs text-gray-600 mt-1">
                Use Gemini to auto-generate a high-quality {questionType === 'mcq' ? 'MCQ' : 'coding'} question based on topic and difficulty.
              </p>
              {aiError && (
                <p className="mt-1 text-xs text-red-600">
                  {aiError}
                </p>
              )}
            </div>
            <button
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.027 10.1c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Generate with AI
                </>
              )}
            </button>
          </div>

          {/* Question Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setQuestionType('mcq')}
              className={`flex-1 px-4 py-2 rounded-lg transition ${questionType === 'mcq' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
            >
              MCQ Question
            </button>
            <button
              onClick={() => setQuestionType('programming')}
              className={`flex-1 px-4 py-2 rounded-lg transition ${questionType === 'programming' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
            >
              Programming Question
            </button>
          </div>

          {questionType === 'mcq' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea
                  value={mcqData.question}
                  onChange={(e) => setMcqData({ ...mcqData, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Enter the question..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options *</label>
                {mcqData.options?.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <span className="w-8 text-center font-medium">{String.fromCharCode(65 + index)}</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...(mcqData.options || [])];
                        newOptions[index] = e.target.value;
                        setMcqData({ ...mcqData, options: newOptions });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={mcqData.correctAnswer === index}
                      onChange={() => setMcqData({ ...mcqData, correctAnswer: index })}
                      className="w-4 h-4 text-orange-500"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                  <input
                    type="text"
                    value={mcqData.topic}
                    onChange={(e) => setMcqData({ ...mcqData, topic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Java Basics, React Hooks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={mcqData.difficulty}
                    onChange={(e) => setMcqData({ ...mcqData, difficulty: e.target.value as DifficultyLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  value={mcqData.explanation}
                  onChange={(e) => setMcqData({ ...mcqData, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Explain why this is the correct answer..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Title & Description *</label>
                <textarea
                  value={progData.question}
                  onChange={(e) => setProgData({ ...progData, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  rows={5}
                  placeholder="Title\n\nDescription..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                  <input
                    type="text"
                    value={progData.topic}
                    onChange={(e) => setProgData({ ...progData, topic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Arrays, Strings"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={progData.difficulty}
                    onChange={(e) => setProgData({ ...progData, difficulty: e.target.value as DifficultyLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {difficulties.map(diff => (
                      <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Constraints</label>
                <textarea
                  value={progData.constraints}
                  onChange={(e) => setProgData({ ...progData, constraints: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  rows={3}
                  placeholder="2 <= nums.length <= 10^4..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Examples</label>
                {(progData.examples || []).map((ex, index) => (
                  <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={ex.input}
                        onChange={(e) => {
                          const newExamples = [...(progData.examples || [])];
                          newExamples[index] = { ...ex, input: e.target.value };
                          setProgData({ ...progData, examples: newExamples });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Input"
                      />
                      <input
                        type="text"
                        value={ex.output}
                        onChange={(e) => {
                          const newExamples = [...(progData.examples || [])];
                          newExamples[index] = { ...ex, output: e.target.value };
                          setProgData({ ...progData, examples: newExamples });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Output"
                      />
                    </div>
                    <input
                      type="text"
                      value={ex.explanation}
                      onChange={(e) => {
                        const newExamples = [...(progData.examples || [])];
                        newExamples[index] = { ...ex, explanation: e.target.value };
                        setProgData({ ...progData, examples: newExamples });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Explanation (optional)"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setProgData({ ...progData, examples: [...(progData.examples || []), { input: '', output: '', explanation: '' }] })}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  + Add Example
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Cases</label>
                {(progData.testCases || []).map((tc, index) => (
                  <div key={index} className="mb-2 p-3 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        type="text"
                        value={tc.input}
                        onChange={(e) => {
                          const newTestCases = [...(progData.testCases || [])];
                          newTestCases[index] = { ...tc, input: e.target.value };
                          setProgData({ ...progData, testCases: newTestCases });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        placeholder="Input"
                      />
                      <input
                        type="text"
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const newTestCases = [...(progData.testCases || [])];
                          newTestCases[index] = { ...tc, expectedOutput: e.target.value };
                          setProgData({ ...progData, testCases: newTestCases });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        placeholder="Expected Output"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={tc.hidden}
                        onChange={(e) => {
                          const newTestCases = [...(progData.testCases || [])];
                          newTestCases[index] = { ...tc, hidden: e.target.checked };
                          setProgData({ ...progData, testCases: newTestCases });
                        }}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm text-gray-700">Hidden test case</span>
                    </label>
                  </div>
                ))}
                <button
                  onClick={() => setProgData({ ...progData, testCases: [...(progData.testCases || []), { input: '', expectedOutput: '', hidden: false }] })}
                  className="text-sm text-orange-600 hover:text-orange-700"
                >
                  + Add Test Case
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starter Code</label>
                <div className="space-y-2">
                  {['python', 'javascript', 'java', 'cpp'].map(lang => (
                    <div key={lang}>
                      <label className="block text-xs text-gray-600 mb-1">{lang.charAt(0).toUpperCase() + lang.slice(1)}</label>
                      <textarea
                        value={progData.starterCode?.[lang] || ''}
                        onChange={(e) => {
                          setProgData({
                            ...progData,
                            starterCode: {
                              ...(progData.starterCode || {}),
                              [lang]: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                        rows={4}
                        placeholder={`${lang} starter code...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Save Question
          </button>
        </div>
      </div>
    </div>
  );
};

// View Assessment Modal
interface ViewAssessmentModalProps {
  assessment: Assessment;
  onClose: () => void;
  onEdit: () => void;
}

const ViewAssessmentModal: React.FC<ViewAssessmentModalProps> = ({ assessment, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{assessment.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <img src={assessment.logo} alt={assessment.title} className="w-16 h-16 object-contain" />
            <div>
              <h3 className="text-lg font-semibold">{assessment.title}</h3>
              <p className="text-sm text-gray-500">{assessment.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium">{assessment.time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="font-medium">{assessment.objective} MCQ, {assessment.programming} Coding</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${assessment.status === 'published' ? 'bg-green-100 text-green-800' :
                assessment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                {assessment.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registrations</p>
              <p className="font-medium">{assessment.registrations.toLocaleString()}</p>
            </div>
          </div>

          {assessment.questions && assessment.questions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Questions ({assessment.questions.length})</h4>
              <div className="space-y-2">
                {assessment.questions.map((q, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        {q.type === 'programming' ? 'Coding' : 'MCQ'}
                      </span>
                      <span className="text-sm font-medium">{index + 1}. {q.type === 'programming' ? (q as ProgrammingQuestion).question.split('\n')[0] : (q as MCQQuestion).question}</span>
                    </div>
                    <p className="text-xs text-gray-500">Topic: {q.topic}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};

// API Key Configuration Modal
interface ApiKeyModalProps {
  apiKeyConfig: APIKeyConfig;
  onSave: (config: APIKeyConfig) => Promise<void>;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ apiKeyConfig: initialConfig, onSave, onClose }) => {
  const [provider, setProvider] = useState<AIProvider>(initialConfig.provider);
  const [geminiKey, setGeminiKey] = useState(initialConfig.geminiKey);
  const [groqKey, setGroqKey] = useState(initialConfig.groqKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (provider === 'gemini' && !geminiKey.trim()) {
      setError('Please enter your Gemini API key');
      return;
    }

    if (provider === 'groq' && !groqKey.trim()) {
      setError('Please enter your Groq API key');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        provider,
        geminiKey: geminiKey.trim(),
        groqKey: groqKey.trim(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Configure AI API Key</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <div className="flex gap-2">
              <button
                onClick={() => setProvider('gemini')}
                className={`flex-1 px-4 py-2 rounded-lg transition ${provider === 'gemini'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Gemini
              </button>
              <button
                onClick={() => setProvider('groq')}
                className={`flex-1 px-4 py-2 rounded-lg transition ${provider === 'groq'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Groq
              </button>
            </div>
          </div>

          {/* Gemini API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-600 text-xs"
              >
                Get key →
              </a>
            </label>
            <div className="relative">
              <input
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${provider === 'gemini' ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showGeminiKey ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Groq API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Groq API Key
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-orange-500 hover:text-orange-600 text-xs"
              >
                Get key →
              </a>
            </label>
            <div className="relative">
              <input
                type={showGroqKey ? 'text' : 'password'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${provider === 'groq' ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowGroqKey(!showGroqKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showGroqKey ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Your API keys are stored securely</p>
                <p>Keys are saved locally in your browser. They will be used to generate questions with AI.</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 font-medium flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save API Key
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockAssessmentsManagementPage;
