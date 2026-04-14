import React, { useState, useEffect } from 'react';
import type { BuyerProject } from '../BuyerProjectCard';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalSales?: number;
  projectsCount?: number;
  joinDate?: string;
  phoneNumber?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isPremium?: boolean;
  credits?: number;
  totalPurchases?: number;
  status?: string;
}

interface AdminProject extends BuyerProject {
  status: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected';
  uploadedDate: string;
  sellerId: string;
}

interface AdminUserProfilePageProps {
  user: User;
  userProjects: AdminProject[];
  onBack: () => void;
  onProjectStatusChange: (projectId: string, newStatus: AdminProject['status']) => void;
}

const GET_USER_DETAILS_ENDPOINT = 'https://5d1gdw7t26.execute-api.ap-south-2.amazonaws.com/default/Get_userdetails_and_His_Projects_By_UserId';
const GET_USER_PAYMENTS_ENDPOINT = 'https://z4utxrtd2e.execute-api.ap-south-2.amazonaws.com/default/get_user_payments';

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
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  role?: string;
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

interface Order {
  orderId: string;
  userId: string;
  projectIds: string[];
  razorpayOrderId: string;
  totalAmount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

interface Purchase {
  projectId: string;
  priceAtPurchase: number;
  purchasedAt: string;
  paymentId: string;
  orderStatus: string;
}

interface PaymentSummary {
  totalOrders: number;
  successfulOrders: number;
  failedOrders: number;
  pendingOrders: number;
  totalSpent: number;
  totalPurchases: number;
}

interface PaymentInfo {
  userId: string;
  orders: Order[];
  purchases: Purchase[];
  summary: PaymentSummary;
}

interface PaymentApiResponse {
  success: boolean;
  data?: PaymentInfo;
  error?: string;
}

const AdminUserProfilePage: React.FC<AdminUserProfilePageProps> = ({
  user,
  userProjects,
  onBack,
  onProjectStatusChange
}) => {
  console.log('🚀 AdminUserProfilePage component mounted/rendered');
  console.log('📦 Props received - user:', user);
  console.log('📦 Props received - userProjects:', userProjects);

  const [userData, setUserData] = useState<User>(user);
  const [projects, setProjects] = useState<AdminProject[]>(userProjects);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentInfo | null>(null);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Map API user to component User interface
  const mapApiUserToComponent = (apiUser: ApiUser): User => {
    return {
      id: apiUser.userId,
      name: apiUser.fullName || apiUser.email.split('@')[0],
      email: apiUser.email,
      phoneNumber: apiUser.phoneNumber,
      githubUrl: apiUser.githubUrl,
      linkedinUrl: apiUser.linkedinUrl,
      isPremium: apiUser.isPremium || false,
      credits: apiUser.credits || 0,
      totalPurchases: apiUser.totalPurchases || 0,
      projectsCount: apiUser.projectsCount || 0,
      joinDate: apiUser.createdAt ? new Date(apiUser.createdAt).toISOString().split('T')[0] : undefined,
      status: apiUser.status,
      rating: 0, // API doesn't provide rating, can be calculated later
      totalSales: 0, // API doesn't provide totalSales directly, can be calculated from projects
    };
  };

  // Map API project to AdminProject interface
  const mapApiProjectToComponent = (apiProject: ApiProject): AdminProject => {
    // Map status based on adminApproved and status fields
    let status: 'pending' | 'in-review' | 'active' | 'disabled' | 'rejected' = 'pending';

    if (apiProject.adminApproved) {
      if (apiProject.status === 'active' || apiProject.status === 'live') {
        status = 'active';
      } else if (apiProject.status === 'disabled' || apiProject.status === 'inactive') {
        status = 'disabled';
      } else {
        status = 'active';
      }
    } else {
      if (apiProject.status === 'pending' || !apiProject.status) {
        status = 'pending';
      } else if (apiProject.status === 'in-review' || apiProject.status === 'review') {
        status = 'in-review';
      } else if (apiProject.status === 'rejected') {
        status = 'rejected';
      } else {
        status = 'pending';
      }
    }

    // Format uploaded date
    const uploadedDate = apiProject.uploadedAt
      ? new Date(apiProject.uploadedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return {
      id: apiProject.projectId,
      imageUrl: apiProject.thumbnailUrl || 'https://images.unsplash.com/photo-1534237693998-0c6218f200b3?q=80&w=2070&auto=format&fit=crop',
      category: apiProject.category || 'Uncategorized',
      title: apiProject.title || 'Untitled Project',
      description: apiProject.description || 'No description available',
      tags: apiProject.tags || [],
      price: typeof apiProject.price === 'number' ? apiProject.price : parseFloat(String(apiProject.price || '0')),
      isPremium: false, // API doesn't provide this, can be updated later
      hasDocumentation: !!apiProject.documentationUrl,
      hasExecutionVideo: !!apiProject.youtubeVideoUrl,
      status: status,
      uploadedDate: uploadedDate,
      sellerId: apiProject.sellerId || '',
    };
  };

  // Fetch user details and projects from API
  const fetchUserDetails = async () => {
    if (!user.id) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = `${GET_USER_DETAILS_ENDPOINT}?userId=${user.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch user details: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.user) {
        const mappedUser = mapApiUserToComponent(data.user);

        // Calculate total sales from projects
        const totalSales = data.projects?.reduce((sum, p) => sum + (p.purchasesCount || 0), 0) || 0;
        mappedUser.totalSales = totalSales;

        setUserData(mappedUser);

        if (data.projects && Array.isArray(data.projects)) {
          const mappedProjects = data.projects.map((apiProject: ApiProject) =>
            mapApiProjectToComponent(apiProject)
          );
          setProjects(mappedProjects);
        } else {
          setProjects([]);
        }

        console.log('Fetched user details:', mappedUser);

        // Fetch payment history after user details are loaded
        if (data.user.userId) {
          fetchPaymentHistory(data.user.userId);
        }

      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async (userId: string) => {
    console.log('=== fetchPaymentHistory called ===', userId);

    setIsLoadingPayments(true);
    setPaymentError(null);

    try {
      const response = await fetch(GET_USER_PAYMENTS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment history: ${response.statusText}`);
      }

      const data: PaymentApiResponse = await response.json();

      if (data.success && data.data) {
        setPaymentData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setPaymentError(err instanceof Error ? err.message : 'Failed to fetch payment history');
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Fetch user details on component mount
  useEffect(() => {
    const userId = user.id || (user as any).userId;
    if (userId) {
      fetchUserDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, (user as any).userId]);

  const handleStatusChange = (projectId: string, newStatus: AdminProject['status']) => {
    setProjects(projects.map(p =>
      p.id === projectId ? { ...p, status: newStatus } : p
    ));
    onProjectStatusChange(projectId, newStatus);
  };

  const getStatusBadge = (status: AdminProject['status']) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'in-review': 'bg-blue-100 text-blue-800 border-blue-300',
      'active': 'bg-green-100 text-green-800 border-green-300',
      'disabled': 'bg-gray-100 text-gray-800 border-gray-300',
      'rejected': 'bg-red-100 text-red-800 border-red-300',
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status: AdminProject['status']) => {
    const labels = {
      'pending': 'Pending',
      'in-review': 'In Review',
      'active': 'Active',
      'disabled': 'Disabled',
      'rejected': 'Rejected',
    };
    return labels[status] || status;
  };

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
        Back to Project Management
      </button>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg p-12 border border-gray-200 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading user details...</p>
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
              onClick={fetchUserDetails}
              className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* User Profile Header and Projects */}
      {!isLoading && !error && (
        <>
          {/* User Profile Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {userData.avatar ? (
                    <img src={userData.avatar} alt={userData.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    userData.name.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
                      {userData.isPremium && (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          PREMIUM
                        </span>
                      )}
                      {userData.status && (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${userData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {userData.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">{userData.email}</p>
                    {userData.phoneNumber && (
                      <p className="text-sm text-gray-500 mb-1">Phone: {userData.phoneNumber}</p>
                    )}
                    {userData.joinDate && (
                      <p className="text-sm text-gray-500">Member since {new Date(userData.joinDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  {userData.rating && userData.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${i < Math.floor(userData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{userData.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(userData.githubUrl || userData.linkedinUrl) && (
                  <div className="flex items-center gap-4 mb-4">
                    {userData.githubUrl && (
                      <a
                        href={userData.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span className="text-sm">GitHub</span>
                      </a>
                    )}
                    {userData.linkedinUrl && (
                      <a
                        href={userData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span className="text-sm">LinkedIn</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  {userData.totalSales !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Total Sales</p>
                      <p className="text-xl font-bold text-gray-900">{userData.totalSales}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Projects</p>
                    <p className="text-xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                  {userData.totalPurchases !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Purchases</p>
                      <p className="text-xl font-bold text-gray-900">{userData.totalPurchases}</p>
                    </div>
                  )}
                  {userData.credits !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Credits</p>
                      <p className="text-xl font-bold text-gray-900">{userData.credits}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User's Projects */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Projects by {userData.name}</h2>
              <button
                onClick={fetchUserDetails}
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
                <p className="text-gray-500">This user hasn't published any projects yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-2xl overflow-hidden group transition-all duration-300 shadow-sm hover:shadow-2xl hover:-translate-y-2 border border-gray-100 flex flex-col h-full relative"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${getStatusBadge(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    {/* Premium Badge */}
                    {project.isPremium && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-white font-bold uppercase">Premium</span>
                        </div>
                      </div>
                    )}

                    {/* Image Section */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex flex-col flex-grow">
                      {/* Category Badge */}
                      <div className="mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold uppercase tracking-wide">
                          {project.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                        {project.title}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed flex-grow">
                        {project.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-50 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="text-xs text-gray-400 font-medium px-2 py-1.5">
                            +{project.tags.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {project.hasDocumentation && (
                          <span className="flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Docs</span>
                          </span>
                        )}
                        {project.hasExecutionVideo && (
                          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Video</span>
                          </span>
                        )}
                      </div>

                      {/* Price and Actions */}
                      <div className="pt-5 border-t border-gray-100 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                              ₹{project.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">Uploaded: {project.uploadedDate}</p>
                          </div>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex flex-col gap-2">
                          {project.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatusChange(project.id, 'active')}
                                className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(project.id, 'rejected')}
                                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {project.status === 'in-review' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatusChange(project.id, 'active')}
                                className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusChange(project.id, 'rejected')}
                                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {project.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(project.id, 'disabled')}
                              className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              Disable Project
                            </button>
                          )}
                          {project.status === 'disabled' && (
                            <button
                              onClick={() => handleStatusChange(project.id, 'active')}
                              className="w-full bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                              Enable Project
                            </button>
                          )}
                          {project.status === 'rejected' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStatusChange(project.id, 'active')}
                                className="flex-1 bg-green-500 text-white px-4 py-2.5 rounded-lg hover:bg-green-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Re-activate
                              </button>
                              <button
                                onClick={() => handleStatusChange(project.id, 'in-review')}
                                className="flex-1 bg-blue-500 text-white px-4 py-2.5 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Put in Review
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment History Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
              <button
                onClick={() => userData.id && fetchPaymentHistory(userData.id)}
                disabled={isLoadingPayments}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isLoadingPayments ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {isLoadingPayments && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent mb-4"></div>
                <p className="text-gray-600">Loading payment history...</p>
              </div>
            )}

            {paymentError && !isLoadingPayments && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 font-medium">Error: {paymentError}</p>
                  <button
                    onClick={() => userData.id && fetchPaymentHistory(userData.id)}
                    className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-semibold"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {paymentData && !isLoadingPayments && (
              <>
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-900">{paymentData.summary.totalOrders}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 font-medium mb-1">Successful</p>
                    <p className="text-2xl font-bold text-green-900">{paymentData.summary.successfulOrders}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <p className="text-sm text-red-600 font-medium mb-1">Failed</p>
                    <p className="text-2xl font-bold text-red-900">{paymentData.summary.failedOrders}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <p className="text-sm text-yellow-600 font-medium mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{paymentData.summary.pendingOrders}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-purple-600 font-medium mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-purple-900">₹{paymentData.summary.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 font-medium mb-1">Purchases</p>
                    <p className="text-2xl font-bold text-orange-900">{paymentData.summary.totalPurchases}</p>
                  </div>
                </div>

                {/* Orders Table */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders</h3>
                  {paymentData.orders.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No orders found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projects</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Razorpay ID</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentData.orders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono">{order.orderId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {order.currency} {order.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {order.projectIds.length} project{order.projectIds.length !== 1 ? 's' : ''}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                  order.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{order.razorpayOrderId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Purchases Table */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h3>
                  {paymentData.purchases.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No purchases found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Purchase Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paymentData.purchases.map((purchase, index) => (
                            <tr key={`${purchase.projectId}-${index}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900 font-mono">{purchase.projectId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {new Date(purchase.purchasedAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                ₹{purchase.priceAtPurchase.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{purchase.paymentId}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${purchase.orderStatus === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                                  purchase.orderStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {purchase.orderStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUserProfilePage;

