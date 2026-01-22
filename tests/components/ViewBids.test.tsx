import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewBids from '../../components/ViewBids';
import * as bidsService from '../../services/bidsService';
import type { Bid } from '../../types/bids';

// Mock the bids service
vi.mock('../../services/bidsService', () => ({
  getBidsByProjectIdAsync: vi.fn(),
  acceptBid: vi.fn(),
  rejectBid: vi.fn(),
}));

const mockBids: Bid[] = [
  {
    id: 'bid-1',
    projectId: 'project-123',
    freelancerId: 'freelancer-1',
    freelancerName: 'Alice Developer',
    freelancerEmail: 'alice@example.com',
    bidAmount: 2500,
    currency: 'INR',
    deliveryTime: 7,
    deliveryTimeUnit: 'days',
    proposal: 'I am an experienced React developer with 5+ years of experience. I can deliver this project on time with high quality.',
    submittedAt: new Date().toISOString(),
    status: 'pending',
  },
  {
    id: 'bid-2',
    projectId: 'project-123',
    freelancerId: 'freelancer-2',
    freelancerName: 'Bob Designer',
    freelancerEmail: 'bob@example.com',
    bidAmount: 3000,
    currency: 'INR',
    deliveryTime: 10,
    deliveryTimeUnit: 'days',
    proposal: 'Full-stack developer here. I specialize in React and Node.js and have completed similar projects.',
    submittedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'pending',
  },
];

describe('ViewBids', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue(mockBids);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show loading state initially', () => {
    render(<ViewBids projectId="project-123" />);
    expect(screen.getByText('Loading proposals...')).toBeInTheDocument();
  });

  it('should display bids after loading', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
      expect(screen.getByText('Bob Designer')).toBeInTheDocument();
    });
  });

  it('should display bid count in header', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Proposals (2)')).toBeInTheDocument();
    });
  });

  it('should display bid amounts correctly', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('₹2,500.00')).toBeInTheDocument();
      expect(screen.getByText('₹3,000.00')).toBeInTheDocument();
    });
  });

  it('should display delivery time for each bid', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Delivery in 7 days')).toBeInTheDocument();
      expect(screen.getByText('Delivery in 10 days')).toBeInTheDocument();
    });
  });

  it('should display proposal text for each bid', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText(/experienced React developer/)).toBeInTheDocument();
      expect(screen.getByText(/Full-stack developer/)).toBeInTheDocument();
    });
  });

  it('should show empty state when no bids exist', async () => {
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([]);

    render(<ViewBids projectId="project-no-bids" />);

    await waitFor(() => {
      expect(screen.getByText('No proposals yet')).toBeInTheDocument();
      expect(screen.getByText('Be the first to submit a proposal for this project')).toBeInTheDocument();
    });
  });

  it('should show error state when API fails', async () => {
    (bidsService.getBidsByProjectIdAsync as any).mockRejectedValue(new Error('API Error'));

    render(<ViewBids projectId="project-error" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load bids. Please try again.')).toBeInTheDocument();
    });
  });

  it('should show Try Again button on error', async () => {
    (bidsService.getBidsByProjectIdAsync as any).mockRejectedValue(new Error('API Error'));

    render(<ViewBids projectId="project-error" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('should reload bids when Try Again is clicked', async () => {
    (bidsService.getBidsByProjectIdAsync as any)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce(mockBids);

    render(<ViewBids projectId="project-error" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load bids. Please try again.')).toBeInTheDocument();
    });

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await userEvent.click(tryAgainButton);

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });
  });

  it('should show refresh button', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByTitle('Refresh bids')).toBeInTheDocument();
    });
  });

  it('should refresh bids when refresh button is clicked', async () => {
    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const refreshButton = screen.getByTitle('Refresh bids');
    await userEvent.click(refreshButton);

    expect(bidsService.getBidsByProjectIdAsync).toHaveBeenCalledTimes(2);
  });
});

