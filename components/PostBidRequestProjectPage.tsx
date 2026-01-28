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

const PostBidRequestProjectPage: React.FC<PostBidRequestProjectPageProps> = () => {
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

  // Calculate form progress
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;
    if (title.trim()) completed++;
    if (description.trim()) completed++;
    if (skills.length > 0) completed++;
    if (budgetMin > 0 && budgetMax > 0) completed++;
    if (category) completed++;
    return Math.round((completed / total) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-100/40 to-amber-100/40 dark:from-orange-900/10 dark:to-amber-900/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-100/30 to-purple-100/30 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Hero Section with Tabs */}
      <div className="mb-8 mt-2">
        {/* Subtitle */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-base">Find talented freelancers for your project requirements</p>

        {/* Modern Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg border border-gray-100 dark:border-gray-700 inline-flex gap-2">
          <button
            onClick={() => handleTabChange('post')}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-300 rounded-xl flex items-center gap-2 ${
              activeTab === 'post'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Project
          </button>
          <button
            onClick={() => handleTabChange('my-projects')}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-300 rounded-xl flex items-center gap-2 ${
              activeTab === 'my-projects'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            My Projects
            {myProjects.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">{myProjects.length}</span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'post' ? (
        /* Post New Project Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-lg animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-200 text-lg">Project Posted Successfully! 🎉</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Freelancers can now view and bid on your project.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Title Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Give your project a clear, descriptive title</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Build a React Native Mobile App for E-commerce"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200 text-gray-900 placeholder-gray-400"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Be specific and descriptive</p>
                  <p className={`text-xs font-medium ${title.length > 80 ? 'text-orange-500' : 'text-gray-400'}`}>{title.length}/100</p>
                </div>
              </div>

              {/* Project Description Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100">
                      Project Description <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Describe your requirements in detail</p>
                  </div>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project requirements in detail. Include:&#10;• Key features and functionality&#10;• Specific technologies or frameworks&#10;• Design requirements&#10;• Any reference examples"
                  rows={7}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                  maxLength={2000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">More detail = better proposals</p>
                  <p className={`text-xs font-medium ${description.length > 1800 ? 'text-orange-500' : 'text-gray-400'}`}>{description.length}/2000</p>
                </div>
              </div>

              {/* Category & Project Type Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100">Category & Type</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Help freelancers find your project</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Type</label>
                    <div className="flex gap-3">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        projectType === 'fixed'
                          ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700 bg-gray-50 dark:bg-gray-700/50'
                      }`}>
                        <input type="radio" name="projectType" value="fixed" checked={projectType === 'fixed'} onChange={() => setProjectType('fixed')} className="sr-only" />
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-sm">Fixed</span>
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        projectType === 'hourly'
                          ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-600 dark:text-orange-400 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-700 bg-gray-50 dark:bg-gray-700/50'
                      }`}>
                        <input type="radio" name="projectType" value="hourly" checked={projectType === 'hourly'} onChange={() => setProjectType('hourly')} className="sr-only" />
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-sm">Hourly</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">₹</span>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100">
                      Budget Range <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {projectType === 'fixed' ? 'Total project budget in INR' : 'Hourly rate range in INR'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Minimum</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-semibold">₹</span>
                      <input
                        type="number"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(Number(e.target.value))}
                        placeholder="1,000"
                        min={1}
                        className="w-full pl-9 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200 text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center pt-6">
                    <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Maximum</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-semibold">₹</span>
                      <input
                        type="number"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(Number(e.target.value))}
                        placeholder="10,000"
                        min={1}
                        className="w-full pl-9 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200 text-gray-900 font-medium"
                      />
                    </div>
                  </div>
                </div>
                {budgetMin > 0 && budgetMax > 0 && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                      💰 Budget: ₹{budgetMin.toLocaleString('en-IN')} - ₹{budgetMax.toLocaleString('en-IN')} {projectType === 'hourly' ? '/hour' : ''}
                    </p>
                  </div>
                )}
              </div>

              {/* Required Skills Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100">
                      Required Skills <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Add skills that freelancers should have</p>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => {
                          setSkillInput(e.target.value);
                          setShowSkillSuggestions(true);
                        }}
                        onFocus={() => setShowSkillSuggestions(true)}
                        onKeyPress={handleSkillKeyPress}
                        placeholder="Type skill name..."
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                      />
                    </div>
                    {skillInput.trim() && (
                      <button
                        type="button"
                        onClick={() => addSkill(skillInput)}
                        className="px-4 py-3.5 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors font-semibold"
                      >
                        Add
                      </button>
                    )}
                  </div>
                  {showSkillSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                      <div className="p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">Suggested Skills</p>
                        {filteredSuggestions.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="w-full px-4 py-2.5 text-left hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-700 dark:text-gray-300 transition-colors rounded-lg flex items-center gap-2"
                          >
                            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {skills.map((skill, index) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:bg-violet-200 dark:hover:bg-violet-800 rounded-full p-0.5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {skills.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Add at least one skill for better proposals
                  </p>
                )}
              </div>

              {/* Timeline Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100">Timeline</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Optional but helps freelancers plan</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estimated Duration</label>
                    <input
                      type="text"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="e.g., 2-3 weeks"
                      className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 focus:bg-white dark:focus:bg-gray-700 dark:text-gray-100 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl animate-in shake duration-300">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-3 font-medium">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Publishing Your Project...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>Publish Project & Get Bids</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:sticky lg:top-6 space-y-6 h-fit">
            {/* Progress Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Form Progress
              </h3>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Completion</span>
                  <span className="font-bold text-orange-500">{progress}%</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${title.trim() ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${title.trim() ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    {title.trim() ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs">1</span>}
                  </div>
                  <span className={`text-sm font-medium ${title.trim() ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Project Title</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${description.trim() ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${description.trim() ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    {description.trim() ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs">2</span>}
                  </div>
                  <span className={`text-sm font-medium ${description.trim() ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Description</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${skills.length > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${skills.length > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    {skills.length > 0 ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs">3</span>}
                  </div>
                  <span className={`text-sm font-medium ${skills.length > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Skills ({skills.length})</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${budgetMin > 0 && budgetMax > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${budgetMin > 0 && budgetMax > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    {budgetMin > 0 && budgetMax > 0 ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs">4</span>}
                  </div>
                  <span className={`text-sm font-medium ${budgetMin > 0 && budgetMax > 0 ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Budget</span>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${category ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${category ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    {category ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <span className="text-xs">5</span>}
                  </div>
                  <span className={`text-sm font-medium ${category ? 'text-green-700 dark:text-green-400' : 'text-gray-500'}`}>Category</span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg border border-blue-100 dark:border-blue-800 p-6">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Pro Tips
              </h3>
              <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Be specific about deliverables and requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Include any design references or examples</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>Set a realistic budget to attract quality bids</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">✓</span>
                  <span>List all required skills for better matches</span>
                </li>
              </ul>
            </div>
          </div>
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
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg shadow-orange-500/30 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Post Your First Project
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
