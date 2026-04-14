/**
 * Service for fetching freelancers from API
 */

import type { Freelancer } from '../types/browse';
import { cachedFetch } from '../lib/apiCache';

// API Endpoint for Freelancers Lambda
const FREELANCERS_API_ENDPOINT = 'https://i77xrgpj6i.execute-api.ap-south-2.amazonaws.com/default/freelancers_handler';

// Fallback to mock data when API is unavailable
import freelancersData from '../mock/freelancers.json';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

interface FreelancersData {
  freelancers: Freelancer[];
  count: number;
  totalCount: number;
  hasMore: boolean;
  maxHourlyRate?: number;
}

export interface SearchFilters {
  [key: string]: unknown;
  query?: string;
  skills?: string[];
  country?: string;
  minHourlyRate?: number;
  maxHourlyRate?: number;
  limit?: number;
  offset?: number;
}

interface FreelancerProfile extends Freelancer {
  email?: string;
  bio?: string;
  projectsSold?: number;
  totalEarnings?: number;
  projectsCount?: number;
  joinedAt?: string;
  lastActiveAt?: string;
  projects?: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    thumbnailUrl?: string;
    category?: string;
    purchasesCount?: number;
    likesCount?: number;
  }>;
}

/**
 * Make API request to freelancers endpoint
 */
async function apiRequest<T>(action: string, body: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(FREELANCERS_API_ENDPOINT, {
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
    console.error(`Error in freelancers API (${action}):`, error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      },
    };
  }
}

// Flag to control whether to use mock data (set to false for production)
const USE_MOCK_DATA = false;

const FREELANCER_TTL = 90_000; // 1.5 min

const filterDummyUsers = (freelancers: Freelancer[]): Freelancer[] =>
  freelancers.filter(
    (f) => !f.email?.endsWith('@projectbazaar.com') &&
      !['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Kumar', 'Lisa Anderson'].includes(f.name)
  );

/**
 * Get all freelancers with optional pagination (cached + deduplicated).
 */
export const getAllFreelancers = async (
  limit: number = 50,
  offset: number = 0,
  includeAll: boolean = true
): Promise<{ freelancers: Freelancer[]; totalCount: number; hasMore: boolean; maxHourlyRate?: number }> => {
  if (USE_MOCK_DATA) {
    return {
      freelancers: freelancersData as Freelancer[],
      totalCount: freelancersData.length,
      hasMore: false,
    };
  }

  const cacheKey = `freelancers:all:${limit}:${offset}:${includeAll}`;
  return cachedFetch(cacheKey, async () => {
    const response = await apiRequest<FreelancersData>('GET_ALL_FREELANCERS', {
      limit,
      offset,
      includeAll
    });

    if (response.success && response.data) {
      const filteredFreelancers = filterDummyUsers(response.data.freelancers);
      return {
        freelancers: filteredFreelancers,
        totalCount: response.data.totalCount - (response.data.freelancers.length - filteredFreelancers.length),
        hasMore: response.data.hasMore,
        maxHourlyRate: response.data.maxHourlyRate,
      };
    }

    throw new Error(response.error?.message || 'Failed to fetch freelancers');
  }, FREELANCER_TTL);
};

/**
 * Get a specific freelancer's profile
 */
export const getFreelancerById = async (freelancerId: string): Promise<FreelancerProfile | null> => {
  if (USE_MOCK_DATA) {
    const mockFreelancer = (freelancersData as Freelancer[]).find(f => f.id === freelancerId);
    return mockFreelancer || null;
  }

  try {
    const response = await apiRequest<FreelancerProfile>('GET_FREELANCER_BY_ID', { freelancerId });

    if (response.success && response.data) {
      return response.data;
    }

    const errorMessage = response.error?.message || 'Failed to fetch freelancer profile';
    console.error('API error:', response.error);
    throw new Error(errorMessage);
  } catch (error) {
    console.error('Error fetching freelancer:', error);
    throw error instanceof Error ? error : new Error('Network error occurred');
  }
};

/**
 * Get top-rated freelancers for homepage
 */
