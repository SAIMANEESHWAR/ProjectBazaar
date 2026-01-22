/**
 * Service for managing Bid Request Projects (job postings by buyers)
 * These are projects that freelancers can browse and bid on
 */

import type { BrowseProject } from '../types/browse';

// API Endpoint for Bid Request Projects Lambda
const BID_REQUEST_PROJECTS_API_ENDPOINT = 'https://ai0hb6211e.execute-api.ap-south-2.amazonaws.com/default/bid_request_projects_handle';

// Mock data for development/fallback
import mockProjectsData from '../mock/projects.json';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

interface BidRequestProject {
  projectId: string;
  buyerId: string;
  buyerEmail: string;
  buyerName?: string;
  buyerProfilePicture?: string;
  title: string;
  description: string;
  projectType: 'fixed' | 'hourly';
  budgetMin: number;
  budgetMax: number;
  currency: string;
  skills: string[];
  category: string;
  attachments?: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  bidsCount: number;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  estimatedDuration?: string;
  postedTimeAgo?: string;
}

interface ProjectsData {
  projects: BidRequestProject[];
  count: number;
}

/**
 * Helper to calculate time ago
 */
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

/**
 * Map API project to BrowseProject format
 */
const mapToBrowseProject = (project: BidRequestProject): BrowseProject => ({
  id: project.projectId,
  title: project.title,
  description: project.description,
  type: project.projectType,
  budget: {
    min: project.budgetMin,
    max: project.budgetMax,
    currency: project.currency,
  },
  skills: project.skills,
  bidsCount: project.bidsCount,
  postedAt: project.createdAt,
  postedTimeAgo: project.postedTimeAgo || getTimeAgo(project.createdAt),
  ownerId: project.buyerId,
  ownerEmail: project.buyerEmail,
  ownerName: project.buyerName,
  ownerProfilePicture: project.buyerProfilePicture,
  category: project.category,
  status: project.status,
  deadline: project.deadline,
  estimatedDuration: project.estimatedDuration,
});

/**
 * Map mock project data to BrowseProject format
 */
const mapMockToBrowseProject = (project: any): BrowseProject => ({
  id: project.id,
  title: project.title,
  description: project.description,
  type: project.type,
  budget: project.budget,
  skills: project.skills,
  bidsCount: project.bidsCount,
  postedAt: project.postedAt,
  postedTimeAgo: getTimeAgo(project.postedAt),
  ownerId: 'mock-buyer-1',
  ownerEmail: 'buyer@example.com',
  ownerName: 'Project Owner',
});

/**
 * Make API request to bid request projects endpoint
 */
