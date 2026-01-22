import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveBidAsync,
  getBidsByProjectIdAsync,
  getBidsByFreelancerIdAsync,
  updateBidAsync,
  deleteBidAsync,
  hasFreelancerBidOnProjectAsync,
  getFreelancerBidOnProjectAsync,
  acceptBid,
  rejectBid,
  getAllBids,
  getBidsByProjectId,
  hasFreelancerBidOnProject,
  getBidCountForProject,
} from '../../services/bidsService';
import type { Bid, BidFormData } from '../../types/bids';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Bids Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('saveBidAsync', () => {
    const validBidData: BidFormData = {
      bidAmount: 1000,
      currency: 'INR',
      deliveryTime: 7,
      deliveryTimeUnit: 'days',
      proposal: 'This is a test proposal that is definitely more than 100 characters long to meet the minimum requirement for a valid proposal submission.',
    };

    it('should successfully create a bid via API', async () => {
      const mockResponse = {
        success: true,
        data: {
          bidId: 'test-bid-123',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse),
      });

      // Mock incrementBidCount call
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const result = await saveBidAsync(
        validBidData,
        'project-123',
        'freelancer-456',
        'John Doe',
        'john@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.bid).toBeDefined();
      expect(result.bid?.projectId).toBe('project-123');
      expect(result.bid?.freelancerId).toBe('freelancer-456');
      expect(mockFetch).toHaveBeenCalledTimes(2); // CREATE_BID + INCREMENT_BIDS_COUNT
    });

    it('should fallback to localStorage when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await saveBidAsync(
        validBidData,
        'project-123',
        'freelancer-456',
        'John Doe',
        'john@example.com'
      );

      expect(result.success).toBe(true);
      expect(result.bid).toBeDefined();
      // Error message contains either 'locally' or the actual error message
      expect(result.error).toBeDefined();
    });

    it('should save bid to localStorage as backup', async () => {
      const mockResponse = {
        success: true,
        data: {
          bidId: 'test-bid-123',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      });

      await saveBidAsync(
        validBidData,
        'project-123',
        'freelancer-456',
        'John Doe',
        'john@example.com'
      );

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should handle bid with minimum valid data', async () => {
      const minimalBidData: BidFormData = {
        bidAmount: 1,
        currency: 'USD',
        deliveryTime: 1,
        deliveryTimeUnit: 'hours',
        proposal: 'A'.repeat(100), // Minimum 100 characters
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: {
            bidId: 'test-bid-min',
            status: 'pending',
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      const result = await saveBidAsync(
        minimalBidData,
        'project-min',
        'freelancer-min',
        'Test User',
        'test@test.com'
      );

      expect(result.success).toBe(true);
    });

    it('should handle large bid amounts', async () => {
      const largeBidData: BidFormData = {
        ...validBidData,
        bidAmount: 9999999.99,
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: {
            bidId: 'test-bid-large',
            status: 'pending',
            submittedAt: new Date().toISOString(),
          },
        }),
      });

      const result = await saveBidAsync(
        largeBidData,
        'project-large',
        'freelancer-large',
        'Big Spender',
        'big@spender.com'
      );

      expect(result.success).toBe(true);
      expect(result.bid?.bidAmount).toBe(9999999.99);
    });

    it('should handle all delivery time units', async () => {
      const units: Array<'hours' | 'days' | 'weeks' | 'months'> = ['hours', 'days', 'weeks', 'months'];
      
      for (const unit of units) {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: {
              bidId: `test-bid-${unit}`,
              status: 'pending',
              submittedAt: new Date().toISOString(),
            },
          }),
        });
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true }),
        });

        const result = await saveBidAsync(
          { ...validBidData, deliveryTimeUnit: unit },
          `project-${unit}`,
          `freelancer-${unit}`,
          'Test User',
          'test@test.com'
        );

        expect(result.success).toBe(true);
        expect(result.bid?.deliveryTimeUnit).toBe(unit);
      }
    });
  });

  describe('getBidsByProjectIdAsync', () => {
    it('should fetch bids for a project from API', async () => {
      const mockBids = [
        {
          id: 'bid-1',
          projectId: 'project-123',
          freelancerId: 'freelancer-1',
          freelancerName: 'Alice',
          freelancerEmail: 'alice@example.com',
          bidAmount: 500,
          currency: 'INR',
          deliveryTime: 5,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bids: mockBids, count: 1 },
        }),
      });

      const result = await getBidsByProjectIdAsync('project-123');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-123');
    });

    it('should fallback to localStorage when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      // Set up localStorage with mock data
      const localBids = [
        {
          id: 'local-bid-1',
          projectId: 'project-123',
          freelancerId: 'freelancer-local',
          freelancerName: 'Local User',
          freelancerEmail: 'local@example.com',
          bidAmount: 300,
          currency: 'INR',
          deliveryTime: 3,
          deliveryTimeUnit: 'days',
          proposal: 'Local proposal',
          status: 'pending',
          submittedAt: new Date().toISOString(),
        },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(localBids));

      const result = await getBidsByProjectIdAsync('project-123');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for project with no bids', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bids: [], count: 0 },
        }),
      });

      const result = await getBidsByProjectIdAsync('project-no-bids');
      expect(result).toHaveLength(0);
    });
  });

  describe('getBidsByFreelancerIdAsync', () => {
    it('should fetch all bids by a specific freelancer', async () => {
      const mockBids = [
        { id: 'bid-1', projectId: 'project-1', freelancerId: 'freelancer-456' },
        { id: 'bid-2', projectId: 'project-2', freelancerId: 'freelancer-456' },
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bids: mockBids, count: 2 },
        }),
      });

      const result = await getBidsByFreelancerIdAsync('freelancer-456');
      expect(result).toHaveLength(2);
    });

    it('should return empty array for freelancer with no bids', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bids: [], count: 0 },
        }),
      });

      const result = await getBidsByFreelancerIdAsync('new-freelancer');
      expect(result).toHaveLength(0);
    });
  });

  describe('updateBidAsync', () => {
    it('should update bid status to accepted', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bidId: 'bid-123', status: 'accepted' },
        }),
      });

      const result = await updateBidAsync('bid-123', { status: 'accepted' });
      expect(result.success).toBe(true);
    });

    it('should update bid status to rejected', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bidId: 'bid-123', status: 'rejected' },
        }),
      });

      const result = await updateBidAsync('bid-123', { status: 'rejected' });
      expect(result.success).toBe(true);
    });

    it('should handle API failure during update', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'UPDATE_FAILED', message: 'Failed to update' },
        }),
      });

      const result = await updateBidAsync('bid-123', { status: 'accepted' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteBidAsync', () => {
    it('should delete a bid successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      });

      const result = await deleteBidAsync('bid-123', 'freelancer-456');
      expect(result.success).toBe(true);
    });

    it('should prevent deleting another user\'s bid', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only delete your own bids' },
        }),
      });

      const result = await deleteBidAsync('bid-123', 'wrong-freelancer');
      expect(result.success).toBe(false);
      expect(result.error).toContain('delete');
    });

    it('should handle non-existent bid deletion', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Bid not found' },
        }),
      });

      const result = await deleteBidAsync('non-existent-bid', 'freelancer-123');
      expect(result.success).toBe(false);
    });
  });

  describe('hasFreelancerBidOnProjectAsync', () => {
    it('should return true when freelancer has bid on project', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { hasBid: true, bid: { id: 'bid-123' } },
        }),
      });

      const result = await hasFreelancerBidOnProjectAsync('freelancer-123', 'project-456');
      expect(result).toBe(true);
    });

    it('should return false when freelancer has not bid on project', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { hasBid: false, bid: null },
        }),
      });

      const result = await hasFreelancerBidOnProjectAsync('freelancer-123', 'project-789');
      expect(result).toBe(false);
    });
  });

  describe('getFreelancerBidOnProjectAsync', () => {
    it('should return the bid when it exists', async () => {
      const mockBid = {
        id: 'bid-123',
        projectId: 'project-456',
        freelancerId: 'freelancer-123',
        bidAmount: 1000,
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { hasBid: true, bid: mockBid },
        }),
      });

      const result = await getFreelancerBidOnProjectAsync('freelancer-123', 'project-456');
      expect(result).toBeDefined();
      expect(result?.id).toBe('bid-123');
    });

    it('should return null when bid does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { hasBid: false, bid: null },
        }),
      });

      const result = await getFreelancerBidOnProjectAsync('freelancer-123', 'project-789');
      expect(result).toBeNull();
    });
  });

  describe('acceptBid / rejectBid', () => {
    it('should accept a bid successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bidId: 'bid-123', status: 'accepted' },
        }),
      });

      const result = await acceptBid('bid-123');
      expect(result.success).toBe(true);
    });

    it('should reject a bid successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { bidId: 'bid-123', status: 'rejected' },
        }),
      });

      const result = await rejectBid('bid-123');
      expect(result.success).toBe(true);
    });
  });

  describe('Local Storage Functions', () => {
    it('getAllBids should return bids from localStorage', () => {
      const mockBids: Bid[] = [
        {
          id: 'bid-1',
          projectId: 'project-1',
          freelancerId: 'freelancer-1',
          freelancerName: 'Test',
          freelancerEmail: 'test@test.com',
          bidAmount: 100,
          currency: 'INR',
          deliveryTime: 5,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal',
          submittedAt: new Date().toISOString(),
        },
      ];

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockBids));
      
      const result = getAllBids();
      expect(Array.isArray(result)).toBe(true);
    });

    it('getBidsByProjectId should filter bids by project', () => {
      const mockBids: Bid[] = [
        {
          id: 'bid-1',
          projectId: 'project-1',
          freelancerId: 'freelancer-1',
          freelancerName: 'Test',
          freelancerEmail: 'test@test.com',
          bidAmount: 100,
          currency: 'INR',
          deliveryTime: 5,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal',
          submittedAt: new Date().toISOString(),
        },
        {
          id: 'bid-2',
          projectId: 'project-2',
          freelancerId: 'freelancer-2',
          freelancerName: 'Test 2',
          freelancerEmail: 'test2@test.com',
          bidAmount: 200,
          currency: 'INR',
          deliveryTime: 10,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal 2',
          submittedAt: new Date().toISOString(),
        },
      ];

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockBids));
      
      const result = getBidsByProjectId('project-1');
      expect(result.every(bid => bid.projectId === 'project-1')).toBe(true);
    });

    it('hasFreelancerBidOnProject should check local bids', () => {
      const mockBids: Bid[] = [
        {
          id: 'bid-1',
          projectId: 'project-1',
          freelancerId: 'freelancer-1',
          freelancerName: 'Test',
          freelancerEmail: 'test@test.com',
          bidAmount: 100,
          currency: 'INR',
          deliveryTime: 5,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal',
          submittedAt: new Date().toISOString(),
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBids));
      
      const hasExistingBid = hasFreelancerBidOnProject('freelancer-1', 'project-1');
      expect(hasExistingBid).toBe(true);

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockBids));
      const noExistingBid = hasFreelancerBidOnProject('freelancer-999', 'project-1');
      expect(noExistingBid).toBe(false);
    });

    it('getBidCountForProject should return correct count', () => {
      const mockBids: Bid[] = [
        { id: 'bid-1', projectId: 'project-1', freelancerId: 'f1', freelancerName: 'Test', freelancerEmail: 'test@test.com', bidAmount: 100, currency: 'INR', deliveryTime: 5, deliveryTimeUnit: 'days', proposal: 'Test', submittedAt: new Date().toISOString() },
        { id: 'bid-2', projectId: 'project-1', freelancerId: 'f2', freelancerName: 'Test 2', freelancerEmail: 'test2@test.com', bidAmount: 200, currency: 'INR', deliveryTime: 10, deliveryTimeUnit: 'days', proposal: 'Test', submittedAt: new Date().toISOString() },
        { id: 'bid-3', projectId: 'project-2', freelancerId: 'f3', freelancerName: 'Test 3', freelancerEmail: 'test3@test.com', bidAmount: 300, currency: 'INR', deliveryTime: 15, deliveryTimeUnit: 'days', proposal: 'Test', submittedAt: new Date().toISOString() },
      ];

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockBids));
      
      const count = getBidCountForProject('project-1');
      expect(count).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in proposal', async () => {
      const specialProposal: BidFormData = {
        bidAmount: 100,
        currency: 'INR',
        deliveryTime: 5,
        deliveryTimeUnit: 'days',
        proposal: 'Test with special chars: <script>alert("xss")</script> & "quotes" and emoji 🚀 ' + 'A'.repeat(50),
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: { bidId: 'special-bid', status: 'pending', submittedAt: new Date().toISOString() },
        }),
      });

      const result = await saveBidAsync(
        specialProposal,
        'project-special',
        'freelancer-special',
        'User <script>',
        'email@example.com'
      );

      expect(result.success).toBe(true);
    });

    it('should handle very long proposal text', async () => {
      const longProposal: BidFormData = {
        bidAmount: 100,
        currency: 'INR',
        deliveryTime: 5,
        deliveryTimeUnit: 'days',
        proposal: 'A'.repeat(5000), // Very long proposal
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({
          success: true,
          data: { bidId: 'long-bid', status: 'pending', submittedAt: new Date().toISOString() },
        }),
      });

      const result = await saveBidAsync(
        longProposal,
        'project-long',
        'freelancer-long',
        'User Long',
        'long@example.com'
      );

      expect(result.success).toBe(true);
    });

    it('should handle concurrent bids from different freelancers', async () => {
      const bidPromises = [];

      for (let i = 0; i < 5; i++) {
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({
            success: true,
            data: { bidId: `bid-${i}`, status: 'pending', submittedAt: new Date().toISOString() },
          }),
        });
        mockFetch.mockResolvedValueOnce({
          json: () => Promise.resolve({ success: true }),
        });

        bidPromises.push(
          saveBidAsync(
            {
              bidAmount: 100 + i * 50,
              currency: 'INR',
              deliveryTime: 5 + i,
              deliveryTimeUnit: 'days',
              proposal: 'Concurrent bid proposal ' + 'A'.repeat(80),
            },
            'project-concurrent',
            `freelancer-${i}`,
            `Freelancer ${i}`,
            `freelancer${i}@example.com`
          )
        );
      }

      const results = await Promise.all(bidPromises);
      results.forEach(result => expect(result.success).toBe(true));
    });

    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await saveBidAsync(
        {
          bidAmount: 100,
          currency: 'INR',
          deliveryTime: 5,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal for timeout scenario ' + 'A'.repeat(60),
        },
        'project-timeout',
        'freelancer-timeout',
        'Timeout User',
        'timeout@example.com'
      );

      // Should fallback to local storage and still succeed
      expect(result.success).toBe(true);
      expect(result.bid).toBeDefined();
      // Error may contain the actual error message or 'locally' depending on the catch path
      expect(result.error).toBeDefined();
    });

    it('should handle malformed API response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false }),
      });

      const result = await saveBidAsync(
        {
          bidAmount: 100,
          currency: 'INR',
          deliveryTime: 5,
          deliveryTimeUnit: 'days',
          proposal: 'Test proposal for malformed response ' + 'A'.repeat(55),
        },
        'project-malformed',
        'freelancer-malformed',
        'Malformed User',
        'malformed@example.com'
      );

      // Should fallback to local storage
      expect(result.success).toBe(true);
    });

    it('should handle empty localStorage', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      
      const result = getAllBids();
      expect(result).toEqual([]);
    });

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json {{{');
      
      const result = getAllBids();
      expect(result).toEqual([]);
    });
  });
});
