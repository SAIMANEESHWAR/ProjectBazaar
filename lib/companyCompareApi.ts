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
    'https://o14vqopl3l.execute-api.ap-south-2.amazonaws.com/default/company_compare_handler';

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

export function buildCompanyCompareListBody(query: CompanyCompareListQuery = {}): Record<string, unknown> {
    const body: Record<string, unknown> = { action: 'list', limit: query.limit ?? 500 };
    if (query.search?.trim()) body.search = query.search.trim();
    if (query.industry) body.industry = query.industry;
    if (query.location) body.location = query.location;
    if (query.role) body.role = query.role;
    if (query.minRating != null) body.minRating = query.minRating;
    if (query.nextToken) body.nextToken = query.nextToken;
    return body;
}

function buildCompanyCompareListQuery(query: CompanyCompareListQuery = {}): string {
    const params = new URLSearchParams();
    params.set('limit', String(query.limit ?? 500));
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.industry) params.set('industry', query.industry);
    if (query.location) params.set('location', query.location);
    if (query.role) params.set('role', query.role);
    if (query.minRating != null) params.set('minRating', String(query.minRating));
    if (query.nextToken) params.set('nextToken', query.nextToken);
    return params.toString();
}

async function fetchCompaniesLegacyGet(
    base: string,
    query: CompanyCompareListQuery = {},
): Promise<CompanyCompareListResponse> {
    const qs = buildCompanyCompareListQuery(query);
    const url = qs ? `${base}?${qs}` : base;
    const res = await fetch(url, { method: 'GET' });
    const data = (await res.json()) as CompanyCompareListResponse;
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
}

export async function fetchCompaniesFromApi(
    query: CompanyCompareListQuery = {},
): Promise<CompanyCompareListResponse> {
    const base = getCompanyCompareApiBase();
    if (!base) {
        return { companies: [], count: 0, totalMatched: 0 };
    }
    const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildCompanyCompareListBody(query)),
    });
    const data = (await res.json()) as CompanyCompareListResponse;
    if (res.status === 405) {
        return fetchCompaniesLegacyGet(base, query);
    }
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
    const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', companyId }),
    });
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
    if (!base) {
        throw new Error('Company compare API URL not configured');
    }
    const adminKey = getCompanyCompareAdminKey();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (adminKey) {
        headers['x-admin-key'] = adminKey;
    }
    const res = await fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'admin_sync', companies }),
    });
    const data = (await res.json()) as AdminSyncResponse;
    if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
    }
    return data;
}

export async function adminDeleteCompany(companyId: string): Promise<void> {
    const base = getCompanyCompareApiBase();
    if (!base) {
        throw new Error('Company compare API URL not configured');
    }
    const adminKey = getCompanyCompareAdminKey();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (adminKey) {
        headers['x-admin-key'] = adminKey;
    }
    const res = await fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'admin_delete', companyId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
}

export async function adminUpsertCompany(company: unknown): Promise<void> {
    const base = getCompanyCompareApiBase();
    if (!base) {
        throw new Error('Company compare API URL not configured');
    }
    const adminKey = getCompanyCompareAdminKey();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (adminKey) {
        headers['x-admin-key'] = adminKey;
    }
    const res = await fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'admin_upsert', company }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
    }
}
