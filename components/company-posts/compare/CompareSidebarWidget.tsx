import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import type { CompanyCompare } from '../../../types/companyCompare';

const COMPARE_PROMO_IMAGE = '/compare_compaines.png';

export interface CompareSidebarWidgetProps {
    selection: [CompanyCompare | null, CompanyCompare | null];
    onGoToCompare: () => void;
    className?: string;
}

export const CompareSidebarWidget: React.FC<CompareSidebarWidgetProps> = ({
    selection,
    onGoToCompare,
    className,
}) => {
    const [leftSelected, rightSelected] = selection;

    return (
        <aside
            className={`overflow-hidden rounded-xl border border-[#EBF0F6] bg-white shadow-sm ${className ?? ''}`}
        >
            <div className="bg-gradient-to-r from-amber-50/90 via-[#FFFCF5] to-amber-50/90 px-4 py-5">
                <img
                    src={COMPARE_PROMO_IMAGE}
                    alt="Compare companies side by side"
                    className="mx-auto h-auto w-full max-w-[260px] object-contain"
                />
            </div>

            <div className="px-5 py-4">
                <p className="text-center text-sm font-semibold leading-relaxed text-[#1E223C]">
                    Side-by-side comparison to make informed career decisions
                </p>

                {(leftSelected || rightSelected) && (
                    <p className="mt-2 text-center text-xs text-gray-500">
                        {[leftSelected?.identity.name, rightSelected?.identity.name].filter(Boolean).join(' vs ')}
                    </p>
                )}

                <button
                    type="button"
                    onClick={onGoToCompare}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-900"
                >
                    Compare companies
                    <ArrowRight size={16} className="text-orange-400" />
                </button>
            </div>
        </aside>
    );
};
