import React, { useState } from 'react';
import { useAuth } from '../App';
import { createBidRequestProject, getBidRequestProjectsByBuyer, deleteBidRequestProject, updateBidRequestProjectStatus } from '../services/bidRequestProjectsApi';
import { getBidsByProjectIdAsync, acceptBid, rejectBid } from '../services/bidsService';
import type { BrowseProject } from '../types/browse';
import type { Bid } from '../types/bids';

// Skill suggestions
const SKILL_SUGGESTIONS = [
  'React', 'React Native', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express',
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot',
  'PHP', 'Laravel', 'WordPress', 'Shopify',
  'TypeScript', 'JavaScript', 'HTML', 'CSS', 'TailwindCSS', 'Bootstrap',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'Redis', 'GraphQL',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
  'iOS', 'Android', 'Flutter', 'Swift', 'Kotlin',
  'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch',
  'UI/UX Design', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
  'REST API', 'WebSocket', 'Socket.io', 'Stripe', 'PayPal',
];

const CATEGORIES = [
  'Web Development',
  'Mobile Development',
  'UI/UX Design',
  'Backend Development',
  'Full Stack Development',
  'E-commerce',
  'WordPress',
  'Data Science & ML',
  'DevOps & Cloud',
  'API Development',
  'Game Development',
  'Blockchain',
  'Other',
];

interface PostBidRequestProjectPageProps {
  onBack?: () => void;
}

