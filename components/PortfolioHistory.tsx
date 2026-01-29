import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

const PORTFOLIO_API_ENDPOINT = 'https://tya60ig1pc.execute-api.ap-south-2.amazonaws.com/default/portfolio-generator';

// Template metadata for display - Updated with website color theme
const TEMPLATE_INFO: Record<string, { name: string; thumbnail: string; color: string }> = {
  minimal: { name: 'Minimal', thumbnail: '📄', color: '#8b5cf6' },
  modern: { name: 'Modern Dark', thumbnail: '🌙', color: '#a78bfa' },
  professional: { name: 'Professional', thumbnail: '💼', color: '#7c3aed' },
  creative: { name: 'Creative', thumbnail: '🎨', color: '#c084fc' },
  developer: { name: 'Developer', thumbnail: '💻', color: '#22d3ee' },
  elegant: { name: 'Elegant', thumbnail: '✨', color: '#f472b6' },
};

// Items to show initially before "View More"
const INITIAL_DISPLAY_COUNT = 4;

interface PortfolioItem {
  portfolioId: string;
  userId: string;
  name: string;
  title: string;
  templateId: string;
  liveUrl: string;
  fileName: string;
  createdAt: string;
  summary?: {
    skillCount: number;
    experienceCount: number;
    projectCount: number;
    educationCount: number;
  };
}

interface PortfolioHistoryProps {
  onSelectPortfolio?: (portfolio: PortfolioItem) => void;
  compact?: boolean;
}

