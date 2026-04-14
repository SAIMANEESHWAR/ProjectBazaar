import React, { useState, useEffect } from 'react';
import type { BuyerProject } from './BuyerProjectCard';
import BuyerProjectCard from './BuyerProjectCard';
import GitHubContributionHeatmap from './GitHubContributionHeatmap';

const GET_USER_DETAILS_ENDPOINT = 'https://5d1gdw7t26.execute-api.ap-south-2.amazonaws.com/default/Get_userdetails_and_His_Projects_By_UserId';

interface Seller {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalSales?: number;
  joinDate?: string;
  phoneNumber?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isPremium?: boolean;
  credits?: number;
  totalPurchases?: number;
  status?: string;
  githubData?: {
    id?: number;
    username?: string;
    name?: string;
    avatar?: string;
    profileUrl?: string;
    bio?: string;
    followers?: number;
    following?: number;
    publicRepos?: number;
    heatmapUrl?: string;
    accountCreatedAt?: string;
    minYear?: number;
  };
}

interface SellerProfilePageProps {
  seller: Seller;
  sellerProjects?: BuyerProject[];
  onBack: () => void;
  onViewProjectDetails?: (project: BuyerProject) => void;
  toggleSidebar?: () => void;
}

interface ApiUser {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isPremium?: boolean;
  credits?: number;
  totalPurchases?: number;
  projectsCount?: number;
  createdAt?: string;
  lastLoginAt?: string;
  status?: string;
  profilePictureUrl?: string;
  githubData?: {
    id?: number;
    username?: string;
    name?: string;
    avatar?: string;
    profileUrl?: string;
    bio?: string;
    followers?: number;
    following?: number;
    publicRepos?: number;
    heatmapUrl?: string;
    accountCreatedAt?: string;
    minYear?: number;
  };
}

interface ApiProject {
  projectId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  thumbnailUrl: string;
  sellerId: string;
  sellerEmail: string;
  status: string;
  adminApproved: boolean;
  uploadedAt: string;
  documentationUrl?: string;
  youtubeVideoUrl?: string;
  purchasesCount?: number;
  likesCount?: number;
  viewsCount?: number;
}

interface ApiResponse {
  success: boolean;
  user: ApiUser;
  projects: ApiProject[];
  projectsCount: number;
}

