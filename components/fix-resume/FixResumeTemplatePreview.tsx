import React, { useMemo, useRef } from 'react';
import type { ResumeInfo } from '../../context/ResumeInfoContext';
import { resumeInfoToGaramondModel } from '../../services/garamondResumeFromResumeInfo';
import { GaramondResumeView } from './GaramondResumeView';
import { normalizeHighlightTerms } from '../../utils/highlightAddedKeywords';
import { Download, Printer } from 'lucide-react';
import { openGaramondResumePrint } from '../../utils/garamondResumePrint';

type FixResumeTemplatePreviewProps = {
  resumeInfo: ResumeInfo;
  addedKeywords: string[];
  onDownloadServerPdf?: () => void;
  serverPdfAvailable?: boolean;
  pdfNote?: string | null;
};

/**
 * EB Garamond ATS-style template preview + print to PDF (matches standalone HTML layout).
 */
const FixResumeTemplatePreview: React.FC<FixResumeTemplatePreviewProps> = ({
  resumeInfo,
  addedKeywords,
  onDownloadServerPdf,
  serverPdfAvailable,
  pdfNote,
}) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const garamondModel = useMemo(() => resumeInfoToGaramondModel(resumeInfo), [resumeInfo]);
  const highlightTerms = useMemo(() => normalizeHighlightTerms(addedKeywords ?? []), [addedKeywords]);

  const handlePrint = () => {
    const title = `${resumeInfo.firstName || 'Resume'} ${resumeInfo.lastName || ''}`.trim() || 'Fixed resume';
    openGaramondResumePrint(pageRef.current, `${title} - Resume`);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/90">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Formatted resume</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            EB Garamond layout (table education, section bars). Injected ATS terms are highlighted in amber in the
            preview. Use Print → Save as PDF, or server PDF if available.
          </p>
        </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
            >
              <Printer className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Print / Save as PDF
            </button>
            {serverPdfAvailable && onDownloadServerPdf ? (
              <button
                type="button"
                onClick={onDownloadServerPdf}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Server PDF
              </button>
            ) : null}
          </div>
        </div>
        {(addedKeywords?.length ?? 0) > 0 ? (
          <p className="text-[11px] text-gray-500 px-4 pt-3">
            Terms merged in this pass:{' '}
            <span className="text-gray-700 font-medium">{addedKeywords.join(', ')}</span>
          </p>
        ) : null}
        {pdfNote ? (
          <p className="text-[11px] text-sky-900 bg-sky-50 border-b border-sky-100 px-4 py-2">{pdfNote}</p>
        ) : null}
        <div className="p-4 sm:p-6 max-h-[min(560px,70vh)] overflow-y-auto bg-gray-50/50">
          <GaramondResumeView ref={pageRef} model={garamondModel} highlightTerms={highlightTerms} />
        </div>
      </div>
  );
};

export default FixResumeTemplatePreview;
