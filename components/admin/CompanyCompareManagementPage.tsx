import * as React from 'react';
import {
    adminDeleteCompany,
    adminUpsertCompany,
    adminSyncCompanies,
    fetchCompaniesFromApi,
    fetchCompanyByIdFromApi,
    getCompanyCompareApiBase,
    isCompanyCompareApiEnabled,
} from '../../services/companyCompareAdminApi';
import { invalidateCompanyCompareCache, normalizeCompany, normalizeCompanyFromApi } from '../../lib/companyCompareData';
import type { CompanyCompare, CompanyReview } from '../../types/companyCompare';
import { CompanyCompareReviewsModal, buildCompanyUpsertPayload } from './CompanyCompareReviewsModal';

interface UploadPreview {
    count: number;
    industries: Record<string, number>;
    sampleNames: string[];
}

interface MappedCompanyPreview {
    companyId: string;
    name: string;
    industry: string;
    headquarters: string;
    overallRating: number;
    salaryCount: number;
    interviewCount: number;
    benefitCount: number;
    reviewCount: number;
    activeJobsCount: number;
    createdAt?: string;
    updatedAt?: string;
}

const CompanyCompareManagementPage: React.FC = () => {
    const [companies, setCompanies] = React.useState<CompanyCompare[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [syncing, setSyncing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [uploadPreview, setUploadPreview] = React.useState<UploadPreview | null>(null);
    const [pendingUpload, setPendingUpload] = React.useState<unknown[] | null>(null);
    const [mappedPreview, setMappedPreview] = React.useState<MappedCompanyPreview[]>([]);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [viewCompany, setViewCompany] = React.useState<CompanyCompare | null>(null);
    const [editCompany, setEditCompany] = React.useState<CompanyCompare | null>(null);
    const [editJson, setEditJson] = React.useState('');
    const [savingEdit, setSavingEdit] = React.useState(false);
    const [reviewsCompany, setReviewsCompany] = React.useState<CompanyCompare | null>(null);
    const [reviewDraft, setReviewDraft] = React.useState<CompanyReview[]>([]);
    const [loadingReviews, setLoadingReviews] = React.useState(false);
    const [savingReviews, setSavingReviews] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const apiConfigured = isCompanyCompareApiEnabled();

    const loadData = React.useCallback(async () => {
        if (!apiConfigured) {
            setLoading(false);
            setError('Set VITE_COMPANY_COMPARE_API_URL in .env.local after deploying the Lambda stack.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetchCompaniesFromApi({ limit: 500 });
            setCompanies((res.companies ?? []).map(c => normalizeCompany(c)));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load companies');
        } finally {
            setLoading(false);
        }
    }, [apiConfigured]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    React.useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 4000);
        return () => window.clearTimeout(t);
    }, [toast]);

    const lastUpdated = React.useMemo(() => {
        const dates = companies.map(c => c.updatedAt).filter(Boolean) as string[];
        if (!dates.length) return null;
        return dates.sort().reverse()[0];
    }, [companies]);

    const handleFile = async (file: File) => {
        setError(null);
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as { companies?: unknown[] };
            if (!Array.isArray(parsed.companies)) {
                throw new Error('JSON must contain a top-level "companies" array');
            }
            const normalized = parsed.companies.map(normalizeCompany);
            const industries: Record<string, number> = {};
            for (const c of normalized) {
                const ind = c.identity.industry || 'Unknown';
                industries[ind] = (industries[ind] || 0) + 1;
            }
            setPendingUpload(parsed.companies);
            setMappedPreview(
                normalized.map((c) => ({
                    companyId: c.id,
                    name: c.identity.name,
                    industry: c.identity.industry || 'Unknown',
                    headquarters: c.identity.headquarters || '—',
                    overallRating: c.ratings.overall_rating,
                    salaryCount: c.salaries.length || (c.salaryRange ? 1 : 0),
                    interviewCount: c.interviews.length,
                    benefitCount: c.benefits.length,
                    reviewCount: c.reviews.length,
                    activeJobsCount: c.active_jobs.length,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                })),
            );
            setUploadPreview({
                count: parsed.companies.length,
                industries,
                sampleNames: normalized.map(c => c.identity.name),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid JSON file');
            setPendingUpload(null);
            setUploadPreview(null);
            setMappedPreview([]);
        }
    };

    const handleSync = async () => {
        if (!pendingUpload?.length) return;
        setSyncing(true);
        setError(null);
        try {
            const result = await adminSyncCompanies(pendingUpload);
            invalidateCompanyCompareCache();
            setToast({
                type: 'success',
                message: result.message || `Synced ${result.count ?? 0} companies`,
            });
            setPendingUpload(null);
            setUploadPreview(null);
            setMappedPreview([]);
            await loadData();
        } catch (e) {
            setToast({ type: 'error', message: e instanceof Error ? e.message : 'Sync failed' });
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (companyId: string, name: string) => {
        if (!window.confirm(`Delete ${name} from compare database?`)) return;
        try {
            await adminDeleteCompany(companyId);
            invalidateCompanyCompareCache();
            setToast({ type: 'success', message: `Deleted ${name}` });
            await loadData();
        } catch (e) {
            setToast({ type: 'error', message: e instanceof Error ? e.message : 'Delete failed' });
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
    };

    const openEdit = (company: CompanyCompare) => {
        setEditCompany(company);
        setEditJson(JSON.stringify({ ...company, companyId: company.id, id: company.id }, null, 2));
    };

    const openReviewsEditor = async (company: CompanyCompare) => {
        setReviewsCompany(company);
        setReviewDraft([]);
        setLoadingReviews(true);
        try {
            const fresh = await fetchCompanyByIdFromApi(company.id);
            const normalized = normalizeCompanyFromApi(fresh);
            setReviewsCompany(normalized);
            setReviewDraft(normalized.reviews ?? []);
        } catch (e) {
            setToast({
                type: 'error',
                message: e instanceof Error ? e.message : 'Failed to load reviews',
            });
            setReviewsCompany(null);
        } finally {
            setLoadingReviews(false);
        }
    };

    const closeReviewsEditor = () => {
        setReviewsCompany(null);
        setReviewDraft([]);
    };

    const handleSaveReviews = async () => {
        if (!reviewsCompany) return;
        setSavingReviews(true);
        try {
            const payload = buildCompanyUpsertPayload({
                ...reviewsCompany,
                reviews: reviewDraft,
            });
            await adminUpsertCompany(payload);
            invalidateCompanyCompareCache();
            setToast({
                type: 'success',
                message: `Updated reviews for ${reviewsCompany.identity.name}`,
            });
            closeReviewsEditor();
            await loadData();
        } catch (e) {
            setToast({
                type: 'error',
                message: e instanceof Error ? e.message : 'Failed to save reviews',
            });
        } finally {
            setSavingReviews(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editCompany) return;
        setSavingEdit(true);
        try {
            const parsed = JSON.parse(editJson) as Record<string, unknown>;
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid JSON object');
            }
            const companyId = String(parsed.companyId ?? parsed.id ?? editCompany.id);
            await adminUpsertCompany({ ...parsed, companyId, id: companyId });
            invalidateCompanyCompareCache();
            setToast({ type: 'success', message: `Updated ${editCompany.identity.name}` });
            setEditCompany(null);
            setEditJson('');
            await loadData();
        } catch (e) {
            setToast({ type: 'error', message: e instanceof Error ? e.message : 'Update failed' });
        } finally {
            setSavingEdit(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900">Company Compare data</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Upload AmbitionBox JSON and sync to DynamoDB. The Compare Companies UI reads from the API.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Companies in DB</p>
                        <p className="text-2xl font-bold text-gray-900">{loading ? '…' : companies.length}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">Last updated</p>
                        <p className="text-sm font-medium text-gray-900">{lastUpdated ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">API</p>
                        <p className="text-xs font-mono text-gray-700 truncate">{getCompanyCompareApiBase() || 'Not configured'}</p>
                    </div>
                </div>
            </div>

            {!apiConfigured && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Deploy the SAM stack in <code className="font-mono">lambda/company-compare</code>, then set{' '}
                    <code className="font-mono">VITE_COMPANY_COMPARE_API_URL</code> in <code className="font-mono">.env.local</code>.
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">Upload JSON</h3>
                <p className="mt-1 text-sm text-gray-500">
                    Expected format: <code className="font-mono">{`{ "companies": [ ... ] }`}</code> (new or legacy schema)
                </p>
                <div
                    className={`mt-4 rounded-xl border-2 border-dashed p-4 transition-colors ${
                        isDragOver ? 'border-[#5670FB] bg-[#EEF4FF]' : 'border-[#D6DFEA] bg-[#FAFCFF]'
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                    }}
                    onDrop={handleDrop}
                >
                    <p className="mb-3 text-sm text-gray-600">
                        Drag and drop your JSON file here, or choose a file manually.
                    </p>
                    <div className="flex flex-wrap gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) void handleFile(file);
                            e.target.value = '';
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-[#5670FB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4358d9]"
                    >
                        Choose JSON file
                    </button>
                    {pendingUpload && (
                        <button
                            type="button"
                            onClick={() => {
                                setPendingUpload(null);
                                setUploadPreview(null);
                                setMappedPreview([]);
                            }}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Clear selection
                        </button>
                    )}
                    </div>
                </div>

                {uploadPreview && (
                    <div className="mt-4 rounded-lg border border-[#EBF0F6] bg-[#FAFCFF] p-4">
                        <p className="text-sm font-semibold text-[#1E223C]">
                            Preview: {uploadPreview.count} companies ready to sync
                        </p>
                        <p className="mt-2 text-xs text-gray-600">
                            Companies: {uploadPreview.sampleNames.join(', ')}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Industries:{' '}
                            {Object.entries(uploadPreview.industries)
                                .map(([k, v]) => `${k} (${v})`)
                                .join(', ')}
                        </p>
                        <button
                            type="button"
                            disabled={syncing}
                            onClick={() => void handleSync()}
                            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {syncing ? 'Syncing…' : 'Sync to DB'}
                        </button>
                    </div>
                )}

                {mappedPreview.length > 0 && (
                    <div className="mt-4 rounded-lg border border-[#EBF0F6] bg-white p-4">
                        <p className="text-sm font-semibold text-[#1E223C]">
                            Stored mapping preview ({mappedPreview.length} companies)
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            This is how uploaded items are normalized before storing in DynamoDB.
                        </p>
                        <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                            {mappedPreview.map((item) => (
                                <div key={item.companyId} className="rounded-md border border-gray-100 bg-[#FAFCFF] p-3">
                                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                    <div className="mt-2 grid gap-1 text-xs text-gray-600 sm:grid-cols-2">
                                        <p><span className="font-medium text-gray-700">companyId:</span> {item.companyId}</p>
                                        <p><span className="font-medium text-gray-700">industry:</span> {item.industry}</p>
                                        <p><span className="font-medium text-gray-700">headquarters:</span> {item.headquarters}</p>
                                        <p><span className="font-medium text-gray-700">overallRating:</span> {item.overallRating.toFixed(1)}</p>
                                        <p><span className="font-medium text-gray-700">salaries:</span> {item.salaryCount}</p>
                                        <p><span className="font-medium text-gray-700">interviews:</span> {item.interviewCount}</p>
                                        <p><span className="font-medium text-gray-700">benefits:</span> {item.benefitCount}</p>
                                        <p><span className="font-medium text-gray-700">reviews:</span> {item.reviewCount}</p>
                                        <p><span className="font-medium text-gray-700">activeJobs:</span> {item.activeJobsCount}</p>
                                        <p><span className="font-medium text-gray-700">createdAt:</span> {item.createdAt ?? 'set on sync'}</p>
                                        <p><span className="font-medium text-gray-700">updatedAt:</span> {item.updatedAt ?? 'set on sync'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 px-5 py-3">
                    <h3 className="font-semibold text-gray-900">Stored companies</h3>
                </div>
                {loading ? (
                    <p className="p-5 text-sm text-gray-500">Loading…</p>
                ) : companies.length === 0 ? (
                    <p className="p-5 text-sm text-gray-500">No companies yet. Upload and sync JSON above.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                        {companies.map(c => (
                            <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                <div className="flex min-w-0 items-center gap-3">
                                    {c.logoUrl ? (
                                        <img
                                            src={c.logoUrl}
                                            alt={c.identity.name}
                                            className="h-10 w-10 shrink-0 rounded-lg border border-gray-200 object-cover bg-white"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = 'none';
                                                const next = target.nextElementSibling as HTMLElement | null;
                                                if (next) next.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600"
                                        aria-hidden
                                    >
                                        {c.identity.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{c.identity.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {c.identity.industry} · {c.ratings.overall_rating.toFixed(1)}/5 · {c.reviews.length} reviews
                                    </p>
                                </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setViewCompany(c)}
                                        className="text-xs font-semibold text-[#5670FB] hover:text-[#4358d9]"
                                    >
                                        View
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void openReviewsEditor(c)}
                                        className="text-xs font-semibold text-violet-700 hover:text-violet-800"
                                    >
                                        Reviews
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openEdit(c)}
                                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => void handleDelete(c.id, c.identity.name)}
                                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {viewCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                            <h4 className="font-semibold text-gray-900">View company: {viewCompany.identity.name}</h4>
                            <button
                                type="button"
                                onClick={() => setViewCompany(null)}
                                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>
                        <div className="max-h-[70vh] overflow-y-auto p-5">
                            <pre className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-4 text-xs text-gray-800">
                                {JSON.stringify(viewCompany, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {editCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                            <h4 className="font-semibold text-gray-900">Edit company: {editCompany.identity.name}</h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditCompany(null);
                                    setEditJson('');
                                }}
                                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
                            >
                                Close
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="mb-2 text-xs text-gray-500">
                                Edit JSON and save. This will upsert the company in DynamoDB.
                            </p>
                            <textarea
                                value={editJson}
                                onChange={(e) => setEditJson(e.target.value)}
                                className="h-[420px] w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 focus:border-[#5670FB] focus:outline-none focus:ring-2 focus:ring-[#5670FB]/25"
                            />
                            <div className="mt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditCompany(null);
                                        setEditJson('');
                                    }}
                                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={savingEdit}
                                    onClick={() => void handleSaveEdit()}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {savingEdit ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {reviewsCompany && (
                <CompanyCompareReviewsModal
                    companyName={reviewsCompany.identity.name}
                    reviews={reviewDraft}
                    loading={loadingReviews}
                    saving={savingReviews}
                    onClose={closeReviewsEditor}
                    onChange={setReviewDraft}
                    onSave={() => void handleSaveReviews()}
                />
            )}

            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
                        toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default CompanyCompareManagementPage;
