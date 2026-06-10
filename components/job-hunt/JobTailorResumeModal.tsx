import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Printer, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../App';
import type { ResumeInfo } from '../../context/ResumeInfoContext';
import type { JobListing } from '../../services/buyerApi';
import type { FixResumeResult } from '../../services/atsService';
import { tailorResumeForJob, type JobTailorPhase } from '../../services/tailorResume';
import { validateProfileForResumeTailoring } from '../../services/tailorProfileValidation';
import { ResumePreviewTemplateView, type ResumePreviewData } from '../fix-resume/ResumePreviewTemplateView';

const PHASE_LABELS: Record<JobTailorPhase, string> = {
  validating: 'Checking your profile…',
  tailoring: 'Organizing your profile for this job…',
  rendering: 'Building preview and PDF…',
};

export type TailorResumeSession = {
  job: JobListing;
  profile: ResumeInfo;
};

type Step = 'form' | 'processing' | 'result';

type JobTailorResumeModalProps = {
  session: TailorResumeSession | null;
  onClose: () => void;
  /** Called when profile fails re-validation inside the modal (safety net). */
  onProfileInvalid?: () => void;
};

const JobTailorResumeModal: React.FC<JobTailorResumeModalProps> = ({
  session,
  onClose,
  onProfileInvalid,
}) => {
  const { userId, userEmail } = useAuth();
  const [step, setStep] = useState<Step>('form');
  const [phase, setPhase] = useState<JobTailorPhase>('validating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fixOutcome, setFixOutcome] = useState<FixResumeResult | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const job = session?.job ?? null;
  const profile = session?.profile ?? null;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!session) return;
    setStep('form');
    setPhase('validating');
    setErrorMessage(null);
    setFixOutcome(null);
  }, [session]);

  useEffect(() => {
    if (!job) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [job, handleClose]);

  const handleTailor = async () => {
    if (!job || !profile) return;

    const validation = validateProfileForResumeTailoring(profile, { accountEmail: userEmail });
    if (!validation.isValid) {
      onProfileInvalid?.();
      handleClose();
      return;
    }

    setErrorMessage(null);
    setStep('processing');
    setPhase('validating');

    const outcome = await tailorResumeForJob({
      job,
      profile,
      userId: userId ?? undefined,
      accountEmail: userEmail,
      onPhase: setPhase,
    });

    if (!outcome.success) {
      setErrorMessage(outcome.message);
      setStep('form');
      return;
    }

    setFixOutcome(outcome.fix);
    setStep('result');
  };

  const printTailored = () => {
    const root = previewRef.current;
    if (!root) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('mark.garamond-injected-kw').forEach((m) => {
      const t = w.document.createTextNode(m.textContent ?? '');
      m.replaceWith(t);
    });
    w.document.open();
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Tailored resume</title></head><body>${clone.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 450);
  };

  if (!job || !profile) return null;

  const jobTitle = job.job_title?.trim() || 'Job';
  const company = job.company?.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-tailor-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[min(92vh,900px)] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 id="job-tailor-modal-title" className="text-lg font-bold text-gray-900 truncate">
              Tailor My Resume
            </h2>
            <p className="text-sm text-gray-600 mt-0.5 truncate">
              {jobTitle}
              {company ? ` · ${company}` : ''}
            </p>
            <p className="text-[11px] text-gray-500 mt-2 leading-snug">
              Uses only your saved profile — reorders sections for this job. Never invents experience or skills.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'form' && (
            <>
              <p className="text-xs text-gray-600 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                Your profile meets the minimum requirements. We will reorder your existing skills, projects, and
                experience for this role.
              </p>

              {errorMessage ? (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handleTailor()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-white font-semibold py-3 text-sm hover:opacity-95"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Tailor My Resume
              </button>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00] mb-4" aria-hidden />
              <p className="text-sm font-medium text-gray-900">{PHASE_LABELS[phase]}</p>
              <p className="text-xs text-gray-500 mt-2 max-w-xs">Please keep this tab open.</p>
            </div>
          )}

          {step === 'result' && fixOutcome?.success && fixOutcome.resumeData && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={printTailored}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Print / PDF
                </button>
              </div>

              {fixOutcome.pdfNote && fixOutcome.pdfAvailable ? (
                <p className="text-[11px] text-sky-900 bg-sky-50 border border-sky-100 rounded-lg px-3 py-2">
                  {fixOutcome.pdfNote}
                </p>
              ) : null}
              {fixOutcome.pdfAvailable === false && fixOutcome.pdfError ? (
                <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  PDF was not generated on the server ({fixOutcome.pdfError}). Use Print / PDF instead.
                </p>
              ) : null}

              {(fixOutcome.addedKeywords?.length ?? 0) > 0 ? (
                <p className="text-xs text-gray-600">
                  <span className="text-gray-400">Profile skills matching this job · </span>
                  <span className="font-medium text-gray-800">{(fixOutcome.addedKeywords ?? []).join(', ')}</span>
                </p>
              ) : null}

              <div
                ref={previewRef}
                className="rounded-lg border border-gray-200 bg-white overflow-auto max-h-[min(560px,70vh)]"
              >
                <ResumePreviewTemplateView
                  data={fixOutcome.resumeData as unknown as ResumePreviewData}
                  highlightTerms={fixOutcome.addedKeywords ?? []}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFixOutcome(null);
                    setStep('form');
                  }}
                  className="text-sm font-medium text-[#FF6B00] hover:underline"
                >
                  Tailor again
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 ml-auto"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {step === 'result' && fixOutcome?.success && !fixOutcome.resumeData && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Your resume was processed, but no preview template was returned. Please try again.
              <button
                type="button"
                onClick={() => setStep('form')}
                className="mt-3 block text-sm font-medium text-[#FF6B00] hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobTailorResumeModal;
