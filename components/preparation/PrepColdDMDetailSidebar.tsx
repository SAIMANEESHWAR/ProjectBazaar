import { Copy, Check } from 'lucide-react';
import type { ColdDMTemplate } from '../../data/preparationMockData';
import PrepDetailSidebar, { PrepDetailActionButton } from './PrepDetailSidebar';

interface PrepColdDMDetailSidebarProps {
  template: ColdDMTemplate;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function PrepColdDMDetailSidebar({
  template,
  copied,
  onCopy,
  onClose,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: PrepColdDMDetailSidebarProps) {
  return (
    <PrepDetailSidebar
      itemId={template.id}
      title={template.title}
      tags={[{ label: template.category, variant: 'default' }]}
      onClose={onClose}
      onNext={onNext}
      onPrev={onPrev}
      hasNext={hasNext}
      hasPrev={hasPrev}
      ariaLabel="Cold DM template details"
      headerActions={
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <PrepDetailActionButton
            icon={copied ? <Check size={16} /> : <Copy size={16} />}
            active={copied}
            activeTone={copied ? 'green' : 'white'}
            onClick={onCopy}
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </PrepDetailActionButton>
        </div>
      }
    >
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
          Template
        </p>
        <div className="rounded-xl border border-white/10 bg-[#141414] p-5 shadow-inner">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-200 md:text-base">
            {template.content}
          </p>
        </div>
      </section>
    </PrepDetailSidebar>
  );
}
