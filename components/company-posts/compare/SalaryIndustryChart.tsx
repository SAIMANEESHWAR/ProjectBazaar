import * as React from 'react';
import { cn } from '../../../lib/utils';
import {
    formatSalaryLakhs,
    getCompanyAverageSalaryLakhs,
    getIndustryAverageSalaryLakhs,
    getSalaryComparisonLabel,
    getSalaryIndustryComparison,
    getTopSalaryRole,
} from '../../../lib/companyCompareData';
import type { CompanyCompare } from '../../../types/companyCompare';

const COMPANY_BAR_SRC = '/company_compare/salary_bar_company.png';
const INDUSTRY_BAR_SRC = '/company_compare/salary_bar_industry.png';
const MAX_BAR_HEIGHT = 132;

interface SalaryBarProps {
    value: number;
    maxValue: number;
    label: string;
    amount: string;
    imageSrc: string;
}

const SalaryBar: React.FC<SalaryBarProps> = ({ value, maxValue, label, amount, imageSrc }) => {
    const heightPct = maxValue > 0 ? Math.max(18, Math.min(100, (value / maxValue) * 100)) : 18;
    const barHeight = Math.round((heightPct / 100) * MAX_BAR_HEIGHT);

    return (
        <div className="flex w-[88px] flex-col items-center sm:w-[96px]">
            <p className="mb-2 text-sm font-semibold text-[#1E223C]">{amount}</p>
            <div
                className="relative w-[56px] overflow-hidden sm:w-[60px]"
                style={{ height: MAX_BAR_HEIGHT }}
            >
                <div
                    className="absolute inset-x-0 bottom-0 overflow-hidden"
                    style={{ height: barHeight }}
                >
                    <img
                        src={imageSrc}
                        alt=""
                        aria-hidden
                        className="absolute bottom-0 left-0 w-full max-w-none"
                        style={{ height: MAX_BAR_HEIGHT }}
                    />
                </div>
            </div>
            <p className="mt-2 max-w-[88px] truncate text-center text-xs text-gray-500">{label}</p>
        </div>
    );
};

export interface SalaryIndustryChartProps {
    company: CompanyCompare;
    allCompanies: CompanyCompare[];
    className?: string;
}

export const SalaryIndustryChart: React.FC<SalaryIndustryChartProps> = ({
    company,
    allCompanies,
    className,
}) => {
    const companyLakhs = getCompanyAverageSalaryLakhs(company);
    const industry = company.identity.industry?.trim() ?? '';
    const industryLakhs = getIndustryAverageSalaryLakhs(allCompanies, industry);
    const topSalary = getTopSalaryRole(company);

    if (companyLakhs == null) {
        return (
            <div className={cn('rounded-xl border border-[#EBF0F6] bg-white p-5 text-center', className)}>
                <p className="text-sm text-gray-400">No salary data available</p>
            </div>
        );
    }

    const benchmarkLakhs = industryLakhs ?? companyLakhs;
    const comparison = getSalaryIndustryComparison(companyLakhs, benchmarkLakhs);
    const comparisonLabel = getSalaryComparisonLabel(comparison);
    const maxValue = Math.max(companyLakhs, benchmarkLakhs, 0.1);

    return (
        <div className={cn('rounded-xl border border-[#EBF0F6] bg-white p-5 sm:p-6', className)}>
            <p className="text-base font-semibold leading-snug text-[#1E223C]">
                Avg. salary is{' '}
                <span
                    className={cn(
                        'font-bold',
                        comparison === 'higher' && 'text-emerald-600',
                        comparison === 'lower' && 'text-rose-500',
                        comparison === 'at par' && 'text-gray-500',
                    )}
                >
                    {comparisonLabel}
                </span>
            </p>
            {industry ? (
                <p className="mt-1 text-sm text-gray-500">
                    with the avg. salary in{' '}
                    <span className="font-semibold text-[#1E223C] underline decoration-[#EBF0F6] underline-offset-2">
                        {industry} Industry
                    </span>
                </p>
            ) : (
                <p className="mt-1 text-sm text-gray-500">compared with industry average</p>
            )}

            <div className="mt-6 flex items-end justify-center gap-8 sm:gap-10">
                <SalaryBar
                    value={companyLakhs}
                    maxValue={maxValue}
                    label="Company avg."
                    amount={formatSalaryLakhs(companyLakhs)}
                    imageSrc={COMPANY_BAR_SRC}
                />
                <SalaryBar
                    value={benchmarkLakhs}
                    maxValue={maxValue}
                    label="Industry avg."
                    amount={formatSalaryLakhs(benchmarkLakhs)}
                    imageSrc={INDUSTRY_BAR_SRC}
                />
            </div>

            {topSalary?.role && (
                <p className="mt-4 text-center text-xs text-gray-400">
                    Based on {topSalary.role}
                </p>
            )}
        </div>
    );
};
