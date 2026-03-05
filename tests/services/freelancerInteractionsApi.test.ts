import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendFreelancerMessage,
  sendFreelancerInvitation,
  addFreelancerReview,
  getFreelancerReviews,
  getUserInteractions,
  getSentInteractions,
  getConversation,
  updateInteractionStatus,
} from '../../services/freelancerInteractionsApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);

describe('freelancerInteractionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendFreelancerMessage', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: { interactionId: 'i1' } })
      );
      const result = await sendFreelancerMessage('u1', 'u2', 'Hello!');
      expect(result).toBe(true);
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: false, error: { code: 'ERR', message: 'Failed' } })
      );
      await expect(sendFreelancerMessage('u1', 'u2', 'Hello!')).rejects.toThrow('Failed');
    });

    it('throws on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(sendFreelancerMessage('u1', 'u2', 'Hello!')).rejects.toThrow();
    });
  });

  describe('sendFreelancerInvitation', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: { interactionId: 'i2' } })
      );
      const result = await sendFreelancerInvitation('u1', 'u2', 'p1', 'Join my project');
      expect(result).toBe(true);
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: false, error: { code: 'ERR', message: 'Invitation failed' } })
      );
      await expect(sendFreelancerInvitation('u1', 'u2', 'p1', 'Join')).rejects.toThrow('Invitation failed');
    });
  });

  describe('addFreelancerReview', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: { interactionId: 'i3' } })
      );
      const result = await addFreelancerReview('u1', 'Reviewer', undefined, 'f1', 5, 'Great work!');
      expect(result).toBe(true);
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: false, error: { code: 'ERR', message: 'Review failed' } })
      );
      await expect(addFreelancerReview('u1', 'Reviewer', undefined, 'f1', 5, 'Great')).rejects.toThrow();
    });
  });

  describe('getFreelancerReviews', () => {
    it('returns reviews data on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: {
            reviews: [
              { interactionId: 'i1', type: 'review', senderId: 'u1', content: 'Great!', createdAt: '2024-01-01', rating: 5 },
            ],
            count: 1,
            averageRating: 5,
          },
        })
      );
      const result = await getFreelancerReviews('f1');
      expect(result.reviews).toHaveLength(1);
      expect(result.averageRating).toBe(5);
    });

    it('returns empty data on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await getFreelancerReviews('f1');
      expect(result.reviews).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('returns empty data on API failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: false, error: { code: 'ERR', message: 'Not found' } })
      );
      const result = await getFreelancerReviews('f1');
      expect(result.reviews).toEqual([]);
    });
  });

  describe('getUserInteractions', () => {
    it('returns interactions on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: {
            interactions: [
              { interactionId: 'i1', type: 'message', senderId: 'u2', content: 'Hi', createdAt: '2024-01-01' },
            ],
            count: 1,
          },
        })
      );
      const result = await getUserInteractions('u1');
      expect(result.interactions).toHaveLength(1);
    });

    it('returns empty data on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await getUserInteractions('u1');
      expect(result.interactions).toEqual([]);
    });
  });

  describe('getSentInteractions', () => {
    it('returns sent interactions on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: { interactions: [], count: 0 } })
      );
      const result = await getSentInteractions('u1');
      expect(result.interactions).toEqual([]);
    });
  });

  describe('getConversation', () => {
    it('returns messages on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: { messages: [{ interactionId: 'i1', type: 'message', senderId: 'u1', content: 'Hello', createdAt: '2024-01-01' }], count: 1 },
        })
      );
      const result = await getConversation('u1', 'u2');
      expect(result.messages).toHaveLength(1);
    });

    it('returns empty messages on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await getConversation('u1', 'u2');
      expect(result.messages).toEqual([]);
    });
  });

  describe('updateInteractionStatus', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await updateInteractionStatus('i1', 'read');
      expect(result).toBe(true);
    });

    it('throws on failure', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: false, error: { code: 'ERR', message: 'Update failed' } })
      );
      await expect(updateInteractionStatus('i1', 'accepted')).rejects.toThrow();
    });
  });
});
