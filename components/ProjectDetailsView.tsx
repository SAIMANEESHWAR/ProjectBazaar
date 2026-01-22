import React, { useState, useEffect } from 'react';
import type { BrowseProject } from '../types/browse';
import { useAuth, useNavigation } from '../App';
import PlaceBidModal from './PlaceBidModal';
import type { BidFormData } from '../types/bids';
import { saveBid, getBidsByProjectId, hasFreelancerBidOnProject, getFreelancerBidOnProject, updateBid } from '../services/bidsService';
import ViewBids from './ViewBids';

interface ProjectDetailsViewProps {
  project: BrowseProject;
  onBack: () => void;
}

const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({ project, onBack }) => {
  const { userId, userEmail } = useAuth();
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<'details' | 'proposals'>('details');
  const [showPlaceBidModal, setShowPlaceBidModal] = useState(false);
  const [bidsCount, setBidsCount] = useState<number>(project.bidsCount);
  const [hasBid, setHasBid] = useState<boolean>(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log('ProjectDetailsView state:', { 
      userId, 
      hasBid, 
      showPlaceBidModal, 
      isProjectOwner,
      bidsCount 
    });
  }, [userId, hasBid, showPlaceBidModal, bidsCount]);

  useEffect(() => {
    if (userId) {
      const freelancerHasBid = hasFreelancerBidOnProject(userId, project.id);
      setHasBid(freelancerHasBid);
      
      // Update bids count from localStorage
      const bids = getBidsByProjectId(project.id);
      setBidsCount(bids.length);
    }
  }, [userId, project.id]);

  const handlePlaceBid = (bidData: BidFormData) => {
    try {
      if (!userId || !userEmail) {
        console.error('User not logged in or email missing');
        return;
      }

      // Check if user already has a bid on this project
      const existingBid = getFreelancerBidOnProject(userId, project.id);
      
      if (existingBid) {
        // Update existing bid
        updateBid(existingBid.id, {
          bidAmount: bidData.bidAmount,
          currency: bidData.currency,
          deliveryTime: bidData.deliveryTime,
          deliveryTimeUnit: bidData.deliveryTimeUnit,
          proposal: bidData.proposal,
          submittedAt: new Date().toISOString(),
        });
        console.log('Bid updated successfully');
      } else {
        // Create new bid
        const newBid = {
          id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: project.id,
          freelancerId: userId,
          freelancerName: userEmail.split('@')[0] || 'Freelancer',
          freelancerEmail: userEmail,
          bidAmount: bidData.bidAmount,
          currency: bidData.currency,
          deliveryTime: bidData.deliveryTime,
          deliveryTimeUnit: bidData.deliveryTimeUnit,
          proposal: bidData.proposal,
          submittedAt: new Date().toISOString(),
          status: 'pending' as const,
        };

        saveBid(newBid);
        console.log('Bid saved successfully:', newBid);
      }

      setHasBid(true);
      setShowPlaceBidModal(false);
      
      // Refresh bids count
      const bids = getBidsByProjectId(project.id);
      setBidsCount(bids.length);
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid. Please try again.');
    }
  };

  // Check if current user is the project owner (simplified - in real app, project would have ownerId)
  const isProjectOwner = false; // This would be determined by comparing userId with project.ownerId

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">{project.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{bidsCount} {bidsCount === 1 ? 'bid' : 'bids'}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{project.postedTimeAgo}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {isProjectOwner && (
              <button className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
                Open
              </button>
            )}
            {!isProjectOwner && !hasBid && userId && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Place Bid button clicked');
                  setShowPlaceBidModal(true);
                }}
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors cursor-pointer"
              >
                Place Bid
              </button>
            )}
            {!isProjectOwner && hasBid && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit Bid button clicked');
                  setShowPlaceBidModal(true);
                }}
                className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Edit Bid
              </button>
            )}
            {!userId && (
              <button
                onClick={() => navigateTo('auth')}
                className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                Login to Bid
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'details'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`pb-4 px-2 font-semibold transition-colors ${
                activeTab === 'proposals'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Proposals
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'details' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Project Details</h2>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          {project.type === 'fixed' ? (
                            <>
                              ₹{project.budget.min.toLocaleString()}
                              {project.budget.max !== project.budget.min && ` - ₹${project.budget.max.toLocaleString()}`}
                            </>
                          ) : (
                            <>
                              ₹{project.budget.min}/hr
                              {project.budget.max !== project.budget.min && ` - ₹${project.budget.max}/hr`}
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Project Type</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                          {project.type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proposals' && (
              <ViewBids projectId={project.id} isProjectOwner={isProjectOwner} />
            )}
          </div>
        </div>
      </div>

      {/* Place Bid Modal */}
      {showPlaceBidModal && (
        <PlaceBidModal
          project={project}
          onClose={() => setShowPlaceBidModal(false)}
          onSubmit={handlePlaceBid}
        />
      )}
    </div>
  );
};

export default ProjectDetailsView;

