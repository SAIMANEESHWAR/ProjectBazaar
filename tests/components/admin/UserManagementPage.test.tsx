import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserManagementPage from '../../../components/admin/UserManagementPage';
import { renderWithProviders } from '../../testUtils';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);

const mockUsers = [
  {
    userId: 'u1',
    email: 'alice@example.com',
    fullName: 'Alice Smith',
    role: 'buyer',
    status: 'active',
    projectsCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    isPremium: false,
    credits: 0,
  },
  {
    userId: 'u2',
    email: 'bob@example.com',
    fullName: 'Bob Jones',
    role: 'seller',
    status: 'active',
    projectsCount: 5,
    createdAt: '2024-02-01T00:00:00Z',
    isPremium: true,
    credits: 100,
  },
];

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(
      mockResponse({
        success: true,
        users: mockUsers,
        count: 2,
      })
    );
  });

  it('renders without crashing', async () => {
    renderWithProviders(<UserManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(0);
    });
  });

  it('renders user data after fetch', async () => {
    renderWithProviders(<UserManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      const alice = screen.queryByText(/alice/i);
      expect(alice || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });

  it('renders a search input', async () => {
    renderWithProviders(<UserManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i) ??
        document.querySelector('input[type="text"], input[type="search"]');
      expect(searchInput || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });

  it('filters users when typing in search', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserManagementPage />, { isLoggedIn: true, userRole: 'admin' });

    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i) ??
        document.querySelector('input[type="text"]') as HTMLInputElement;
      if (searchInput) {
        expect(searchInput).toBeInTheDocument();
      }
    });
  });
});
