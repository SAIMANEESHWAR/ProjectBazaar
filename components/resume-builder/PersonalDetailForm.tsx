import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useResumeInfo } from '../../context/ResumeInfoContext';

interface PersonalDetailFormProps {
  onEnableNext: (enabled: boolean) => void;
}

const PersonalDetailForm: React.FC<PersonalDetailFormProps> = ({ onEnableNext }) => {
  const { resumeInfo, updateResumeField } = useResumeInfo();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateResumeField(name as keyof typeof resumeInfo, value);
    // Check if required fields are filled to enable next
    const requiredFields = ['firstName', 'lastName', 'jobTitle', 'phone', 'email'];
    const isFormValid = requiredFields.every(field => {
      if (field === name) {
        return value.trim().length > 0;
      }
      return resumeInfo[field as keyof typeof resumeInfo]?.toString().trim().length > 0;
    });
    onEnableNext(isFormValid);
  };

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Max file size: 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateResumeField('profileImage', reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [updateResumeField]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveImage = () => {
    updateResumeField('profileImage', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check form validity on mount and when resumeInfo changes
  useEffect(() => {
    const requiredFields = ['firstName', 'lastName', 'jobTitle', 'phone', 'email'];
    const isFormValid = requiredFields.every(field => {
      const value = resumeInfo[field as keyof typeof resumeInfo]?.toString().trim();
      return value && value.length > 0;
    });
    onEnableNext(isFormValid);
  }, [resumeInfo.firstName, resumeInfo.lastName, resumeInfo.jobTitle, resumeInfo.phone, resumeInfo.email, onEnableNext]);

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Personal Details</h2>
          <p className="text-xs sm:text-sm text-gray-500">Get started with the basic information</p>
        </div>
      </div>

      <div>
        {/* Profile Image Upload - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
            Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              {resumeInfo.profileImage ? (
                <div className="relative group">
                  <img
                    src={resumeInfo.profileImage}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full sm:flex-1 border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1.5 sm:mb-2 ${
                  isDragging ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isDragging ? 'text-orange-600' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-orange-600">Tap to upload</span>
                  <span className="hidden sm:inline"> or drag and drop</span>
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center sm:text-left">
            💡 Some templates show your photo, others show initials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={resumeInfo.firstName}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="John"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={resumeInfo.lastName}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="Doe"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={resumeInfo.jobTitle}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="Full Stack Developer"
            />
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Address</label>
            <input
              type="text"
              name="address"
              value={resumeInfo.address}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="New York, NY"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Phone</label>
            <input
              type="tel"
              name="phone"
              value={resumeInfo.phone}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={resumeInfo.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">LinkedIn <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="url"
              name="linkedIn"
              value={resumeInfo.linkedIn || ''}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="linkedin.com/in/johndoe"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">GitHub <span className="text-gray-400 font-normal">(optional)</span></label>
            <input
              type="url"
              name="github"
              value={resumeInfo.github || ''}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              placeholder="github.com/johndoe"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailForm;
