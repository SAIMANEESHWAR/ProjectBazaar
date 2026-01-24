import React, { useState, useEffect } from 'react';
import { useResumeInfo } from '../../context/ResumeInfoContext';
import { generateSummarySuggestions } from '../../services/AIResumeService';

interface SummaryFormProps {
  onEnableNext: (enabled: boolean) => void;
}

interface SuggestionItem {
  summary: string;
  experience_level: string;
}

const SummaryForm: React.FC<SummaryFormProps> = ({ onEnableNext }) => {
  const { resumeInfo, updateResumeField } = useResumeInfo();
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    updateResumeField('summary', value);
    // Enable next if summary is not empty
    onEnableNext(value.trim().length > 0);
  };

  const generateFromAI = async () => {
    if (!resumeInfo.jobTitle) {
      alert('Please add a job title first in Personal Details');
      return;
    }

    setAiLoading(true);
    try {
      const results = await generateSummarySuggestions(resumeInfo.jobTitle);
      setSuggestions(results);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const selectSuggestion = (summary: string) => {
    updateResumeField('summary', summary);
    onEnableNext(summary.trim().length > 0);
  };

  // Check form validity on mount and when summary changes
  useEffect(() => {
    onEnableNext(resumeInfo.summary.trim().length > 0);
  }, [resumeInfo.summary, onEnableNext]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Professional Summary</h2>
            <p className="text-xs sm:text-sm text-gray-500">Add a compelling summary for your resume</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Your Summary</label>
            <button
              type="button"
              onClick={generateFromAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all disabled:opacity-50"
            >
              {aiLoading ? (
                <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
              <span className="hidden sm:inline">Generate with AI</span>
              <span className="sm:hidden">AI</span>
            </button>
          </div>

          <textarea
            value={resumeInfo.summary}
            onChange={handleChange}
            rows={4}
            required
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
            placeholder="A results-driven professional with extensive experience in..."
          />
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="text-orange-500">✨</span> AI Suggestions
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {suggestions.map((item, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(item.summary)}
                className="w-full text-left p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-orange-600 uppercase tracking-wide">
                    {item.experience_level}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    Tap to use
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{item.summary}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryForm;
