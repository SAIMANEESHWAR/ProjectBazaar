import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CompanyCompare, CompanyReview } from '../../types/companyCompare';

function emptyReview(): CompanyReview {
    return {
        review_date: new Date().toISOString().slice(0, 10),
        summary: '',
        pros: '',
        cons: '',
    };
}

export interface CompanyCompareReviewsModalProps {
    companyName: string;
    reviews: CompanyReview[];
    loading?: boolean;
    saving?: boolean;
    onClose: () => void;
    onChange: (reviews: CompanyReview[]) => void;
    onSave: () => void;
}

export const CompanyCompareReviewsModal: React.FC<CompanyCompareReviewsModalProps> = ({
    companyName,
    reviews,
    loading = false,
    saving = false,
    onClose,
    onChange,
    onSave,
}) => {
    const updateReview = (index: number, patch: Partial<CompanyReview>) => {
        onChange(reviews.map((review, i) => (i === index ? { ...review, ...patch } : review)));
    };

    const removeReview = (index: number) => {
        onChange(reviews.filter((_, i) => i !== index));
    };

    const addReview = () => {
        onChange([...reviews, emptyReview()]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                    <div>
                        <h4 className="font-semibold text-gray-900">Manage reviews: {companyName}</h4>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Add or edit employee reviews. Changes are saved to DynamoDB on Save.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <p className="text-sm text-gray-500">Loading reviews…</p>
                    ) : reviews.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                            No reviews yet. Add one below.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review, index) => (
                                <article
                                    key={`${review.review_date}-${index}`}
                                    className="rounded-xl border border-gray-200 bg-[#FAFCFF] p-4"
                                >
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-900">Review {index + 1}</p>
                                        <button
                                            type="button"
                                            onClick={() => removeReview(index)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 size={14} />
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid gap-3">
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-medium text-gray-600">Date</span>
                                            <input
                                                type="date"
                                                value={review.review_date?.slice(0, 10) ?? ''}
                                                onChange={e => updateReview(index, { review_date: e.target.value })}
                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#5670FB] focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-medium text-gray-600">Summary</span>
                                            <textarea
                                                value={review.summary}
                                                onChange={e => updateReview(index, { summary: e.target.value })}
                                                rows={2}
                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#5670FB] focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-medium text-gray-600">Pros</span>
                                            <textarea
                                                value={review.pros}
                                                onChange={e => updateReview(index, { pros: e.target.value })}
                                                rows={2}
                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#5670FB] focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                                            />
                                        </label>
                                        <label className="block">
                                            <span className="mb-1 block text-xs font-medium text-gray-600">Cons</span>
                                            <textarea
                                                value={review.cons}
                                                onChange={e => updateReview(index, { cons: e.target.value })}
                                                rows={2}
                                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#5670FB] focus:outline-none focus:ring-2 focus:ring-[#5670FB]/20"
                                            />
                                        </label>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={addReview}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        <Plus size={16} />
                        Add review
                    </button>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={saving || loading}
                        onClick={onSave}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save reviews'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export function buildCompanyUpsertPayload(company: CompanyCompare): Record<string, unknown> {
    return {
        ...company,
        companyId: company.id,
        id: company.id,
        reviews: company.reviews,
    };
}
