/**
 * Service for managing bids via API
 * Replaces localStorage with backend API calls
 */

import type { Bid, BidFormData } from '../types/bids';
import { incrementBidCount, decrementBidCount } from './bidRequestProjectsApi';

// API Endpoint for Bids Lambda
const BIDS_API_ENDPOINT = 'https://3bi4qyp5r3.execute-api.ap-south-2.amazonaws.com/default/bids_handler';

// For local development/fallback, keep localStorage as backup
const BIDS_STORAGE_KEY = 'projectBazaar_bids';
const USE_API = true; // Toggle to switch between API and localStorage

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

interface BidsData {
  bids: Bid[];
  count: number;
}

interface CheckBidData {
  hasBid: boolean;
  bid: Bid | null;
}

/**
 * Make API request to bids endpoint
 */
async function apiRequest<T>(action: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(BIDS_API_ENDPOINT, {
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
    console.error(`Error in bids API (${action}):`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      },
    };
  }
}

// ============================================
// LOCAL STORAGE FALLBACK FUNCTIONS
// ============================================

function getLocalBids(): Bid[] {
  try {
    const stored = localStorage.getItem(BIDS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error fetching local bids:', error);
    return [];
  }
}

function saveLocalBid(bid: Bid): void {
  const allBids = getLocalBids();
  allBids.push(bid);
  localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(allBids));
}

function updateLocalBid(bidId: string, updates: Partial<Bid>): void {
  const allBids = getLocalBids();
  const index = allBids.findIndex(bid => bid.id === bidId);
  if (index !== -1) {
    allBids[index] = { ...allBids[index], ...updates };
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(allBids));
  }
}

function deleteLocalBid(bidId: string): void {
  const allBids = getLocalBids();
  const filtered = allBids.filter(bid => bid.id !== bidId);
  localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(filtered));
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Get all bids from localStorage (for sync operations)
 */
export const getAllBids = (): Bid[] => {
  return getLocalBids();
};

/**
 * Get bids for a specific project (sync version for compatibility)
 */
export const getBidsByProjectId = (projectId: string): Bid[] => {
  const allBids = getLocalBids();
  return allBids.filter(bid => bid.projectId === projectId);
};

/**
 * Get bids for a specific project (async API version)
 */
export const getBidsByProjectIdAsync = async (projectId: string): Promise<Bid[]> => {
  if (!USE_API) {
    return getBidsByProjectId(projectId);
  }

  try {
    const response = await apiRequest<BidsData>('GET_BIDS_BY_PROJECT', { projectId });
    
    if (response.success && response.data) {
      return response.data.bids;
    }
    
    // Fallback to localStorage
    return getBidsByProjectId(projectId);
  } catch (error) {
    console.error('Error fetching bids by project:', error);
    return getBidsByProjectId(projectId);
  }
};

/**
 * Get bids submitted by a specific freelancer (sync)
 */
export const getBidsByFreelancerId = (freelancerId: string): Bid[] => {
  const allBids = getLocalBids();
  return allBids.filter(bid => bid.freelancerId === freelancerId);
};

/**
 * Get bids submitted by a specific freelancer (async API)
 */
export const getBidsByFreelancerIdAsync = async (freelancerId: string): Promise<Bid[]> => {
  if (!USE_API) {
    return getBidsByFreelancerId(freelancerId);
  }

  try {
    const response = await apiRequest<BidsData>('GET_BIDS_BY_FREELANCER', { freelancerId });
    
    if (response.success && response.data) {
      return response.data.bids;
    }
    
    return getBidsByFreelancerId(freelancerId);
  } catch (error) {
    console.error('Error fetching bids by freelancer:', error);
    return getBidsByFreelancerId(freelancerId);
  }
};

/**
 * Save a new bid (sync - saves to localStorage)
 */
export const saveBid = (bid: Bid): void => {
  saveLocalBid(bid);
};

/**
 * Save a new bid (async - saves to API and localStorage)
 */
export const saveBidAsync = async (
  bidData: BidFormData,
  projectId: string,
  freelancerId: string,
  freelancerName: string,
  freelancerEmail: string
): Promise<{ success: boolean; bid?: Bid; error?: string }> => {
  const bid: Bid = {
    id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    freelancerId,
    freelancerName,
    freelancerEmail,
    bidAmount: bidData.bidAmount,
    currency: bidData.currency,
    deliveryTime: bidData.deliveryTime,
    deliveryTimeUnit: bidData.deliveryTimeUnit,
    proposal: bidData.proposal,
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };

  if (!USE_API) {
    saveLocalBid(bid);
    return { success: true, bid };
  }

  try {
    const response = await apiRequest<{ bidId: string; status: string; submittedAt: string }>(
      'CREATE_BID',
      {
        projectId,
        freelancerId,
        freelancerName,
        freelancerEmail,
        bidAmount: bidData.bidAmount,
        currency: bidData.currency,
        deliveryTime: bidData.deliveryTime,
        deliveryTimeUnit: bidData.deliveryTimeUnit,
        proposal: bidData.proposal,
      }
    );

    if (response.success && response.data) {
      bid.id = response.data.bidId;
      bid.submittedAt = response.data.submittedAt;
      saveLocalBid(bid);
      
      // Increment bid count on the project
      await incrementBidCount(projectId);
      
      return { success: true, bid };
    }

    // Fallback: save locally if API fails
    saveLocalBid(bid);
    return { 
      success: true, 
      bid,
      error: response.error?.message || 'Saved locally (API unavailable)'
    };
  } catch (error) {
    console.error('Error saving bid:', error);
    saveLocalBid(bid);
    return { 
      success: true, 
      bid,
      error: 'Saved locally (API unavailable)'
    };
  }
};

/**
 * Update a bid (sync)
 */