const PostBidRequestProjectPage: React.FC<PostBidRequestProjectPageProps> = ({ onBack }) => {
  const { userId, userEmail } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<'fixed' | 'hourly'>('fixed');
  const [budgetMin, setBudgetMin] = useState<number>(100);
  const [budgetMax, setBudgetMax] = useState<number>(500);
  const [currency] = useState('INR');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [deadline, setDeadline] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  
  // My projects state
  const [activeTab, setActiveTab] = useState<'post' | 'my-projects'>('post');
  const [myProjects, setMyProjects] = useState<BrowseProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  
  // View bids modal state
  const [selectedProjectForBids, setSelectedProjectForBids] = useState<BrowseProject | null>(null);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [projectBids, setProjectBids] = useState<Bid[]>([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [updatingBidId, setUpdatingBidId] = useState<string | null>(null);
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

  // Filter skill suggestions based on input
  const filteredSuggestions = SKILL_SUGGESTIONS.filter(
    skill => skill.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(skill)
  ).slice(0, 8);

  // Add skill
  const addSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  // Remove skill
  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  // Handle skill input key press
  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  // Fetch my projects
  const fetchMyProjects = async () => {
    if (!userId) return;
    
    setIsLoadingProjects(true);
    try {
      const projects = await getBidRequestProjectsByBuyer(userId);
      setMyProjects(projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: 'post' | 'my-projects') => {
    setActiveTab(tab);
    if (tab === 'my-projects') {
      fetchMyProjects();
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !userEmail) {
      setError('Please login to post a project');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a project title');
      return;
    }
    
    if (!description.trim()) {
      setError('Please enter a project description');
      return;
    }
    
    if (skills.length === 0) {
      setError('Please add at least one required skill');
      return;
    }
    
    if (budgetMin <= 0 || budgetMax <= 0) {
      setError('Please enter valid budget amounts');
      return;
    }
    
    if (budgetMin > budgetMax) {
      setError('Minimum budget cannot be greater than maximum budget');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createBidRequestProject({
        buyerId: userId,
        buyerEmail: userEmail,
        title: title.trim(),
        description: description.trim(),
        projectType,
        budgetMin,
        budgetMax,
        currency,
        skills,
        category,
        deadline: deadline || undefined,
        estimatedDuration: estimatedDuration || undefined,
      });
      
      if (result.success) {
        setSuccess(true);
        // Reset form
        setTitle('');
        setDescription('');
        setProjectType('fixed');
        setBudgetMin(100);
        setBudgetMax(500);
        setSkills([]);
        setCategory('Web Development');
        setDeadline('');
        setEstimatedDuration('');
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to post project');
      }
    } catch (err) {
      setError('An error occurred while posting your project');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle project deletion - show confirmation modal
  const handleDeleteProject = (projectId: string) => {
    if (!userId) return;
    setShowDeleteConfirm(projectId);
  };

  // Confirm and execute project deletion
  const confirmDeleteProject = async () => {
    if (!userId || !showDeleteConfirm) return;
    
    setDeletingProjectId(showDeleteConfirm);
    
    try {
      const result = await deleteBidRequestProject(showDeleteConfirm, userId);
      if (result.success) {
        setMyProjects(prev => prev.filter(p => p.id !== showDeleteConfirm));
        setShowDeleteConfirm(null);
      } else {
        setError(result.error || 'Failed to delete project');
      }
    } catch (err) {
      setError('Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (projectId: string, status: 'open' | 'in_progress' | 'completed' | 'cancelled') => {
    if (!userId) return;
    
    try {
      const result = await updateBidRequestProjectStatus(projectId, userId, status);
      if (result.success) {
        // Update local state immediately for better UX
        setMyProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, status } : p
        ));
      } else {
        setError(result.error || 'Failed to update status');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Failed to update status');
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle viewing bids for a project
  const handleViewBids = async (project: BrowseProject) => {
    setSelectedProjectForBids(project);
    setShowBidsModal(true);
    setIsLoadingBids(true);
    
    try {
      const bids = await getBidsByProjectIdAsync(project.id);
      setProjectBids(bids);
    } catch (err) {
      console.error('Error fetching bids:', err);
      setProjectBids([]);
    } finally {
      setIsLoadingBids(false);
    }
  };

  // Handle accepting a bid
  const handleAcceptBid = async (bidId: string) => {
    setUpdatingBidId(bidId);
    try {
      const result = await acceptBid(bidId);
      if (result.success) {
        // Update the bid status locally
        setProjectBids(prev => prev.map(bid => 
          bid.id === bidId ? { ...bid, status: 'accepted' } : bid
        ));
        // Refresh the project list to update bid counts
        fetchMyProjects();
      } else {
        setError(result.error || 'Failed to accept bid');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Failed to accept bid');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingBidId(null);
    }
  };

  // Handle rejecting a bid
  const handleRejectBid = async (bidId: string) => {
    setUpdatingBidId(bidId);
    try {
      const result = await rejectBid(bidId);
      if (result.success) {
        // Update the bid status locally
        setProjectBids(prev => prev.map(bid => 
          bid.id === bidId ? { ...bid, status: 'rejected' } : bid
        ));
      } else {
        setError(result.error || 'Failed to reject bid');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError('Failed to reject bid');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingBidId(null);
    }
  };

  // Format time ago for bids
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Post a Project</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Find talented freelancers for your project</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleTabChange('post')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'post'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post New Project
            </span>
          </button>
          <button
            onClick={() => handleTabChange('my-projects')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'my-projects'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Posted Projects
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'post' ? (
        /* Post New Project Form */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">Project Posted Successfully!</p>
                  <p className="text-sm text-green-600 dark:text-green-400">Freelancers can now view and bid on your project.</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Project Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Build a React Native Mobile App for E-commerce"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{title.length}/100 characters</p>
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Project Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project requirements in detail. Include features, functionality, and any specific technologies you need..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 resize-none transition-colors"
                maxLength={2000}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description.length}/2000 characters</p>
            </div>

            {/* Category & Project Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Project Type
                </label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                    projectType === 'fixed'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="projectType"
                      value="fixed"
                      checked={projectType === 'fixed'}
                      onChange={() => setProjectType('fixed')}
                      className="sr-only"
                    />
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Fixed Price</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                    projectType === 'hourly'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="projectType"
                      value="hourly"
                      checked={projectType === 'hourly'}
                      onChange={() => setProjectType('hourly')}
                      className="sr-only"
                    />
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Hourly Rate</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Budget Range ({currency}) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(Number(e.target.value))}
                      placeholder="Min"
                      min={1}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Minimum</p>
                </div>
                <span className="text-gray-400 font-medium">to</span>
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      placeholder="Max"
                      min={1}
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Maximum</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {projectType === 'fixed' ? 'Total project budget' : 'Hourly rate range'}
              </p>
            </div>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Required Skills <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSkillSuggestions(true);
                  }}
                  onFocus={() => setShowSkillSuggestions(true)}
                  onKeyPress={handleSkillKeyPress}
                  placeholder="Type a skill and press Enter, or select from suggestions"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                />
                {/* Skill Suggestions Dropdown */}
                {showSkillSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className="w-full px-4 py-2 text-left hover:bg-orange-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Selected Skills */}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-orange-900 dark:hover:text-orange-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Deadline & Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deadline */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                />
              </div>

              {/* Estimated Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Estimated Duration (Optional)
                </label>
                <input
                  type="text"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="e.g., 2-3 weeks, 1 month"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 transition-colors"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting Project...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Post Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* My Posted Projects */
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600 dark:text-gray-400">Loading your projects...</p>
              </div>
            </div>
          ) : myProjects.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No projects posted yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Post your first project to start receiving bids from freelancers</p>
              <button
                onClick={() => setActiveTab('post')}
                className="px-6 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                Post a Project
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {myProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {project.title}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          project.type === 'fixed'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        }`}>
                          {project.type === 'fixed' ? 'Fixed' : 'Hourly'}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {project.skills.length > 5 && (
                          <span className="text-xs text-gray-500">+{project.skills.length - 5} more</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <button 
                          onClick={() => handleViewBids(project)}
                          className="flex items-center gap-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">{project.bidsCount} bids</span>
                          {project.bidsCount > 0 && (
                            <span className="text-orange-500 dark:text-orange-400">→ View</span>
                          )}
                        </button>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {project.postedTimeAgo}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {project.type === 'fixed' ? 'Fixed Price' : 'Per Hour'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={(project as any).status || 'open'}
                          onChange={(e) => handleStatusUpdate(project.id, e.target.value as any)}
                          className={`px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 transition-colors ${
                            (project as any).status === 'completed' ? 'border-green-300 dark:border-green-600 text-green-700 dark:text-green-400' :
                            (project as any).status === 'in_progress' ? 'border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400' :
                            (project as any).status === 'cancelled' ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-400' :
                            'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <option value="open">🟢 Open</option>
                          <option value="in_progress">🔵 In Progress</option>
                          <option value="completed">✅ Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete project"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Error Toast */}
      {error && activeTab === 'my-projects' && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-2 hover:bg-red-600 rounded p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Project?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this project? All associated bids will also be removed. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deletingProjectId !== null}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={deletingProjectId !== null}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingProjectId ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Bids Modal */}
      {showBidsModal && selectedProjectForBids && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bids Received</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedProjectForBids.title}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setShowBidsModal(false);
                    setSelectedProjectForBids(null);
                    setProjectBids([]);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Project Summary */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedProjectForBids.type === 'fixed'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  }`}>
                    {selectedProjectForBids.type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Budget: <span className="font-semibold text-gray-900 dark:text-gray-100">
                    ₹{selectedProjectForBids.budget.min.toLocaleString()} - ₹{selectedProjectForBids.budget.max.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Bids: <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {projectBids.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Bids List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingBids ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400">Loading bids...</p>
                  </div>
                </div>
              ) : projectBids.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No bids yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Freelancers will start bidding on your project soon
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projectBids.map((bid) => (
                    <div key={bid.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Freelancer Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                                {(bid.freelancerName || bid.freelancerEmail || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {bid.freelancerName || bid.freelancerEmail?.split('@')[0] || 'Freelancer'}
                                </h4>
                                {bid.status === 'accepted' && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                                    Accepted
                                  </span>
                                )}
                                {bid.status === 'rejected' && (
                                  <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                                    Rejected
                                  </span>
                                )}
                                {bid.status === 'pending' && (
                                  <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs font-medium rounded-full">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                {bid.freelancerEmail}
                              </p>
                              
                              {/* Proposal */}
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                                  {bid.proposal}
                                </p>
                              </div>

                              {/* Bid Details */}
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-500 dark:text-gray-400">Bid Amount:</span>
                                  <span className="font-bold text-gray-900 dark:text-gray-100">
                                    ₹{bid.bidAmount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-500 dark:text-gray-400">Delivery:</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {bid.deliveryTime} {bid.deliveryTimeUnit}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-gray-500 dark:text-gray-400">
                                    {formatTimeAgo(bid.submittedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row md:flex-col gap-2 md:min-w-[140px]">
                          {bid.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleAcceptBid(bid.id)}
                                disabled={updatingBidId === bid.id}
                                className="flex-1 md:flex-none px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {updatingBidId === bid.id ? (
                                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectBid(bid.id)}
                                disabled={updatingBidId === bid.id}
                                className="flex-1 md:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </>
                          )}
                          {bid.status === 'accepted' && (
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <svg className="w-8 h-8 text-green-500 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Bid Accepted</p>
                            </div>
                          )}
                          {bid.status === 'rejected' && (
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <svg className="w-8 h-8 text-red-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-red-500 dark:text-red-400 font-medium">Bid Rejected</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => {
                  setShowBidsModal(false);
                  setSelectedProjectForBids(null);
                  setProjectBids([]);
                }}
                className="w-full py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostBidRequestProjectPage;
