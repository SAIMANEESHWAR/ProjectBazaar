import * as React from 'react';
import {
    adminDeleteCompany,
    adminSyncCompanies,
    fetchCompaniesFromApi,
    getCompanyCompareAdminKey,
    getCompanyCompareApiBase,
    isCompanyCompareApiEnabled,
} from '../../services/companyCompareAdminApi';
import { invalidateCompanyCompareCache, normalizeCompany } from '../../lib/companyCompareData';
import type { CompanyCompare } from '../../types/companyCompare';

interface UploadPreview {
    count: number;
    industries: Record<string, number>;
    sampleNames: string[];
}

const CompanyCompareManagementPage: React.FC = () => {
    const [companies, setCompanies] = React.useState<CompanyCompare[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [syncing, setSyncing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [uploadPreview, setUploadPreview] = React.useState<UploadPreview | null>(null);
    const [pendingUpload, setPendingUpload] = React.useState<unknown[] | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const apiConfigured = isCompanyCompareApiEnabled();
    const adminKeyConfigured = Boolean(getCompanyCompareAdminKey());

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
            setUploadPreview({
                count: parsed.companies.length,
                industries,
                sampleNames: normalized.slice(0, 5).map(c => c.identity.name),
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid JSON file');
            setPendingUpload(null);
            setUploadPreview(null);
        }
    };

    const handleSync = async () => {
        if (!pendingUpload?.length) return;
        if (!adminKeyConfigured) {
            setToast({ type: 'error', message: 'Set VITE_COMPANY_COMPARE_ADMIN_KEY in .env.local' });
            return;
        }
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
                    <code className="font-mono">VITE_COMPANY_COMPARE_API_URL</code> and{' '}
                    <code className="font-mono">VITE_COMPANY_COMPARE_ADMIN_KEY</code> in <code className="font-mono">.env.local</code>.
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
                <div className="mt-4 flex flex-wrap gap-3">
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
                            }}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Clear selection
                        </button>
                    )}
                </div>

                {uploadPreview && (
                    <div className="mt-4 rounded-lg border border-[#EBF0F6] bg-[#FAFCFF] p-4">
                        <p className="text-sm font-semibold text-[#1E223C]">
                            Preview: {uploadPreview.count} companies ready to sync
                        </p>
                        <p className="mt-2 text-xs text-gray-600">
                            Sample: {uploadPreview.sampleNames.join(', ')}
                            {uploadPreview.count > 5 ? '…' : ''}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                            Industries:{' '}
                            {Object.entries(uploadPreview.industries)
                                .slice(0, 6)
                                .map(([k, v]) => `${k} (${v})`)
                                .join(', ')}
                        </p>
                        <button
                            type="button"
                            disabled={syncing || !adminKeyConfigured}
                            onClick={() => void handleSync()}
                            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {syncing ? 'Syncing…' : 'Sync to database'}
                        </button>
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
                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{c.identity.name}</p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {c.identity.industry} · {c.ratings.overall_rating.toFixed(1)}/5
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void handleDelete(c.id, c.identity.name)}
                                    className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

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
