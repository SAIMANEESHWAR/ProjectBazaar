import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import CartPage from '../../components/CartPage';
import { CartContext } from '../../components/DashboardPage';
import { renderWithProviders } from '../testUtils';
import type { BuyerProject } from '../../components/BuyerProjectCard';

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie-animation" />,
}));

vi.mock('../../services/buyerApi', () => ({
  createPaymentIntent: vi.fn(),
}));

const sampleProjects: BuyerProject[] = [
  {
    id: 'p1',
    imageUrl: 'https://example.com/img1.jpg',
    category: 'Web',
    title: 'Project Alpha',
    description: 'A web project',
    tags: ['react'],
    price: 999,
    sellerId: 's1',
    sellerEmail: 'seller@test.com',
    status: 'active',
    uploadedAt: '2024-01-01',
    adminApproved: true,
    likesCount: 10,
    purchasesCount: 5,
  },
];

const cartContextWithItem = {
  cart: ['p1'],
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  isInCart: (id: string) => id === 'p1',
  cartCount: 1,
  refreshCart: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
};

const emptyCartContext = {
  cart: [],
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  isInCart: () => false,
  cartCount: 0,
  refreshCart: vi.fn().mockResolvedValue(undefined),
  isLoading: false,
};

describe('CartPage', () => {
  it('shows empty state when cart is empty', () => {
    renderWithProviders(
      <CartContext.Provider value={emptyCartContext}>
        <CartPage allProjects={sampleProjects} />
      </CartContext.Provider>,
      { isLoggedIn: true, userId: 'u1' }
    );
    // Should show some empty cart indication
    const emptyMsg = screen.queryByText(/empty|no items|nothing/i) ?? screen.queryByTestId('lottie-animation');
    expect(emptyMsg).toBeTruthy();
  });

  it('renders cart items when cart has projects', () => {
    renderWithProviders(
      <CartContext.Provider value={cartContextWithItem}>
        <CartPage allProjects={sampleProjects} />
      </CartContext.Provider>,
      { isLoggedIn: true, userId: 'u1' }
    );
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
  });

  it('shows checkout or payment button when cart has items', () => {
    renderWithProviders(
      <CartContext.Provider value={cartContextWithItem}>
        <CartPage allProjects={sampleProjects} />
      </CartContext.Provider>,
      { isLoggedIn: true, userId: 'u1' }
    );
    const checkoutBtns = screen.queryAllByText(/checkout|pay|proceed/i);
    expect(checkoutBtns.length).toBeGreaterThan(0);
  });
});
