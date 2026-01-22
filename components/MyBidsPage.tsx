import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { getBidsByFreelancerIdAsync, deleteBidAsync } from '../services/bidsService';
import { getBidRequestProject } from '../services/bidRequestProjectsApi';
import type { Bid } from '../types/bids';
import type { BrowseProject } from '../types/browse';

interface BidWithProject extends Bid {
  project?: BrowseProject | null;
}

interface MyBidsPageProps {
  onBack?: () => void;
}

const MyBidsPage: React.FC<MyBidsPageProps> = ({ onBack }) => {
  const { userId } = useAuth();
  const [bids, setBids] = useState<BidWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [withdrawingBidId, setWithdrawingBidId] = useState<string | null>(null);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState<string | null>(null);

  // Fetch bids and their associated projects
  const fetchBids = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedBids = await getBidsByFreelancerIdAsync(userId);
      
      // Fetch project details for each bid
      const bidsWithProjects: BidWithProject[] = await Promise.all(
        fetchedBids.map(async (bid) => {
          try {
            const project = await getBidRequestProject(bid.projectId);
            return { ...bid, project };
          } catch {
            return { ...bid, project: null };
          }
        })
      );
      
      // Sort by submission date (newest first)
      bidsWithProjects.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
      
      setBids(bidsWithProjects);
    } catch (err) {
      console.error('Error fetching bids:', err);
      setError('Failed to load your bids. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  // Handle bid withdrawal
  const handleWithdrawBid = async (bidId: string) => {
    if (!userId) return;
    
    setWithdrawingBidId(bidId);
    
    try {
      const result = await deleteBidAsync(bidId, userId);
      if (result.success) {
        setBids(prev => prev.filter(b => b.id !== bidId));
        setShowWithdrawConfirm(null);
      } else {
        setError(result.error || 'Failed to withdraw bid');
      }
    } catch (err) {
      setError('Failed to withdraw bid');
    } finally {
      setWithdrawingBidId(null);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Filter bids based on status
  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status === filter;
  });

  // Get status counts
  const statusCounts = {
    all: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    accepted: bids.filter(b => b.status === 'accepted').length,
    rejected: bids.filter(b => b.status === 'rejected').length,
  };

  // Get status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Bids</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track all your submitted proposals</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Bids</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{statusCounts.all}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{statusCounts.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-green-600 dark:text-green-400">Accepted</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statusCounts.accepted}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-red-600 dark:text-red-400">Rejected</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statusCounts.rejected}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-orange-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Loading your bids...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
            <button
              onClick={fetchBids}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
              {filter === 'all' ? 'No bids submitted yet' : `No ${filter} bids`}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {filter === 'all' 
                ? 'Browse projects and submit your first proposal'
                : 'Try checking another filter'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredBids.map((bid) => (
              <div key={bid.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col gap-4">
                  {/* Project Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {bid.project?.title || 'Project Not Found'}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(bid.status)}`}>
                          {bid.status ? bid.status.charAt(0).toUpperCase() + bid.status.slice(1) : 'Pending'}
                        </span>
                      </div>
                      {bid.project && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                          {bid.project.description}
                        </p>
                      )}
                      {bid.project?.skills && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {bid.project.skills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Budget & Actions */}
                    <div className="text-right ml-4">
                      {bid.project && (
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ₹{bid.project.budget.min.toLocaleString()} - ₹{bid.project.budget.max.toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Project Budget</p>
                    </div>
                  </div>

                  {/* Your Bid Details */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your Bid
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          ₹{bid.bidAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Delivery Time</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {bid.deliveryTime} {bid.deliveryTimeUnit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Submitted</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatTimeAgo(bid.submittedAt)}
                        </p>
                      </div>
                      <div className="flex items-end justify-end">
                        {bid.status === 'pending' && (
                          <button
                            onClick={() => setShowWithdrawConfirm(bid.id)}
                            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          >
                            Withdraw Bid
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Proposal Preview */}
                    <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Proposal</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {bid.proposal}
                      </p>
                    </div>
                  </div>

                  {/* Status Message */}
                  {bid.status === 'accepted' && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-300">Congratulations! Your bid was accepted</p>
                        <p className="text-sm text-green-600 dark:text-green-400">The project owner has selected you for this project.</p>
                      </div>
                    </div>
                  )}
                  
                  {bid.status === 'rejected' && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-red-700 dark:text-red-300">Bid not selected</p>
                        <p className="text-sm text-red-600 dark:text-red-400">The project owner chose another freelancer. Keep bidding!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Withdraw Bid?</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to withdraw this bid? This action cannot be undone and you'll need to submit a new bid if you change your mind.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawConfirm(null)}
                disabled={withdrawingBidId !== null}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdrawBid(showWithdrawConfirm)}
                disabled={withdrawingBidId !== null}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {withdrawingBidId ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw Bid'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBidsPage;
