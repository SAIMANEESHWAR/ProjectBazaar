import type { CompanyCompare } from '../types/companyCompare';

export interface CompanyCompareListQuery {
    search?: string;
    industry?: string;
    location?: string;
    role?: string;
    minRating?: number;
    limit?: number;
    nextToken?: string | null;
}

export interface CompanyCompareListResponse {
    companies?: CompanyCompareApiItem[];
    count?: number;
    totalMatched?: number;
    nextToken?: string | null;
    error?: string;
}

export interface CompanyCompareApiItem {
    companyId?: string;
    id?: string;
    name?: string;
    logoUrl?: string;
    identity?: CompanyCompare['identity'];
    foundedYear?: number;
    employeeCount?: string;
    overviewUrl?: string;
    ratings?: CompanyCompare['ratings'];
    salaryRange?: string;
    salaries?: CompanyCompare['salaries'];
    interviews?: CompanyCompare['interviews'];
    benefits?: CompanyCompare['benefits'];
    reviews?: CompanyCompare['reviews'];
    active_jobs?: CompanyCompare['active_jobs'];
    interviewQuestions?: string[];
    metadata?: CompanyCompare['metadata'];
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminSyncResponse {
    success?: boolean;
    message?: string;
    count?: number;
    removed?: number;
    error?: string;
}

const OFFLINE = import.meta.env.VITE_COMPANY_COMPARE_OFFLINE === 'true';

const DEFAULT_COMPANY_COMPARE_API_URL =
    'https://et6a14hdo1.execute-api.ap-south-2.amazonaws.com/default/company_compare_handler';

export function getCompanyCompareApiBase(): string {
    if (OFFLINE) return '';
    const fromEnv = (import.meta.env.VITE_COMPANY_COMPARE_API_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    return DEFAULT_COMPANY_COMPARE_API_URL;
}

export function getCompanyCompareAdminKey(): string {
    return (import.meta.env.VITE_COMPANY_COMPARE_ADMIN_KEY as string | undefined)?.trim() || '';
}

export function isCompanyCompareApiEnabled(): boolean {
    return Boolean(getCompanyCompareApiBase());
}

export function buildCompanyCompareListUrl(base: string, query: CompanyCompareListQuery = {}): string {
    const params = new URLSearchParams();
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.industry) params.set('industry', query.industry);
    if (query.location) params.set('location', query.location);
    if (query.role) params.set('role', query.role);
    if (query.minRating != null) params.set('minRating', String(query.minRating));
    params.set('limit', String(query.limit ?? 500));
    if (query.nextToken) params.set('nextToken', query.nextToken);
    const qs = params.toString();
    return qs ? `${base}/companies?${qs}` : `${base}/companies`;
}

export async function fetchCompaniesFromApi(
    query: CompanyCompareListQuery = {},
): Promise<CompanyCompareListResponse> {
    const base = getCompanyCompareApiBase();
    if (!base) {
        return { companies: [], count: 0, totalMatched: 0 };
    }
    const res = await fetch(buildCompanyCompareListUrl(base, query));
    const data = (await res.json()) as CompanyCompareListResponse;
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
}

export async function fetchCompanyByIdFromApi(companyId: string): Promise<CompanyCompareApiItem> {
    const base = getCompanyCompareApiBase();
    if (!base) {
        throw new Error('Company compare API not configured');
    }
    const res = await fetch(`${base}/companies/${encodeURIComponent(companyId)}`);
    const data = (await res.json()) as { company?: CompanyCompareApiItem; error?: string };
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    if (!data.company) {
        throw new Error('Company not found');
    }
    return data.company;
}

export async function adminSyncCompanies(companies: unknown[]): Promise<AdminSyncResponse> {
    const base = getCompanyCompareApiBase();
    const adminKey = getCompanyCompareAdminKey();
    if (!base) {
        throw new Error('Company compare API URL not configured');
    }
    if (!adminKey) {
        throw new Error('VITE_COMPANY_COMPARE_ADMIN_KEY not configured');
    }
    const res = await fetch(`${base}/admin/companies/sync`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminKey,
        },
        body: JSON.stringify({ companies }),
    });
    const data = (await res.json()) as AdminSyncResponse;
    if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return data;
}

export async function adminDeleteCompany(companyId: string): Promise<void> {
    const base = getCompanyCompareApiBase();
    const adminKey = getCompanyCompareAdminKey();
    if (!base || !adminKey) {
        throw new Error('Company compare API or admin key not configured');
    }
    const res = await fetch(`${base}/admin/companies/${encodeURIComponent(companyId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
}
