import React, { useState, useRef } from 'react';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onSubmit?: (data: BugReportData) => Promise<void>;
}

export interface BugReportData {
  title: string;
  description: string;
  pageUrl: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  imageFile?: File;
  videoFile?: File;
  email?: string;
}

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'completed' | 'error';
}

const BugReportModal: React.FC<BugReportModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  onSubmit,
}) => {
  const bugModalRef = useAccessibleModal(isOpen, onClose);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [email, setEmail] = useState(userEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [imageUpload, setImageUpload] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
  });

  const [videoUpload, setVideoUpload] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('');
      setDescription('');
      setPageUrl('');
      setPriority('low');
      setEmail(userEmail);
      setImageUpload({ file: null, progress: 0, status: 'idle' });
      setVideoUpload({ file: null, progress: 0, status: 'idle' });
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      setImageUpload({ file, progress: 100, status: 'completed' });
      setError(null);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError('Video size must be less than 100MB');
        return;
      }
      setVideoUpload({ file, progress: 100, status: 'completed' });
      setError(null);
    }
  };

  const removeImage = () => {
    setImageUpload({ file: null, progress: 0, status: 'idle' });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeVideo = () => {
    setVideoUpload({ file: null, progress: 0, status: 'idle' });
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a bug title');
      return;
    }

    if (!description.trim()) {
      setError('Please describe the bug');
      return;
    }

    setIsSubmitting(true);

    try {
      const reportData: BugReportData = {
        title: title.trim(),
        description: description.trim(),
        pageUrl: pageUrl.trim(),
        priority,
        imageFile: imageUpload.file || undefined,
        videoFile: videoUpload.file || undefined,
        email: email.trim() || undefined,
      };

      if (onSubmit) {
        await onSubmit(reportData);
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bug report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-600', dot: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', dot: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'text-orange-600', dot: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', dot: 'bg-red-500' },
  ];

  return (
    <div ref={bugModalRef} className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Report a bug">
      {/* Gradient Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-purple-100/80 via-pink-50/80 to-blue-100/80 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden transform transition-all">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bug Report</h2>
                <p className="text-gray-500 text-sm mt-0.5">Found a problem? Let us know so we can fix it.</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-200px)]">
            {success ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Bug Report Sent!</h3>
                <p className="text-gray-500">Thank you for your feedback. We'll look into it.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Bug Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bug title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Feedback Form Submission Fails (Chrome Desktop)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Bug Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bug description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe the issue, steps to reproduce, and browser/device."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-gray-900 placeholder-gray-400 resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Describe the issue, steps to reproduce, and browser/device.
                  </p>
                </div>

                {/* Page URL and Priority Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Page URL */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Page URL or Path
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pageUrl}
                        onChange={(e) => setPageUrl(e.target.value)}
                        placeholder="/dashboard/profile"
                        className="w-full px-4 py-3 pr-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-gray-900 placeholder-gray-400"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority
                    </label>
                    <div className="relative">
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-gray-900 appearance-none cursor-pointer"
                      >
                        {priorityOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <div className={`w-2 h-2 rounded-full ${priorityOptions.find(p => p.value === priority)?.dot}`}></div>
                      </div>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Section */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Upload Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Image
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {!imageUpload.file ? (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 border-dashed rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 text-gray-600"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Image</span>
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {imageUpload.file.name}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatFileSize(imageUpload.file.size)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-green-600 mt-1.5 font-medium">Completed</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Video */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Video
                    </label>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    {!videoUpload.file ? (
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 border-dashed rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-all flex items-center justify-center gap-2 text-gray-600"
                      >
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Video</span>
                      </button>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {videoUpload.file.name}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {formatFileSize(videoUpload.file.size)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={removeVideo}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-green-600 mt-1.5 font-medium">Completed</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your email (optional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="proof.of.email@decentralized.biz"
                      className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all text-gray-900 placeholder-gray-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      'Send bug report'
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

export default BugReportModal;

