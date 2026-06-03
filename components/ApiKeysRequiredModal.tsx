import React from 'react';
import { KeyRound, Settings, X } from 'lucide-react';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

export type ApiKeysModalFeature = 'ats' | 'liveInterview';

interface ApiKeysRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
  feature: ApiKeysModalFeature;
  requiresLogin?: boolean;
}

const COPY: Record<
  ApiKeysModalFeature,
  { title: string; body: string; settingsHint: string }
> = {
  ats: {
    title: 'API key required for ATS Scorer',
    body: 'Add at least one LLM provider key (OpenAI, Gemini, OpenRouter, or Claude) in Settings to run resume scoring.',
    settingsHint: 'Settings → AI & LLM API keys',
  },
  liveInterview: {
    title: 'API key required for Live AI Interview',
    body: 'Add an OpenRouter or Groq API key in Settings to generate questions and AI scoring.',
    settingsHint: 'Settings → AI & LLM API keys',
  },
};

const ApiKeysRequiredModal: React.FC<ApiKeysRequiredModalProps> = ({
  isOpen,
  onClose,
  onGoToSettings,
  feature,
  requiresLogin = false,
}) => {
  const modalRef = useAccessibleModal(isOpen, onClose);
  if (!isOpen) return null;

  const copy = COPY[feature];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-keys-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
                <KeyRound className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 id="api-keys-modal-title" className="text-lg font-bold text-gray-900">
                  {requiresLogin ? 'Sign in required' : copy.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {requiresLogin
                    ? 'Sign in to your account, then add API keys in Settings.'
                    : copy.settingsHint}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 leading-relaxed">
            {requiresLogin
              ? 'This feature uses your saved API keys from Settings. Please sign in first.'
              : copy.body}
          </p>
        </div>
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToSettings();
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-[#FF6B00] hover:brightness-105 shadow-sm"
          >
            <Settings className="h-4 w-4" aria-hidden />
            {requiresLogin ? 'Sign in' : 'Open Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeysRequiredModal;
