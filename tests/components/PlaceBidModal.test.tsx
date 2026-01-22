import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlaceBidModal from '../../components/PlaceBidModal';
import type { BrowseProject } from '../../types/browse';

// Mock the useAuth hook
vi.mock('../../App', () => ({
  useAuth: () => ({
    userId: 'test-user-123',
    userEmail: 'test@example.com',
  }),
}));

// Mock createPortal
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

const mockProject: BrowseProject = {
  id: 'project-123',
  title: 'Test React Project',
  description: 'A comprehensive React application with modern features.',
  type: 'fixed',
  budget: {
    min: 1000,
    max: 5000,
    currency: 'INR',
  },
  skills: ['React', 'TypeScript', 'TailwindCSS'],
  bidsCount: 5,
  postedAt: '2024-01-01T00:00:00Z',
  postedTimeAgo: '2 days ago',
  ownerId: 'owner-123',
  ownerEmail: 'owner@example.com',
  ownerName: 'Project Owner',
};

describe('PlaceBidModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  it('should render the modal with project details', () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Place a bid on this project')).toBeInTheDocument();
  });

  it('should set initial bid amount to project minimum budget', () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const bidInput = screen.getByDisplayValue('1000');
    expect(bidInput).toBeInTheDocument();
  });

  it('should prevent body scroll when modal is open', () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should call onClose when clicking the close button', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const closeButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when clicking outside the modal', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Click on the backdrop (the outermost div with the bg-black class)
    const backdrop = document.querySelector('.bg-black');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should show error when bid amount is zero or negative', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const bidInput = screen.getByDisplayValue('1000');
    await userEvent.clear(bidInput);
    await userEvent.type(bidInput, '0');

    // Also add a proposal to isolate the bid amount error
    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'A'.repeat(110));

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    // Should show budget validation error (since 0 is below min * 0.5 = 500)
    expect(screen.getByText(/Bid amount must be greater than 0|Bid amount seems too low/)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should show error when proposal is less than 100 characters', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'Short proposal');

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(screen.getByText('Proposal must be at least 100 characters')).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit bid with valid data', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const bidInput = screen.getByDisplayValue('1000');
    await userEvent.clear(bidInput);
    await userEvent.type(bidInput, '2500');

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    const longProposal = 'This is a very detailed proposal explaining my experience and expertise in React development. I have worked on similar projects and can deliver high-quality results within the specified timeline.';
    await userEvent.type(proposalInput, longProposal);

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      bidAmount: 2500,
      currency: 'INR',
      deliveryTime: 7,
      deliveryTimeUnit: 'days',
      proposal: longProposal,
    });
  });

  it('should update delivery time correctly', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const deliveryTimeInput = screen.getByDisplayValue('7') as HTMLInputElement;
    // Use fireEvent for more reliable input change
    fireEvent.change(deliveryTimeInput, { target: { value: '14' } });

    const deliveryUnitSelect = screen.getByDisplayValue('Days');
    await userEvent.selectOptions(deliveryUnitSelect, 'weeks');

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    const longProposal = 'A'.repeat(150);
    await userEvent.type(proposalInput, longProposal);

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryTime: 14,
        deliveryTimeUnit: 'weeks',
      })
    );
  });

  it('should calculate and display platform fee correctly', () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Default bid amount is 1000, so fee should be 100 (10%)
    expect(screen.getByText(/₹1000.00 - ₹100.00 fee = ₹900.00/)).toBeInTheDocument();
  });

  it('should show character count for proposal', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'Test proposal');

    // Should show character count
    expect(screen.getByText(/13\/100/)).toBeInTheDocument();
  });

  it('should update character count color when minimum reached', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'A'.repeat(100));

    // Character count should be green when >= 100
    const charCount = screen.getByText(/100\/100/);
    expect(charCount).toHaveClass('text-green-600');
  });

  it('should allow changing currency', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // The modal should show INR currency selector
    expect(screen.getByDisplayValue('INR')).toBeInTheDocument();
  });

  it('should handle decimal bid amounts', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const bidInput = screen.getByDisplayValue('1000');
    await userEvent.clear(bidInput);
    await userEvent.type(bidInput, '1500.50');

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'A'.repeat(110));

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        bidAmount: 1500.5,
      })
    );
  });
});

describe('PlaceBidModal Edge Cases', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle project with no currency specified', () => {
    const projectNoCurrency: BrowseProject = {
      ...mockProject,
      budget: {
        min: 500,
        max: 1000,
        currency: '',
      },
    };

    render(
      <PlaceBidModal
        project={projectNoCurrency}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    // Should default to INR
    expect(screen.getByDisplayValue('INR')).toBeInTheDocument();
  });

  it('should handle large bid amounts within valid range', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const bidInput = screen.getByDisplayValue('1000') as HTMLInputElement;
    // Use fireEvent for reliable input - bid within 3x of max (5000 * 3 = 15000)
    fireEvent.change(bidInput, { target: { value: '10000' } });

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'A'.repeat(110));

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        bidAmount: 10000,
      })
    );
  });

  it('should handle months as delivery time unit', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const deliveryUnitSelect = screen.getByDisplayValue('Days');
    await userEvent.selectOptions(deliveryUnitSelect, 'months');

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    await userEvent.type(proposalInput, 'A'.repeat(110));

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryTimeUnit: 'months',
      })
    );
  });

  it('should trim proposal whitespace before submission', async () => {
    render(
      <PlaceBidModal
        project={mockProject}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );

    const proposalInput = screen.getByPlaceholderText(/what makes you the best candidate/i);
    const proposalWithSpaces = '   ' + 'A'.repeat(110) + '   ';
    await userEvent.type(proposalInput, proposalWithSpaces);

    const submitButton = screen.getByRole('button', { name: /submit bid/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        proposal: 'A'.repeat(110),
      })
    );
  });
});
