import React, { useState } from 'react';
import { useResumeInfo, Project } from '../../context/ResumeInfoContext';

const ProjectsForm: React.FC = () => {
  const { resumeInfo, updateResumeField } = useResumeInfo();

  const createEmptyProject = (): Project => ({
    id: `proj_${Date.now()}`,
    name: '',
    description: '',
    technologies: [],
    link: '',
  });

  const handleChange = (index: number, field: keyof Project, value: string | string[]) => {
    const updated = [...resumeInfo.projects];
    updated[index] = { ...updated[index], [field]: value };
    updateResumeField('projects', updated);
  };

  const handleTechChange = (index: number, techString: string) => {
    const technologies = techString.split(',').map(t => t.trim()).filter(Boolean);
    handleChange(index, 'technologies', technologies);
  };

  const addProject = () => {
    updateResumeField('projects', [...resumeInfo.projects, createEmptyProject()]);
  };

  const removeProject = (index: number) => {
    const updated = resumeInfo.projects.filter((_, i) => i !== index);
    updateResumeField('projects', updated);
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500">Showcase your best work</p>
        </div>
      </div>

      <div className="space-y-6">
        {resumeInfo.projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p>No projects added yet. Click "Add Project" to showcase your work.</p>
          </div>
        ) : (
          resumeInfo.projects.map((project, index) => (
            <div key={project.id} className="p-5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-orange-600">Project {index + 1}</span>
                <button
                  onClick={() => removeProject(index)}
                  className="text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Project Name</label>
                  <input
                    type="text"
                    value={project.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="My Awesome Project"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Link (optional)</label>
                  <input
                    type="url"
                    value={project.link || ''}
                    onChange={(e) => handleChange(index, 'link', e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="https://github.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    placeholder="Brief description of the project and your role..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Technologies (comma-separated)</label>
                  <input
                    type="text"
                    value={project.technologies.join(', ')}
                    onChange={(e) => handleTechChange(index, e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                    placeholder="React, TypeScript, Node.js, PostgreSQL"
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
          onClick={addProject}
          className="px-4 py-2.5 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all"
        >
          + Add Project
        </button>
        {resumeInfo.projects.length > 0 && (
          <button
            type="button"
            onClick={() => removeProject(resumeInfo.projects.length - 1)}
            className="px-4 py-2.5 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all"
          >
            - Remove Last
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsForm;