const SellerProfilePage: React.FC<SellerProfilePageProps> = ({ seller, sellerProjects: initialProjects, onBack, onViewProjectDetails, toggleSidebar }) => {
  const [sellerData, setSellerData] = useState<Seller>(seller);
  const [projects, setProjects] = useState<BuyerProject[]>(initialProjects || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState<number>(new Date().getFullYear());

  // Map API user to Seller interface
  const mapApiUserToSeller = (apiUser: ApiUser): Seller => {
    return {
      id: apiUser.userId,
      name: apiUser.fullName || apiUser.email.split('@')[0],
      email: apiUser.email,
      avatar: apiUser.profilePictureUrl,
      phoneNumber: apiUser.phoneNumber,
      githubUrl: apiUser.githubUrl,
      linkedinUrl: apiUser.linkedinUrl,
      isPremium: apiUser.isPremium || false,
      credits: apiUser.credits || 0,
      totalPurchases: apiUser.totalPurchases || 0,
      joinDate: apiUser.createdAt ? new Date(apiUser.createdAt).toISOString().split('T')[0] : undefined,
      status: apiUser.status,
      rating: 0, // API doesn't provide rating
      totalSales: 0, // Can be calculated from projects
      githubData: apiUser.githubData,
    };
  };

  // Map API project to BuyerProject interface
  const mapApiProjectToBuyerProject = (apiProject: ApiProject): BuyerProject => {
    return {
      id: apiProject.projectId,
      imageUrl: apiProject.thumbnailUrl || 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
      category: apiProject.category || 'Uncategorized',
      title: apiProject.title || 'Untitled Project',
      description: apiProject.description || 'No description available',
      tags: apiProject.tags || [],
      price: typeof apiProject.price === 'number' ? apiProject.price : parseFloat(String(apiProject.price || '0')),
      isPremium: false,
      hasDocumentation: !!apiProject.documentationUrl,
      hasExecutionVideo: !!apiProject.youtubeVideoUrl,
    };
  };

  // Fetch seller details and projects from API
  const fetchSellerDetails = async () => {
    if (!seller.id) {
      setError('Seller ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${GET_USER_DETAILS_ENDPOINT}?userId=${seller.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch seller details: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.user) {
        const mappedSeller = mapApiUserToSeller(data.user);

        // Calculate total sales from projects
        const totalSales = data.projects?.reduce((sum, p) => sum + (p.purchasesCount || 0), 0) || 0;
        mappedSeller.totalSales = totalSales;

        setSellerData(mappedSeller);

        if (data.projects && Array.isArray(data.projects)) {
          const mappedProjects = data.projects.map(mapApiProjectToBuyerProject);
          setProjects(mappedProjects);
        } else {
          setProjects([]);
        }

        console.log('Fetched seller details:', mappedSeller);
        console.log('Fetched seller projects:', data.projects?.length || 0);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching seller details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch seller details');
      // Keep initial data if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch seller details on component mount
  useEffect(() => {
    fetchSellerDetails();
  }, [seller.id]);
  return (
    <div className="space-y-6">
      {/* Header with Mobile Menu and Back Button */}
      <div className="flex items-center gap-2">
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Back to Project</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading seller details...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800 font-medium">Error: {error}</p>
            <button
              onClick={fetchSellerDetails}
              className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Seller Profile Header */}
      {!isLoading && !error && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
                {sellerData.avatar ? (
                  <img src={sellerData.avatar} alt={sellerData.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  sellerData.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            {/* Seller Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{sellerData.name}</h1>
                    {sellerData.isPremium && (
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        PREMIUM
                      </span>
                    )}
                    {sellerData.status && (
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${sellerData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {sellerData.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">{sellerData.email}</p>

                  {sellerData.joinDate && (
                    <p className="text-sm text-gray-500">Member since {new Date(sellerData.joinDate).toLocaleDateString()}</p>
                  )}
                </div>
                {sellerData.rating && sellerData.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-5 h-5 ${i < Math.floor(sellerData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{sellerData.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {sellerData.linkedinUrl?.trim() && (
                  <a
                    href={sellerData.linkedinUrl.startsWith('http') ? sellerData.linkedinUrl : `https://${sellerData.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {sellerData.githubData && (
                  <a
                    href={sellerData.githubData.profileUrl || `https://github.com/${sellerData.githubData.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span className="text-sm font-medium">{sellerData.githubData.username || 'GitHub'}</span>
                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Verifications (Profile, Payment, Phone, Email) */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Verifications</h3>
                <div className="flex flex-wrap gap-4">
                  {/* Profile is always shown as verified (green) for authenticated sellers */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50" title="Profile verified">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-green-800">Profile</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50" title="Payment method">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Payment</span>
                  </div>
                  {sellerData.phoneNumber && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50" title="Phone verified">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-sm font-medium text-green-800">Phone</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50" title="Email">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600">Email</span>
                  </div>
                </div>
              </div>

              {/* GitHub Stats and Heatmap */}
              {sellerData.githubData && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">GitHub Activity</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {sellerData.githubData.followers !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{sellerData.githubData.followers}</p>
                        <p className="text-sm text-gray-500">Followers</p>
                      </div>
                    )}
                    {sellerData.githubData.following !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{sellerData.githubData.following}</p>
                        <p className="text-sm text-gray-500">Following</p>
                      </div>
                    )}
                    {sellerData.githubData.publicRepos !== undefined && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{sellerData.githubData.publicRepos}</p>
                        <p className="text-sm text-gray-500">Repositories</p>
                      </div>
                    )}
                  </div>

                  {sellerData.githubData.heatmapUrl && sellerData.githubData.username && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                          <p className="text-sm font-semibold text-gray-700">Contribution Heatmap</p>
                        </div>
                        <select
                          value={selectedHeatmapYear}
                          onChange={(e) => setSelectedHeatmapYear(parseInt(e.target.value))}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          {(() => {
                            const currentYear = new Date().getFullYear();
                            // Use minYear from GitHub data if available, otherwise last 10 years
                            const minYear = sellerData.githubData?.minYear || Math.max(2014, currentYear - 10);
                            const years = [];
                            for (let year = currentYear; year >= minYear; year--) {
                              years.push(
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              );
                            }
                            return years;
                          })()}
                        </select>
                      </div>
                      <div className="overflow-x-auto bg-white p-3 rounded-lg border border-gray-200">
                        <GitHubContributionHeatmap
                          username={sellerData.githubData.username}
                          selectedYear={selectedHeatmapYear}
                        />
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <a
                          href={sellerData.githubData.profileUrl || `https://github.com/${sellerData.githubData.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View full profile on GitHub
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                {sellerData.totalSales !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="text-xl font-bold text-gray-900">{sellerData.totalSales}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Projects</p>
                  <p className="text-xl font-bold text-gray-900">{projects.length}</p>
                </div>
                {sellerData.totalPurchases !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Purchases</p>
                    <p className="text-xl font-bold text-gray-900">{sellerData.totalPurchases}</p>
                  </div>
                )}
                {sellerData.credits !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Credits</p>
                    <p className="text-xl font-bold text-gray-900">{sellerData.credits}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seller's Projects */}
      {!isLoading && !error && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Projects by {sellerData.name}</h2>
            <button
              onClick={fetchSellerDetails}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-500">This seller hasn't published any projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <BuyerProjectCard
                  key={project.id}
                  project={project}
                  onViewDetails={onViewProjectDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerProfilePage;