export const updateBid = (bidId: string, updates: Partial<Bid>): void => {
  updateLocalBid(bidId, updates);
};

/**
 * Update a bid (async)
 */
export const updateBidAsync = async (
  bidId: string, 
  updates: Partial<Bid>
): Promise<{ success: boolean; error?: string }> => {
  if (!USE_API) {
    updateLocalBid(bidId, updates);
    return { success: true };
  }

  try {
    if (updates.status) {
      const response = await apiRequest<{ bidId: string; status: string }>(
        'UPDATE_BID_STATUS',
        { bidId, status: updates.status }
      );

      if (response.success) {
        updateLocalBid(bidId, updates);
        return { success: true };
      }

      return { success: false, error: response.error?.message || 'Failed to update bid' };
    }

    updateLocalBid(bidId, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating bid:', error);
    updateLocalBid(bidId, updates);
    return { success: true, error: 'Updated locally (API unavailable)' };
  }
};

/**
 * Delete a bid (sync)
 */
export const deleteBid = (bidId: string): void => {
  deleteLocalBid(bidId);
};

/**
 * Delete a bid (async)
 */
export const deleteBidAsync = async (
  bidId: string,
  freelancerId?: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> => {
  // Get the bid to find the projectId if not provided
  let bidProjectId = projectId;
  if (!bidProjectId) {
    const bid = getFreelancerBidOnProject(freelancerId || '', '');
    if (!bid) {
      // Try to get from all local bids
      const allBids = getLocalBids();
      const foundBid = allBids.find(b => b.id === bidId);
      if (foundBid) {
        bidProjectId = foundBid.projectId;
      }
    }
  }

  if (!USE_API) {
    deleteLocalBid(bidId);
    return { success: true };
  }

  try {
    const response = await apiRequest<void>('DELETE_BID', { bidId, freelancerId });

    if (response.success) {
      deleteLocalBid(bidId);
      
      // Decrement bid count on the project
      if (bidProjectId) {
        await decrementBidCount(bidProjectId);
      }
      
      return { success: true };
    }

    return { success: false, error: response.error?.message || 'Failed to delete bid' };
  } catch (error) {
    console.error('Error deleting bid:', error);
    deleteLocalBid(bidId);
    return { success: true, error: 'Deleted locally (API unavailable)' };
  }
};

/**
 * Check if a freelancer has already bid on a project (sync)
 */
export const hasFreelancerBidOnProject = (freelancerId: string, projectId: string): boolean => {
  const allBids = getLocalBids();
  return allBids.some(bid => bid.freelancerId === freelancerId && bid.projectId === projectId);
};

/**
 * Check if a freelancer has already bid on a project (async)
 */
export const hasFreelancerBidOnProjectAsync = async (
  freelancerId: string, 
  projectId: string
): Promise<boolean> => {
  if (!USE_API) {
    return hasFreelancerBidOnProject(freelancerId, projectId);
  }

  try {
    const response = await apiRequest<CheckBidData>('CHECK_EXISTING_BID', { freelancerId, projectId });

    if (response.success && response.data) {
      return response.data.hasBid;
    }

    return hasFreelancerBidOnProject(freelancerId, projectId);
  } catch (error) {
    console.error('Error checking existing bid:', error);
    return hasFreelancerBidOnProject(freelancerId, projectId);
  }
};

/**
 * Get the bid submitted by a freelancer on a specific project (sync)
 */
export const getFreelancerBidOnProject = (freelancerId: string, projectId: string): Bid | null => {
  const allBids = getLocalBids();
  return allBids.find(bid => bid.freelancerId === freelancerId && bid.projectId === projectId) || null;
};

/**
 * Get the bid submitted by a freelancer on a specific project (async)
 */
export const getFreelancerBidOnProjectAsync = async (
  freelancerId: string, 
  projectId: string
): Promise<Bid | null> => {
  if (!USE_API) {
    return getFreelancerBidOnProject(freelancerId, projectId);
  }

  try {
    const response = await apiRequest<CheckBidData>('CHECK_EXISTING_BID', { freelancerId, projectId });

    if (response.success && response.data && response.data.hasBid) {
      return response.data.bid;
    }

    return getFreelancerBidOnProject(freelancerId, projectId);
  } catch (error) {
    console.error('Error getting freelancer bid:', error);
    return getFreelancerBidOnProject(freelancerId, projectId);
  }
};

/**
 * Get bid count for a project
 */
export const getBidCountForProject = (projectId: string): number => {
  return getBidsByProjectId(projectId).length;
};

/**
 * Bid statistics interface
 */
export interface BidStats {
  count: number;
  averageBid: number;
  minBid: number;
  maxBid: number;
}

/**
 * Get bid statistics for a project (async)
 */
export const getBidStatsForProjectAsync = async (projectId: string): Promise<BidStats> => {
  const bids = await getBidsByProjectIdAsync(projectId);
  
  if (bids.length === 0) {
    return { count: 0, averageBid: 0, minBid: 0, maxBid: 0 };
  }
  
  const amounts = bids.map(bid => bid.bidAmount);
  const sum = amounts.reduce((acc, val) => acc + val, 0);
  
  return {
    count: bids.length,
    averageBid: Math.round(sum / bids.length),
    minBid: Math.min(...amounts),
    maxBid: Math.max(...amounts),
  };
};

/**
 * Accept a bid
 */
export const acceptBid = async (bidId: string): Promise<{ success: boolean; error?: string }> => {
  return updateBidAsync(bidId, { status: 'accepted' });
};

/**
 * Reject a bid
 */
export const rejectBid = async (bidId: string): Promise<{ success: boolean; error?: string }> => {
  return updateBidAsync(bidId, { status: 'rejected' });
};