async function apiRequest<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    throw new Error('API endpoint not configured');
  }

  try {
    const response = await fetch(BID_REQUEST_PROJECTS_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...body,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in bid request projects API (${action}):`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      },
    };
  }
}

/**
 * Get all open bid request projects for freelancers to browse
 */
export const getAllBidRequestProjects = async (): Promise<BrowseProject[]> => {
  // If API endpoint is not configured, use mock data
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    console.log('Using mock data for bid request projects (API not configured)');
    return (mockProjectsData as any[]).map(mapMockToBrowseProject);
  }

  try {
    const response = await apiRequest<ProjectsData>('GET_ALL_PROJECTS');
    
    if (response.success && response.data?.projects) {
      return response.data.projects.map(mapToBrowseProject);
    }
    
    // Fallback to mock data
    console.log('API call failed, using mock data');
    return (mockProjectsData as any[]).map(mapMockToBrowseProject);
  } catch (error) {
    console.error('Error fetching bid request projects:', error);
    return (mockProjectsData as any[]).map(mapMockToBrowseProject);
  }
};

/**
 * Get a specific bid request project by ID
 */
export const getBidRequestProject = async (projectId: string): Promise<BrowseProject | null> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    const mockProject = (mockProjectsData as any[]).find(p => p.id === projectId);
    return mockProject ? mapMockToBrowseProject(mockProject) : null;
  }

  try {
    const response = await apiRequest<{ project: BidRequestProject }>('GET_PROJECT', { projectId });
    
    if (response.success && response.data?.project) {
      return mapToBrowseProject(response.data.project);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
};

/**
 * Get all bid request projects posted by a specific buyer
 */
export const getBidRequestProjectsByBuyer = async (buyerId: string): Promise<BrowseProject[]> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    // Return empty for mock (no buyer-specific mock data)
    return [];
  }

  try {
    const response = await apiRequest<ProjectsData>('GET_PROJECTS_BY_BUYER', { buyerId });
    
    if (response.success && response.data?.projects) {
      return response.data.projects.map(mapToBrowseProject);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching buyer projects:', error);
    return [];
  }
};

/**
 * Create a new bid request project (posted by buyer)
 */
export const createBidRequestProject = async (
  projectData: {
    buyerId: string;
    buyerEmail: string;
    buyerName?: string;
    buyerProfilePicture?: string;
    title: string;
    description: string;
    projectType?: 'fixed' | 'hourly';
    budgetMin: number;
    budgetMax: number;
    currency?: string;
    skills: string[];
    category?: string;
    deadline?: string;
    estimatedDuration?: string;
  }
): Promise<{ success: boolean; projectId?: string; error?: string }> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    console.log('API not configured, project not created');
    return { success: false, error: 'API endpoint not configured' };
  }

  try {
    const response = await apiRequest<{ projectId: string }>('CREATE_PROJECT', projectData);
    
    if (response.success && response.data?.projectId) {
      return { success: true, projectId: response.data.projectId };
    }
    
    return { success: false, error: response.error?.message || 'Failed to create project' };
  } catch (error) {
    console.error('Error creating project:', error);
    return { success: false, error: 'Failed to create project' };
  }
};

/**
 * Update bid request project status
 */
export const updateBidRequestProjectStatus = async (
  projectId: string,
  buyerId: string,
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
): Promise<{ success: boolean; error?: string }> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    return { success: false, error: 'API endpoint not configured' };
  }

  try {
    const response = await apiRequest<void>('UPDATE_PROJECT_STATUS', { projectId, buyerId, status });
    
    if (response.success) {
      return { success: true };
    }
    
    return { success: false, error: response.error?.message || 'Failed to update status' };
  } catch (error) {
    console.error('Error updating project status:', error);
    return { success: false, error: 'Failed to update status' };
  }
};

/**
 * Delete a bid request project
 */
export const deleteBidRequestProject = async (
  projectId: string,
  buyerId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    return { success: false, error: 'API endpoint not configured' };
  }

  try {
    const response = await apiRequest<void>('DELETE_PROJECT', { projectId, buyerId });
    
    if (response.success) {
      return { success: true };
    }
    
    return { success: false, error: response.error?.message || 'Failed to delete project' };
  } catch (error) {
    console.error('Error deleting project:', error);
    return { success: false, error: 'Failed to delete project' };
  }
};

/**
 * Increment bid count for a project (called when a new bid is placed)
 */
export const incrementBidCount = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    return { success: false, error: 'API endpoint not configured' };
  }

  try {
    const response = await apiRequest<void>('INCREMENT_BIDS_COUNT', { projectId });
    
    if (response.success) {
      return { success: true };
    }
    
    return { success: false, error: response.error?.message || 'Failed to increment bid count' };
  } catch (error) {
    console.error('Error incrementing bid count:', error);
    return { success: false, error: 'Failed to increment bid count' };
  }
};

/**
 * Decrement bid count for a project (called when a bid is withdrawn/deleted)
 */
export const decrementBidCount = async (projectId: string): Promise<{ success: boolean; error?: string }> => {
  if (!BID_REQUEST_PROJECTS_API_ENDPOINT) {
    return { success: false, error: 'API endpoint not configured' };
  }

  try {
    const response = await apiRequest<void>('DECREMENT_BIDS_COUNT', { projectId });
    
    if (response.success) {
      return { success: true };
    }
    
    return { success: false, error: response.error?.message || 'Failed to decrement bid count' };
  } catch (error) {
    console.error('Error decrementing bid count:', error);
    return { success: false, error: 'Failed to decrement bid count' };
  }
};

/**
 * Set the API endpoint (call this when you have the actual endpoint)
 */
export const setApiEndpoint = (endpoint: string): void => {
  (window as any).__BID_REQUEST_PROJECTS_API_ENDPOINT__ = endpoint;
};
