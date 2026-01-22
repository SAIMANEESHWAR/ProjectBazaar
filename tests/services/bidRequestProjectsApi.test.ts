import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAllBidRequestProjects,
  getBidRequestProject,
  getBidRequestProjectsByBuyer,
  createBidRequestProject,
  updateBidRequestProjectStatus,
  deleteBidRequestProject,
  incrementBidCount,
} from '../../services/bidRequestProjectsApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Bid Request Projects API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllBidRequestProjects', () => {
    it('should fetch all open projects successfully', async () => {
      const mockProjects = [
        {
          projectId: 'project-1',
          buyerId: 'buyer-1',
          buyerEmail: 'buyer@example.com',
          title: 'React Dashboard Development',
          description: 'Build a comprehensive admin dashboard',
          projectType: 'fixed',
          budgetMin: 5000,
          budgetMax: 10000,
          currency: 'INR',
          skills: ['React', 'TypeScript', 'TailwindCSS'],
          category: 'Web Development',
          status: 'open',
          bidsCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          projectId: 'project-2',
          buyerId: 'buyer-2',
          buyerEmail: 'buyer2@example.com',
          title: 'Mobile App Development',
          description: 'Create a cross-platform mobile app',
          projectType: 'hourly',
          budgetMin: 20,
          budgetMax: 50,
          currency: 'INR',
          skills: ['React Native', 'TypeScript'],
          category: 'Mobile Development',
          status: 'open',
          bidsCount: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projects: mockProjects, count: 2 },
        }),
      });

      const result = await getAllBidRequestProjects();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('project-1');
      expect(result[0].title).toBe('React Dashboard Development');
    });

    it('should return empty array when no projects exist', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projects: [], count: 0 },
        }),
      });

      const result = await getAllBidRequestProjects();
      expect(result).toHaveLength(0);
    });

    it('should fallback to mock data when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getAllBidRequestProjects();
      // Should return mock data
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle API returning error response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'DATABASE_ERROR', message: 'Failed to fetch' },
        }),
      });

      const result = await getAllBidRequestProjects();
      // Should return mock data on failure
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getBidRequestProject', () => {
    it('should fetch a single project by ID', async () => {
      const mockProject = {
        projectId: 'project-123',
        buyerId: 'buyer-1',
        buyerEmail: 'buyer@example.com',
        title: 'E-commerce Website',
        description: 'Full-stack e-commerce solution',
        projectType: 'fixed',
        budgetMin: 10000,
        budgetMax: 20000,
        currency: 'INR',
        skills: ['Node.js', 'React', 'PostgreSQL'],
        category: 'E-commerce',
        status: 'open',
        bidsCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { project: mockProject },
        }),
      });

      const result = await getBidRequestProject('project-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('project-123');
      expect(result?.title).toBe('E-commerce Website');
    });

    it('should return null for non-existent project', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        }),
      });

      const result = await getBidRequestProject('non-existent');
      expect(result).toBeNull();
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getBidRequestProject('project-error');
      expect(result).toBeNull();
    });
  });

  describe('getBidRequestProjectsByBuyer', () => {
    it('should fetch all projects by a specific buyer', async () => {
      const mockProjects = [
        {
          projectId: 'project-1',
          buyerId: 'buyer-123',
          buyerEmail: 'buyer@example.com',
          title: 'Project 1',
          description: 'Description 1',
          projectType: 'fixed',
          budgetMin: 1000,
          budgetMax: 5000,
          currency: 'INR',
          skills: ['React'],
          status: 'open',
          bidsCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          projectId: 'project-2',
          buyerId: 'buyer-123',
          buyerEmail: 'buyer@example.com',
          title: 'Project 2',
          description: 'Description 2',
          projectType: 'hourly',
          budgetMin: 25,
          budgetMax: 50,
          currency: 'INR',
          skills: ['Node.js'],
          status: 'in_progress',
          bidsCount: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projects: mockProjects, count: 2 },
        }),
      });

      const result = await getBidRequestProjectsByBuyer('buyer-123');

      expect(result).toHaveLength(2);
      expect(result.every(p => p.ownerId === 'buyer-123')).toBe(true);
    });

    it('should return empty array for buyer with no projects', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projects: [], count: 0 },
        }),
      });

      const result = await getBidRequestProjectsByBuyer('new-buyer');
      expect(result).toHaveLength(0);
    });
  });

  describe('createBidRequestProject', () => {
    const validProjectData = {
      buyerId: 'buyer-123',
      buyerEmail: 'buyer@example.com',
      buyerName: 'John Buyer',
      title: 'New Web Application',
      description: 'I need a full-stack web application with user authentication, dashboard, and reporting features.',
      projectType: 'fixed' as const,
      budgetMin: 5000,
      budgetMax: 15000,
      currency: 'INR',
      skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      category: 'Full Stack Development',
      deadline: '2024-06-30',
      estimatedDuration: '2-3 months',
    };

    it('should create a new project successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'new-project-123' },
        }),
      });

      const result = await createBidRequestProject(validProjectData);

      expect(result.success).toBe(true);
      expect(result.projectId).toBe('new-project-123');
    });

    it('should handle validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Missing required field: title' },
        }),
      });

      const result = await createBidRequestProject({
        ...validProjectData,
        title: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors during creation', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await createBidRequestProject(validProjectData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should create project with minimal required fields', async () => {
      const minimalData = {
        buyerId: 'buyer-min',
        buyerEmail: 'minimal@example.com',
        title: 'Minimal Project',
        description: 'A simple project',
        budgetMin: 100,
        budgetMax: 500,
        skills: ['JavaScript'],
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'minimal-project' },
        }),
      });

      const result = await createBidRequestProject(minimalData);
      expect(result.success).toBe(true);
    });

    it('should handle hourly project type', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'hourly-project' },
        }),
      });

      const result = await createBidRequestProject({
        ...validProjectData,
        projectType: 'hourly',
        budgetMin: 20,
        budgetMax: 50,
      });

      expect(result.success).toBe(true);
    });

    it('should handle project with multiple skills', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'multi-skill-project' },
        }),
      });

      const result = await createBidRequestProject({
        ...validProjectData,
        skills: [
          'React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis',
          'Docker', 'Kubernetes', 'AWS', 'GraphQL', 'TailwindCSS',
        ],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateBidRequestProjectStatus', () => {
    it('should update project status to in_progress', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Project status updated to in_progress',
        }),
      });

      const result = await updateBidRequestProjectStatus('project-123', 'buyer-456', 'in_progress');
      expect(result.success).toBe(true);
    });

    it('should update project status to completed', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Project status updated to completed',
        }),
      });

      const result = await updateBidRequestProjectStatus('project-123', 'buyer-456', 'completed');
      expect(result.success).toBe(true);
    });

    it('should update project status to cancelled', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Project status updated to cancelled',
        }),
      });

      const result = await updateBidRequestProjectStatus('project-123', 'buyer-456', 'cancelled');
      expect(result.success).toBe(true);
    });

    it('should prevent non-owner from updating status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only update your own projects' },
        }),
      });

      const result = await updateBidRequestProjectStatus('project-123', 'wrong-buyer', 'completed');
      expect(result.success).toBe(false);
    });

    it('should handle non-existent project', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        }),
      });

      const result = await updateBidRequestProjectStatus('non-existent', 'buyer-123', 'completed');
      expect(result.success).toBe(false);
    });
  });

  describe('deleteBidRequestProject', () => {
    it('should delete project successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Project deleted successfully',
        }),
      });

      const result = await deleteBidRequestProject('project-123', 'buyer-456');
      expect(result.success).toBe(true);
    });

    it('should prevent non-owner from deleting project', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only delete your own projects' },
        }),
      });

      const result = await deleteBidRequestProject('project-123', 'wrong-buyer');
      expect(result.success).toBe(false);
    });

    it('should handle non-existent project deletion', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        }),
      });

      const result = await deleteBidRequestProject('non-existent', 'buyer-123');
      expect(result.success).toBe(false);
    });

    it('should handle network error during deletion', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await deleteBidRequestProject('project-123', 'buyer-456');
      expect(result.success).toBe(false);
    });
  });

  describe('incrementBidCount', () => {
    it('should increment bid count successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          message: 'Bids count incremented',
        }),
      });

      const result = await incrementBidCount('project-123');
      expect(result.success).toBe(true);
    });

    it('should handle non-existent project', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        }),
      });

      const result = await incrementBidCount('non-existent');
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle project with special characters in title', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'special-chars-project' },
        }),
      });

      const result = await createBidRequestProject({
        buyerId: 'buyer-special',
        buyerEmail: 'special@example.com',
        title: 'Project with "quotes" & <brackets> and emoji 🚀',
        description: 'Description with special chars < > " \' & @ # $ %',
        budgetMin: 1000,
        budgetMax: 5000,
        skills: ['C++', 'C#', '.NET'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle very large budget values', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'large-budget-project' },
        }),
      });

      const result = await createBidRequestProject({
        buyerId: 'buyer-large',
        buyerEmail: 'large@example.com',
        title: 'Large Budget Project',
        description: 'Enterprise level project',
        budgetMin: 1000000,
        budgetMax: 9999999,
        skills: ['Enterprise'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle very long description', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'long-desc-project' },
        }),
      });

      const result = await createBidRequestProject({
        buyerId: 'buyer-long',
        buyerEmail: 'long@example.com',
        title: 'Project with Long Description',
        description: 'A'.repeat(2000), // Very long description
        budgetMin: 1000,
        budgetMax: 5000,
        skills: ['JavaScript'],
      });

      expect(result.success).toBe(true);
    });

    it('should handle concurrent project creations', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: { projectId: `concurrent-project-${i}` },
          }),
        });

        promises.push(
          createBidRequestProject({
            buyerId: `buyer-${i}`,
            buyerEmail: `buyer${i}@example.com`,
            title: `Concurrent Project ${i}`,
            description: 'Concurrent project description',
            budgetMin: 1000 + i * 100,
            budgetMax: 5000 + i * 100,
            skills: ['JavaScript', 'React'],
          })
        );
      }

      const results = await Promise.all(promises);
      results.forEach(result => expect(result.success).toBe(true));
    });

    it('should handle unicode in project data', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { projectId: 'unicode-project' },
        }),
      });

      const result = await createBidRequestProject({
        buyerId: 'buyer-unicode',
        buyerEmail: 'unicode@example.com',
        title: 'プロジェクト - 项目 - مشروع',
        description: '日本語の説明、中文描述、وصف عربي',
        buyerName: '田中太郎',
        budgetMin: 1000,
        budgetMax: 5000,
        skills: ['JavaScript'],
      });

      expect(result.success).toBe(true);
    });
  });
});