export const getTopFreelancers = async (limit: number = 6): Promise<Freelancer[]> => {
  if (USE_MOCK_DATA) {
    const sorted = [...(freelancersData as Freelancer[])].sort((a, b) => b.rating - a.rating);
    return sorted.slice(0, limit);
  }

  return cachedFetch(`freelancers:top:${limit}`, async () => {
    const response = await apiRequest<FreelancersData>('GET_TOP_FREELANCERS', { limit });

    if (response.success && response.data) {
      return filterDummyUsers(response.data.freelancers);
    }

    throw new Error(response.error?.message || 'Failed to fetch top freelancers');
  }, FREELANCER_TTL);
};

/**
 * Search freelancers by various criteria
 */
export const searchFreelancers = async (
  filters: SearchFilters
): Promise<{ freelancers: Freelancer[]; totalCount: number; hasMore: boolean; maxHourlyRate?: number }> => {
  if (USE_MOCK_DATA) {
    // Filter mock data locally
    let filtered = [...(freelancersData as Freelancer[])];

    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(query) ||
        f.username.toLowerCase().includes(query) ||
        f.skills.some(s => s.toLowerCase().includes(query))
      );
    }

    if (filters.skills && filters.skills.length > 0) {
      filtered = filtered.filter(f =>
        filters.skills!.some((skill: string) =>
          f.skills.some((s: string) => s.toLowerCase() === skill.toLowerCase())
        )
      );
    }

    if (filters.country) {
      filtered = filtered.filter(f =>
        f.location.country.toLowerCase() === filters.country!.toLowerCase()
      );
    }

    if (filters.minHourlyRate !== undefined) {
      filtered = filtered.filter(f => f.hourlyRate >= filters.minHourlyRate!);
    }

    if (filters.maxHourlyRate !== undefined) {
      filtered = filtered.filter(f => f.hourlyRate <= filters.maxHourlyRate!);
    }

    const offset = filters.offset || 0;
    const limit = filters.limit || 50;

    return {
      freelancers: filtered.slice(offset, offset + limit),
      totalCount: filtered.length,
      hasMore: offset + limit < filtered.length,
      maxHourlyRate: undefined, // Mock data doesn't provide this, so set to undefined
    };
  }

  try {
    const response = await apiRequest<FreelancersData>('SEARCH_FREELANCERS', filters);

    if (response.success && response.data) {
      const filteredResults = response.data.freelancers.filter(
        (f) => !f.email?.endsWith('@projectbazaar.com') &&
          !['John Smith', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Kumar', 'Lisa Anderson'].includes(f.name)
      );

      return {
        freelancers: filteredResults,
        totalCount: response.data.totalCount - (response.data.freelancers.length - filteredResults.length),
        hasMore: response.data.hasMore,
        maxHourlyRate: response.data.maxHourlyRate,
      };
    }

    const errorMessage = response.error?.message || 'Failed to search freelancers';
    console.error('API error:', response.error);
    throw new Error(errorMessage);
  } catch (error) {
    console.error('Error searching freelancers:', error);
    throw error instanceof Error ? error : new Error('Network error occurred');
  }
};

/**
 * Get skills AND countries in a single cached call (avoids 2 extra getAllFreelancers calls).
 */
export const getAvailableFilters = async (): Promise<{ skills: string[]; countries: string[] }> => {
  if (USE_MOCK_DATA) {
    const skillsSet = new Set<string>();
    const countriesSet = new Set<string>();
    (freelancersData as Freelancer[]).forEach(f => {
      f.skills.forEach(skill => skillsSet.add(skill));
      countriesSet.add(f.location.country);
    });
    return { skills: Array.from(skillsSet).sort(), countries: Array.from(countriesSet).sort() };
  }

  return cachedFetch('freelancers:filters', async () => {
    const { freelancers } = await getAllFreelancers(1000, 0);
    const skillsSet = new Set<string>();
    const countriesSet = new Set<string>();
    freelancers.forEach(f => {
      f.skills?.forEach(skill => skillsSet.add(skill));
      if (f.location?.country) countriesSet.add(f.location.country);
    });
    return { skills: Array.from(skillsSet).sort(), countries: Array.from(countriesSet).sort() };
  }, FREELANCER_TTL);
};

/** @deprecated Use getAvailableFilters() instead to avoid duplicate API calls */
export const getAvailableSkills = async (): Promise<string[]> => {
  const { skills } = await getAvailableFilters();
  return skills;
};

/** @deprecated Use getAvailableFilters() instead to avoid duplicate API calls */
export const getAvailableCountries = async (): Promise<string[]> => {
  const { countries } = await getAvailableFilters();
  return countries;
};
