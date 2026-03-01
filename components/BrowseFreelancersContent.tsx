import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Pagination from './Pagination';
import OrangeCheckbox from './OrangeCheckbox';
import type { Freelancer } from '../types/browse';
import type { BrowseProject } from '../types/browse';
import { getAllFreelancers, searchFreelancers, getAvailableSkills, getAvailableCountries } from '../services/freelancersApi';
import { getBidRequestProjectsByBuyer } from '../services/bidRequestProjectsApi';
import { sendFreelancerMessage, sendFreelancerInvitation } from '../services/freelancerInteractionsApi';
import { GET_USER_DETAILS_ENDPOINT } from '../services/buyerApi';
import { useAuth } from '../App';
import verifiedFreelanceSvg from '../lottiefiles/verified_freelance.svg';
import Lottie from 'lottie-react';
import noFreelancerUsersAnimation from '../lottiefiles/no_freelancer_users.json';
import SkeletonDashboard from './ui/skeleton-dashboard';
import { useSocket } from '../context/SocketContext';

type SortOption = 'most-relevant' | 'highest-rated' | 'lowest-price';

interface BrowseFreelancersContentProps {
  // No props needed for now, but can add if needed
}

export const BrowseFreelancersContent: React.FC<BrowseFreelancersContentProps> = () => {
  const { userId } = useAuth();
  const { socket, isConnected, subscribe } = useSocket();
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicMaxRate, setDynamicMaxRate] = useState<number>(500);
  const [hourlyRateRange, setHourlyRateRange] = useState<[number, number]>([0, 500]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('most-relevant');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hourlyRate: false,
    skills: false,
    country: false
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [selectedFreelancer, setSelectedFreelancer] = useState<Freelancer | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<BrowseProject[]>([]);
  const [selectedInviteProjectId, setSelectedInviteProjectId] = useState('');
  const [loadingUserProjects, setLoadingUserProjects] = useState(false);

  // Fetch user profile (name, profile image) from Get_user_Details_by_his_Id
  const fetchUserProfile = useCallback(async (freelancerId: string) => {
    try {
      const response = await fetch(GET_USER_DETAILS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: freelancerId }),
      });
      const data = await response.json();
      const user = data.data || data.user || data;
      if (!user || data.success === false) return undefined;
      const profilePicture =
        user.profilePictureUrl ??
        user.profilePicture ??
        user.profileImage ??
        user.profile_picture ??
        user.avatar ??
        user.photoURL ??
        user.imageUrl ??
        user.photo;
      const name = user.fullName || user.name;
      return { profileImage: profilePicture || undefined, name: name || undefined };
    } catch (err) {
      console.error('Error fetching freelancer profile:', err);
      return undefined;
    }
  }, []);

  // Helper to enrich freelancers with profile image from Get_user_Details_by_his_Id
  const enrichFreelancersWithProfiles = useCallback((data: Freelancer[]) => {
    const uniqueIds = [...new Set(data.map((f) => f.id).filter(Boolean))];
    uniqueIds.forEach((id) => {
      fetchUserProfile(id).then((profile) => {
        if (profile && (profile.profileImage || profile.name)) {
          setFreelancers((prev) =>
            prev.map((f) =>
              f.id === id
                ? {
                  ...f,
                  ...(profile!.profileImage && { profileImage: profile.profileImage }),
                  ...(profile!.name && { name: profile!.name }),
                }
                : f
            )
          );
        }
      });
    });
  }, [fetchUserProfile]);

  // Fetch freelancers from API
  useEffect(() => {
    const fetchFreelancers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { freelancers: data, maxHourlyRate } = await getAllFreelancers(100, 0);
        setFreelancers(data);
        if (maxHourlyRate) {
          setDynamicMaxRate(maxHourlyRate);
          setHourlyRateRange([0, maxHourlyRate]);
        }
        enrichFreelancersWithProfiles(data);
      } catch (err) {
        console.error('Error fetching freelancers:', err);
        setError('Failed to load freelancers. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreelancers();
  }, [enrichFreelancersWithProfiles]);

  // Fetch filter metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [skills, countries] = await Promise.all([
          getAvailableSkills(),
          getAvailableCountries()
        ]);
        setAvailableSkills(skills);
        setAvailableCountries(countries);
      } catch (err) {
        console.error('Error fetching filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Socket event listeners example
  useEffect(() => {
    if (!socket || !isConnected) return;

    const unsubscribe = subscribe('new_invitation', (data) => {
      console.log('Real-time invitation received:', data);
      // You can trigger a toast or update local state here
    });

    return () => unsubscribe();
  }, [socket, isConnected, subscribe]);

  // Search with API when filters change significantly
  useEffect(() => {
    const searchWithFilters = async () => {
      // If no filters are active, fetch all freelancers
      if (!searchQuery && selectedSkills.length === 0 && !selectedCountry && hourlyRateRange[0] === 0 && (hourlyRateRange[1] === dynamicMaxRate || hourlyRateRange[1] === 5000)) {
        try {
          const { freelancers: data, maxHourlyRate } = await getAllFreelancers(100, 0, false);
          setFreelancers(data);
          if (maxHourlyRate) setDynamicMaxRate(maxHourlyRate);
          enrichFreelancersWithProfiles(data);
        } catch (err) {
          console.error('Error fetching all freelancers:', err);
        }
        return;
      }

      try {
        const { freelancers: results, maxHourlyRate } = await searchFreelancers({
          query: searchQuery,
          skills: selectedSkills,
          country: selectedCountry,
          minHourlyRate: hourlyRateRange[0],
          maxHourlyRate: hourlyRateRange[1],
          limit: 100,
        });
        setFreelancers(results);
        if (maxHourlyRate) setDynamicMaxRate(maxHourlyRate);
        enrichFreelancersWithProfiles(results);
      } catch (err) {
        console.error('Error searching freelancers:', err);
        // Ensure we don't crash, maybe set empty content or show error toast
      }
    };

    const debounceTimer = setTimeout(searchWithFilters, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedSkills, selectedCountry, enrichFreelancersWithProfiles]);

  // Get unique skills and countries - removed derived memos
  // keeping simpler reference variables for compatibility if needed, but optimally we use state
  const allSkills = availableSkills;
  const allCountries = availableCountries;

  // Filter and sort freelancers
  const filteredAndSortedFreelancers = useMemo(() => {
    let filtered = [...freelancers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.username.toLowerCase().includes(query) ||
        f.skills.some(skill => skill.toLowerCase().includes(query)) ||
        f.location.city.toLowerCase().includes(query) ||
        f.location.country.toLowerCase().includes(query)
      );
    }

    // Hourly rate filter
    filtered = filtered.filter(f =>
      f.hourlyRate >= hourlyRateRange[0] && f.hourlyRate <= hourlyRateRange[1]
    );

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(f =>
        selectedSkills.some(skill => f.skills.includes(skill))
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(f => f.location.country === selectedCountry);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'highest-rated':
          return b.rating - a.rating;
        case 'lowest-price':
          return a.hourlyRate - b.hourlyRate;
        case 'most-relevant':
        default:
          // For most relevant, sort by rating and then success rate
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.successRate - a.successRate;
      }
    });

    return filtered;
  }, [freelancers, searchQuery, hourlyRateRange, selectedSkills, selectedCountry, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFreelancers.length / itemsPerPage);
  const paginatedFreelancers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFreelancers.slice(start, start + itemsPerPage);
  }, [filteredAndSortedFreelancers, currentPage, itemsPerPage]);

  // Close filter on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const clearFilters = () => {
    setHourlyRateRange([0, dynamicMaxRate]);
    setSelectedSkills([]);
    setSelectedCountry('');
    setSearchQuery('');
    setSortOption('most-relevant');
  };

  // Handle Invite to Bid - fetch user's projects when opening modal
  const handleInviteToBid = async (freelancer: Freelancer) => {
    if (!userId) {
      alert('Please login to invite freelancers to bid');
      return;
    }
    setSelectedFreelancer(freelancer);
    setSelectedInviteProjectId('');
    setShowInviteModal(true);
    setSendSuccess(null);
    setLoadingUserProjects(true);
    try {
      const projects = await getBidRequestProjectsByBuyer(userId);
      setUserProjects(projects);
      const openProjects = projects.filter((p) => p.status === 'open' || !p.status);
      if (openProjects.length) setSelectedInviteProjectId(openProjects[0].id);
    } catch (err) {
      console.error('Error fetching your projects:', err);
      setUserProjects([]);
    } finally {
      setLoadingUserProjects(false);
    }
    const defaultMsg = `Hi ${freelancer.name},\n\nI would like to invite you to bid on my project. Your skills in ${freelancer.skills.slice(0, 3).join(', ')} make you a great fit.\n\nPlease check out my project and submit your bid if interested.\n\nBest regards`;
    setInviteMessage(defaultMsg);
  };

  // Handle Contact
  const handleContact = (freelancer: Freelancer) => {
    if (!userId) {
      alert('Please login to contact freelancers');
      return;
    }
    setSelectedFreelancer(freelancer);
    setContactMessage('');
    setShowContactModal(true);
    setSendSuccess(null);
  };

  // Send Invite
  const sendInvite = async () => {
    if (!selectedFreelancer || !inviteMessage.trim() || !selectedInviteProjectId) return;

    const selectedProject = userProjects.find((p) => p.id === selectedInviteProjectId);
    setIsSending(true);
    try {
      if (!userId) {
        alert('Please login to invite freelancers to bid');
        return;
      }

      await sendFreelancerInvitation(
        userId,
        selectedFreelancer.id,
        selectedProject?.id || '',
        inviteMessage
      );

      // Log the invitation (in production, save to database with selectedInviteProjectId)
      console.log('Invitation sent to:', selectedFreelancer.name, 'Project:', selectedProject?.title);

      setSendSuccess(`Invitation sent to ${selectedFreelancer.name}!`);
      setTimeout(() => {
        setShowInviteModal(false);
        setSelectedFreelancer(null);
        setSelectedInviteProjectId('');
        setInviteMessage('');
        setSendSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error sending invite:', err);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Send Message
  const sendMessage = async () => {
    if (!selectedFreelancer || !contactMessage.trim()) return;

    setIsSending(true);
    try {
      if (!userId) {
        alert('Please login to send a message');
        return;
      }

      await sendFreelancerMessage(
        userId,
        selectedFreelancer.id,
        contactMessage
      );

      // Log the message (in production, save to database)
      console.log('Message sent to:', selectedFreelancer.name);

      setSendSuccess(`Message sent to ${selectedFreelancer.name}!`);
      setTimeout(() => {
        setShowContactModal(false);
        setSelectedFreelancer(null);
        setContactMessage('');
        setSendSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const hasActiveFilters = selectedSkills.length > 0 || selectedCountry !== '' || hourlyRateRange[0] > 0 || hourlyRateRange[1] < dynamicMaxRate;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate slider percentages (range: 0 to dynamicMaxRate)
  const minPercent = (hourlyRateRange[0] / dynamicMaxRate) * 100;
  const maxPercent = (hourlyRateRange[1] / dynamicMaxRate) * 100;

  const StarIcon = ({ filled }: { filled: boolean }) => (
    <svg
      className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= Math.round(rating)} />
        ))}
      </div>
    );
  };

  // Loading state - Skeleton dashboard
  if (isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonDashboard />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
        <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search for freelancers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-gray-100 text-sm transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div ref={filterRef} className="lg:w-80">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 mb-4 shadow-sm w-full"
          >
            <svg className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-semibold text-gray-700 dark:text-gray-300">Filters</span>
            {hasActiveFilters && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {selectedSkills.length + (selectedCountry ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Filter Sidebar - same content as BrowseFreelancers but without Header/Footer wrapper */}
          {/* Filter Sidebar - same content as BrowseFreelancers but without Header/Footer wrapper */}
          <div className={`${isFilterOpen ? 'block' : 'hidden'} lg:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg h-fit lg:sticky lg:top-4 z-10 transition-all duration-300 max-h-[calc(100vh-2rem)] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-semibold transition-colors duration-200 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Sort By</label>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium appearance-none cursor-pointer"
                >
                  <option value="most-relevant">Most Relevant</option>
                  <option value="highest-rated">Highest Rated</option>
                  <option value="lowest-price">Lowest Price</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Hourly Rate - same implementation as BrowseFreelancers */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('hourlyRate')}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                  Hourly Rate: <span className="text-orange-500 font-semibold">₹{hourlyRateRange[0]}</span> - <span className="text-orange-500 font-semibold">₹{hourlyRateRange[1]}</span>
                </label>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.hourlyRate ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.hourlyRate && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="relative h-8 py-3">
                    <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2"></div>
                    <div
                      className="absolute top-1/2 h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transform -translate-y-1/2"
                      style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                    ></div>
                    <input
                      type="range"
                      min={0}
                      max={dynamicMaxRate}
                      value={hourlyRateRange[0]}
                      onChange={(e) => setHourlyRateRange([Number(e.target.value), hourlyRateRange[1]])}
                      className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-30 pointer-events-none"
                    />
                    <input
                      type="range"
                      min={0}
                      max={dynamicMaxRate}
                      value={hourlyRateRange[1]}
                      onChange={(e) => setHourlyRateRange([hourlyRateRange[0], Number(e.target.value)])}
                      className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-20 pointer-events-none"
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        pointer-events: auto;
                        -webkit-appearance: none;
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #f97316;
                        cursor: pointer;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      }
                      input[type="range"]::-moz-range-thumb {
                        pointer-events: auto;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #f97316;
                        cursor: pointer;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                      }
                    `}</style>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Min</label>
                      <input
                        type="number"
                        min={0}
                        max={dynamicMaxRate}
                        value={hourlyRateRange[0]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(dynamicMaxRate, Number(e.target.value)));
                          setHourlyRateRange([val, hourlyRateRange[1]]);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max</label>
                      <input
                        type="number"
                        min={0}
                        max={dynamicMaxRate}
                        value={hourlyRateRange[1]}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(dynamicMaxRate, Number(e.target.value)));
                          setHourlyRateRange([hourlyRateRange[0], val]);
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Skills */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection('skills')}
                className="w-full flex items-center justify-between mb-3 group"
              >
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                  Skills {selectedSkills.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-orange-500">({selectedSkills.length})</span>
                  )}
                </label>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.skills ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.skills && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {allSkills.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
                    >
                      <OrangeCheckbox
                        checked={selectedSkills.includes(skill)}
                        onChange={(checked) => {
                          if (checked) {
                            setSelectedSkills([...selectedSkills, skill]);
                          } else {
                            setSelectedSkills(selectedSkills.filter(s => s !== skill));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{skill}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Country */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">
                Country
              </label>
              <div className="space-y-2">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium"
                >
                  <option value="">All Countries</option>
                  {allCountries.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredAndSortedFreelancers.length}</span> freelancer{filteredAndSortedFreelancers.length !== 1 ? 's' : ''}
          </div>

          {paginatedFreelancers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {paginatedFreelancers.map((freelancer) => (
                  <div
                    key={freelancer.id}
                    className="flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-300 group"
                  >
                    {/* Header Section */}
                    <div className="flex items-start gap-3 mb-4">
                      {/* Profile Image - show real photo or initial fallback */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full border-2 border-orange-200 dark:border-orange-800 group-hover:border-orange-500 dark:group-hover:border-orange-400 transition-colors overflow-hidden bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          {freelancer.profileImage ? (
                            <img
                              src={freelancer.profileImage}
                              alt={freelancer.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <span
                            className={`w-full h-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl ${freelancer.profileImage ? 'hidden' : ''}`}
                            aria-hidden={!!freelancer.profileImage}
                          >
                            {(freelancer.name || freelancer.username || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {freelancer.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Name and Username - clickable to view profile */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <a
                            href={`/freelancer?p=${encodeURIComponent(btoa(unescape(encodeURIComponent(freelancer.id))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''))}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const enc = btoa(unescape(encodeURIComponent(freelancer.id))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                              window.location.href = `/freelancer?p=${encodeURIComponent(enc)}`;
                            }}
                            className="text-base font-bold text-gray-900 dark:text-gray-100 truncate hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                          >
                            {freelancer.name}
                          </a>
                          <img src={verifiedFreelanceSvg} alt="Verified freelancer" className="w-5 h-5 flex-shrink-0" aria-hidden />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{freelancer.username}</p>
                      </div>
                    </div>

                    {/* Rating and Success Rate */}
                    {freelancer.reviewsCount > 0 && (
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          {renderStars(freelancer.rating)}
                          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 ml-0.5">
                            {freelancer.rating}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {freelancer.reviewsCount} reviews
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {freelancer.successRate}% Success
                        </span>
                      </div>
                    )}

                    {/* Hourly Rate */}
                    <div className="mb-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ₹{freelancer.hourlyRate}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">/hr</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{freelancer.location.city}, {freelancer.location.country}</span>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {freelancer.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length > 3 && (
                        <span className="px-2.5 py-1 text-gray-500 dark:text-gray-400 text-xs font-medium">
                          +{freelancer.skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInviteToBid(freelancer)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Invite to Bid
                        </button>
                        <button
                          onClick={() => handleContact(freelancer)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Contact
                        </button>
                      </div>
                      <a
                        href={`/freelancer?p=${encodeURIComponent(btoa(unescape(encodeURIComponent(freelancer.id))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''))}`}
                        onClick={(e) => {
                          e.preventDefault();
                          localStorage.setItem('activeView', 'freelancers');
                          const enc = btoa(unescape(encodeURIComponent(freelancer.id))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                          window.location.href = `/freelancer?p=${encodeURIComponent(enc)}`;
                        }}
                        className="text-center text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                      >
                        View profile
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredAndSortedFreelancers.length}
                  onItemsPerPageChange={(newItemsPerPage) => {
                    setItemsPerPage(newItemsPerPage);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center">
              <div className="w-64 h-64 mb-4">
                <Lottie animationData={noFreelancerUsersAnimation} loop={true} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No freelancers found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite to Bid Modal */}
      {showInviteModal && selectedFreelancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Invite to Bid
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedFreelancer(null);
                  setSelectedInviteProjectId('');
                  setSendSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="w-16 h-16 rounded-full border-2 border-orange-500 overflow-hidden bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                {selectedFreelancer.profileImage ? (
                  <img
                    src={selectedFreelancer.profileImage}
                    alt={selectedFreelancer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span
                  className={`w-full h-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl ${selectedFreelancer.profileImage ? 'hidden' : ''}`}
                  aria-hidden={!!selectedFreelancer.profileImage}
                >
                  {(selectedFreelancer.name || selectedFreelancer.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{selectedFreelancer.name}</p>
                  <img src={verifiedFreelanceSvg} alt="Verified freelancer" className="w-5 h-5 flex-shrink-0" aria-hidden />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{selectedFreelancer.username}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedFreelancer.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {sendSuccess ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">{sendSuccess}</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Select your project
                  </label>
                  {loadingUserProjects ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading your projects...</p>
                  ) : userProjects.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400">You have no projects. Post a project first from Browse Projects, then invite freelancers to bid.</p>
                  ) : (
                    <select
                      value={selectedInviteProjectId}
                      onChange={(e) => setSelectedInviteProjectId(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                    >
                      <option value="">Choose a project...</option>
                      {userProjects.filter((p) => p.status === 'open' || !p.status).map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Invitation Message
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm resize-none"
                    placeholder="Write your invitation message..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedFreelancer(null);
                      setSelectedInviteProjectId('');
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendInvite}
                    disabled={isSending || !inviteMessage.trim() || !selectedInviteProjectId || userProjects.length === 0}
                    className="flex-1 px-4 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Invitation
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedFreelancer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Contact {selectedFreelancer.name}
              </h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setSelectedFreelancer(null);
                  setSendSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="w-16 h-16 rounded-full border-2 border-orange-500 overflow-hidden bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                {selectedFreelancer.profileImage ? (
                  <img
                    src={selectedFreelancer.profileImage}
                    alt={selectedFreelancer.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span
                  className={`w-full h-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl ${selectedFreelancer.profileImage ? 'hidden' : ''}`}
                  aria-hidden={!!selectedFreelancer.profileImage}
                >
                  {(selectedFreelancer.name || selectedFreelancer.username || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{selectedFreelancer.name}</p>
                  <img src={verifiedFreelanceSvg} alt="Verified freelancer" className="w-5 h-5 flex-shrink-0" aria-hidden />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{selectedFreelancer.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{selectedFreelancer.hourlyRate}/hr</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{selectedFreelancer.location.city}, {selectedFreelancer.location.country}</span>
                </div>
              </div>
            </div>

            {sendSuccess ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">{sendSuccess}</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm resize-none"
                    placeholder={`Hi ${selectedFreelancer.name}, I'd like to discuss a potential project with you...`}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {contactMessage.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowContactModal(false);
                      setSelectedFreelancer(null);
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={isSending || !contactMessage.trim() || contactMessage.length > 500}
                    className="flex-1 px-4 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

