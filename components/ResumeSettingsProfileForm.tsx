import React, { useCallback, useMemo, useState } from 'react';
import {
  RESUME_SETTINGS_MONTHS,
  RESUME_SETTINGS_YEARS,
  emptyEducationRow,
  emptyExperienceRow,
  emptyProjectRow,
  moveRow,
  type ResumeEducationFormRow,
  type ResumeExperienceFormRow,
  type ResumeFullForm,
  type ResumeProjectFormRow,
} from '../lib/resumeSettingsForm';

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-0 focus:border-orange-400';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
const requiredStar = <span className="text-red-500">*</span>;

function parseSkillsTextToList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToSkillsText(skills: string[]): string {
  return skills.join(', ');
}

function SkillsChipsField({
  value,
  onChange,
  inputClass: containerClass,
}: {
  value: string;
  onChange: (next: string) => void;
  inputClass: string;
}) {
  const skills = useMemo(() => parseSkillsTextToList(value), [value]);
  const [draft, setDraft] = useState('');

  const commit = useCallback(
    (next: string[]) => {
      onChange(listToSkillsText(next));
    },
    [onChange]
  );

  const addFromDraft = useCallback(() => {
    const t = draft.trim().replace(/^,+|,+$/g, '').trim();
    if (!t) {
      setDraft('');
      return;
    }
    const lower = t.toLowerCase();
    const exists = skills.some((s) => s.toLowerCase() === lower);
    if (!exists) commit([...skills, t]);
    setDraft('');
  }, [draft, skills, commit]);

  const removeAt = useCallback(
    (index: number) => {
      commit(skills.filter((_, i) => i !== index));
    },
    [skills, commit]
  );

  return (
    <div
      className={`${containerClass} flex min-h-[3rem] flex-wrap items-center gap-2 px-2 py-2 sm:px-3`}
      onClick={(e) => {
        if (e.target === e.currentTarget) (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus();
      }}
    >
      {skills.map((skill, i) => (
        <span
          key={`${skill}-${i}`}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-orange-200 bg-orange-50 pl-2.5 pr-1 py-0.5 text-sm font-medium text-gray-800"
        >
          <span className="truncate">{skill}</span>
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-orange-200/80 hover:text-gray-900"
            aria-label={`Remove ${skill}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text').trim();
          if (!text.includes(',')) return;
          e.preventDefault();
          const parts = text
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length === 0) return;
          const next = [...skills];
          for (const p of parts) {
            if (!next.some((s) => s.toLowerCase() === p.toLowerCase())) next.push(p);
          }
          commit(next);
          setDraft('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addFromDraft();
          } else if (e.key === ',') {
            e.preventDefault();
            addFromDraft();
          } else if (e.key === 'Backspace' && draft === '' && skills.length > 0) {
            e.preventDefault();
            removeAt(skills.length - 1);
          }
        }}
        onBlur={() => {
          if (!draft.trim()) return;
          if (draft.includes(',')) {
            const parts = draft
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean);
            const next = [...skills];
            for (const p of parts) {
              if (!next.some((s) => s.toLowerCase() === p.toLowerCase())) next.push(p);
            }
            commit(next);
            setDraft('');
          } else {
            addFromDraft();
          }
        }}
        className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-0"
        placeholder={skills.length === 0 ? 'e.g. React, then Enter' : 'Add another…'}
        aria-label="Add skill"
      />
    </div>
  );
}

function RemoveEntryButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  );
}

const MonthSelect = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    className={`${inputClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <option value="">Month</option>
    {RESUME_SETTINGS_MONTHS.map((m) => (
      <option key={m} value={m}>
        {m}
      </option>
    ))}
  </select>
);

const YearSelect = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => (
  <select
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    className={`${inputClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <option value="">Year</option>
    {RESUME_SETTINGS_YEARS.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
);

interface ResumeSettingsProfileFormProps {
  form: ResumeFullForm;
  setForm: React.Dispatch<React.SetStateAction<ResumeFullForm>>;
}

const ResumeSettingsProfileForm: React.FC<ResumeSettingsProfileFormProps> = ({ form, setForm }) => {
  const updatePersonal = (patch: Partial<ResumeFullForm['personal']>) => {
    setForm((f) => ({ ...f, personal: { ...f.personal, ...patch } }));
  };

  return (
    <div>
      {/* Personal Information */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Full Name {requiredStar}
            </label>
            <input
              type="text"
              value={form.personal.fullName}
              onChange={(e) => updatePersonal({ fullName: e.target.value })}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className={labelClass}>
              Phone {requiredStar}
            </label>
            <input
              type="text"
              value={form.personal.phone}
              onChange={(e) => updatePersonal({ phone: e.target.value })}
              className={inputClass}
              placeholder="Phone number"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Email {requiredStar}
            </label>
            <input
              type="email"
              value={form.personal.email}
              onChange={(e) => updatePersonal({ email: e.target.value })}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              type="url"
              value={form.personal.linkedIn}
              onChange={(e) => updatePersonal({ linkedIn: e.target.value })}
              className={inputClass}
              placeholder="https://linkedin.com/in/…"
            />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input
              type="url"
              value={form.personal.github}
              onChange={(e) => updatePersonal({ github: e.target.value })}
              className={inputClass}
              placeholder="https://github.com/…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Website</label>
            <input
              type="url"
              value={form.personal.website}
              onChange={(e) => updatePersonal({ website: e.target.value })}
              className={inputClass}
              placeholder="https://…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Professional title</label>
            <input
              type="text"
              value={form.personal.jobTitle}
              onChange={(e) => updatePersonal({ jobTitle: e.target.value })}
              className={inputClass}
              placeholder="e.g. Full Stack Developer"
            />
            <p className="text-xs text-gray-500 mt-1">Shown under your name on the exported resume.</p>
          </div>
        </div>
      </div>

      {/* Professional summary */}
      <div className="pt-8 border-t border-gray-200 space-y-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Professional summary</h4>
        <textarea
          value={form.summary}
          onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
          rows={4}
          className={inputClass}
          placeholder="Brief overview of your background and strengths…"
        />
      </div>

      {/* Skills */}
      <div className="pt-8 border-t border-gray-200 space-y-4">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Skills {requiredStar}
        </h4>
        <SkillsChipsField
          value={form.skillsText}
          onChange={(skillsText) => setForm((f) => ({ ...f, skillsText }))}
          inputClass={inputClass}
        />
        <p className="text-xs text-gray-500 mt-1">
          Add skills one at a time (Enter or comma). Click remove on a chip to delete. Saved as a comma-separated list for your resume.
        </p>
      </div>

      {/* Experience */}
      <div className="pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Experience</h4>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, experience: [...f.experience, emptyExperienceRow()] }))}
            className="text-sm font-semibold text-orange-600 hover:text-orange-800 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50/80"
          >
            + Add
          </button>
        </div>
        <div className="space-y-6">
          {form.experience.map((row, i) => (
            <ExperienceCard
              key={row.id}
              index={i}
              row={row}
              total={form.experience.length}
              onChange={(next) =>
                setForm((f) => {
                  const experience = [...f.experience];
                  experience[i] = next;
                  return { ...f, experience };
                })
              }
              onMove={(dir) => setForm((f) => ({ ...f, experience: moveRow(f.experience, i, dir) }))}
              onRemove={() =>
                setForm((f) => ({
                  ...f,
                  experience: f.experience.length <= 1 ? [emptyExperienceRow()] : f.experience.filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">Education</h4>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, education: [...f.education, emptyEducationRow()] }))}
            className="text-sm font-semibold text-orange-600 hover:text-orange-800 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50/80"
          >
            + Add
          </button>
        </div>
        <div className="space-y-6">
          {form.education.map((row, i) => (
            <EducationCard
              key={row.id}
              index={i}
              row={row}
              total={form.education.length}
              onChange={(next) =>
                setForm((f) => {
                  const education = [...f.education];
                  education[i] = next;
                  return { ...f, education };
                })
              }
              onMove={(dir) => setForm((f) => ({ ...f, education: moveRow(f.education, i, dir) }))}
              onRemove={() =>
                setForm((f) => ({
                  ...f,
                  education: f.education.length <= 1 ? [emptyEducationRow()] : f.education.filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-gray-900">
            Projects <span className="text-sm font-normal text-gray-500">({form.projects.length}/15)</span>
          </h4>
          <button
            type="button"
            disabled={form.projects.length >= 15}
            onClick={() =>
              setForm((f) =>
                f.projects.length >= 15 ? f : { ...f, projects: [...f.projects, emptyProjectRow()] }
              )
            }
            className="text-sm font-semibold text-orange-600 hover:text-orange-800 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add
          </button>
        </div>
        <div className="space-y-6">
          {form.projects.map((row, i) => (
            <ProjectCard
              key={row.id}
              index={i}
              row={row}
              total={form.projects.length}
              onChange={(next) =>
                setForm((f) => {
                  const projects = [...f.projects];
                  projects[i] = next;
                  return { ...f, projects };
                })
              }
              onMove={(dir) => setForm((f) => ({ ...f, projects: moveRow(f.projects, i, dir) }))}
              onRemove={() =>
                setForm((f) => ({
                  ...f,
                  projects: f.projects.length <= 1 ? [emptyProjectRow()] : f.projects.filter((_, j) => j !== i),
                }))
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function ExperienceCard({
  index,
  row,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  row: ResumeExperienceFormRow;
  total: number;
  onChange: (r: ResumeExperienceFormRow) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">Experience {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↓
          </button>
          <RemoveEntryButton onClick={onRemove} label="Remove this experience" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Job Title {requiredStar}</label>
          <input
            type="text"
            value={row.jobTitle}
            onChange={(e) => onChange({ ...row, jobTitle: e.target.value })}
            className={inputClass}
            placeholder="e.g. Full Stack Developer"
          />
        </div>
        <div>
          <label className={labelClass}>Company {requiredStar}</label>
          <input
            type="text"
            value={row.company}
            onChange={(e) => onChange({ ...row, company: e.target.value })}
            className={inputClass}
            placeholder="Company name"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Location (State, Country) {requiredStar}</label>
          <input
            type="text"
            value={row.location}
            onChange={(e) => onChange({ ...row, location: e.target.value })}
            className={inputClass}
            placeholder="e.g. Telangana, India"
          />
        </div>
        <div>
          <label className={labelClass}>Start date {requiredStar}</label>
          <div className="flex gap-2">
            <MonthSelect value={row.startMonth} onChange={(v) => onChange({ ...row, startMonth: v })} />
            <YearSelect value={row.startYear} onChange={(v) => onChange({ ...row, startYear: v })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>End date {requiredStar}</label>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <MonthSelect
                value={row.endMonth}
                onChange={(v) => onChange({ ...row, endMonth: v })}
                disabled={row.present}
              />
              <YearSelect
                value={row.endYear}
                onChange={(v) => onChange({ ...row, endYear: v })}
                disabled={row.present}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer shrink-0 pb-2">
              <input
                type="checkbox"
                checked={row.present}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onChange({
                    ...row,
                    present: checked,
                    ...(checked ? { endMonth: '', endYear: '' } : {}),
                  });
                }}
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:outline-none focus:ring-0 focus:ring-offset-0"
              />
              Present
            </label>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Details {requiredStar}</label>
          <textarea
            value={row.details}
            onChange={(e) => onChange({ ...row, details: e.target.value })}
            rows={4}
            className={inputClass}
            placeholder="Describe responsibilities, impact, and technologies (one bullet per line optional)…"
          />
        </div>
      </div>
    </div>
  );
}

function EducationCard({
  index,
  row,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  row: ResumeEducationFormRow;
  total: number;
  onChange: (r: ResumeEducationFormRow) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">Education {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↓
          </button>
          <RemoveEntryButton onClick={onRemove} label="Remove this education entry" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Degree {requiredStar}</label>
          <input
            type="text"
            value={row.degree}
            onChange={(e) => onChange({ ...row, degree: e.target.value })}
            className={inputClass}
            placeholder="e.g. B.Tech"
          />
        </div>
        <div>
          <label className={labelClass}>School {requiredStar}</label>
          <input
            type="text"
            value={row.school}
            onChange={(e) => onChange({ ...row, school: e.target.value })}
            className={inputClass}
            placeholder="University name"
          />
        </div>
        <div>
          <label className={labelClass}>Location (State, Country) {requiredStar}</label>
          <input
            type="text"
            value={row.location}
            onChange={(e) => onChange({ ...row, location: e.target.value })}
            className={inputClass}
            placeholder="e.g. India"
          />
        </div>
        <div>
          <label className={labelClass}>GPA</label>
          <input
            type="text"
            value={row.gpa}
            onChange={(e) => onChange({ ...row, gpa: e.target.value })}
            className={inputClass}
            placeholder="e.g. 9.47"
          />
        </div>
        <div>
          <label className={labelClass}>Start date {requiredStar}</label>
          <div className="flex gap-2">
            <MonthSelect value={row.startMonth} onChange={(v) => onChange({ ...row, startMonth: v })} />
            <YearSelect value={row.startYear} onChange={(v) => onChange({ ...row, startYear: v })} />
          </div>
        </div>
        <div>
          <label className={labelClass}>End date {requiredStar}</label>
          <div className="flex gap-2">
            <MonthSelect value={row.endMonth} onChange={(v) => onChange({ ...row, endMonth: v })} />
            <YearSelect value={row.endYear} onChange={(v) => onChange({ ...row, endYear: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  index,
  row,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  row: ResumeProjectFormRow;
  total: number;
  onChange: (r: ResumeProjectFormRow) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-800">Project {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↓
          </button>
          <RemoveEntryButton onClick={onRemove} label="Remove this project" />
        </div>
      </div>
      <div>
        <label className={labelClass}>Title {requiredStar}</label>
        <input
          type="text"
          value={row.title}
          onChange={(e) => onChange({ ...row, title: e.target.value })}
          className={inputClass}
          placeholder="Project name"
        />
      </div>
      <div>
        <label className={labelClass}>Details {requiredStar}</label>
        <textarea
          value={row.details}
          onChange={(e) => onChange({ ...row, details: e.target.value })}
          rows={4}
          className={inputClass}
          placeholder="Describe the project, technologies, and outcomes…"
        />
      </div>
    </div>
  );
}

export default ResumeSettingsProfileForm;
