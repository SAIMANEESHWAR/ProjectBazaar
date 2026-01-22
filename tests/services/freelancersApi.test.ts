import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllFreelancers,
  getFreelancerById,
  getTopFreelancers,
  searchFreelancers,
  getAvailableSkills,
  getAvailableCountries,
} from '../../services/freelancersApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Freelancers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllFreelancers', () => {
    const mockFreelancers = [
      {
        id: 'freelancer-1',
        profileImage: 'https://example.com/avatar1.jpg',
        name: 'Alice Developer',
        username: 'alice_dev',
        isVerified: true,
        rating: 4.9,
        reviewsCount: 150,
        successRate: 98,
        hourlyRate: 50,
        currency: 'USD',
        location: { country: 'India', city: 'Bangalore' },
        skills: ['React', 'TypeScript', 'Node.js'],
      },
      {
        id: 'freelancer-2',
        profileImage: 'https://example.com/avatar2.jpg',
        name: 'Bob Designer',
        username: 'bob_design',
        isVerified: true,
        rating: 4.7,
        reviewsCount: 85,
        successRate: 95,
        hourlyRate: 40,
        currency: 'USD',
        location: { country: 'USA', city: 'San Francisco' },
        skills: ['UI/UX', 'Figma', 'Adobe XD'],
      },
    ];

    it('should fetch all freelancers successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: mockFreelancers,
            count: 2,
            totalCount: 2,
            hasMore: false,
          },
        }),
      });

      const result = await getAllFreelancers();

      expect(result.freelancers).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it('should handle pagination parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: mockFreelancers.slice(0, 1),
            count: 1,
            totalCount: 10,
            hasMore: true,
          },
        }),
      });

      const result = await getAllFreelancers(1, 0);

      expect(result.freelancers).toHaveLength(1);
      expect(result.totalCount).toBe(10);
      expect(result.hasMore).toBe(true);
    });

    it('should return empty list when API fails (no mock fallback)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getAllFreelancers();

      // In production mode, no mock fallback - returns empty list
      expect(result.freelancers).toBeDefined();
      expect(Array.isArray(result.freelancers)).toBe(true);
      expect(result.freelancers.length).toBe(0);
    });

    it('should return empty list when API returns empty (no mock fallback)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: [],
            count: 0,
            totalCount: 0,
            hasMore: false,
          },
        }),
      });

      const result = await getAllFreelancers();

      // Should return empty list from API (no mock fallback in production)
      expect(result.freelancers).toBeDefined();
      expect(Array.isArray(result.freelancers)).toBe(true);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getFreelancerById', () => {
    const mockFreelancer = {
      id: 'freelancer-123',
      profileImage: 'https://example.com/avatar.jpg',
      name: 'John Freelancer',
      username: 'john_freelancer',
      email: 'john@example.com',
      isVerified: true,
      rating: 4.8,
      reviewsCount: 200,
      successRate: 97,
      hourlyRate: 60,
      currency: 'USD',
      location: { country: 'India', city: 'Mumbai' },
      skills: ['Python', 'Django', 'PostgreSQL', 'AWS'],
      bio: 'Experienced full-stack developer with 10+ years of experience.',
      projectsSold: 50,
      totalEarnings: 100000,
      projectsCount: 75,
      joinedAt: '2020-01-15T00:00:00Z',
      lastActiveAt: new Date().toISOString(),
      projects: [
        {
          id: 'project-1',
          title: 'E-commerce Platform',
          description: 'Full-stack e-commerce solution',
          price: 5000,
          thumbnailUrl: 'https://example.com/thumb1.jpg',
          category: 'E-commerce',
          purchasesCount: 10,
          likesCount: 25,
        },
      ],
    };

    it('should fetch freelancer profile successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: mockFreelancer,
        }),
      });

      const result = await getFreelancerById('freelancer-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('freelancer-123');
      expect(result?.name).toBe('John Freelancer');
      expect(result?.skills).toContain('Python');
    });

    it('should return null for non-existent freelancer', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Freelancer not found' },
        }),
      });

      const result = await getFreelancerById('non-existent');
      expect(result).toBeNull();
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getFreelancerById('error-freelancer');
      expect(result).toBeNull();
    });
  });

  describe('getTopFreelancers', () => {
    const topFreelancers = [
      {
        id: 'top-1',
        name: 'Top Freelancer 1',
        rating: 5.0,
        reviewsCount: 500,
        successRate: 100,
        skills: ['React', 'Node.js'],
      },
      {
        id: 'top-2',
        name: 'Top Freelancer 2',
        rating: 4.9,
        reviewsCount: 450,
        successRate: 99,
        skills: ['Python', 'Django'],
      },
    ];

    it('should fetch top freelancers with default limit', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: topFreelancers,
            count: 2,
          },
        }),
      });

      const result = await getTopFreelancers();

      expect(result).toHaveLength(2);
      // Should be sorted by rating
      expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating);
    });

    it('should respect custom limit', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: topFreelancers.slice(0, 1),
            count: 1,
          },
        }),
      });

      const result = await getTopFreelancers(1);
      expect(result).toHaveLength(1);
    });

    it('should return empty array on API failure (no mock fallback)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await getTopFreelancers(3);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('searchFreelancers', () => {
    const searchResults = [
      {
        id: 'search-1',
        name: 'React Expert',
        username: 'react_expert',
        skills: ['React', 'TypeScript', 'Redux'],
        hourlyRate: 45,
        location: { country: 'India', city: 'Delhi' },
        rating: 4.8,
      },
      {
        id: 'search-2',
        name: 'React Developer',
        username: 'react_dev',
        skills: ['React', 'JavaScript', 'CSS'],
        hourlyRate: 35,
        location: { country: 'India', city: 'Chennai' },
        rating: 4.5,
      },
    ];

    it('should search by query string', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: searchResults,
            count: 2,
            totalCount: 2,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ query: 'React' });

      expect(result.freelancers).toHaveLength(2);
      expect(result.freelancers.every(f => 
        f.name.includes('React') || f.skills.some((s: string) => s.includes('React'))
      )).toBe(true);
    });

    it('should search by skills array', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: searchResults.filter(f => f.skills.includes('TypeScript')),
            count: 1,
            totalCount: 1,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ skills: ['TypeScript'] });

      expect(result.freelancers).toHaveLength(1);
    });

    it('should search by country', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: searchResults.filter(f => f.location.country === 'India'),
            count: 2,
            totalCount: 2,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ country: 'India' });

      expect(result.freelancers).toHaveLength(2);
      expect(result.freelancers.every(f => f.location.country === 'India')).toBe(true);
    });

    it('should search by hourly rate range', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: searchResults.filter(f => f.hourlyRate >= 30 && f.hourlyRate <= 40),
            count: 1,
            totalCount: 1,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ 
        minHourlyRate: 30, 
        maxHourlyRate: 40 
      });

      expect(result.freelancers).toHaveLength(1);
    });

    it('should combine multiple search filters', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: [searchResults[0]],
            count: 1,
            totalCount: 1,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({
        query: 'React',
        skills: ['TypeScript'],
        country: 'India',
        minHourlyRate: 40,
        maxHourlyRate: 50,
      });

      expect(result.freelancers).toHaveLength(1);
    });

    it('should return empty results for no matches', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: [],
            count: 0,
            totalCount: 0,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ query: 'NonExistentSkill123' });

      expect(result.freelancers).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should handle pagination in search', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: searchResults.slice(0, 1),
            count: 1,
            totalCount: 10,
            hasMore: true,
          },
        }),
      });

      const result = await searchFreelancers({ 
        query: 'Developer',
        limit: 1,
        offset: 0,
      });

      expect(result.freelancers).toHaveLength(1);
      expect(result.hasMore).toBe(true);
    });
  });

  describe('getAvailableSkills', () => {
    it('should return unique skills from all freelancers', async () => {
      const mockFreelancers = [
        { skills: ['React', 'TypeScript'] },
        { skills: ['React', 'Node.js'] },
        { skills: ['Python', 'Django'] },
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: mockFreelancers,
            count: 3,
            totalCount: 3,
            hasMore: false,
          },
        }),
      });

      const result = await getAvailableSkills();

      expect(Array.isArray(result)).toBe(true);
      // Should contain unique skills
      const uniqueCount = new Set(result).size;
      expect(uniqueCount).toBe(result.length);
    });

    it('should return sorted skills', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: [
              { skills: ['Zebra', 'Apple'] },
              { skills: ['Mango', 'Banana'] },
            ],
            count: 2,
            totalCount: 2,
            hasMore: false,
          },
        }),
      });

      const result = await getAvailableSkills();

      // Should be sorted alphabetically
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].localeCompare(result[i])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('getAvailableCountries', () => {
    it('should return unique countries from all freelancers', async () => {
      const mockFreelancers = [
        { location: { country: 'India', city: 'Delhi' } },
        { location: { country: 'USA', city: 'NYC' } },
        { location: { country: 'India', city: 'Mumbai' } },
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: mockFreelancers,
            count: 3,
            totalCount: 3,
            hasMore: false,
          },
        }),
      });

      const result = await getAvailableCountries();

      expect(Array.isArray(result)).toBe(true);
      // Should contain unique countries
      const uniqueCount = new Set(result).size;
      expect(uniqueCount).toBe(result.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle freelancer with no skills', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'no-skills',
            name: 'Beginner',
            skills: [],
          },
        }),
      });

      const result = await getFreelancerById('no-skills');
      expect(result?.skills).toHaveLength(0);
    });

    it('should handle freelancer with very long name', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'long-name',
            name: 'A'.repeat(200),
            skills: ['JavaScript'],
          },
        }),
      });

      const result = await getFreelancerById('long-name');
      expect(result?.name).toHaveLength(200);
    });

    it('should handle special characters in search query', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: [],
            count: 0,
            totalCount: 0,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ 
        query: "C++ <script>alert('xss')</script>" 
      });

      expect(Array.isArray(result.freelancers)).toBe(true);
    });

    it('should handle very high hourly rate', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            freelancers: [
              {
                id: 'expensive',
                name: 'Premium Developer',
                hourlyRate: 1000,
              },
            ],
            count: 1,
            totalCount: 1,
            hasMore: false,
          },
        }),
      });

      const result = await searchFreelancers({ minHourlyRate: 900 });

      expect(result.freelancers).toHaveLength(1);
      expect(result.freelancers[0].hourlyRate).toBe(1000);
    });

    it('should handle concurrent API calls', async () => {
      const promises = [];

      for (let i = 0; i < 3; i++) {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: {
              freelancers: [{ id: `freelancer-${i}`, name: `Freelancer ${i}` }],
              count: 1,
              totalCount: 1,
              hasMore: false,
            },
          }),
        });

        promises.push(searchFreelancers({ query: `Freelancer ${i}` }));
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.freelancers).toHaveLength(1);
      });
    });

    it('should handle unicode in freelancer data', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: {
            id: 'unicode-freelancer',
            name: '田中太郎 المطور',
            skills: ['日本語', 'العربية'],
            location: { country: '日本', city: '東京' },
          },
        }),
      });

      const result = await getFreelancerById('unicode-freelancer');
      expect(result?.name).toBe('田中太郎 المطور');
    });

    it('should handle malformed API response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          // Missing expected fields
          data: null,
        }),
      });

      const result = await getAllFreelancers();
      // Should return empty list (no mock fallback)
      expect(Array.isArray(result.freelancers)).toBe(true);
      expect(result.freelancers.length).toBe(0);
    });
  });
});
