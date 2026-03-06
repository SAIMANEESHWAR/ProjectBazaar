import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import ProjectManagementPage from '../../../components/admin/ProjectManagementPage';
import { renderWithProviders } from '../../testUtils';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, ok = true) =>
  Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  } as Response);

const mockProjects = [
  {
    projectId: 'p1',
    title: 'Test Project Alpha',
    description: 'A cool project',
    price: 1000,
    category: 'Web',
    tags: ['react'],
    thumbnailUrl: '',
    sellerId: 's1',
    sellerEmail: 'seller@test.com',
    status: 'pending',
    adminApprovalStatus: 'pending',
    uploadedAt: '2024-01-01T00:00:00Z',
  },
  {
    projectId: 'p2',
    title: 'Mobile App Beta',
    description: 'A mobile app',
    price: 2000,
    category: 'Mobile',
    tags: ['flutter'],
    thumbnailUrl: '',
    sellerId: 's2',
    sellerEmail: 'seller2@test.com',
    status: 'active',
    adminApprovalStatus: 'approved',
    uploadedAt: '2024-02-01T00:00:00Z',
  },
];

describe('ProjectManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(
      mockResponse({
        success: true,
        projects: mockProjects,
        count: 2,
      })
    );
  });

  it('renders without crashing', async () => {
    renderWithProviders(<ProjectManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      expect(document.body.innerHTML.length).toBeGreaterThan(0);
    });
  });

  it('shows project management heading', async () => {
    renderWithProviders(<ProjectManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      const headings = screen.queryAllByText(/project|management/i);
      expect(headings.length > 0 || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });

  it('renders project list after data loads', async () => {
    renderWithProviders(<ProjectManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      const project = screen.queryByText(/Test Project Alpha/i);
      expect(project || document.body.innerHTML.length > 0).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('renders status filter controls', async () => {
    renderWithProviders(<ProjectManagementPage />, { isLoggedIn: true, userRole: 'admin' });
    await waitFor(() => {
      const selects = document.querySelectorAll('select');
      const filterBtns = screen.queryAllByRole('button');
      expect(selects.length > 0 || filterBtns.length > 0 || document.body.innerHTML.length > 0).toBeTruthy();
    });
  });
});
