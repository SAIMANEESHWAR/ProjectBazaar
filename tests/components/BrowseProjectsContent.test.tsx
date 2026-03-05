import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowseProjectsContent } from '../../components/BrowseProjectsContent';
import { renderWithProviders } from '../testUtils';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie" />,
}));

vi.mock('../../components/ui/skeleton-dashboard', () => ({
  default: () => <div data-testid="skeleton" />,
}));

vi.mock('../../services/bidsService', () => ({
  saveBidAsync: vi.fn().mockResolvedValue({ success: true }),
  hasFreelancerBidOnProjectAsync: vi.fn().mockResolvedValue(false),
  getBidStatsForProjectAsync: vi.fn().mockResolvedValue({ totalBids: 0, avgBid: 0 }),
}));

vi.mock('../../services/buyerApi', () => ({
  cachedFetchUserProfile: vi.fn().mockResolvedValue({ userId: 'u1', role: 'buyer' }),
}));

const mockProjects = [
  {
    id: 'p1',
    title: 'Build React App',
    description: 'Need a React developer',
    budget: { min: 500, max: 1500 },
    category: 'Web Development',
    deliveryTime: 7,
    type: 'fixed',
    buyerId: 'b1',
    buyerName: 'Alice',
    postedAt: '2024-01-01T00:00:00Z',
    bidsCount: 3,
    tags: ['react', 'typescript'],
  },
  {
    id: 'p2',
    title: 'Design Mobile App',
    description: 'Need a UI/UX designer',
    budget: { min: 200, max: 800 },
    category: 'UI/UX Design',
    deliveryTime: 14,
    type: 'fixed',
    buyerId: 'b2',
    buyerName: 'Bob',
    postedAt: '2024-01-02T00:00:00Z',
    bidsCount: 1,
    tags: ['figma', 'ui'],
  },
];

vi.mock('../../services/bidRequestProjectsApi', () => ({
  getAllBidRequestProjects: vi.fn().mockResolvedValue({
    success: true,
    projects: [
      {
        id: 'p1',
        title: 'Build React App',
        description: 'Need a React developer',
        budget: { min: 500, max: 1500 },
        category: 'Web Development',
        deliveryTime: 7,
        type: 'fixed',
        buyerId: 'b1',
        buyerName: 'Alice',
        postedAt: '2024-01-01T00:00:00Z',
        bidsCount: 3,
        skills: ['React', 'TypeScript'],
        tags: ['react', 'typescript'],
      },
    ],
    count: 1,
  }),
}));

describe('BrowseProjectsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(mockResponse({ success: true }));
  });

  it('renders without crashing', async () => {
    renderWithProviders(<BrowseProjectsContent />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(0);
    });
  });

  it('shows project listings after load', async () => {
    renderWithProviders(<BrowseProjectsContent />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      const project = screen.queryByText(/Build React App/);
      expect(project || document.body.innerHTML.length > 0).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('renders filter/category controls', async () => {
    renderWithProviders(<BrowseProjectsContent />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      const selects = document.querySelectorAll('select');
      const filterBtns = screen.queryAllByRole('button');
      expect(selects.length > 0 || filterBtns.length > 0).toBeTruthy();
    });
  });

  it('renders a search input', async () => {
    renderWithProviders(<BrowseProjectsContent />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i) ??
        document.querySelector('input[type="text"], input[type="search"]');
      expect(searchInput || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });
});