describe('ViewBids as Project Owner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue(mockBids);
    (bidsService.acceptBid as any).mockResolvedValue({ success: true });
    (bidsService.rejectBid as any).mockResolvedValue({ success: true });
  });

  it('should show Accept/Reject buttons for project owner', async () => {
    render(<ViewBids projectId="project-123" isProjectOwner={true} />);

    await waitFor(() => {
      const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });

      expect(acceptButtons).toHaveLength(2);
      expect(rejectButtons).toHaveLength(2);
    });
  });

  it('should not show Accept/Reject buttons for non-owner', async () => {
    render(<ViewBids projectId="project-123" isProjectOwner={false} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
    });
  });

  it('should call acceptBid when Accept button is clicked', async () => {
    render(
      <ViewBids 
        projectId="project-123" 
        isProjectOwner={true} 
        onBidStatusChange={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await userEvent.click(acceptButtons[0]);

    expect(bidsService.acceptBid).toHaveBeenCalledWith('bid-1');
  });

  it('should call rejectBid when Reject button is clicked', async () => {
    render(
      <ViewBids 
        projectId="project-123" 
        isProjectOwner={true} 
        onBidStatusChange={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
    await userEvent.click(rejectButtons[0]);

    expect(bidsService.rejectBid).toHaveBeenCalledWith('bid-1');
  });

  it('should update bid status locally after accepting', async () => {
    render(
      <ViewBids 
        projectId="project-123" 
        isProjectOwner={true} 
        onBidStatusChange={vi.fn()} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await userEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });
  });

  it('should call onBidStatusChange callback after status update', async () => {
    const mockCallback = vi.fn();

    render(
      <ViewBids 
        projectId="project-123" 
        isProjectOwner={true} 
        onBidStatusChange={mockCallback} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await userEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  it('should show loading spinner while updating bid status', async () => {
    // Make acceptBid take some time
    (bidsService.acceptBid as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <ViewBids 
        projectId="project-123" 
        isProjectOwner={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await userEvent.click(acceptButtons[0]);

    // Button should be disabled during loading
    expect(acceptButtons[0]).toBeDisabled();
  });

  it('should handle accept bid failure', async () => {
    (bidsService.acceptBid as any).mockResolvedValue({ 
      success: false, 
      error: 'Failed to accept bid' 
    });

    render(
      <ViewBids 
        projectId="project-123" 
        isProjectOwner={true} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await userEvent.click(acceptButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to accept bid')).toBeInTheDocument();
    });
  });

  it('should not show Accept/Reject for already accepted bids', async () => {
    const bidsWithAccepted: Bid[] = [
      { ...mockBids[0], status: 'accepted' },
      mockBids[1],
    ];

    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue(bidsWithAccepted);

    render(<ViewBids projectId="project-123" isProjectOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    // Only one set of buttons should exist (for the pending bid)
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    expect(acceptButtons).toHaveLength(1);
  });

  it('should not show Accept/Reject for already rejected bids', async () => {
    const bidsWithRejected: Bid[] = [
      { ...mockBids[0], status: 'rejected' },
      mockBids[1],
    ];

    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue(bidsWithRejected);

    render(<ViewBids projectId="project-123" isProjectOwner={true} />);

    await waitFor(() => {
      expect(screen.getByText('Alice Developer')).toBeInTheDocument();
    });

    // Only one set of buttons should exist (for the pending bid)
    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    expect(acceptButtons).toHaveLength(1);
  });
});

describe('ViewBids Status Badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show pending badge for pending bids', async () => {
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([
      { ...mockBids[0], status: 'pending' },
    ]);

    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('should show accepted badge for accepted bids', async () => {
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([
      { ...mockBids[0], status: 'accepted' },
    ]);

    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Accepted')).toBeInTheDocument();
    });
  });

  it('should show rejected badge for rejected bids', async () => {
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([
      { ...mockBids[0], status: 'rejected' },
    ]);

    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });
  });
});

describe('ViewBids Time Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue(mockBids);
  });

  it('should display "Just now" for recent submissions', async () => {
    const now = new Date();
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([
      { ...mockBids[0], submittedAt: now.toISOString() },
    ]);

    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText(/just now/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display minutes ago for recent submissions', async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([
      { ...mockBids[0], submittedAt: thirtyMinutesAgo.toISOString() },
    ]);

    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ minutes ago/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display hours ago for submissions within a day', async () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    (bidsService.getBidsByProjectIdAsync as any).mockResolvedValue([
      { ...mockBids[0], submittedAt: fiveHoursAgo.toISOString() },
    ]);

    render(<ViewBids projectId="project-123" />);

    await waitFor(() => {
      expect(screen.getByText(/\d+ hours ago/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
