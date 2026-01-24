import React, { useState } from 'react';
import { useResumeInfo, Skill } from '../../context/ResumeInfoContext';
import { generateSkillsSuggestions } from '../../services/AIResumeService';

const SkillsForm: React.FC = () => {
  const { resumeInfo, updateResumeField } = useResumeInfo();
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const createEmptySkill = (): Skill => ({
    id: `skill_${Date.now()}`,
    name: '',
    rating: 3,
  });

  const handleChange = (index: number, field: keyof Skill, value: string | number) => {
    const updated = [...resumeInfo.skills];
    updated[index] = { ...updated[index], [field]: value };
    updateResumeField('skills', updated);
  };

  const addSkill = (name?: string) => {
    const newSkill = createEmptySkill();
    if (name) {
      newSkill.name = name;
      newSkill.rating = 4;
    }
    updateResumeField('skills', [...resumeInfo.skills, newSkill]);
  };

  const removeSkill = (index: number) => {
    const updated = resumeInfo.skills.filter((_, i) => i !== index);
    updateResumeField('skills', updated);
  };

  const getSuggestions = async () => {
    if (!resumeInfo.jobTitle) {
      alert('Please add a job title first in Personal Details');
      return;
    }

    setSuggestionsLoading(true);
    try {
      const results = await generateSkillsSuggestions(resumeInfo.jobTitle);
      const existingNames = resumeInfo.skills.map(s => s.name.toLowerCase());
      const filtered = results.filter(s => !existingNames.includes(s.toLowerCase()));
      setSuggestions(filtered);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const addSuggestedSkill = (skillName: string) => {
    addSkill(skillName);
    setSuggestions(suggestions.filter(s => s !== skillName));
  };

  const renderRatingStars = (rating: number, onChange: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-orange-500' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Skills</h2>
            <p className="text-sm text-gray-500">Add your professional skills</p>
          </div>
        </div>

        <button
          type="button"
          onClick={getSuggestions}
          disabled={suggestionsLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all disabled:opacity-50"
        >
          {suggestionsLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
          Get AI Suggestions
        </button>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <p className="text-sm text-gray-600 mb-3">Suggested skills based on your job title:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((skill) => (
              <button
                key={skill}
                onClick={() => addSuggestedSkill(skill)}
                className="px-3 py-1.5 text-sm bg-white text-orange-600 rounded-full border border-orange-200 hover:bg-orange-100 transition-all flex items-center gap-1"
              >
                <span>+</span> {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {resumeInfo.skills.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No skills added yet. Click "Add Skill" or get AI suggestions to get started.</p>
          </div>
        ) : (
          resumeInfo.skills.map((skill, index) => (
            <div key={skill.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex-1">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  placeholder="Skill name"
                />
              </div>
              <div className="flex items-center gap-3">
                {renderRatingStars(skill.rating, (rating) => handleChange(index, 'rating', rating))}
                <button
                  onClick={() => removeSkill(index)}
                  className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => addSkill()}
          className="px-4 py-2.5 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all"
        >
          + Add Skill
        </button>
      </div>
    </div>
  );
};

export default SkillsForm;
