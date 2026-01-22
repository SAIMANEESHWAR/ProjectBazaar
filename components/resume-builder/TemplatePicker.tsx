import React, { useState } from 'react';
import { useResumeInfo, ResumeTemplate } from '../../context/ResumeInfoContext';

interface TemplateOption {
  id: ResumeTemplate;
  name: string;
  description: string;
  atsScore: number;
  category: 'popular' | 'professional' | 'creative' | 'industry' | 'unique';
}

const templates: TemplateOption[] = [
  // Popular Templates
  { id: 'classic', name: 'Classic', description: "Jake's Resume - Clean, traditional format", atsScore: 98, category: 'popular' },
  { id: 'modern', name: 'Modern', description: 'Awesome CV style - Contemporary accents', atsScore: 95, category: 'popular' },
  { id: 'minimal', name: 'Minimal', description: 'Wilson style - Simple, elegant', atsScore: 99, category: 'popular' },
  { id: 'professional', name: 'Professional', description: 'ModernCV - Corporate style', atsScore: 97, category: 'popular' },
  { id: 'swiss', name: 'Swiss', description: 'Swiss design - Ultra clean minimalist', atsScore: 98, category: 'popular' },
  
  // Professional Templates
  { id: 'executive', name: 'Executive', description: 'Senior leadership style', atsScore: 96, category: 'professional' },
  { id: 'corporate', name: 'Corporate', description: 'Fortune 500 style', atsScore: 97, category: 'professional' },
  { id: 'consultant', name: 'Consultant', description: 'McKinsey style - Consulting', atsScore: 96, category: 'professional' },
  { id: 'elegant', name: 'Elegant', description: 'Sophisticated serif design', atsScore: 95, category: 'professional' },
  { id: 'bold', name: 'Bold', description: 'Strong impactful headers', atsScore: 94, category: 'professional' },
  { id: 'legal', name: 'Legal', description: 'Law professional - Attorney style', atsScore: 97, category: 'professional' },
  
  // Creative Templates
  { id: 'creative', name: 'Creative', description: 'Modern professional design', atsScore: 93, category: 'creative' },
  { id: 'timeline', name: 'Timeline', description: 'Visual timeline journey', atsScore: 92, category: 'creative' },
  { id: 'sidebar', name: 'Sidebar', description: 'Left panel layout', atsScore: 91, category: 'creative' },
  { id: 'infographic', name: 'Infographic', description: 'Visual skills charts', atsScore: 90, category: 'creative' },
  { id: 'compact', name: 'Compact', description: 'Dense space-efficient', atsScore: 96, category: 'creative' },
  { id: 'startup', name: 'Startup', description: 'Y Combinator style', atsScore: 93, category: 'creative' },
  { id: 'gradient', name: 'Gradient', description: 'Modern gradient header', atsScore: 92, category: 'creative' },
  { id: 'boxed', name: 'Boxed', description: 'Card-based sections', atsScore: 93, category: 'creative' },
  
  // Industry Templates
  { id: 'tech', name: 'Tech', description: 'Developer-focused', atsScore: 94, category: 'industry' },
  { id: 'academic', name: 'Academic', description: 'Research & academia', atsScore: 97, category: 'industry' },
  { id: 'healthcare', name: 'Healthcare', description: 'Medical professional', atsScore: 96, category: 'industry' },
  { id: 'finance', name: 'Finance', description: 'Banking & finance', atsScore: 97, category: 'industry' },
  { id: 'marketing', name: 'Marketing', description: 'Brand-focused style', atsScore: 93, category: 'industry' },
  
  // Unique Templates
  { id: 'metro', name: 'Metro', description: 'Windows tile style', atsScore: 91, category: 'unique' },
  { id: 'retro', name: 'Retro', description: 'Vintage typewriter look', atsScore: 94, category: 'unique' },
  { id: 'architect', name: 'Architect', description: 'Blueprint technical style', atsScore: 93, category: 'unique' },
  { id: 'magazine', name: 'Magazine', description: 'Editorial layout', atsScore: 92, category: 'unique' },
  { id: 'neon', name: 'Neon', description: 'Dark mode with neon', atsScore: 89, category: 'unique' },
  { id: 'newspaper', name: 'Newspaper', description: 'Classic column layout', atsScore: 94, category: 'unique' },
];

