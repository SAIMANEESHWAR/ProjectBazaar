import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { BrowseProject } from '../types/browse';
import type { BidFormData } from '../types/bids';
import { useAuth } from '../App';

interface PlaceBidModalProps {
  project: BrowseProject;
  onClose: () => void;
  onSubmit: (bidData: BidFormData) => void;
}

const PlaceBidModal: React.FC<PlaceBidModalProps> = ({ project, onClose, onSubmit }) => {
  const { userId } = useAuth();
  const [bidAmount, setBidAmount] = useState<number>(project.budget.min);
  const [currency, setCurrency] = useState<string>(project.budget.currency || 'INR');
  const [deliveryTime, setDeliveryTime] = useState<number>(7);
  const [deliveryTimeUnit, setDeliveryTimeUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [proposal, setProposal] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const calculateFee = (amount: number): number => {
    // 10% platform fee
    return amount * 0.1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (bidAmount <= 0) {
      setError('Bid amount must be greater than 0');
      return;
    }

    // Validate bid is within reasonable range of project budget
    if (bidAmount < project.budget.min * 0.5) {
      setError(`Bid amount seems too low. Project budget starts at ₹${project.budget.min.toLocaleString()}`);
      return;
    }

    if (bidAmount > project.budget.max * 3) {
      setError(`Bid amount seems too high. Project budget is up to ₹${project.budget.max.toLocaleString()}`);
      return;
    }

    if (proposal.trim().length < 100) {
      setError('Proposal must be at least 100 characters');
      return;
    }

    if (proposal.trim().length > 5000) {
      setError('Proposal must be less than 5000 characters');
      return;
    }

    if (deliveryTime <= 0) {
      setError('Delivery time must be greater than 0');
      return;
    }

    if (!userId) {
      setError('You must be logged in to place a bid');
      return;
    }

    onSubmit({
      bidAmount,
      currency,
      deliveryTime,
      deliveryTimeUnit,
      proposal: proposal.trim(),
    });
  };

  const fee = calculateFee(bidAmount);
  const amountAfterFee = bidAmount - fee;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Place a bid on this project</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You will be able to edit your bid until the project is awarded to someone.
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Bid Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Bid Amount
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                  required
                />
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="INR">INR</option>
              </select>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Paid to you: ₹{bidAmount.toFixed(2)} - ₹{fee.toFixed(2)} fee = ₹{amountAfterFee.toFixed(2)}
              <svg className="w-4 h-4 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              This project will be delivered in
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(parseInt(e.target.value) || 1)}
                className="w-24 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
                required
              />
              <select
                value={deliveryTimeUnit}
                onChange={(e) => setDeliveryTimeUnit(e.target.value as 'days' | 'weeks' | 'months')}
                className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {/* Proposal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                Describe your proposal (minimum 100 characters)
              </label>
              <span className={`text-xs ${proposal.length >= 100 ? 'text-green-600' : 'text-gray-500'}`}>
                {proposal.length}/100
              </span>
            </div>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="What makes you the best candidate for this project?"
              rows={8}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Submit Bid
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
};

export default PlaceBidModal;

