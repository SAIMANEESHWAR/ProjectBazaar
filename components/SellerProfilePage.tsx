import React, { useState, useEffect } from 'react';
import type { BuyerProject } from './BuyerProjectCard';
import BuyerProjectCard from './BuyerProjectCard';

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
}

interface SellerProfilePageProps {
  seller: Seller;
  sellerProjects?: BuyerProject[];
  onBack: () => void;
  onViewProjectDetails?: (project: BuyerProject) => void;
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

const SellerProfilePage: React.FC<SellerProfilePageProps> = ({ seller, sellerProjects: initialProjects, onBack, onViewProjectDetails }) => {
  const [sellerData, setSellerData] = useState<Seller>(seller);
  const [projects, setProjects] = useState<BuyerProject[]>(initialProjects || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Project
      </button>

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
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        sellerData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {sellerData.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-1">{sellerData.email}</p>
                  {sellerData.phoneNumber && (
                    <p className="text-sm text-gray-500 mb-1">Phone: {sellerData.phoneNumber}</p>
                  )}
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

              {/* Social Links - LinkedIn only */}
              {sellerData.linkedinUrl?.trim() && (
                <div className="flex items-center gap-4 mb-4">
                  <a
                    href={sellerData.linkedinUrl.startsWith('http') ? sellerData.linkedinUrl : `https://${sellerData.linkedinUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 hover:text-blue-900 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-sm font-medium">LinkedIn</span>
                    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
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

