import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchUserData,
  fetchProjectDetails,
  likeProject,
  unlikeProject,
  addToCart,
  removeFromCart,
  purchaseProject,
  reportProject,
  createPaymentIntent,
  fetchHackathons,
  getPurchasedCourses,
} from '../../services/buyerApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true, status = 200) =>
  Promise.resolve({
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);

describe('buyerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUserData', () => {
    it('returns user data on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          success: true,
          data: {
            userId: 'u1',
            email: 'test@example.com',
            wishlist: ['p1'],
            cart: [],
            purchases: [],
          },
        })
      );
      const result = await fetchUserData('u1');
      expect(result).not.toBeNull();
      expect(result?.userId).toBe('u1');
      expect(result?.email).toBe('test@example.com');
    });

    it('returns null when API response success is false', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: false }));
      const result = await fetchUserData('u1');
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchUserData('u1');
      expect(result).toBeNull();
    });

    it('returns null on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({}, false, 500));
      const result = await fetchUserData('u1');
      expect(result).toBeNull();
    });
  });

  describe('fetchProjectDetails', () => {
    it('returns project details on success', async () => {
      const project = {
        projectId: 'p1',
        title: 'Test Project',
        price: 500,
        category: 'Web',
        description: 'A test project',
        tags: ['react'],
        thumbnailUrl: '',
        sellerId: 's1',
        sellerEmail: 'seller@test.com',
        status: 'active',
        uploadedAt: '2024-01-01',
      };
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, data: project }));
      const result = await fetchProjectDetails('p1');
      expect(result?.projectId).toBe('p1');
      expect(result?.title).toBe('Test Project');
    });

    it('returns null when success is false', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: false }));
      const result = await fetchProjectDetails('p1');
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));
      const result = await fetchProjectDetails('p1');
      expect(result).toBeNull();
    });
  });

  describe('likeProject', () => {
    it('returns success response and calls update counters', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ success: true, message: 'Liked' }))
        .mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await likeProject('u1', 'p1');
      expect(result.success).toBe(true);
    });

    it('returns failure on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await likeProject('u1', 'p1');
      expect(result.success).toBe(false);
    });
  });

  describe('unlikeProject', () => {
    it('returns success response', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ success: true }))
        .mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await unlikeProject('u1', 'p1');
      expect(result.success).toBe(true);
    });
  });

  describe('addToCart', () => {
    it('returns success response', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ success: true }))
        .mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await addToCart('u1', 'p1');
      expect(result.success).toBe(true);
    });

    it('returns failure on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await addToCart('u1', 'p1');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to add to cart');
    });
  });

  describe('removeFromCart', () => {
    it('returns success response', async () => {
      mockFetch
        .mockResolvedValueOnce(mockResponse({ success: true }))
        .mockResolvedValueOnce(mockResponse({ success: true }));
      const result = await removeFromCart('u1', 'p1');
      expect(result.success).toBe(true);
    });
  });

  describe('purchaseProject', () => {
    it('returns success response on purchase', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, message: 'Purchase complete' }));
      const result = await purchaseProject('u1', 'p1', 500, 'pay_123');
      expect(result.success).toBe(true);
    });

    it('returns failure on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await purchaseProject('u1', 'p1', 500, 'pay_123');
      expect(result.success).toBe(false);
    });
  });

  describe('reportProject', () => {
    it('returns success on valid report', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, data: { reportId: 'r1', status: 'pending' } })
      );
      const result = await reportProject({
        buyerId: 'u1',
        projectId: 'p1',
        reason: 'Spam',
        description: 'This is spam',
      });
      expect(result.success).toBe(true);
    });

    it('returns failure on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await reportProject({
        buyerId: 'u1',
        projectId: 'p1',
        reason: 'Spam',
        description: 'This is spam',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('createPaymentIntent', () => {
    it('returns order ID on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, razorpayOrderId: 'order_123', amount: 50000, currency: 'INR' })
      );
      const result = await createPaymentIntent({ userId: 'u1', projectIds: ['p1'], totalAmount: 500 });
      expect(result.success).toBe(true);
      expect(result.razorpayOrderId).toBe('order_123');
    });

    it('returns failure on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Invalid request' }, false, 400));
      const result = await createPaymentIntent({ userId: 'u1', projectIds: ['p1'], totalAmount: 500 });
      expect(result.success).toBe(false);
    });
  });

  describe('fetchHackathons', () => {
    it('returns hackathons list on success', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({
          hackathons: [
            {
              PK: 'h1',
              post_link: 'https://unstop.com/hackathons/test-hack-123',
              location: 'Online',
              created_at: 1700000000,
              end_date: null,
              start_date: null,
              status: 'live',
              image_link: null,
              type: 'online',
            },
          ],
          count: 1,
        })
      );
      const result = await fetchHackathons();
      expect(result.success).toBe(true);
      expect(result.data?.hackathons).toHaveLength(1);
    });

    it('returns error on non-OK response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ message: 'Server error' }, false, 500));
      const result = await fetchHackathons();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVER_ERROR');
    });

    it('returns error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchHackathons();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
    });
  });

  describe('getPurchasedCourses', () => {
    it('returns purchased courses list', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ success: true, purchasedCourses: [], count: 0 })
      );
      const result = await getPurchasedCourses('u1');
      expect(result.success).toBe(true);
    });

    it('returns failure on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await getPurchasedCourses('u1');
      expect(result.success).toBe(false);
    });
  });
});