const PortfolioHistory: React.FC<PortfolioHistoryProps> = ({ onSelectPortfolio, compact = false }) => {
  const { userId, isLoggedIn } = useAuth();
  const [history, setHistory] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareMenuOpen, setShareMenuOpen] = useState<string | null>(null);
  
  // Filter and pagination state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchHistory();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, userId]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchHistory = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(PORTFOLIO_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getPortfolioHistory',
          userId: userId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setHistory(result.history || []);
      } else {
        setError(result.error || 'Failed to load history');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (portfolioId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(portfolioId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    const portfolioId = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(portfolioId);
    
    try {
      const response = await fetch(PORTFOLIO_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deletePortfolio',
          userId: userId,
          portfolioId: portfolioId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setHistory(prev => prev.filter(p => p.portfolioId !== portfolioId));
        showToast('Portfolio deleted successfully', 'success');
      } else {
        showToast('Failed to delete portfolio', 'error');
      }
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      showToast('Failed to delete portfolio', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard!', 'success');
  };

  const handleShare = (url: string, _name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareMenuOpen(shareMenuOpen === url ? null : url);
  };

  const shareViaWhatsApp = (url: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out my portfolio: ${name}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    setShareMenuOpen(null);
  };

  const shareViaSMS = (url: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out my portfolio: ${name} - ${url}`;
    window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank');
    setShareMenuOpen(null);
  };

  const shareViaEmail = (url: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const subject = `Check out my portfolio: ${name}`;
    const body = `Hi,\n\nI wanted to share my portfolio with you:\n\n${url}\n\nBest regards`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    setShareMenuOpen(null);
  };

  const shareViaLinkedIn = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    setShareMenuOpen(null);
  };

  const shareViaTwitter = (url: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Check out my portfolio: ${name}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    setShareMenuOpen(null);
  };

  const shareNative = async (url: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name}'s Portfolio`,
          text: `Check out my portfolio`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
    setShareMenuOpen(null);
  };

  // Filter portfolios based on selected filter
  const filteredHistory = selectedFilter === 'all' 
    ? history 
    : history.filter(p => p.templateId === selectedFilter);
  
  // Get unique templates from history for filter options
  const availableTemplates = Array.from(new Set(history.map(p => p.templateId)));
  
  // Determine which portfolios to display
  const displayedPortfolios = showAll 
    ? filteredHistory 
    : filteredHistory.slice(0, INITIAL_DISPLAY_COUNT);
  
  const hasMorePortfolios = filteredHistory.length > INITIAL_DISPLAY_COUNT;

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShareMenuOpen(null);
    if (shareMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [shareMenuOpen]);

  // Toast notification component
  const renderToast = () => {
    if (!toast) return null;
    
    return (
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm animate-slide-up ${
        toast.type === 'success' 
          ? 'bg-[#0d0d12]/95 border-violet-500/30 text-white' 
          : 'bg-[#0d0d12]/95 border-red-500/30 text-white'
      }`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          toast.type === 'success' ? 'bg-violet-500/20' : 'bg-red-500/20'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium">{toast.message}</span>
        <button 
          onClick={() => setToast(null)}
          className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <style>{`
          @keyframes slide-up {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up { animation: slide-up 0.3s ease-out; }
        `}</style>
      </div>
    );
  };

  // Delete confirmation modal
  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;
    
    const portfolio = history.find(p => p.portfolioId === deleteConfirm);
    
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#0d0d12] rounded-2xl border border-violet-500/20 p-6 max-w-sm w-full shadow-2xl shadow-black/50">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Delete Portfolio?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete "{portfolio?.name || 'this portfolio'}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 py-2.5 bg-[#1a1a24] hover:bg-[#252530] border border-white/10 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <>
        {renderToast()}
        <div className="bg-[#0d0d12] rounded-2xl border border-violet-500/10 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sign in to view history</h3>
          <p className="text-gray-400 text-sm">Your portfolio generation history will appear here after you sign in.</p>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        {renderToast()}
        <div className="bg-[#0d0d12] rounded-2xl border border-violet-500/10 p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">Loading history...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {renderToast()}
        <div className="bg-[#0d0d12] rounded-2xl border border-violet-500/10 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error loading history</h3>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-all"
          >
            Try Again
          </button>
        </div>
      </>
    );
  }

  if (history.length === 0) {
    return (
      <>
        {renderToast()}
        <div className="bg-[#0d0d12] rounded-2xl border border-violet-500/10 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-violet-500/10 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No portfolios yet</h3>
          <p className="text-gray-400 text-sm">Your generated portfolios will appear here.</p>
        </div>
      </>
    );
  }

  return (
    <>
      {renderToast()}
      {renderDeleteConfirm()}
      
      <div className={compact ? '' : 'bg-[#0d0d12] rounded-2xl border border-violet-500/10 p-6'}>
        {!compact && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                Your Portfolios
              </h2>
              <span className="text-sm text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full font-medium">
                {history.length} portfolio{history.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Filter tabs */}
            {availableTemplates.length > 1 && (
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => { setSelectedFilter('all'); setShowAll(false); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedFilter === 'all'
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-white/5 hover:border-violet-500/30'
                  }`}
                >
                  All ({history.length})
                </button>
                {availableTemplates.map(templateId => {
                  const template = TEMPLATE_INFO[templateId] || TEMPLATE_INFO.modern;
                  const count = history.filter(p => p.templateId === templateId).length;
                  return (
                    <button
                      key={templateId}
                      onClick={() => { setSelectedFilter(templateId); setShowAll(false); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                        selectedFilter === templateId
                          ? 'bg-violet-600 text-white'
                          : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-white/5 hover:border-violet-500/30'
                      }`}
                    >
                      <span>{template.thumbnail}</span>
                      <span>{template.name} ({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
          {displayedPortfolios.map((portfolio) => {
          const template = TEMPLATE_INFO[portfolio.templateId] || TEMPLATE_INFO.modern;
          
          return (
            <div
              key={portfolio.portfolioId}
              onClick={() => onSelectPortfolio?.(portfolio)}
              className={`group relative bg-[#1a1a24] rounded-xl border border-white/5 p-5 transition-all hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 ${
                onSelectPortfolio ? 'cursor-pointer' : ''
              }`}
            >
              {/* Template Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-xl">
                    {template.thumbnail}
                  </div>
                  <span 
                    className="text-xs px-2.5 py-1 rounded-full font-medium border"
                    style={{ 
                      backgroundColor: `${template.color}15`, 
                      color: template.color,
                      borderColor: `${template.color}30`
                    }}
                  >
                    {template.name}
                  </span>
                </div>
                
                {/* Actions Toolbar - Always visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-[#0d0d12]/95 backdrop-blur-sm rounded-lg p-1 border border-violet-500/20">
                  {/* Copy Button */}
                  <div className="relative group/copy">
                    <button
                      onClick={(e) => copyToClipboard(portfolio.liveUrl, e)}
                      className="p-2 hover:bg-violet-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400 group-hover/copy:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg opacity-0 group-hover/copy:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                      Copy URL
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                  
                  {/* Share Button with Dropdown */}
                  <div className="relative group/share">
                    <button
                      onClick={(e) => handleShare(portfolio.liveUrl, portfolio.name, e)}
                      className="p-2 hover:bg-violet-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400 group-hover/share:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    {!shareMenuOpen && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg opacity-0 group-hover/share:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                        Share
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                      </div>
                    )}
                    
                    {/* Share Dropdown Menu */}
                    {shareMenuOpen === portfolio.liveUrl && (
                      <div 
                        className="absolute right-0 top-full mt-2 w-52 bg-[#1a1a24] rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2">
                          <p className="text-xs text-gray-500 px-3 py-2 font-medium">Share via</p>
                          
                          {/* WhatsApp */}
                          <button
                            onClick={(e) => shareViaWhatsApp(portfolio.liveUrl, portfolio.name, e)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                            </div>
                            <span className="text-sm text-white">WhatsApp</span>
                          </button>
                          
                          {/* SMS/Messages */}
                          <button
                            onClick={(e) => shareViaSMS(portfolio.liveUrl, portfolio.name, e)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <span className="text-sm text-white">Messages</span>
                          </button>
                          
                          {/* Email */}
                          <button
                            onClick={(e) => shareViaEmail(portfolio.liveUrl, portfolio.name, e)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="text-sm text-white">Email</span>
                          </button>
                          
                          {/* LinkedIn */}
                          <button
                            onClick={(e) => shareViaLinkedIn(portfolio.liveUrl, e)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-[#0077b5] rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </div>
                            <span className="text-sm text-white">LinkedIn</span>
                          </button>
                          
                          {/* Twitter/X */}
                          <button
                            onClick={(e) => shareViaTwitter(portfolio.liveUrl, portfolio.name, e)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center border border-white/20">
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                            </div>
                            <span className="text-sm text-white">X (Twitter)</span>
                          </button>
                          
                          <div className="border-t border-white/10 my-2"></div>
                          
                          {/* More Options */}
                          <button
                            onClick={(e) => shareNative(portfolio.liveUrl, portfolio.name, e)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors text-left"
                          >
                            <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </div>
                            <span className="text-sm text-white">More Options</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Open Button */}
                  <div className="relative group/open">
                    <a
                      href={portfolio.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 hover:bg-violet-500/20 rounded-lg transition-colors block"
                    >
                      <svg className="w-4 h-4 text-gray-400 group-hover/open:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg opacity-0 group-hover/open:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                      Open
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <div className="relative group/del">
                    <button
                      onClick={(e) => handleDeleteClick(portfolio.portfolioId, e)}
                      disabled={deletingId === portfolio.portfolioId}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      {deletingId === portfolio.portfolioId ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 group-hover/del:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-lg opacity-0 group-hover/del:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                      Delete
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Portfolio Info */}
              <h3 className="font-semibold text-white mb-1 truncate">{portfolio.name}</h3>
              {portfolio.title && (
                <p className="text-sm text-gray-400 mb-3 truncate">{portfolio.title}</p>
              )}
              
              {/* Stats */}
              {portfolio.summary && (
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
                  <span>{portfolio.summary.skillCount} skills</span>
                  <span>{portfolio.summary.experienceCount} exp</span>
                  <span>{portfolio.summary.projectCount} projects</span>
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-xs text-gray-500">{formatDate(portfolio.createdAt)}</span>
                <a
                  href={portfolio.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 group/link"
                >
                  View Live
                  <svg className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* View More / View Less Button */}
      {!compact && hasMorePortfolios && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a24] hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/30 rounded-xl text-sm font-medium text-gray-400 hover:text-violet-400 transition-all"
          >
            {showAll ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                View More ({filteredHistory.length - INITIAL_DISPLAY_COUNT} more)
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Empty state for filtered results */}
      {filteredHistory.length === 0 && selectedFilter !== 'all' && (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">No portfolios with this template</p>
          <button
            onClick={() => setSelectedFilter('all')}
            className="mt-2 text-xs text-violet-400 hover:text-violet-300"
          >
            View all portfolios →
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default PortfolioHistory;
