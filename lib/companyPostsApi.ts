export const DEFAULT_COMPANY_POSTS_PAGE_SIZE = 10;

export interface CompanyPostsListQuery {
    company?: string;
    category?: string;
    authorUserId?: string;
    search?: string;
    limit?: number;
    nextToken?: string | null;
    includeTotal?: boolean;
}

export interface CompanyPostsListResponse {
    posts?: unknown[];
    nextToken?: string | null;
    count?: number;
    totalMatched?: number;
    error?: string;
}

/** Matches lambda/company_posts_handler.py encode_next_token ({ offset }). */
export function encodeCompanyPostsPageToken(offset: number): string {
    const json = JSON.stringify({ offset: Math.max(0, offset) });
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function buildCompanyPostsListUrl(base: string, query: CompanyPostsListQuery): string {
    const params = new URLSearchParams();
    if (query.company) params.set('company', query.company);
    if (query.category) params.set('category', query.category);
    if (query.authorUserId) params.set('authorUserId', query.authorUserId);
    if (query.search?.trim()) params.set('search', query.search.trim());
    params.set('limit', String(query.limit ?? DEFAULT_COMPANY_POSTS_PAGE_SIZE));
    if (query.nextToken) params.set('nextToken', query.nextToken);
    if (query.includeTotal) params.set('includeTotal', 'true');
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
}

export async function fetchCompanyPostsPage(
    base: string,
    query: CompanyPostsListQuery,
    headers: Record<string, string>,
): Promise<CompanyPostsListResponse> {
    const res = await fetch(buildCompanyPostsListUrl(base, query), { headers });
    const j = (await res.json()) as CompanyPostsListResponse;
    if (!res.ok) {
        throw new Error(j.error || `HTTP ${res.status}`);
    }
    return j;
}
