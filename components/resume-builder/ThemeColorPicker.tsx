import React, { useState } from 'react';
import { useResumeInfo } from '../../context/ResumeInfoContext';

const THEME_COLORS = [
  { name: 'Orange', value: '#f97316' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Slate', value: '#475569' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Lime', value: '#65a30d' },
];

const ThemeColorPicker: React.FC = () => {
  const { resumeInfo, updateResumeField } = useResumeInfo();
  const [isOpen, setIsOpen] = useState(false);

  const selectedColor = resumeInfo.themeColor || '#f97316';

  return (
    <div className="relative">
      {/* Trigger Button - Mobile optimized */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        <div 
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Theme</span>
        <svg className={`w-3 sm:w-4 h-3 sm:h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/10" 
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown - Positioned better on mobile */}
          <div className="fixed left-3 right-3 bottom-3 sm:bottom-auto sm:left-auto sm:right-0 sm:absolute sm:top-full sm:mt-2 p-3 sm:p-4 bg-white border border-gray-200 rounded-xl shadow-xl z-50 sm:min-w-[220px]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs sm:text-sm text-gray-700 font-medium">Choose Theme Color</p>
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hidden p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-4 gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    updateResumeField('themeColor', color.value);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg transition-all hover:scale-110 ${
                    selectedColor === color.value 
                      ? 'ring-2 ring-gray-900 ring-offset-2' 
                      : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            
            {/* Custom Color Input */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-xs text-gray-500 block mb-2 font-medium">Custom Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => updateResumeField('themeColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      updateResumeField('themeColor', e.target.value);
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-900 font-mono"
                  placeholder="#f97316"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeColorPicker;
