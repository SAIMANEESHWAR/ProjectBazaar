import React, { useState, useEffect } from 'react';
import { useResumeInfo, Experience } from '../../context/ResumeInfoContext';
import RichTextEditor from './RichTextEditor';

const ExperienceForm: React.FC = () => {
  const { resumeInfo, updateResumeField } = useResumeInfo();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get current date in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Get max date (1 year in future) in YYYY-MM format
  const getMaxDate = () => {
    const now = new Date();
    return `${now.getFullYear() + 1}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Get date 100 years ago in YYYY-MM format (reasonable minimum)
  const getMinDate = () => {
    const now = new Date();
    return `${now.getFullYear() - 100}-01`;
  };

  const validateDates = (index: number, startDate: string, endDate: string, currentlyWorking: boolean) => {
    const newErrors: { [key: string]: string } = {};
    const errorKey = `exp_${index}`;
    const current = new Date();
    const currentYear = current.getFullYear();
    const currentMonth = current.getMonth();

    // Validate start date
    if (startDate) {
      const [year, month] = startDate.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const maxDate = new Date(currentYear + 1, currentMonth, 1);
      const minDate = new Date(currentYear - 100, 0, 1);

      if (start > maxDate) {
        newErrors[`${errorKey}_start`] = 'Start date cannot be more than 1 year in the future';
      } else if (start < minDate) {
        newErrors[`${errorKey}_start`] = 'Start date is too far in the past';
      }
    }

    // Validate end date only if not currently working
    if (!currentlyWorking && endDate) {
      const [endYear, endMonth] = endDate.split('-').map(Number);
      const end = new Date(endYear, endMonth - 1, 1);
      const maxDate = new Date(currentYear + 1, currentMonth, 1);
      const minDate = new Date(currentYear - 100, 0, 1);

      // Check if end date is before start date
      if (startDate) {
        const [startYear, startMonth] = startDate.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, 1);
        
        if (end < start) {
          newErrors[`${errorKey}_end`] = 'End date cannot be before start date';
        }
      }

      // Check if end date is too far in future
      if (end > maxDate) {
        newErrors[`${errorKey}_end`] = 'End date cannot be more than 1 year in the future';
      }

      // Check if end date is too far in past
      if (end < minDate) {
        newErrors[`${errorKey}_end`] = 'End date is too far in the past';
      }
    }

    // Update errors state
    setErrors(prev => {
      const updated = { ...prev };
      // Clear previous errors for this experience
      delete updated[`${errorKey}_start`];
      delete updated[`${errorKey}_end`];
      // Add new errors
      return { ...updated, ...newErrors };
    });

    return Object.keys(newErrors).length === 0;
  };

  const createEmptyExperience = (): Experience => ({
    id: `exp_${Date.now()}`,
    title: '',
    companyName: '',
    city: '',
    state: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    workSummary: '',
  });

  const handleChange = (index: number, field: keyof Experience, value: string | boolean) => {
    const updated = [...resumeInfo.experience];
    const currentExp = updated[index];
    
    // If currentlyWorking is checked, clear endDate and clear end date errors
    if (field === 'currentlyWorking' && value === true) {
      updated[index] = { ...currentExp, [field]: value, endDate: '' };
      // Clear end date error when currently working is checked
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[`exp_${index}_end`];
        return updated;
      });
    } else {
      updated[index] = { ...currentExp, [field]: value };
    }

    updateResumeField('experience', updated);

    // Validate dates after update
    const updatedExp = updated[index];
    if (field === 'startDate' || field === 'endDate' || field === 'currentlyWorking') {
      validateDates(index, updatedExp.startDate, updatedExp.endDate, updatedExp.currentlyWorking);
    }
  };

  const addExperience = () => {
    updateResumeField('experience', [...resumeInfo.experience, createEmptyExperience()]);
  };

  const removeExperience = (index: number) => {
    const updated = resumeInfo.experience.filter((_, i) => i !== index);
    updateResumeField('experience', updated);
    // Clear errors for removed experience
    const errorKey = `exp_${index}`;
    setErrors(prev => {
      const updated = { ...prev };
      delete updated[`${errorKey}_start`];
      delete updated[`${errorKey}_end`];
      return updated;
    });
  };

  // Validate all experiences on mount
  useEffect(() => {
    resumeInfo.experience.forEach((exp, index) => {
      validateDates(index, exp.startDate, exp.endDate, exp.currentlyWorking);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Professional Experience</h2>
          <p className="text-sm text-gray-500">Add your work experience</p>
        </div>
      </div>

      <div className="space-y-6">
        {resumeInfo.experience.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No experience added yet. Click "Add Experience" to get started.</p>
          </div>
        ) : (
          resumeInfo.experience.map((exp, index) => (
            <div key={exp.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-orange-600">Experience {index + 1}</span>
                <button
                  onClick={() => removeExperience(index)}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Position Title</label>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="Senior Developer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={exp.companyName}
                    onChange={(e) => handleChange(index, 'companyName', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="Tech Company Inc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">City</label>
                  <input
                    type="text"
                    value={exp.city}
                    onChange={(e) => handleChange(index, 'city', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">State</label>
                  <input
                    type="text"
                    value={exp.state}
                    onChange={(e) => handleChange(index, 'state', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="NY"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Start Date</label>
                  <input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => handleChange(index, 'startDate', e.target.value)}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className={`w-full px-3 py-2.5 bg-white border rounded-lg text-gray-900 text-sm focus:ring-2 transition-all ${
                      errors[`exp_${index}_start`] 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                        : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                    }`}
                  />
                  {errors[`exp_${index}_start`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`exp_${index}_start`]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">End Date</label>
                  <div className="space-y-2">
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => handleChange(index, 'endDate', e.target.value)}
                      disabled={exp.currentlyWorking}
                      min={exp.startDate || getMinDate()}
                      max={getMaxDate()}
                      className={`w-full px-3 py-2.5 bg-white border rounded-lg text-gray-900 text-sm focus:ring-2 transition-all disabled:opacity-50 disabled:bg-gray-100 ${
                        errors[`exp_${index}_end`] 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500/20'
                      }`}
                    />
                    {errors[`exp_${index}_end`] && (
                      <p className="text-xs text-red-600">{errors[`exp_${index}_end`]}</p>
                    )}
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exp.currentlyWorking}
                        onChange={(e) => handleChange(index, 'currentlyWorking', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Currently working here
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Work Description</label>
                  <RichTextEditor
                    value={exp.workSummary}
                    onChange={(value) => handleChange(index, 'workSummary', value)}
                    placeholder="Describe your responsibilities and achievements..."
                    positionTitle={exp.title}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={addExperience}
            className="px-4 py-2.5 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all"
          >
            + Add Experience
          </button>
          {resumeInfo.experience.length > 0 && (
            <button
              type="button"
              onClick={() => removeExperience(resumeInfo.experience.length - 1)}
              className="px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
            >
              - Remove Last
            </button>
          )}
      </div>
    </div>
  );
};

export default ExperienceForm;
