import * as React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import type { CompanyCompare } from '../../../types/companyCompare';
import { CompanyAvatar } from './CompanyAvatar';

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
    const [left, right] = selection;

    return (
        <aside
            className={`rounded-xl border border-[#EBF0F6] bg-white p-5 shadow-sm ${className ?? ''}`}
        >
            <div className="flex items-center justify-center gap-2 mb-4">
                {left ? (
                    <CompanyAvatar
                        name={left.identity.name}
                        logoUrl={left.logoUrl}
                        size="md"
                        className="ring-2 ring-white"
                    />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500">
                        —
                    </div>
                )}
                <div className="flex flex-col items-center px-1">
                    <div className="flex items-center gap-0.5 text-amber-400">
                        <Zap size={12} fill="currentColor" />
                        <Zap size={12} fill="currentColor" className="-ml-1" />
                    </div>
                    <span className="text-sm font-bold text-[#1E223C]">Compare</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                        <Zap size={12} fill="currentColor" />
                        <Zap size={12} fill="currentColor" className="-ml-1" />
                    </div>
                </div>
                {right ? (
                    <CompanyAvatar
                        name={right.identity.name}
                        logoUrl={right.logoUrl}
                        size="md"
                        className="ring-2 ring-white"
                    />
                ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-500">
                        —
                    </div>
                )}
            </div>

            <p className="text-center text-sm text-gray-600 leading-relaxed mb-4">
                Side-by-side comparison to make informed career decisions.
            </p>

            {(left || right) && (
                <p className="text-center text-xs text-gray-500 mb-3">
                    {[left?.identity.name, right?.identity.name].filter(Boolean).join(' vs ')}
                </p>
            )}

            <button
                type="button"
                onClick={onGoToCompare}
                className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-[#5670FB] hover:text-[#4358d9] transition-colors"
            >
                Compare companies
                <ArrowRight size={16} />
            </button>
        </aside>
    );
};