const categories = [
  { id: 'popular', name: 'Popular', icon: '⭐' },
  { id: 'professional', name: 'Professional', icon: '💼' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
  { id: 'industry', name: 'Industry', icon: '🏢' },
  { id: 'unique', name: 'Unique', icon: '✨' },
];

const TemplatePicker: React.FC = () => {
  const { resumeInfo, updateResumeField } = useResumeInfo();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('popular');

  const currentTemplate = templates.find(t => t.id === resumeInfo.template) || templates[0];
  const filteredTemplates = templates.filter(t => t.category === activeCategory);

  const handleSelectTemplate = (templateId: ResumeTemplate) => {
    updateResumeField('template', templateId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <span>{currentTemplate.name}</span>
        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">ATS {currentTemplate.atsScore}%</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-50 w-[90vw] max-w-[520px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Choose Template</h3>
                  <p className="text-xs text-gray-500">30 ATS-friendly templates • All tested for compatibility</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ATS Optimized
                </div>
              </div>
              
              {/* Category Tabs */}
              <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-[11px]">{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className={`px-1 py-0.5 rounded-full text-[10px] ${activeCategory === cat.id ? 'bg-orange-400' : 'bg-gray-200'}`}>
                      {templates.filter(t => t.category === cat.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="p-4 max-h-[420px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template.id)}
                    className={`text-left p-3 rounded-xl border-2 transition-all hover:shadow-md group ${
                      resumeInfo.template === template.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    {/* Mini Preview */}
                    <div className="mb-2 relative">
                      <TemplateMiniPreview template={template.id} themeColor={resumeInfo.themeColor} />
                      {resumeInfo.template === template.id && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{template.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ml-1 ${
                        template.atsScore >= 95 ? 'bg-green-100 text-green-700' 
                        : template.atsScore >= 90 ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-orange-100 text-orange-700'
                      }`}>{template.atsScore}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Info */}
            <div className="p-3 bg-blue-50 border-t border-blue-100">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-medium text-blue-800">ATS Compatibility</p>
                  <p className="text-xs text-blue-600 mt-0.5">95%+ recommended for corporate. Templates with photos may score lower but look great!</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Mini preview component
const TemplateMiniPreview: React.FC<{ template: ResumeTemplate; themeColor: string }> = ({ template, themeColor }) => {
  const getPreviewStyle = (): { container: React.CSSProperties; variant: string } => {
    const styles: Record<string, { container: React.CSSProperties; variant: string }> = {
      classic: { container: { borderTop: `3px solid ${themeColor}` }, variant: 'center' },
      modern: { container: { borderLeft: `3px solid ${themeColor}` }, variant: 'left' },
      professional: { container: { borderBottom: `2px solid ${themeColor}` }, variant: 'center' },
      minimal: { container: {}, variant: 'left' },
      executive: { container: { borderTop: `2px solid #1f2937`, borderBottom: `2px solid #1f2937` }, variant: 'center' },
      tech: { container: { background: `linear-gradient(135deg, ${themeColor}15 0%, transparent 50%)` }, variant: 'left' },
      academic: { container: { borderTop: `4px double ${themeColor}` }, variant: 'center' },
      creative: { container: { borderLeft: `4px solid ${themeColor}`, borderRadius: '0 8px 8px 0' }, variant: 'left' },
      elegant: { container: { borderTop: `1px solid ${themeColor}`, borderBottom: `1px solid ${themeColor}` }, variant: 'center' },
      bold: { container: { background: `linear-gradient(180deg, ${themeColor} 0%, ${themeColor} 20%, white 20%)` }, variant: 'center-white' },
      compact: { container: { border: `1px solid #e5e7eb` }, variant: 'dense' },
      timeline: { container: { borderLeft: `2px dashed ${themeColor}` }, variant: 'timeline' },
      sidebar: { container: { background: `linear-gradient(90deg, ${themeColor}20 30%, white 30%)` }, variant: 'sidebar' },
      infographic: { container: { borderTop: `3px solid ${themeColor}` }, variant: 'infographic' },
      corporate: { container: { borderTop: `4px solid #1e3a5f` }, variant: 'center' },
      startup: { container: { borderRadius: '8px', border: `2px solid ${themeColor}` }, variant: 'left' },
      consultant: { container: { borderLeft: `4px solid #1f2937` }, variant: 'left' },
      healthcare: { container: { borderTop: `3px solid #059669` }, variant: 'center' },
      finance: { container: { borderTop: `3px solid #1e3a5f`, borderBottom: `1px solid #1e3a5f` }, variant: 'center' },
      marketing: { container: { background: `linear-gradient(135deg, ${themeColor}10 0%, #ec489920 100%)` }, variant: 'creative' },
      gradient: { container: { background: `linear-gradient(135deg, ${themeColor} 0%, #8b5cf6 100%)`, borderRadius: '8px 8px 0 0' }, variant: 'gradient' },
      boxed: { container: { border: `1px solid #e5e7eb`, borderRadius: '8px' }, variant: 'boxed' },
      metro: { container: { background: `${themeColor}15` }, variant: 'metro' },
      swiss: { container: {}, variant: 'swiss' },
      retro: { container: { background: '#fef3c7', border: '1px solid #d97706' }, variant: 'retro' },
      architect: { container: { background: '#eff6ff', border: '1px dashed #3b82f6' }, variant: 'architect' },
      magazine: { container: { borderTop: `6px solid ${themeColor}` }, variant: 'magazine' },
      neon: { container: { background: '#1a1a2e', border: `1px solid ${themeColor}` }, variant: 'neon' },
      legal: { container: { borderTop: '2px solid #1f2937', borderBottom: '1px solid #1f2937' }, variant: 'center' },
      newspaper: { container: { borderTop: '3px double #1f2937' }, variant: 'newspaper' },
    };
    return styles[template] || styles.classic;
  };

  const { container, variant } = getPreviewStyle();

  return (
    <div className="w-full h-20 bg-white rounded-lg border border-gray-200 p-1.5 overflow-hidden" style={container}>
      {variant === 'neon' ? (
        <div className="space-y-1">
          <div className="h-1.5 rounded" style={{ backgroundColor: themeColor, width: '50%' }} />
          <div className="h-1 bg-gray-600 rounded w-1/3" />
          <div className="space-y-0.5 mt-1">
            <div className="h-0.5 bg-gray-600 rounded w-full" />
            <div className="h-0.5 bg-gray-600 rounded w-4/5" />
          </div>
        </div>
      ) : variant === 'gradient' ? (
        <div className="h-full flex flex-col">
          <div className="h-3 -m-1.5 mb-1" />
          <div className="h-1.5 bg-gray-800 rounded w-1/2 mx-auto" />
          <div className="h-1 bg-gray-300 rounded w-1/3 mx-auto mt-0.5" />
        </div>
      ) : variant === 'boxed' ? (
        <div className="grid grid-cols-2 gap-1 h-full">
          <div className="bg-gray-100 rounded p-1">
            <div className="h-1 rounded w-3/4" style={{ backgroundColor: themeColor }} />
          </div>
          <div className="bg-gray-100 rounded p-1">
            <div className="h-1 bg-gray-300 rounded w-full" />
          </div>
        </div>
      ) : variant === 'metro' ? (
        <div className="grid grid-cols-3 gap-0.5 h-full">
          <div className="rounded" style={{ backgroundColor: themeColor }} />
          <div className="bg-gray-200 rounded" />
          <div className="bg-gray-300 rounded" />
        </div>
      ) : variant === 'swiss' ? (
        <div className="space-y-1">
          <div className="h-2 bg-gray-900 rounded w-2/3" />
          <div className="h-0.5 bg-gray-300 rounded w-1/2" />
          <div className="h-4 border-l-2 border-gray-900 pl-1 mt-1">
            <div className="h-0.5 bg-gray-200 rounded w-full" />
            <div className="h-0.5 bg-gray-200 rounded w-4/5 mt-0.5" />
          </div>
        </div>
      ) : variant === 'retro' ? (
        <div className="space-y-1">
          <div className="h-1.5 bg-amber-800 rounded w-3/5" style={{ fontFamily: 'monospace' }} />
          <div className="h-0.5 bg-amber-600 rounded w-2/5" />
          <div className="h-0.5 bg-amber-700 rounded w-full mt-1" />
        </div>
      ) : variant === 'newspaper' ? (
        <div className="flex gap-1 h-full">
          <div className="flex-1 space-y-0.5">
            <div className="h-1 bg-gray-800 rounded w-full" />
            <div className="h-0.5 bg-gray-300 rounded w-full" />
            <div className="h-0.5 bg-gray-300 rounded w-4/5" />
          </div>
          <div className="w-px bg-gray-300" />
          <div className="flex-1 space-y-0.5">
            <div className="h-0.5 bg-gray-300 rounded w-full" />
            <div className="h-0.5 bg-gray-300 rounded w-full" />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className={`h-1.5 rounded ${variant === 'center-white' ? 'bg-white' : ''}`} style={{ backgroundColor: variant === 'center-white' ? 'white' : themeColor, width: '50%', margin: variant.includes('center') ? '0 auto' : '0' }} />
          <div className="h-1 bg-gray-300 rounded" style={{ width: '35%', margin: variant.includes('center') ? '0 auto' : '0' }} />
          <div className="space-y-0.5 mt-1">
            <div className="h-0.5 bg-gray-200 rounded w-full" />
            <div className="h-0.5 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePicker;
