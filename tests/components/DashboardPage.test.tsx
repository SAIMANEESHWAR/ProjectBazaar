import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import DashboardPage from '../../components/DashboardPage';
import { renderWithProviders } from '../testUtils';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);

// Mock heavy sub-components
vi.mock('../../components/DashboardContent', () => ({
  default: () => <div data-testid="dashboard-content">Dashboard Content</div>,
}));

vi.mock('../../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../../components/DashboardFilters', () => ({
  default: () => <div data-testid="filters">Filters</div>,
}));

vi.mock('../../components/DashboardHeader', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie" />,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(
      mockResponse({
        success: true,
        projects: [],
        data: { userId: 'u1', wishlist: [], cart: [] },
      })
    );
  });

  it('renders without crashing', async () => {
    renderWithProviders(<DashboardPage />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(0);
    });
  });

  it('renders the sidebar', async () => {
    renderWithProviders(<DashboardPage />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
  });

  it('renders the main dashboard content area', async () => {
    renderWithProviders(<DashboardPage />, { isLoggedIn: true, userId: 'u1' });
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
  });
});
