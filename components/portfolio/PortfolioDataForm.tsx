import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { PortfolioData } from '../../services/portfolioBuilderService';

interface PortfolioDataFormProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
}

const inputCls =
  'mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]';
const labelCls = 'text-xs font-semibold text-gray-600 uppercase tracking-wide';

const PortfolioDataForm: React.FC<PortfolioDataFormProps> = ({ data, onChange }) => {
  const personal = data.personal || {};
  const about = data.about || {};
  const links = data.links || {};
  const experience = data.experience || [];
  const education = data.education || [];
  const projects = data.projects || [];
  const skills = data.skills || {};

  const patch = (partial: Partial<PortfolioData>) => onChange({ ...data, ...partial });

  const setPersonal = (field: string, value: string) =>
    patch({ personal: { ...personal, [field]: value } });

  const setAbout = (field: string, value: string | string[]) =>
    patch({ about: { ...about, [field]: value } });

  const setLink = (field: string, value: string) =>
    patch({ links: { ...links, [field]: value } });

  const updateExp = (i: number, field: string, value: string) => {
    const next = [...experience];
    next[i] = { ...next[i], [field]: value };
    patch({ experience: next });
  };

  const updateExpHighlights = (i: number, text: string) => {
    const next = [...experience];
    next[i] = {
      ...next[i],
      highlights: text.split('\n').map((l) => l.trim()).filter(Boolean),
    };
    patch({ experience: next });
  };

  const addExperience = () =>
    patch({
      experience: [
        ...experience,
        { company: '', title: '', period: '', description: '', highlights: [] },
      ],
    });

  const removeExperience = (i: number) =>
    patch({ experience: experience.filter((_, idx) => idx !== i) });

  const updateEdu = (i: number, field: string, value: string) => {
    const next = [...education];
    next[i] = { ...next[i], [field]: value };
    patch({ education: next });
  };

  const addEducation = () =>
    patch({ education: [...education, { institution: '', degree: '', year: '' }] });

  const removeEducation = (i: number) =>
    patch({ education: education.filter((_, idx) => idx !== i) });

  const updateProject = (i: number, field: string, value: string) => {
    const next = [...projects];
    next[i] = { ...next[i], [field]: value };
    patch({ projects: next });
  };

  const updateProjectTech = (i: number, text: string) => {
    const next = [...projects];
    next[i] = {
      ...next[i],
      technologies: text.split(',').map((t) => t.trim()).filter(Boolean),
    };
    patch({ projects: next });
  };

  const addProject = () =>
    patch({
      projects: [
        ...projects,
        { name: '', description: '', technologies: [], url: '', github: '' },
      ],
    });

  const removeProject = (i: number) =>
    patch({ projects: projects.filter((_, idx) => idx !== i) });

  const updateSkillCategory = (cat: string, text: string) => {
    const items = text.split(',').map((s) => s.trim()).filter(Boolean);
    patch({ skills: { ...skills, [cat]: items } });
  };

  const skillCategories = Object.keys(skills);
  const defaultCats = ['frontend', 'backend', 'database', 'devops', 'other'];
  const allCats = [...new Set([...defaultCats, ...skillCategories])];

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Personal info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ['name', 'Full name'],
              ['title', 'Job title'],
              ['tagline', 'Tagline'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['location', 'Location'],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="block sm:col-span-1">
              <span className={labelCls}>{label}</span>
              <input
                className={inputCls}
                value={(personal as Record<string, string>)[field] || ''}
                onChange={(e) => setPersonal(field, e.target.value)}
              />
            </label>
          ))}
          <label className="block sm:col-span-2">
            <span className={labelCls}>Bio / summary</span>
            <textarea
              className={`${inputCls} min-h-[100px]`}
              value={personal.bio || ''}
              onChange={(e) => setPersonal('bio', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">About</h3>
        <div className="space-y-4">
          <label className="block">
            <span className={labelCls}>Headline</span>
            <input
              className={inputCls}
              value={about.headline || ''}
              onChange={(e) => setAbout('headline', e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Description</span>
            <textarea
              className={`${inputCls} min-h-[80px]`}
              value={about.description || ''}
              onChange={(e) => setAbout('description', e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelCls}>Highlights (one per line)</span>
            <textarea
              className={`${inputCls} min-h-[72px]`}
              value={(about.highlights || []).join('\n')}
              onChange={(e) =>
                setAbout(
                  'highlights',
                  e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Skills</h3>
        <p className="text-xs text-gray-500 mb-3">Comma-separated per category. AI fills missing skills from your resume.</p>
        <div className="space-y-3">
          {allCats.map((cat) => {
            const raw = skills[cat];
            const val = Array.isArray(raw)
              ? raw.map((s) => (typeof s === 'string' ? s : s.name)).join(', ')
              : '';
            return (
              <label key={cat} className="block">
                <span className={labelCls}>{cat}</span>
                <input
                  className={inputCls}
                  placeholder="e.g. React, TypeScript, Node.js"
                  value={val}
                  onChange={(e) => updateSkillCategory(cat, e.target.value)}
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Experience</h3>
          <button
            type="button"
            onClick={addExperience}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B00] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Add role
          </button>
        </div>
        {experience.length === 0 && (
          <p className="text-xs text-gray-400 mb-2">No experience yet — add a role or re-run AI from resume.</p>
        )}
        <div className="space-y-4">
          {experience.map((exp, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-400">Role {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeExperience(i)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  aria-label="Remove experience"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>Title</span>
                  <input className={inputCls} value={exp.title || ''} onChange={(e) => updateExp(i, 'title', e.target.value)} />
                </label>
                <label className="block">
                  <span className={labelCls}>Company</span>
                  <input className={inputCls} value={exp.company || ''} onChange={(e) => updateExp(i, 'company', e.target.value)} />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Period</span>
                  <input className={inputCls} value={exp.period || ''} onChange={(e) => updateExp(i, 'period', e.target.value)} placeholder="Jan 2020 — Present" />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Bullet points (one per line)</span>
                  <textarea
                    className={`${inputCls} min-h-[80px]`}
                    value={(exp.highlights || []).join('\n') || exp.description || ''}
                    onChange={(e) => updateExpHighlights(i, e.target.value)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Projects</h3>
          <button type="button" onClick={addProject} className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B00] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add project
          </button>
        </div>
        <div className="space-y-4">
          {projects.map((proj, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Project {i + 1}</span>
                <button type="button" onClick={() => removeProject(i)} className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="block">
                <span className={labelCls}>Name</span>
                <input className={inputCls} value={proj.name || ''} onChange={(e) => updateProject(i, 'name', e.target.value)} />
              </label>
              <label className="block">
                <span className={labelCls}>Description</span>
                <textarea className={`${inputCls} min-h-[72px]`} value={proj.description || ''} onChange={(e) => updateProject(i, 'description', e.target.value)} />
              </label>
              <label className="block">
                <span className={labelCls}>Technologies (comma-separated)</span>
                <input className={inputCls} value={(proj.technologies || []).join(', ')} onChange={(e) => updateProjectTech(i, e.target.value)} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>URL</span>
                  <input className={inputCls} value={proj.url || ''} onChange={(e) => updateProject(i, 'url', e.target.value)} />
                </label>
                <label className="block">
                  <span className={labelCls}>GitHub</span>
                  <input className={inputCls} value={proj.github || ''} onChange={(e) => updateProject(i, 'github', e.target.value)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Education</h3>
          <button type="button" onClick={addEducation} className="inline-flex items-center gap-1 text-xs font-medium text-[#FF6B00] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add education
          </button>
        </div>
        <div className="space-y-4">
          {education.map((edu, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block sm:col-span-1">
                <span className={labelCls}>Degree</span>
                <input className={inputCls} value={edu.degree || ''} onChange={(e) => updateEdu(i, 'degree', e.target.value)} />
              </label>
              <label className="block sm:col-span-1">
                <span className={labelCls}>Institution</span>
                <input className={inputCls} value={edu.institution || ''} onChange={(e) => updateEdu(i, 'institution', e.target.value)} />
              </label>
              <label className="block sm:col-span-1 relative">
                <span className={labelCls}>Year</span>
                <input className={inputCls} value={edu.year || ''} onChange={(e) => updateEdu(i, 'year', e.target.value)} />
                <button type="button" onClick={() => removeEducation(i)} className="absolute -top-1 right-0 p-1 text-gray-400 hover:text-red-600 sm:hidden">
                  <Trash2 className="h-4 w-4" />
                </button>
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Links</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(
            [
              ['github', 'GitHub URL'],
              ['linkedin', 'LinkedIn URL'],
              ['twitter', 'Twitter / X'],
              ['website', 'Website'],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="block">
              <span className={labelCls}>{label}</span>
              <input className={inputCls} value={(links as Record<string, string>)[field] || ''} onChange={(e) => setLink(field, e.target.value)} />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PortfolioDataForm;
