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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden transform transition-all">

          {/* Header - Clean & Minimal */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Report an Issue</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Help us keep the marketplace safe</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {success ? (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-5">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Report Submitted</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">Thank you for reporting. Our team will review this and take appropriate action.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Note for non-purchasers */}
                {!isPurchased && (
                  <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 rounded-xl">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Since you haven't purchased this project, some report options are limited to issues visible in the description, preview, or images.
                    </p>
                  </div>
                )}

                {/* Reason Selection - Radio Cards */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2.5">
                    What's wrong? <span className="text-red-400 font-normal">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {REPORT_REASONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setReason(option.value)}
                        className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${reason === option.value
                            ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-200'
                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <p className={`text-xs font-semibold ${reason === option.value ? 'text-orange-700' : 'text-gray-700'}`}>
                          {option.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{option.subtext}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tell us more <span className="text-red-400 font-normal">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the issue in detail so we can act quickly..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none transition-all text-sm bg-gray-50/50 placeholder:text-gray-400"
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <p className={`text-[11px] ${description.trim().length >= 10 ? 'text-green-500' : 'text-gray-400'}`}>
                      {description.trim().length >= 10 ? '✓ Minimum met' : `${description.trim().length}/10 characters minimum`}
                    </p>
                  </div>
                </div>

                {/* Attachments - Simplified */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                    Evidence <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mb-2.5">Add screenshot URLs to support your report</p>

                  <div className="space-y-2">
                    {attachments.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => handleAttachmentChange(index, e.target.value)}
                          placeholder="https://imgur.com/screenshot.png"
                          className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all ${url.trim() && !validateUrl(url)
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-gray-200 bg-gray-50/50'
                            }`}
                        />
                        {attachments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAttachmentField(index)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {attachments.length < 5 && (
                      <button
                        type="button"
                        onClick={addAttachmentField}
                        className="flex items-center gap-1.5 text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors py-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add URL ({attachments.length}/5)
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                    <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-5 py-2.5 text-sm bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !reason || description.trim().length < 10}
                    className="flex-1 px-5 py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
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
