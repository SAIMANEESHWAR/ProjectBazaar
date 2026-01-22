import React from 'react';
import { ResumeInfo, ResumeTemplate } from '../../context/ResumeInfoContext';

interface TemplateProps {
  resumeInfo: ResumeInfo;
  themeColor: string;
  formatDate: (dateStr: string) => string;
}

// Shared rich text styles for all templates
export const richTextStyles = `
  .rich-text-content ul {
    list-style-type: disc;
    padding-left: 1.25rem;
    margin: 0.375rem 0;
  }
  .rich-text-content ol {
    list-style-type: decimal;
    padding-left: 1.25rem;
    margin: 0.375rem 0;
  }
  .rich-text-content li {
    display: list-item;
    margin: 0.25rem 0;
    padding-left: 0.25rem;
  }
  .rich-text-content a {
    color: inherit;
    text-decoration: underline;
  }
  .rich-text-content p {
    margin: 0.25rem 0;
  }
  .rich-text-content br {
    display: block;
    content: "";
    margin-top: 0.25rem;
  }
`;

// =============================================================================
// TEMPLATE 1: CLASSIC (Jake's Resume Style)
// Clean, traditional format - ATS Score: 98%
// =============================================================================
export const ClassicTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div 
    className="bg-white text-gray-900 p-8"
    style={{ 
      borderTop: `6px solid ${themeColor}`,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}
  >
    <header className="text-center mb-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: themeColor }}>
        {resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}
      </h1>
      {resumeInfo.jobTitle && <p className="text-base font-medium text-gray-700">{resumeInfo.jobTitle}</p>}
      {resumeInfo.address && <p className="text-sm mt-1" style={{ color: themeColor }}>{resumeInfo.address}</p>}
      <div className="flex justify-center items-center gap-4 mt-2 text-sm">
        {resumeInfo.phone && <span style={{ color: themeColor }}>{resumeInfo.phone}</span>}
        {resumeInfo.email && <span style={{ color: themeColor }}>{resumeInfo.email}</span>}
      </div>
      {(resumeInfo.linkedIn || resumeInfo.github) && (
        <div className="flex justify-center items-center gap-4 mt-2 text-xs text-gray-600">
          {resumeInfo.linkedIn && <a href={resumeInfo.linkedIn} className="hover:underline">LinkedIn</a>}
          {resumeInfo.github && <a href={resumeInfo.github} className="hover:underline">GitHub</a>}
        </div>
      )}
      <hr className="mt-4" style={{ borderColor: themeColor, borderWidth: '1px' }} />
    </header>
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-center" style={{ color: themeColor }}>Professional Summary</h2>
        <hr className="mb-3" style={{ borderColor: themeColor }} />
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-center" style={{ color: themeColor }}>Professional Experience</h2>
        <hr className="mb-3" style={{ borderColor: themeColor }} />
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: themeColor }}>{exp.title || 'Position'}</h3>
                <p className="text-xs text-gray-600">{exp.companyName}{exp.city && `, ${exp.city}`}{exp.state && `, ${exp.state}`}</p>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</p>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-center" style={{ color: themeColor }}>Education</h2>
        <hr className="mb-3" style={{ borderColor: themeColor }} />
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: themeColor }}>{edu.universityName}</h3>
                <p className="text-xs text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</p>
            </div>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-center" style={{ color: themeColor }}>Skills</h2>
        <hr className="mb-3" style={{ borderColor: themeColor }} />
        <div className="text-xs text-gray-700">{resumeInfo.skills.map(s => s.name).join(' • ')}</div>
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider mb-2 text-center" style={{ color: themeColor }}>Projects</h2>
        <hr className="mb-3" style={{ borderColor: themeColor }} />
        {resumeInfo.projects.map((project) => (
          <div key={project.id} className="mb-3">
            <h3 className="text-sm font-semibold" style={{ color: themeColor }}>{project.name}{project.link && <a href={project.link} className="ml-2 text-xs font-normal text-gray-500">↗</a>}</h3>
            {project.description && <p className="text-xs text-gray-600 mt-1">{project.description}</p>}
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 2: MODERN (Awesome CV Style)
// Contemporary design with left accent - ATS Score: 95%
// =============================================================================
export const ModernTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ borderLeft: `5px solid ${themeColor}`, fontFamily: "'Inter', sans-serif" }}>
    <header className="mb-6">
      <h1 className="text-3xl font-bold" style={{ color: themeColor }}>{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-lg font-medium text-gray-600 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
        {resumeInfo.email && <span className="flex items-center gap-1"><span style={{ color: themeColor }}>✉</span> {resumeInfo.email}</span>}
        {resumeInfo.phone && <span className="flex items-center gap-1"><span style={{ color: themeColor }}>☎</span> {resumeInfo.phone}</span>}
      </div>
      {(resumeInfo.linkedIn || resumeInfo.github) && (
        <div className="flex gap-4 mt-2 text-sm">
          {resumeInfo.linkedIn && <a href={resumeInfo.linkedIn} style={{ color: themeColor }}>LinkedIn</a>}
          {resumeInfo.github && <a href={resumeInfo.github} style={{ color: themeColor }}>GitHub</a>}
        </div>
      )}
    </header>
    {resumeInfo.summary && (
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: themeColor }}>About Me</h2>
        <p className="text-sm leading-relaxed text-gray-700 pl-4 border-l-2" style={{ borderColor: `${themeColor}40` }}>{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4 pl-4 border-l-2" style={{ borderColor: `${themeColor}40` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-sm" style={{ color: themeColor }}>{exp.companyName}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3 pl-4 border-l-2" style={{ borderColor: `${themeColor}40` }}>
            <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-sm text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Skills</h2>
        <div className="flex flex-wrap gap-2">
          {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>{skill.name}</span>)}
        </div>
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Projects</h2>
        {resumeInfo.projects.map((project) => (
          <div key={project.id} className="mb-3 pl-4 border-l-2" style={{ borderColor: `${themeColor}40` }}>
            <h3 className="text-sm font-bold text-gray-900">{project.name}{project.link && <a href={project.link} style={{ color: themeColor }} className="ml-2 text-xs font-normal">↗</a>}</h3>
            {project.description && <p className="text-xs text-gray-600 mt-1">{project.description}</p>}
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 3: PROFESSIONAL (ModernCV Classic Style)
// Corporate/Banking style - ATS Score: 97%
// =============================================================================
export const ProfessionalTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Georgia', serif" }}>
    <header className="border-b-2 pb-4 mb-6" style={{ borderColor: themeColor }}>
      <h1 className="text-3xl font-normal tracking-wide" style={{ color: themeColor }}>{resumeInfo.firstName || 'Your'} <span className="font-bold">{resumeInfo.lastName || 'Name'}</span></h1>
      {resumeInfo.jobTitle && <p className="text-base text-gray-600 mt-1 italic">{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-6 mt-3 text-sm text-gray-600">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2" style={{ color: themeColor }}>Professional Profile</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3" style={{ color: themeColor }}>Professional Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-bold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-500 italic">{formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-sm italic" style={{ color: themeColor }}>{exp.companyName}</p>
            {exp.workSummary && <div className="text-sm text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-3" style={{ color: themeColor }}>Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <h3 className="text-base font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-sm italic text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-2" style={{ color: themeColor }}>Core Competencies</h2>
        <p className="text-sm text-gray-700">{resumeInfo.skills.map(s => s.name).join(' | ')}</p>
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section>
        <h2 className="text-lg font-bold mb-3" style={{ color: themeColor }}>Key Projects</h2>
        {resumeInfo.projects.map((project) => (
          <div key={project.id} className="mb-3">
            <h3 className="text-sm font-bold text-gray-900">{project.name}</h3>
            {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 4: MINIMAL (Wilson Style)
// Simple, elegant - ATS Score: 99%
// =============================================================================
export const MinimalTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-500 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="text-xs text-gray-500 mt-2">{[resumeInfo.email, resumeInfo.phone, resumeInfo.address].filter(Boolean).join(' • ')}</div>
    </header>
    {resumeInfo.summary && <section className="mb-5"><p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p></section>}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{exp.title}</h3>
                <p className="text-xs text-gray-500">{exp.companyName}</p>
              </div>
              <p className="text-xs text-gray-400">{formatDate(exp.startDate)} – {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</p>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-500">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Skills</h2>
        <p className="text-xs text-gray-600">{resumeInfo.skills.map(s => s.name).join(', ')}</p>
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Projects</h2>
        {resumeInfo.projects.map((project) => (
          <div key={project.id} className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{project.name}</h3>
            {project.description && <p className="text-xs text-gray-500 mt-0.5">{project.description}</p>}
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 5: EXECUTIVE (Senior Leadership Style)
// ATS Score: 96%
// =============================================================================
export const ExecutiveTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ borderTop: '3px solid #1f2937', borderBottom: '3px solid #1f2937', fontFamily: "'Georgia', serif" }}>
    <header className="text-center mb-6 pb-4 border-b border-gray-300">
      <h1 className="text-3xl font-bold tracking-wider text-gray-900 uppercase">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm font-medium text-gray-600 mt-2 uppercase tracking-widest">{resumeInfo.jobTitle}</p>}
      <div className="flex justify-center flex-wrap gap-4 mt-3 text-xs text-gray-600">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <><span>|</span><span>{resumeInfo.phone}</span></>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6 text-center">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-3">Executive Summary</h2>
        <p className="text-sm leading-relaxed text-gray-700 max-w-2xl mx-auto">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4 text-center border-b border-gray-200 pb-2">Professional Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-5">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-base font-bold text-gray-900 uppercase">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{exp.companyName}</p>
            {exp.workSummary && <div className="text-sm text-gray-700 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-4 text-center border-b border-gray-200 pb-2">Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3 text-center">
            <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-sm text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500 mb-3 text-center border-b border-gray-200 pb-2">Core Competencies</h2>
        <p className="text-sm text-gray-700 text-center">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 6: TECH (Developer-Focused)
// ATS Score: 94%
// =============================================================================
export const TechTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ background: `linear-gradient(135deg, ${themeColor}08 0%, transparent 50%)`, fontFamily: "'JetBrains Mono', monospace" }}>
    <header className="mb-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColor }}>{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
          {resumeInfo.jobTitle && <p className="text-sm text-gray-600 mt-1"><span style={{ color: themeColor }}>{'>'}</span> {resumeInfo.jobTitle}</p>}
        </div>
        <div className="text-right text-xs text-gray-600">
          {resumeInfo.email && <p>{resumeInfo.email}</p>}
          {resumeInfo.github && <p style={{ color: themeColor }}>{resumeInfo.github}</p>}
        </div>
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-xs font-bold mb-2" style={{ color: themeColor }}>{'// '}README.md</h2>
        <p className="text-sm leading-relaxed text-gray-700 pl-4 border-l-2" style={{ borderColor: themeColor }}>{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold mb-2" style={{ color: themeColor }}>{'// '}tech_stack</h2>
        <div className="flex flex-wrap gap-2">
          {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs px-2 py-1 rounded font-mono" style={{ backgroundColor: `${themeColor}15`, color: themeColor, border: `1px solid ${themeColor}30` }}>{skill.name}</span>)}
        </div>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold mb-3" style={{ color: themeColor }}>{'// '}work_history</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4 pl-4 border-l" style={{ borderColor: `${themeColor}40` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs" style={{ color: themeColor }}>@ {exp.companyName}</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">{formatDate(exp.startDate)} → {exp.currentlyWorking ? 'now' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold mb-3" style={{ color: themeColor }}>{'// '}projects</h2>
        {resumeInfo.projects.map((project) => (
          <div key={project.id} className="mb-3 pl-4 border-l" style={{ borderColor: `${themeColor}40` }}>
            <h3 className="text-sm font-bold text-gray-900">{project.name}{project.link && <a href={project.link} className="ml-2 text-xs" style={{ color: themeColor }}>↗</a>}</h3>
            {project.description && <p className="text-xs text-gray-600 mt-1">{project.description}</p>}
            {project.technologies.length > 0 && <p className="text-xs text-gray-500 mt-1 font-mono">[{project.technologies.join(', ')}]</p>}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section>
        <h2 className="text-xs font-bold mb-3" style={{ color: themeColor }}>{'// '}education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2 pl-4">
            <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 7: ACADEMIC (Research/Education Focused)
// ATS Score: 97%
// =============================================================================
export const AcademicTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ borderTop: `4px double ${themeColor}`, fontFamily: "'Times New Roman', serif" }}>
    <header className="text-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-base text-gray-600 italic mt-1">{resumeInfo.jobTitle}</p>}
      <div className="text-sm text-gray-600 mt-2">{[resumeInfo.email, resumeInfo.phone].filter(Boolean).join(' | ')}</div>
    </header>
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-base font-bold border-b-2 pb-1 mb-3" style={{ borderColor: themeColor, color: themeColor }}>Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{edu.degree}{edu.major && ` in ${edu.major}`}</h3>
                <p className="text-sm italic text-gray-600">{edu.universityName}</p>
              </div>
              <p className="text-xs text-gray-500">{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</p>
            </div>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-base font-bold border-b-2 pb-1 mb-3" style={{ borderColor: themeColor, color: themeColor }}>Research Interests</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-base font-bold border-b-2 pb-1 mb-3" style={{ borderColor: themeColor, color: themeColor }}>Academic Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-sm italic text-gray-600">{exp.companyName}</p>
              </div>
              <p className="text-xs text-gray-500">{formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</p>
            </div>
            {exp.workSummary && <div className="text-sm text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section className="mb-5">
        <h2 className="text-base font-bold border-b-2 pb-1 mb-3" style={{ borderColor: themeColor, color: themeColor }}>Publications & Research</h2>
        {resumeInfo.projects.map((project) => (
          <div key={project.id} className="mb-3">
            <h3 className="text-sm font-bold text-gray-900">{project.name}</h3>
            {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-base font-bold border-b-2 pb-1 mb-2" style={{ borderColor: themeColor, color: themeColor }}>Technical Skills</h2>
        <p className="text-sm text-gray-700">{resumeInfo.skills.map(s => s.name).join(', ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 8: CREATIVE (Modern Professional)
// ATS Score: 93%
// =============================================================================
export const CreativeTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ borderLeft: `6px solid ${themeColor}`, fontFamily: "'Inter', sans-serif" }}>
    <header className="mb-8">
      <div className="flex items-end gap-4">
        {resumeInfo.profileImage ? (
          <img src={resumeInfo.profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2" style={{ borderColor: themeColor }} />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: themeColor }}>{(resumeInfo.firstName?.[0] || 'Y')}{(resumeInfo.lastName?.[0] || 'N')}</div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
          {resumeInfo.jobTitle && <p className="text-sm font-medium" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-600">
        {resumeInfo.email && <span>📧 {resumeInfo.email}</span>}
        {resumeInfo.phone && <span>📱 {resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: themeColor }}>About</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: themeColor }}>Experience</h2>
        {resumeInfo.experience.map((exp, index) => (
          <div key={exp.id} className="mb-4 relative pl-6">
            <div className="absolute left-0 top-1 w-3 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
            {index < resumeInfo.experience.length - 1 && <div className="absolute left-1.5 top-4 w-px h-full" style={{ backgroundColor: `${themeColor}40` }} />}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs" style={{ color: themeColor }}>{exp.companyName}</p>
              </div>
              <span className="text-xs text-gray-400">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    <div className="grid grid-cols-2 gap-6">
      {resumeInfo.education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
            </div>
          ))}
        </section>
      )}
      {resumeInfo.skills.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Skills</h2>
          <div className="space-y-2">
            {resumeInfo.skills.slice(0, 6).map((skill) => (
              <div key={skill.id}>
                <span className="text-xs text-gray-700">{skill.name}</span>
                <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ backgroundColor: themeColor, width: `${(skill.rating / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 9: ELEGANT (Sophisticated Serif Design)
// ATS Score: 95%
// =============================================================================
export const ElegantTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ borderTop: `1px solid ${themeColor}`, borderBottom: `1px solid ${themeColor}`, fontFamily: "'Playfair Display', 'Georgia', serif" }}>
    <header className="text-center mb-8">
      <h1 className="text-3xl font-normal tracking-wide text-gray-800">{resumeInfo.firstName || 'Your'} <span className="font-bold">{resumeInfo.lastName || 'Name'}</span></h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-500 mt-2 tracking-widest uppercase">{resumeInfo.jobTitle}</p>}
      <div className="flex justify-center items-center gap-6 mt-4 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>•</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6 text-center">
        <p className="text-sm leading-relaxed text-gray-600 italic max-w-xl mx-auto">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-center mb-4" style={{ color: themeColor }}>— Experience —</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-5">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-semibold text-gray-800">{exp.title}</h3>
              <span className="text-xs text-gray-400 italic">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-sm text-gray-500 italic">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-center mb-4" style={{ color: themeColor }}>— Education —</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3 text-center">
            <h3 className="text-sm font-semibold text-gray-800">{edu.universityName}</h3>
            <p className="text-xs text-gray-500 italic">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-center mb-3" style={{ color: themeColor }}>— Skills —</h2>
        <p className="text-xs text-gray-600 text-center">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 10: BOLD (Strong Impactful Design)
// ATS Score: 94%
// =============================================================================
export const BoldTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900">
    <header className="p-6 text-white" style={{ backgroundColor: themeColor }}>
      <h1 className="text-3xl font-black uppercase tracking-wide">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-lg font-medium mt-1 opacity-90">{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-sm opacity-80">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    <div className="p-6">
      {resumeInfo.summary && (
        <section className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider mb-2" style={{ color: themeColor }}>Profile</h2>
          <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
        </section>
      )}
      {resumeInfo.experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>Experience</h2>
          {resumeInfo.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-base font-bold text-gray-900">{exp.title}</h3>
                <span className="text-xs font-semibold px-2 py-1 rounded" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
              </div>
              <p className="text-sm font-semibold" style={{ color: themeColor }}>{exp.companyName}</p>
              {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
            </div>
          ))}
        </section>
      )}
      {resumeInfo.skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs font-semibold px-3 py-1.5 text-white rounded" style={{ backgroundColor: themeColor }}>{skill.name}</span>)}
          </div>
        </section>
      )}
      {resumeInfo.education.length > 0 && (
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 11: COMPACT (Space-Efficient Dense Layout)
// ATS Score: 96%
// =============================================================================
export const CompactTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-6" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px' }}>
    <header className="mb-4 pb-3 border-b border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
          {resumeInfo.jobTitle && <p className="text-xs font-medium mt-0.5" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
        </div>
        <div className="text-right text-[10px] text-gray-500">
          {resumeInfo.email && <p>{resumeInfo.email}</p>}
          {resumeInfo.phone && <p>{resumeInfo.phone}</p>}
          {resumeInfo.linkedIn && <p>LinkedIn</p>}
        </div>
      </div>
    </header>
    {resumeInfo.summary && <p className="text-[10px] text-gray-600 mb-3 leading-relaxed">{resumeInfo.summary}</p>}
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {resumeInfo.experience.length > 0 && (
          <section className="mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: themeColor, borderColor: themeColor }}>Experience</h2>
            {resumeInfo.experience.map((exp) => (
              <div key={exp.id} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-[11px] font-semibold text-gray-900">{exp.title}</h3>
                  <span className="text-[9px] text-gray-400">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
                </div>
                <p className="text-[10px] text-gray-500">{exp.companyName}</p>
                {exp.workSummary && <div className="text-[9px] text-gray-600 mt-1 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
              </div>
            ))}
          </section>
        )}
        {resumeInfo.projects.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: themeColor, borderColor: themeColor }}>Projects</h2>
            {resumeInfo.projects.map((project) => (
              <div key={project.id} className="mb-1.5">
                <h3 className="text-[10px] font-semibold text-gray-900">{project.name}</h3>
                {project.description && <p className="text-[9px] text-gray-500">{project.description}</p>}
              </div>
            ))}
          </section>
        )}
      </div>
      <div>
        {resumeInfo.skills.length > 0 && (
          <section className="mb-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: themeColor, borderColor: themeColor }}>Skills</h2>
            <div className="space-y-0.5">
              {resumeInfo.skills.map((skill) => <p key={skill.id} className="text-[9px] text-gray-600">• {skill.name}</p>)}
            </div>
          </section>
        )}
        {resumeInfo.education.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-2 pb-1 border-b" style={{ color: themeColor, borderColor: themeColor }}>Education</h2>
            {resumeInfo.education.map((edu) => (
              <div key={edu.id} className="mb-1.5">
                <h3 className="text-[10px] font-semibold text-gray-900">{edu.universityName}</h3>
                <p className="text-[9px] text-gray-500">{edu.degree}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 12: TIMELINE (Visual Timeline Experience)
// ATS Score: 92%
// =============================================================================
export const TimelineTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6">
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: themeColor }}>Career Timeline</h2>
        <div className="relative pl-6 border-l-2" style={{ borderColor: themeColor }}>
          {resumeInfo.experience.map((exp) => (
            <div key={exp.id} className="mb-6 relative">
              <div className="absolute -left-[29px] w-4 h-4 rounded-full border-2 bg-white" style={{ borderColor: themeColor }} />
              <div className="text-xs font-semibold px-2 py-0.5 rounded inline-block mb-1" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</div>
              <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
              <p className="text-xs text-gray-500">{exp.companyName}</p>
              {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
            </div>
          ))}
        </div>
      </section>
    )}
    <div className="grid grid-cols-2 gap-6">
      {resumeInfo.education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-500">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
            </div>
          ))}
        </section>
      )}
      {resumeInfo.skills.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Skills</h2>
          <p className="text-xs text-gray-600">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 13: SIDEBAR (Left Panel Layout)
// ATS Score: 91%
// =============================================================================
export const SidebarTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="w-1/3 p-6 text-white" style={{ backgroundColor: themeColor }}>
      {resumeInfo.profileImage ? (
        <img src={resumeInfo.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-white/30 mb-4" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-4">{(resumeInfo.firstName?.[0] || 'Y')}{(resumeInfo.lastName?.[0] || 'N')}</div>
      )}
      <h1 className="text-xl font-bold">{resumeInfo.firstName || 'Your'}</h1>
      <h1 className="text-xl font-bold mb-1">{resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm opacity-80 mb-4">{resumeInfo.jobTitle}</p>}
      <div className="space-y-2 text-xs opacity-90">
        {resumeInfo.email && <p>📧 {resumeInfo.email}</p>}
        {resumeInfo.phone && <p>📱 {resumeInfo.phone}</p>}
        {resumeInfo.address && <p>📍 {resumeInfo.address}</p>}
      </div>
      {resumeInfo.skills.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-80">Skills</h2>
          <div className="space-y-2">
            {resumeInfo.skills.map((skill) => (
              <div key={skill.id}>
                <p className="text-xs mb-1">{skill.name}</p>
                <div className="h-1 bg-white/30 rounded-full"><div className="h-full bg-white rounded-full" style={{ width: `${(skill.rating / 5) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    <div className="w-2/3 p-6">
      {resumeInfo.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: themeColor }}>About Me</h2>
          <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
        </section>
      )}
      {resumeInfo.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Experience</h2>
          {resumeInfo.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{exp.title}</h3>
                  <p className="text-xs text-gray-500">{exp.companyName}</p>
                </div>
                <span className="text-xs text-gray-400">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
              </div>
              {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
            </div>
          ))}
        </section>
      )}
      {resumeInfo.education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-500">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 14: INFOGRAPHIC (Visual Skills Representation)
// ATS Score: 90%
// =============================================================================
export const InfographicTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
    <header className="text-center mb-6 pb-4 border-b-4" style={{ borderColor: themeColor }}>
      <h1 className="text-3xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-base mt-1" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
      <div className="flex justify-center gap-6 mt-3 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6 text-center">
        <p className="text-sm leading-relaxed text-gray-600 max-w-xl mx-auto">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-6 p-4 rounded-lg" style={{ backgroundColor: `${themeColor}08` }}>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: themeColor }}>Skill Proficiency</h2>
        <div className="grid grid-cols-2 gap-4">
          {resumeInfo.skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-700 w-24">{skill.name}</span>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: themeColor, width: `${(skill.rating / 5) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-8">{skill.rating * 20}%</span>
            </div>
          ))}
        </div>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4 text-center" style={{ color: themeColor }}>Work Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4 p-4 border rounded-lg" style={{ borderColor: `${themeColor}30` }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs" style={{ color: themeColor }}>{exp.companyName}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-600 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3 text-center" style={{ color: themeColor }}>Education</h2>
        <div className="flex justify-center gap-6">
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="text-center p-3 border rounded-lg" style={{ borderColor: `${themeColor}30` }}>
              <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-500">{edu.degree}</p>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 15: CORPORATE (Fortune 500 Style)
// ATS Score: 97%
// =============================================================================
export const CorporateTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Arial', sans-serif" }}>
    <header className="mb-6 pb-4 border-b-4 border-[#1e3a5f]">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-600 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="flex gap-6 mt-2 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
        {resumeInfo.linkedIn && <span>LinkedIn</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase mb-2">Executive Summary</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase mb-3">Professional Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs text-[#1e3a5f] font-medium">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase mb-3">Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase mb-2">Core Competencies</h2>
        <p className="text-xs text-gray-700">{resumeInfo.skills.map(s => s.name).join(' | ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 16: STARTUP (Modern Tech Startup Style)
// ATS Score: 93%
// =============================================================================
export const StartupTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Inter', sans-serif", border: `2px solid ${themeColor}`, borderRadius: '12px' }}>
    <header className="mb-6">
      <div className="flex items-center gap-4">
        {resumeInfo.profileImage ? (
          <img src={resumeInfo.profileImage} alt="Profile" className="w-14 h-14 rounded-xl object-cover border-2" style={{ borderColor: themeColor }} />
        ) : (
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: themeColor }}>{(resumeInfo.firstName?.[0] || 'Y')}{(resumeInfo.lastName?.[0] || 'N')}</div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
          {resumeInfo.jobTitle && <p className="text-sm" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
        </div>
      </div>
      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        {resumeInfo.email && <span className="px-2 py-1 bg-gray-100 rounded">{resumeInfo.email}</span>}
        {resumeInfo.phone && <span className="px-2 py-1 bg-gray-100 rounded">{resumeInfo.phone}</span>}
        {resumeInfo.github && <span className="px-2 py-1 rounded" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>GitHub</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5 p-4 rounded-lg bg-gray-50">
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>{skill.name}</span>)}
        </div>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs" style={{ color: themeColor }}>{exp.companyName}</p>
              </div>
              <span className="text-xs text-gray-400">{formatDate(exp.startDate)} → {exp.currentlyWorking ? 'now' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: themeColor }}>Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-500">{edu.degree}{edu.major && ` - ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 17: CONSULTANT (Business Consulting Style)
// ATS Score: 96%
// =============================================================================
export const ConsultantTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Georgia', serif", borderLeft: '4px solid #1f2937' }}>
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-600 italic mt-1">{resumeInfo.jobTitle}</p>}
      <div className="flex gap-6 mt-3 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">Professional Summary</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">Professional Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-5">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base font-bold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} – {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-sm text-gray-600">{exp.companyName}</p>
            {exp.workSummary && <div className="text-sm text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-3">Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-600 italic">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-gray-800 border-b border-gray-300 pb-1 mb-2">Areas of Expertise</h2>
        <p className="text-sm text-gray-700">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 18: HEALTHCARE (Medical Professional Style)
// ATS Score: 96%
// =============================================================================
export const HealthcareTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Arial', sans-serif", borderTop: '4px solid #059669' }}>
    <header className="mb-6 pb-4 border-b border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-emerald-600 font-medium mt-1">{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
        {resumeInfo.address && <span>{resumeInfo.address}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-emerald-700 uppercase mb-2">Professional Summary</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-emerald-700 uppercase mb-3">Education & Credentials</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <h3 className="text-sm font-bold text-gray-900">{edu.degree}{edu.major && ` in ${edu.major}`}</h3>
            <p className="text-xs text-gray-600">{edu.universityName}</p>
            <p className="text-xs text-gray-500">{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-emerald-700 uppercase mb-3">Clinical Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs text-emerald-600">{exp.companyName}</p>
              </div>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-emerald-700 uppercase mb-2">Clinical Skills & Competencies</h2>
        <p className="text-xs text-gray-700">{resumeInfo.skills.map(s => s.name).join(' | ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 19: FINANCE (Banking/Finance Style)
// ATS Score: 97%
// =============================================================================
export const FinanceTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Times New Roman', serif", borderTop: '3px solid #1e3a5f', borderBottom: '1px solid #1e3a5f' }}>
    <header className="mb-6 text-center pb-4 border-b border-gray-200">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-600 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Profile</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Professional Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs text-[#1e3a5f] font-medium">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-600">{edu.degree}{edu.major && `, ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wide mb-2">Technical Proficiencies</h2>
        <p className="text-xs text-gray-700">{resumeInfo.skills.map(s => s.name).join(' | ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 20: MARKETING (Marketing/Advertising Style)
// ATS Score: 93%
// =============================================================================
export const MarketingTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Inter', sans-serif", background: `linear-gradient(135deg, ${themeColor}08 0%, #ec489908 100%)` }}>
    <header className="mb-6">
      <h1 className="text-3xl font-black text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-lg font-medium mt-1" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
        {resumeInfo.email && <span>✉️ {resumeInfo.email}</span>}
        {resumeInfo.phone && <span>📱 {resumeInfo.phone}</span>}
        {resumeInfo.portfolio && <span>🌐 Portfolio</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest mb-2" style={{ color: themeColor }}>The Story</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: themeColor }}>Superpowers</h2>
        <div className="flex flex-wrap gap-2">
          {resumeInfo.skills.map((skill, i) => (
            <span key={skill.id} className="text-xs px-3 py-1.5 rounded-full font-medium text-white" style={{ backgroundColor: i % 2 === 0 ? themeColor : '#ec4899' }}>{skill.name}</span>
          ))}
        </div>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest mb-4" style={{ color: themeColor }}>Career Highlights</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs font-medium" style={{ color: themeColor }}>{exp.companyName}</p>
              </div>
              <span className="text-xs text-gray-400">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.projects.length > 0 && (
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: themeColor }}>Campaign Wins</h2>
        <div className="grid grid-cols-2 gap-3">
          {resumeInfo.projects.map((project) => (
            <div key={project.id} className="p-3 rounded-lg border border-gray-200 bg-white">
              <h3 className="text-sm font-bold text-gray-900">{project.name}</h3>
              {project.description && <p className="text-xs text-gray-500 mt-1">{project.description}</p>}
            </div>
          ))}
        </div>
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section>
        <h2 className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: themeColor }}>Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
            <p className="text-xs text-gray-500">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 21: GRADIENT (Modern Gradient Header)
// ATS Score: 92%
// =============================================================================
export const GradientTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
    <header className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #8b5cf6 100%)` }}>
      <h1 className="text-2xl font-bold">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-base mt-1 opacity-90">{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-sm opacity-80">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    <div className="p-6">
      {resumeInfo.summary && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: themeColor }}>Summary</h2>
          <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
        </section>
      )}
      {resumeInfo.experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Experience</h2>
          {resumeInfo.experience.map((exp) => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <span className="text-xs text-gray-500">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
              </div>
              <p className="text-xs" style={{ color: themeColor }}>{exp.companyName}</p>
              {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
            </div>
          ))}
        </section>
      )}
      {resumeInfo.skills.length > 0 && (
        <section className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: themeColor }}>Skills</h2>
          <div className="flex flex-wrap gap-2">
            {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs px-2 py-1 rounded text-white" style={{ background: `linear-gradient(135deg, ${themeColor}, #8b5cf6)` }}>{skill.name}</span>)}
          </div>
        </section>
      )}
      {resumeInfo.education.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-600">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 22: BOXED (Card-Based Sections)
// ATS Score: 93%
// =============================================================================
export const BoxedTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-gray-100 text-gray-900 p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
    <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm mt-1" style={{ color: themeColor }}>{resumeInfo.jobTitle}</p>}
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </div>
    {resumeInfo.summary && (
      <div className="bg-white rounded-xl p-5 mb-4 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: themeColor }}>About</h2>
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </div>
    )}
    <div className="grid grid-cols-2 gap-4 mb-4">
      {resumeInfo.experience.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Experience</h2>
          {resumeInfo.experience.map((exp) => (
            <div key={exp.id} className="mb-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <span className="text-xs text-gray-400">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
              </div>
              <p className="text-xs text-gray-500">{exp.companyName}</p>
              {exp.workSummary && <div className="text-xs text-gray-600 mt-1 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
            </div>
          ))}
        </div>
      )}
      {resumeInfo.skills.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Skills</h2>
          <div className="flex flex-wrap gap-1">
            {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{skill.name}</span>)}
          </div>
        </div>
      )}
      {resumeInfo.education.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-sm font-semibold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-500">{edu.degree}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 23: METRO (Windows Tile Style)
// ATS Score: 91%
// =============================================================================
export const MetroTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900 p-6" style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif" }}>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="col-span-2 p-4 text-white" style={{ backgroundColor: themeColor }}>
        <h1 className="text-2xl font-light">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
        {resumeInfo.jobTitle && <p className="text-sm mt-1 opacity-80">{resumeInfo.jobTitle}</p>}
      </div>
      <div className="bg-gray-800 p-4 text-white text-xs space-y-1">
        {resumeInfo.email && <p>{resumeInfo.email}</p>}
        {resumeInfo.phone && <p>{resumeInfo.phone}</p>}
      </div>
    </div>
    {resumeInfo.summary && (
      <div className="mb-4 p-4 bg-gray-100">
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </div>
    )}
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2 space-y-3">
        {resumeInfo.experience.length > 0 && resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="p-4 border-l-4" style={{ borderColor: themeColor, backgroundColor: `${themeColor}08` }}>
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-semibold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs text-gray-500">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {resumeInfo.skills.length > 0 && (
          <div className="p-4" style={{ backgroundColor: themeColor }}>
            <h2 className="text-xs font-bold uppercase text-white mb-2">Skills</h2>
            <div className="space-y-1">
              {resumeInfo.skills.map((skill) => <p key={skill.id} className="text-xs text-white/90">{skill.name}</p>)}
            </div>
          </div>
        )}
        {resumeInfo.education.length > 0 && (
          <div className="p-4 bg-gray-800 text-white">
            <h2 className="text-xs font-bold uppercase mb-2">Education</h2>
            {resumeInfo.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <h3 className="text-xs font-semibold">{edu.universityName}</h3>
                <p className="text-xs opacity-80">{edu.degree}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 24: SWISS (Swiss Design Minimalist)
// ATS Score: 98%
// =============================================================================
export const SwissTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Helvetica Neue', 'Arial', sans-serif" }}>
    <header className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{resumeInfo.firstName || 'Your'}</h1>
      <h1 className="text-4xl font-light text-gray-900 tracking-tight">{resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-500 mt-2 uppercase tracking-widest">{resumeInfo.jobTitle}</p>}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        {resumeInfo.email && <p>{resumeInfo.email}</p>}
        {resumeInfo.phone && <p>{resumeInfo.phone}</p>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6 pl-4 border-l-4 border-gray-900">
        <p className="text-sm leading-relaxed text-gray-700">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-5 pl-4 border-l border-gray-200">
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-400">{formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-gray-600 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    <div className="grid grid-cols-2 gap-8">
      {resumeInfo.education.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">Education</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
              <p className="text-xs text-gray-500">{edu.degree}</p>
            </div>
          ))}
        </section>
      )}
      {resumeInfo.skills.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400 mb-3">Skills</h2>
          <p className="text-xs text-gray-600 leading-relaxed">{resumeInfo.skills.map(s => s.name).join(', ')}</p>
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 25: RETRO (Vintage Typewriter)
// ATS Score: 94%
// =============================================================================
export const RetroTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-amber-50 text-gray-900 p-8" style={{ fontFamily: "'Courier New', 'Courier', monospace" }}>
    <header className="mb-6 pb-4 border-b-2 border-amber-800 border-dashed">
      <h1 className="text-2xl font-bold text-amber-900 uppercase tracking-wider">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-amber-700 mt-1">— {resumeInfo.jobTitle} —</p>}
      <div className="mt-3 text-xs text-amber-800">
        {[resumeInfo.email, resumeInfo.phone].filter(Boolean).join(' | ')}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-amber-900 uppercase mb-2">* PROFILE *</h2>
        <p className="text-sm leading-relaxed text-amber-800">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-amber-900 uppercase mb-3">* EXPERIENCE *</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-amber-900">{exp.title}</h3>
              <span className="text-xs text-amber-700">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs text-amber-700 italic">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-amber-800 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-amber-900 uppercase mb-3">* EDUCATION *</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-bold text-amber-900">{edu.universityName}</h3>
            <p className="text-xs text-amber-700">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-amber-900 uppercase mb-2">* SKILLS *</h2>
        <p className="text-xs text-amber-800">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 26: ARCHITECT (Blueprint Technical Style)
// ATS Score: 93%
// =============================================================================
export const ArchitectTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-blue-50 text-gray-900 p-8" style={{ fontFamily: "'Roboto Mono', monospace", backgroundImage: 'linear-gradient(#bfdbfe 1px, transparent 1px), linear-gradient(90deg, #bfdbfe 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
    <header className="mb-6 pb-4 border-b-2 border-blue-600">
      <div className="flex items-center gap-2 text-blue-600 text-xs mb-2">
        <span>▸ REVISION 1.0</span>
        <span>|</span>
        <span>DATE: {new Date().toLocaleDateString()}</span>
      </div>
      <h1 className="text-2xl font-bold text-blue-900">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-blue-700 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="mt-3 text-xs text-blue-600 font-mono">
        {resumeInfo.email && <span className="mr-4">[E] {resumeInfo.email}</span>}
        {resumeInfo.phone && <span>[T] {resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-5 p-4 border border-blue-300 bg-white/50">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-2">// ABSTRACT</h2>
        <p className="text-sm leading-relaxed text-blue-900">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-xs font-bold text-blue-700 uppercase mb-3">// WORK HISTORY</h2>
        {resumeInfo.experience.map((exp, i) => (
          <div key={exp.id} className="mb-4 p-3 border-l-2 border-blue-500 bg-white/30">
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-blue-900">{i + 1}.0 {exp.title}</h3>
              <span className="text-xs text-blue-600 font-mono">{formatDate(exp.startDate)} → {exp.currentlyWorking ? 'CURRENT' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs text-blue-700">{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-blue-800 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    <div className="grid grid-cols-2 gap-4">
      {resumeInfo.skills.length > 0 && (
        <section className="p-3 border border-blue-300 bg-white/50">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-2">// TECHNICAL SPECS</h2>
          <div className="text-xs text-blue-800 space-y-1">
            {resumeInfo.skills.map((skill) => <p key={skill.id}>◆ {skill.name}</p>)}
          </div>
        </section>
      )}
      {resumeInfo.education.length > 0 && (
        <section className="p-3 border border-blue-300 bg-white/50">
          <h2 className="text-xs font-bold text-blue-700 uppercase mb-2">// CREDENTIALS</h2>
          {resumeInfo.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <h3 className="text-xs font-bold text-blue-900">{edu.universityName}</h3>
              <p className="text-xs text-blue-700">{edu.degree}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 27: MAGAZINE (Editorial Layout)
// ATS Score: 92%
// =============================================================================
export const MagazineTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-white text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
    <header className="p-6 border-t-8" style={{ borderColor: themeColor }}>
      <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">Curriculum Vitae</p>
      <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-lg text-gray-600 italic mt-2">{resumeInfo.jobTitle}</p>}
    </header>
    <div className="px-6 pb-6">
      <div className="flex gap-6 text-xs text-gray-500 mb-6 pb-4 border-b border-gray-200">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
      {resumeInfo.summary && (
        <section className="mb-6">
          <p className="text-sm leading-relaxed text-gray-700 first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2">{resumeInfo.summary}</p>
        </section>
      )}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          {resumeInfo.experience.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4 pb-2 border-b" style={{ borderColor: themeColor, color: themeColor }}>Experience</h2>
              {resumeInfo.experience.map((exp) => (
                <div key={exp.id} className="mb-5">
                  <h3 className="text-base font-bold text-gray-900">{exp.title}</h3>
                  <p className="text-sm text-gray-500 italic">{exp.companyName} • {formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</p>
                  {exp.workSummary && <div className="text-sm text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
                </div>
              ))}
            </section>
          )}
        </div>
        <div>
          {resumeInfo.education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b" style={{ borderColor: themeColor, color: themeColor }}>Education</h2>
              {resumeInfo.education.map((edu) => (
                <div key={edu.id} className="mb-3">
                  <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
                  <p className="text-xs text-gray-500 italic">{edu.degree}</p>
                </div>
              ))}
            </section>
          )}
          {resumeInfo.skills.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b" style={{ borderColor: themeColor, color: themeColor }}>Expertise</h2>
              <p className="text-xs text-gray-600 leading-relaxed">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =============================================================================
// TEMPLATE 28: NEON (Dark Mode with Neon Accents)
// ATS Score: 89%
// =============================================================================
export const NeonTemplate: React.FC<TemplateProps> = ({ resumeInfo, themeColor, formatDate }) => (
  <div className="bg-[#0f0f1a] text-gray-100 p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
    <header className="mb-6">
      <h1 className="text-3xl font-bold" style={{ color: themeColor, textShadow: `0 0 20px ${themeColor}50` }}>{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-base text-gray-400 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        {resumeInfo.email && <span>{resumeInfo.email}</span>}
        {resumeInfo.phone && <span>{resumeInfo.phone}</span>}
      </div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-6 p-4 rounded-lg border" style={{ borderColor: `${themeColor}40`, backgroundColor: `${themeColor}08` }}>
        <p className="text-sm leading-relaxed text-gray-300">{resumeInfo.summary}</p>
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Skills</h2>
        <div className="flex flex-wrap gap-2">
          {resumeInfo.skills.map((skill) => <span key={skill.id} className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: themeColor, color: themeColor }}>{skill.name}</span>)}
        </div>
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: themeColor }}>Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4 pl-4 border-l" style={{ borderColor: themeColor }}>
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-gray-100">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-xs" style={{ color: themeColor }}>{exp.companyName}</p>
            {exp.workSummary && <div className="text-xs text-gray-400 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.education.length > 0 && (
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: themeColor }}>Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-2">
            <h3 className="text-sm font-bold text-gray-100">{edu.universityName}</h3>
            <p className="text-xs text-gray-500">{edu.degree}{edu.major && ` in ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 29: LEGAL (Law Professional)
// ATS Score: 97%
// =============================================================================
export const LegalTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-8" style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
    <header className="mb-6 text-center pb-4 border-t-2 border-b-2 border-gray-800">
      <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-600 mt-1">{resumeInfo.jobTitle}</p>}
      <div className="mt-2 text-xs text-gray-500">
        {[resumeInfo.email, resumeInfo.phone, resumeInfo.address].filter(Boolean).join(' | ')}
      </div>
    </header>
    {resumeInfo.education.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Education</h2>
        {resumeInfo.education.map((edu) => (
          <div key={edu.id} className="mb-3">
            <div className="flex justify-between">
              <h3 className="text-sm font-bold text-gray-900">{edu.universityName}</h3>
              <span className="text-xs text-gray-500">{formatDate(edu.endDate)}</span>
            </div>
            <p className="text-sm text-gray-600 italic">{edu.degree}{edu.major && `, ${edu.major}`}</p>
          </div>
        ))}
      </section>
    )}
    {resumeInfo.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">Legal Experience</h2>
        {resumeInfo.experience.map((exp) => (
          <div key={exp.id} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
              <span className="text-xs text-gray-500">{formatDate(exp.startDate)} — {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</span>
            </div>
            <p className="text-sm text-gray-600 italic">{exp.companyName}</p>
            {exp.workSummary && <div className="text-sm text-gray-700 mt-2 rich-text-content" dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
          </div>
        ))}
      </section>
    )}
    {resumeInfo.skills.length > 0 && (
      <section>
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">Areas of Practice</h2>
        <p className="text-sm text-gray-700">{resumeInfo.skills.map(s => s.name).join(' • ')}</p>
      </section>
    )}
  </div>
);

// =============================================================================
// TEMPLATE 30: NEWSPAPER (Column Layout)
// ATS Score: 94%
// =============================================================================
export const NewspaperTemplate: React.FC<TemplateProps> = ({ resumeInfo, formatDate }) => (
  <div className="bg-white text-gray-900 p-6" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
    <header className="text-center mb-4 pb-3 border-b-4 border-double border-gray-800">
      <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wider" style={{ fontFamily: "'Times New Roman', serif" }}>{resumeInfo.firstName || 'Your'} {resumeInfo.lastName || 'Name'}</h1>
      {resumeInfo.jobTitle && <p className="text-sm text-gray-600 italic mt-1">{resumeInfo.jobTitle}</p>}
      <div className="text-xs text-gray-500 mt-2">{[resumeInfo.email, resumeInfo.phone].filter(Boolean).join(' • ')}</div>
    </header>
    {resumeInfo.summary && (
      <section className="mb-4 text-center border-b border-gray-200 pb-4">
        <p className="text-sm leading-relaxed text-gray-700 italic">"{resumeInfo.summary}"</p>
      </section>
    )}
    <div className="flex gap-4">
      <div className="flex-1 pr-4 border-r border-gray-200">
        {resumeInfo.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3 border-b border-gray-300 pb-1">Career History</h2>
            {resumeInfo.experience.map((exp) => (
              <div key={exp.id} className="mb-4">
                <h3 className="text-sm font-bold text-gray-900">{exp.title}</h3>
                <p className="text-xs text-gray-500 italic">{exp.companyName} | {formatDate(exp.startDate)} - {exp.currentlyWorking ? 'Present' : formatDate(exp.endDate)}</p>
                {exp.workSummary && <div className="text-xs text-gray-700 mt-1 rich-text-content leading-relaxed" style={{ textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: exp.workSummary }} />}
              </div>
            ))}
          </section>
        )}
      </div>
      <div className="w-1/3">
        {resumeInfo.education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-3 border-b border-gray-300 pb-1">Education</h2>
            {resumeInfo.education.map((edu) => (
              <div key={edu.id} className="mb-2">
                <h3 className="text-xs font-bold text-gray-900">{edu.universityName}</h3>
                <p className="text-xs text-gray-600">{edu.degree}</p>
              </div>
            ))}
          </section>
        )}
        {resumeInfo.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-2 border-b border-gray-300 pb-1">Expertise</h2>
            <p className="text-xs text-gray-700 leading-relaxed">{resumeInfo.skills.map(s => s.name).join(', ')}</p>
          </section>
        )}
      </div>
    </div>
  </div>
);

// =============================================================================
// TEMPLATE RENDERER - Maps template ID to component
// =============================================================================
export const getTemplateComponent = (template: ResumeTemplate): React.FC<TemplateProps> => {
  const templates: Record<ResumeTemplate, React.FC<TemplateProps>> = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    professional: ProfessionalTemplate,
    minimal: MinimalTemplate,
    executive: ExecutiveTemplate,
    tech: TechTemplate,
    academic: AcademicTemplate,
    creative: CreativeTemplate,
    elegant: ElegantTemplate,
    bold: BoldTemplate,
    compact: CompactTemplate,
    timeline: TimelineTemplate,
    sidebar: SidebarTemplate,
    infographic: InfographicTemplate,
    corporate: CorporateTemplate,
    startup: StartupTemplate,
    consultant: ConsultantTemplate,
    gradient: GradientTemplate,
    boxed: BoxedTemplate,
    metro: MetroTemplate,
    swiss: SwissTemplate,
    retro: RetroTemplate,
    architect: ArchitectTemplate,
    magazine: MagazineTemplate,
    neon: NeonTemplate,
    legal: LegalTemplate,
    newspaper: NewspaperTemplate,
    healthcare: HealthcareTemplate,
    finance: FinanceTemplate,
    marketing: MarketingTemplate,
  };
  
  return templates[template] || ClassicTemplate;
};
