import React, { useState, useEffect, useCallback } from 'react';
import type { Bid } from '../types/bids';
import { getBidsByProjectIdAsync, acceptBid, rejectBid } from '../services/bidsService';

interface ViewBidsProps {
  projectId: string;
  isProjectOwner?: boolean;
  onBidStatusChange?: () => void;
}

const ViewBids: React.FC<ViewBidsProps> = ({ projectId, isProjectOwner = false, onBidStatusChange }) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingBidId, setUpdatingBidId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBids = useCallback(async () => {
    try {
      setError(null);
      const projectBids = await getBidsByProjectIdAsync(projectId);
      // Sort by submission date (newest first)
      projectBids.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setBids(projectBids);
    } catch (err) {
      console.error('Error loading bids:', err);
      setError('Failed to load bids. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBids();

    // Refresh bids every 10 seconds (reduced frequency since we're using API now)
    const interval = setInterval(loadBids, 10000);
    return () => clearInterval(interval);
  }, [loadBids]);

  // Handle accepting a bid
  const handleAcceptBid = async (bidId: string) => {
    setUpdatingBidId(bidId);
    try {
      const result = await acceptBid(bidId);
      if (result.success) {
        // When a bid is accepted, mark it as accepted and all others as rejected
        setBids(prev => prev.map(bid => {
          if (bid.id === bidId) {
            return { ...bid, status: 'accepted' };
          } else if (bid.status === 'pending') {
            return { ...bid, status: 'rejected' };
          }
          return bid;
        }));
        onBidStatusChange?.();
        
        // Refresh bids from server to ensure sync
        setTimeout(() => loadBids(), 1000);
      } else {
        setError(result.error || 'Failed to accept bid');
      }
    } catch (err) {
      setError('Failed to accept bid');
    } finally {
      setUpdatingBidId(null);
    }
  };

  // Handle rejecting a bid
  const handleRejectBid = async (bidId: string) => {
    setUpdatingBidId(bidId);
    try {
      const result = await rejectBid(bidId);
      if (result.success) {
        setBids(prev => prev.map(bid => 
          bid.id === bidId ? { ...bid, status: 'rejected' } : bid
        ));
        onBidStatusChange?.();
      } else {
        setError(result.error || 'Failed to reject bid');
      }
    } catch (err) {
      setError('Failed to reject bid');
    } finally {
      setUpdatingBidId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status?: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    };

    const statusText = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
    };

    const statusClass = statusColors[status as keyof typeof statusColors] || statusColors.pending;
    const text = statusText[status as keyof typeof statusText] || 'Pending';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
        <button
          onClick={loadBids}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No proposals yet</p>
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
          Be the first to submit a proposal for this project
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Proposals ({bids.length})
        </h2>
        <button
          onClick={loadBids}
          className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh bids"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {bids.map((bid) => (
        <div
          key={bid.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {bid.freelancerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {bid.freelancerName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {bid.freelancerEmail}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(bid.status)}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ₹{bid.bidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Delivery in {bid.deliveryTime} {bid.deliveryTimeUnit}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Proposal</h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {bid.proposal}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Submitted {formatDate(bid.submittedAt)}
                </div>
                
                {/* Action buttons for project owner */}
                {isProjectOwner && bid.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptBid(bid.id)}
                      disabled={updatingBidId === bid.id}
                      className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {updatingBidId === bid.id ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectBid(bid.id)}
                      disabled={updatingBidId === bid.id}
                      className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ViewBids;

