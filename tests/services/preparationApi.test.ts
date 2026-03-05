import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prepAdminApi, prepUserApi } from '../../services/preparationApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);

// Mock localStorage for getUserId
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    length: 0,
    key: vi.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('preparationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('prepAdminApi.listContent', () => {
    it('returns paginated content on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          items: [{ id: 'q1', title: 'Question 1' }],
          total: 1,
          page: 1,
          totalPages: 1,
          limit: 50,
        })
      );
      const result = await prepAdminApi.listContent('interview_questions');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('returns empty list on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await prepAdminApi.listContent('dsa_problems');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('prepAdminApi.getContent', () => {
    it('returns content item on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, item: { id: 'q1', title: 'Question 1' } })
      );
      const result = await prepAdminApi.getContent('interview_questions', 'q1');
      expect(result).not.toBeNull();
    });

    it('returns null on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));
      const result = await prepAdminApi.getContent('interview_questions', 'q1');
      expect(result).toBeNull();
    });
  });

  describe('prepAdminApi.putContent', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await prepAdminApi.putContent('interview_questions', [{ id: 'q1', title: 'Q1' }]);
      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));
      const result = await prepAdminApi.putContent('quizzes', [{ id: 'q1' }]);
      expect(result).toBe(false);
    });
  });

  describe('prepAdminApi.deleteContent', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await prepAdminApi.deleteContent('dsa_problems', 'q1');
      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));
      const result = await prepAdminApi.deleteContent('dsa_problems', 'q1');
      expect(result).toBe(false);
    });
  });

  describe('prepAdminApi.getContentStats', () => {
    it('returns stats map on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, counts: { interview_questions: 10, dsa_problems: 5 } })
      );
      const result = await prepAdminApi.getContentStats();
      expect(result.interview_questions).toBe(10);
    });

    it('returns empty object on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Error'));
      const result = await prepAdminApi.getContentStats();
      expect(result).toEqual({});
    });
  });

  describe('prepUserApi.getProgress', () => {
    it('returns empty map when no userId in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = await prepUserApi.getProgress('interview_questions');
      expect(result).toEqual({});
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns progress map when userId exists', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ userId: 'u1' }));
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, progress: { 'q1': { isSolved: true, isBookmarked: false, isFavorite: false, isApplied: false } } })
      );
      const result = await prepUserApi.getProgress();
      expect(result['q1']?.isSolved).toBe(true);
    });
  });

  describe('prepUserApi.getStats', () => {
    it('returns null when no userId', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = await prepUserApi.getStats();
      expect(result).toBeNull();
    });

    it('returns stats when userId exists', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ userId: 'u1' }));
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          stats: {
            userId: 'u1',
            solvedQuestions: 5,
            solvedDSA: 2,
            completedQuizzes: 1,
            streak: 3,
            longestStreak: 7,
            lastActiveDate: '2024-01-01',
            totalStudyMinutes: 120,
            quizAverageScore: 85,
          },
        })
      );
      const result = await prepUserApi.getStats();
      expect(result?.solvedQuestions).toBe(5);
    });
  });

  describe('prepUserApi.listCollections', () => {
    it('returns empty array when no userId', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = await prepUserApi.listCollections();
      expect(result).toEqual([]);
    });

    it('returns collections list', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ userId: 'u1' }));
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, collections: [{ collectionId: 'c1', name: 'My DSA' }] })
      );
      const result = await prepUserApi.listCollections();
      expect(result).toHaveLength(1);
    });
  });

  describe('prepUserApi.getQuizHistory', () => {
    it('returns empty array when no userId', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      const result = await prepUserApi.getQuizHistory();
      expect(result).toEqual([]);
    });

    it('returns quiz history', async () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({ userId: 'u1' }));
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          history: [{ resultId: 'r1', quizId: 'q1', score: 80, passed: true }],
        })
      );
      const result = await prepUserApi.getQuizHistory();
      expect(result).toHaveLength(1);
    });
  });
});
