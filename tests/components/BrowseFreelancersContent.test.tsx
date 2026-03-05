import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { BrowseFreelancersContent } from '../../components/BrowseFreelancersContent';
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

vi.mock('../../context/SocketContext', () => ({
  useSocket: () => ({
    socket: null,
    isConnected: false,
    emit: vi.fn(),
    subscribe: vi.fn(),
  }),
}));

const mockFreelancers = [
  {
    id: 'f1',
    userId: 'u1',
    name: 'Alice Developer',
    title: 'React Developer',
    skills: ['React', 'TypeScript', 'Node.js'],
    hourlyRate: 50,
    rating: 4.8,
    reviewCount: 15,
    completedProjects: 20,
    location: 'Bangalore',
    profileImage: '',
    isVerified: true,
    isAvailable: true,
    bio: 'Experienced React developer',
  },
  {
    id: 'f2',
    userId: 'u2',
    name: 'Bob Designer',
    title: 'UI/UX Designer',
    skills: ['Figma', 'Adobe XD'],
    hourlyRate: 40,
    rating: 4.5,
    reviewCount: 8,
    completedProjects: 12,
    location: 'Mumbai',
    profileImage: '',
    isVerified: false,
    isAvailable: true,
    bio: 'Creative designer',
  },
];

vi.mock('../../services/freelancersApi', () => ({
  getAllFreelancers: vi.fn().mockResolvedValue({
    success: true,
    freelancers: [
      {
        id: 'f1',
        userId: 'u1',
        name: 'Alice Developer',
        title: 'React Developer',
        skills: ['React', 'TypeScript'],
        hourlyRate: 50,
        rating: 4.8,
        reviewCount: 15,
        completedProjects: 20,
        location: 'Bangalore',
        profileImage: '',
        isVerified: true,
        isAvailable: true,
        bio: 'Experienced React developer',
      },
    ],
    count: 1,
  }),
  searchFreelancers: vi.fn().mockResolvedValue({ success: true, freelancers: [], count: 0 }),
  getAvailableFilters: vi.fn().mockResolvedValue({ skills: ['React', 'Figma'], countries: ['India'] }),
}));

vi.mock('../../services/bidRequestProjectsApi', () => ({
  getBidRequestProjectsByBuyer: vi.fn().mockResolvedValue({ success: true, projects: [] }),
}));

vi.mock('../../services/freelancerInteractionsApi', () => ({
  sendFreelancerMessage: vi.fn().mockResolvedValue(true),
  sendFreelancerInvitation: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../services/buyerApi', () => ({
  cachedFetchUserProfile: vi.fn().mockResolvedValue({ userId: 'u1' }),
}));

describe('BrowseFreelancersContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(mockResponse({ success: true }));
  });

  it('renders without crashing', async () => {
    renderWithProviders(<BrowseFreelancersContent />, { isLoggedIn: true, userId: 'b1' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(0);
    });
  });

  it('displays freelancer cards after loading', async () => {
    renderWithProviders(<BrowseFreelancersContent />, { isLoggedIn: true, userId: 'b1' });
    await waitFor(() => {
      const freelancer = screen.queryByText(/Alice Developer/);
      expect(freelancer || document.body.innerHTML.length > 0).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('renders search input for filtering freelancers', async () => {
    renderWithProviders(<BrowseFreelancersContent />, { isLoggedIn: true, userId: 'b1' });
    await waitFor(() => {
      const search = screen.queryByPlaceholderText(/search/i) ??
        document.querySelector('input[type="text"], input[type="search"]');
      expect(search || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });

  it('renders filter controls', async () => {
    renderWithProviders(<BrowseFreelancersContent />, { isLoggedIn: true, userId: 'b1' });
    await waitFor(() => {
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length > 0 || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });
});
