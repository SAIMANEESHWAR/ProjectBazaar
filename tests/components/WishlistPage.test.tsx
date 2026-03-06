import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import WishlistPage from '../../components/WishlistPage';
import { WishlistContext } from '../../components/DashboardPage';
import { renderWithProviders } from '../testUtils';
import type { BuyerProject } from '../../components/BuyerProjectCard';

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie-animation" />,
}));

const sampleProjects: BuyerProject[] = [
  {
    id: 'p1',
    imageUrl: 'https://example.com/img.jpg',
    category: 'Mobile',
    title: 'Wishlist Project',
    description: 'A saved project',
    tags: ['flutter'],
    price: 2500,
    sellerId: 's1',
    sellerEmail: 'seller@test.com',
    status: 'active',
    uploadedAt: '2024-01-01',
    adminApproved: true,
    likesCount: 0,
    purchasesCount: 0,
  },
];

const wishlistWithItem = {
  wishlist: ['p1'],
  toggleWishlist: vi.fn(),
  isInWishlist: (id: string) => id === 'p1',
  refreshWishlist: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
};

const emptyWishlist = {
  wishlist: [],
  toggleWishlist: vi.fn(),
  isInWishlist: () => false,
  refreshWishlist: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
};

describe('WishlistPage', () => {
  it('shows empty state when wishlist is empty', () => {
    renderWithProviders(
      <WishlistContext.Provider value={emptyWishlist}>
        <WishlistPage allProjects={sampleProjects} onViewDetails={vi.fn()} />
      </WishlistContext.Provider>
    );
    const emptyState = screen.queryByText(/empty|nothing|no projects/i) ?? screen.queryByTestId('lottie-animation');
    expect(emptyState).toBeTruthy();
  });

  it('renders wishlist items when wishlist has projects', () => {
    renderWithProviders(
      <WishlistContext.Provider value={wishlistWithItem}>
        <WishlistPage allProjects={sampleProjects} onViewDetails={vi.fn()} />
      </WishlistContext.Provider>
    );
    expect(screen.getByText('Wishlist Project')).toBeInTheDocument();
  });

  it('shows loading state when wishlist is loading', () => {
    const loadingContext = { ...emptyWishlist, isLoading: true };
    renderWithProviders(
      <WishlistContext.Provider value={loadingContext}>
        <WishlistPage allProjects={sampleProjects} onViewDetails={vi.fn()} />
      </WishlistContext.Provider>
    );
    // Loading spinner should be present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });
});
