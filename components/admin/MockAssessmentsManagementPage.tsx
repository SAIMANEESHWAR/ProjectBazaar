import React, { useState, useMemo, useEffect } from 'react';

// Lambda API endpoint for Mock Assessments
const MOCK_ASSESSMENTS_API = 'https://your-api-gateway.execute-api.ap-south-2.amazonaws.com/default/mock-assessment-handler';

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
  difficulty?: DifficultyLevel;
  company?: string;
  xpReward?: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  questions?: AnyQuestion[];
}

const categories: AssessmentCategory[] = ['technical', 'language', 'framework', 'database', 'devops', 'company'];
const difficulties: DifficultyLevel[] = ['easy', 'medium', 'hard'];

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
    difficulty: 'medium',
    company: '',
    xpReward: 100,
    status: 'draft',
  });

  const [questions, setQuestions] = useState<AnyQuestion[]>([]);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionType, setQuestionType] = useState<'mcq' | 'programming'>('mcq');

  // ========================================
  // API Functions
  // ========================================

  const fetchAssessments = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      // For now, use mock data. Replace with actual API call later
      const mockAssessments: Assessment[] = [
        {
          id: 'java',
          title: 'Java',
          logo: '/mock_assessments_logo/java.png',
          time: '30 Minutes',
          objective: 15,
          programming: 0,
          registrations: 6626,
          category: 'language',
          difficulty: 'medium',
          status: 'published',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
        },
        {
          id: 'react',
          title: 'React',
          logo: '/mock_assessments_logo/react.png',
          time: '30 Minutes',
          objective: 15,
          programming: 0,
          registrations: 2262,
          category: 'framework',
          difficulty: 'medium',
          status: 'published',
          createdAt: '2024-01-16',
          updatedAt: '2024-01-16',
        },
      ];
      setAssessments(mockAssessments);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setApiError('Failed to fetch assessments');
    } finally {
      setIsLoading(false);
    }
  };

  const saveAssessment = async (assessment: Partial<Assessment>) => {
    setIsSaving(true);
    setApiError(null);
    try {
      // TODO: Implement API call to save assessment
      // const response = await fetch(MOCK_ASSESSMENTS_API, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     action: editingAssessment ? 'update_assessment' : 'create_assessment',
      //     ...assessment,
      //     questions: questions,
      //   }),
      // });

      // For now, simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));

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
      // TODO: Implement API call
      setAssessments(assessments.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting assessment:', error);
      setApiError('Failed to delete assessment');
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // ========================================
  // Filtering and Search
  // ========================================

  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           assessment.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || assessment.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || assessment.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assessments, searchQuery, selectedCategory, selectedStatus]);

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
      company: '',
      xpReward: 100,
      status: 'draft',
    });
    setQuestions([]);
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mock Assessments</h2>
          <p className="text-sm text-gray-500 mt-1">Manage assessments, questions, and settings</p>
        </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AssessmentCategory | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Clear Filters
            </button>
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
              <table className="w-full">
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
                          <img src={assessment.logo} alt={assessment.title} className="w-10 h-10 object-contain" />
                          <div>
                            <div className="font-medium text-gray-900">{assessment.title}</div>
                            <div className="text-sm text-gray-500">{assessment.id}</div>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          assessment.status === 'published' ? 'bg-green-100 text-green-800' :
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssessments.map((assessment) => (
                <div key={assessment.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={assessment.logo} alt={assessment.title} className="w-12 h-12 object-contain" />
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
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        assessment.status === 'published' ? 'bg-green-100 text-green-800' :
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
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({
  formData,
  setFormData,
  questions,
  editingAssessment,
  onSave,
  onClose,
  onAddQuestion,
  onEditQuestion,
  onDeleteQuestion,
  isSaving,
}) => {
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
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Java, React, Python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="/mock_assessments_logo/java.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssessmentCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                ))}
              </select>
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
            {formData.category === 'company' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Google, Amazon"
                />
              </div>
            )}
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

            {questions.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No questions added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          {q.type === 'programming' ? 'Coding' : 'MCQ'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {q.type === 'programming' ? (q as ProgrammingQuestion).question.split('\n')[0] : (q as MCQQuestion).question}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Topic: {q.topic}</p>
                    </div>
                    <div className="flex gap-2">
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
}

const QuestionModal: React.FC<QuestionModalProps> = ({
  questionType,
  setQuestionType,
  question,
  onSave,
  onClose,
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
          {/* Question Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setQuestionType('mcq')}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                questionType === 'mcq' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              MCQ Question
            </button>
            <button
              onClick={() => setQuestionType('programming')}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                questionType === 'programming' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
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
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                assessment.status === 'published' ? 'bg-green-100 text-green-800' :
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

export default MockAssessmentsManagementPage;
