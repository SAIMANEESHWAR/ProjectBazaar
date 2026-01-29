import React, { useState, useEffect } from 'react';
import { reportProject, ReportProjectRequest } from '../services/buyerApi';

interface ReportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  buyerId: string;
  isPurchased?: boolean;
  onSuccess?: () => void;
}

const REPORT_REASONS = [
  { value: 'POOR_QUALITY', label: 'Poor Quality', subtext: 'Code quality is below expectations' },
  { value: 'DESCRIPTION_MISMATCH', label: 'Description Mismatch', subtext: 'Project does not match the description or preview' },
  { value: 'SUSPECTED_SCAM', label: 'Suspected Scam', subtext: 'Project appears to be fraudulent or malicious' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate Content', subtext: 'Project contains inappropriate, offensive, or harmful content' },
  { value: 'COPYRIGHT_VIOLATION', label: 'Copyright Violation', subtext: 'Project appears to violate copyright or intellectual property' },
  { value: 'OTHER', label: 'Other', subtext: 'Other issues not listed above' },
];

const ReportProjectModal: React.FC<ReportProjectModalProps> = ({
  isOpen,
  onClose,
  projectId,
  buyerId,
  isPurchased = false,
  onSuccess,
}) => {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachments, setAttachments] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-fill description when reason is selected
  useEffect(() => {
    if (reason) {
      const selectedReason = REPORT_REASONS.find(opt => opt.value === reason);
      if (selectedReason) {
        // Auto-fill the description with the subtext
        setDescription(selectedReason.subtext);
      }
    } else {
      // Clear description when reason is cleared
      setDescription('');
    }
  }, [reason]);

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setDescription('');
      setAttachments(['']);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const handleAttachmentChange = (index: number, value: string) => {
    const newAttachments = [...attachments];
    newAttachments[index] = value;
    setAttachments(newAttachments);
  };

  const addAttachmentField = () => {
    if (attachments.length < 5) {
      setAttachments([...attachments, '']);
    }
  };

  const removeAttachmentField = (index: number) => {
    if (attachments.length > 1) {
      const newAttachments = attachments.filter((_, i) => i !== index);
      setAttachments(newAttachments);
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true;
    const urlPattern = /^https?:\/\/.+$/;
    return urlPattern.test(url.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!buyerId) {
      setError('You must be logged in to report a project');
      return;
    }

    if (!reason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    const validAttachments = attachments
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (validAttachments.length > 5) {
      setError('Maximum 5 attachments allowed');
      return;
    }

    for (const url of validAttachments) {
      if (!validateUrl(url)) {
        setError('Please provide valid URLs for attachments (must start with http:// or https://)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const reportData: ReportProjectRequest = {
        buyerId,
        projectId,
        reason,
        description: description.trim(),
        attachments: validAttachments.length > 0 ? validAttachments : undefined,
      };

      const response = await reportProject(reportData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
          if (onSuccess) {
            onSuccess();
          }
        }, 2000);
      } else {
        setError(response.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden transform transition-all">
          {/* Header - Orange Background */}
          <div className="bg-orange-500 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Warning Icon */}
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              {/* Title and Subtitle */}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">Report Project Issue</h2>
                <p className="text-white/90 text-sm mt-0.5">AI Resume Analyzer</p>
              </div>
            </div>
            {/* Close Button */}
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {success ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted Successfully!</h3>
                <p className="text-gray-600">Thank you for reporting this issue. Our team will review it shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reason for Reporting Section */}
                <div>
                  {/* Blue Info Note Box - At the top */}
                  {!isPurchased && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Note:</span> Since you haven't purchased this project, some report options are limited. You can report issues visible in the description, preview, or images.
                      </p>
                    </div>
                  )}

                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Reason for Reporting <span className="text-red-500">(Required)</span>
                  </label>

                  {/* Dropdown Select */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-700 whitespace-nowrap">
                      I would like to
                    </label>
                    <div className="flex-1 relative">
                      <select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none cursor-pointer pr-10"
                      >
                        <option value="">Select an option</option>
                        {REPORT_REASONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {/* Custom Dropdown Arrow */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Description Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Detailed Description <span className="text-red-500">(Required)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Please provide detailed information about the issue you encountered. Be as specific as possible to help us understand and resolve the problem quickly..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all"
                  />
                  <p className="text-sm text-red-500 mt-2">
                    {description.length}/10 characters minimum
                  </p>
                </div>

                {/* Attachments Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Attachments (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Max 5 URLs</p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-4">
                      Provide URLs to screenshots, error messages, or any other evidence that supports your report. Upload images to a service like imgur or use S3 URLs.
                    </p>
                    
                    <div className="space-y-3">
                      {attachments.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleAttachmentChange(index, e.target.value)}
                            placeholder="https://example.com/screenshot.png"
                            className={`flex-1 px-4 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all ${
                              url.trim() && !validateUrl(url)
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300 bg-white'
                            }`}
                          />
                          {attachments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAttachmentField(index)}
                              className="px-4 py-2.5 text-red-600 hover:text-red-700 font-medium"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {attachments.length < 5 && (
                        <button
                          type="button"
                          onClick={addAttachmentField}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-orange-600 hover:text-orange-700 font-medium text-sm border-2 border-dashed border-orange-500 rounded-lg hover:bg-orange-50 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          + Add Another Attachment URL ({attachments.length}/5)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reason || description.trim().length < 10}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportProjectModal;
