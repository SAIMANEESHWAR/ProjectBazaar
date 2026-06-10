import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import {
  getTailorBlockingMessage,
  type ProfileResumeTailoringValidation,
} from '../../services/tailorProfileValidation';

type TailorProfileRequiredModalProps = {
  validation: ProfileResumeTailoringValidation | null;
  needsSignIn?: boolean;
  onClose: () => void;
};

const TailorProfileRequiredModal: React.FC<TailorProfileRequiredModalProps> = ({
  validation,
  needsSignIn,
  onClose,
}) => {
  const { setActiveView } = useDashboard();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!validation && !needsSignIn) return null;

  const goToSettings = () => {
    onClose();
    setActiveView('settings');
  };

  const goToAddProject = () => {
    onClose();
    setActiveView('build-resume');
  };

  const showAddProject =
    validation?.missingRequired.includes('projects') ?? false;
  const projectsOnly =
    validation?.missingRequired.length === 1 &&
    validation.missingRequired[0] === 'projects';
  const educationOnly =
    validation?.missingRequired.length === 1 &&
    validation.missingRequired[0] === 'education';

  const title = needsSignIn ? 'Sign in required' : 'Complete Your Profile';
  const message = needsSignIn
    ? 'Sign in to tailor your resume from your saved profile.'
    : getTailorBlockingMessage(validation!);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tailor-profile-required-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-2 min-w-0">
            {!needsSignIn ? (
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
            ) : null}
            <h2 id="tailor-profile-required-title" className="text-lg font-bold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-700">{message}</p>

          {validation?.usesSampleData ? (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              The resume builder ships with sample data (e.g. James Carter, demo projects). Replace every
              section with your own information in Settings → Resume.
            </p>
          ) : null}

          {validation && !validation.isValid && validation.missingFields.length > 0 && !projectsOnly && !educationOnly && !validation.usesSampleData ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Missing information</p>
              <ul className="mt-2 space-y-1.5">
                {validation.missingFields.map((field) => (
                  <li key={field} className="text-sm text-amber-950 flex gap-2">
                    <span className="text-red-600 shrink-0" aria-hidden>
                      ✕
                    </span>
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-amber-900">
                Please update your profile before generating a tailored resume.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            {needsSignIn ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                OK
              </button>
            ) : projectsOnly ? (
              <>
                <button
                  type="button"
                  onClick={goToAddProject}
                  className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Add Project
                </button>
                <button
                  type="button"
                  onClick={goToSettings}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Update Profile
                </button>
              </>
            ) : educationOnly ? (
              <button
                type="button"
                onClick={goToSettings}
                className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Update Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={goToSettings}
                  className="rounded-lg bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Update Profile
                </button>
                {showAddProject ? (
                  <button
                    type="button"
                    onClick={goToAddProject}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Add Project
                  </button>
                ) : null}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 ml-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorProfileRequiredModal;
