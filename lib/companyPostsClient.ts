import { fetchCompanyPostsPage } from './companyPostsApi';
import type { CompanyPost, CompanyPostComment, PostCategory } from '../types/companyPosts';

const POST_CATEGORIES = [
    'interview-experience',
    'company-feedback',
    'salary-compensation',
    'career-discussion',
] as const satisfies readonly PostCategory[];

export const COMPANY_POSTS_STORAGE_KEY = 'dashboardCompanyPosts';
export const PENDING_COMPANY_POSTS_FILTER_KEY = 'pendingCompanyPostsCompanyFilter';

export const COMPANY_POSTS_CATEGORY_LABELS: Record<PostCategory, { label: string; shortLabel: string }> = {
    'interview-experience': { label: 'Interview Experience', shortLabel: 'Interview' },
    'company-feedback': { label: 'Company Feedback', shortLabel: 'Feedback' },
    'salary-compensation': { label: 'Salary Compensation', shortLabel: 'Salary' },
    'career-discussion': { label: 'Career Discussion', shortLabel: 'Career' },
};

export const COMPANY_POSTS_CATEGORY_BADGE: Record<PostCategory, string> = {
    'interview-experience': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'company-feedback': 'bg-blue-50 text-blue-700 border-blue-100',
    'salary-compensation': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'career-discussion': 'bg-purple-50 text-purple-700 border-purple-100',
};

export function getCompanyPostsApiBase(): string {
    if (import.meta.env.VITE_COMPANY_POSTS_OFFLINE === 'true') return '';
    const fromEnv = (import.meta.env.VITE_COMPANY_POSTS_API_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    return 'https://dj1gnnn8p9.execute-api.ap-south-2.amazonaws.com/default/company_posts_handler';
}

export function isCompanyPostsApiEnabled(): boolean {
    return Boolean(getCompanyPostsApiBase());
}

function isPostCategory(value: unknown): value is PostCategory {
    return typeof value === 'string' && (POST_CATEGORIES as readonly string[]).includes(value);
}

function normalizeCompanyPostForCategory(p: CompanyPost): CompanyPost {
    const c = p.category;
    const rating =
        typeof p.companyRating === 'number' && p.companyRating >= 1 && p.companyRating <= 5
            ? p.companyRating
            : undefined;

    return {
        ...p,
        packageDetails: c === 'salary-compensation' ? p.packageDetails : undefined,
        companyRating: c === 'company-feedback' ? rating : undefined,
        careerTopic: c === 'career-discussion' && typeof p.careerTopic === 'string' ? p.careerTopic : undefined,
        interviewRound:
            c === 'interview-experience' && typeof p.interviewRound === 'string' ? p.interviewRound : undefined,
    };
}

export function mapApiPostToCompanyPost(raw: unknown): CompanyPost | null {
    if (!raw || typeof raw !== 'object') return null;
    const p = raw as Record<string, unknown>;
    const id = typeof p.id === 'string' ? p.id : null;
    if (!id || !isPostCategory(p.category)) return null;
    const commentsRaw = Array.isArray(p.comments) ? p.comments : [];
    const comments: CompanyPostComment[] = commentsRaw
        .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
        .map(c => ({
            id: String(c.id ?? ''),
            author: String(c.author ?? ''),
            text: String(c.text ?? ''),
            createdAt: String(c.createdAt ?? ''),
        }))
        .filter(c => c.id && c.text);

    return normalizeCompanyPostForCategory({
        id,
        authorId: typeof p.authorId === 'string' ? p.authorId : null,
        authorName: String(p.authorName ?? ''),
        companyName: typeof p.companyName === 'string' ? p.companyName : 'General',
        isAdminCompany: Boolean(p.isAdminCompany),
        role: typeof p.role === 'string' ? p.role : 'General',
        category: p.category as PostCategory,
        createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
        updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : undefined,
        title: String(p.title ?? ''),
        content: String(p.content ?? ''),
        location: typeof p.location === 'string' ? p.location : undefined,
        experienceLevel: typeof p.experienceLevel === 'string' ? p.experienceLevel : undefined,
        interviewRound: typeof p.interviewRound === 'string' ? p.interviewRound : undefined,
        packageDetails: p.packageDetails as CompanyPost['packageDetails'],
        companyRating: typeof p.companyRating === 'number' ? p.companyRating : undefined,
        careerTopic: typeof p.careerTopic === 'string' ? p.careerTopic : undefined,
        tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
        upvotes: typeof p.upvotes === 'number' ? p.upvotes : 0,
        hasUpvoted: Boolean(p.hasUpvoted),
        comments,
    });
}

export function postMatchesCompany(postCompany: string, exploreCompany: string): boolean {
    const a = postCompany.trim().toLowerCase();
    const b = exploreCompany.trim().toLowerCase();
    if (!a || !b) return false;
    if (a === b) return true;
    return a.includes(b) || b.includes(a);
}

function loadOfflinePosts(): CompanyPost[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(COMPANY_POSTS_STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((item): item is CompanyPost => Boolean(item && typeof item === 'object' && typeof item.id === 'string'))
            .map(item => normalizeCompanyPostForCategory(item));
    } catch {
        return [];
    }
}

export function resolvePostsCompanyFilter(exploreCompanyName: string, posts: CompanyPost[]): string {
    const matched = posts.find(p => postMatchesCompany(p.companyName, exploreCompanyName));
    return matched?.companyName ?? exploreCompanyName;
}

export interface CompanyPostsPreviewResult {
    posts: CompanyPost[];
    totalMatched: number;
    filterCompanyName: string;
}

export async function fetchCompanyPostsPreview(
    companyName: string,
    options?: { limit?: number; userEmail?: string | null },
): Promise<CompanyPostsPreviewResult> {
    const limit = options?.limit ?? 5;
    const empty: CompanyPostsPreviewResult = { posts: [], totalMatched: 0, filterCompanyName: companyName };

    if (!isCompanyPostsApiEnabled()) {
        const offline = loadOfflinePosts()
            .filter(p => postMatchesCompany(p.companyName, companyName))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        return {
            posts: offline.slice(0, limit),
            totalMatched: offline.length,
            filterCompanyName: resolvePostsCompanyFilter(companyName, offline),
        };
    }

    const base = getCompanyPostsApiBase();
    const headers: Record<string, string> = {};
    if (options?.userEmail) headers['x-user-id'] = options.userEmail;

    try {
        const exact = await fetchCompanyPostsPage(
            base,
            { company: companyName, limit, includeTotal: true },
            headers,
        );
        let list = (exact.posts ?? []).map(mapApiPostToCompanyPost).filter((p): p is CompanyPost => p != null);

        if (list.length === 0) {
            const search = await fetchCompanyPostsPage(
                base,
                { search: companyName, limit: Math.max(limit * 4, 20), includeTotal: true },
                headers,
            );
            list = (search.posts ?? [])
                .map(mapApiPostToCompanyPost)
                .filter((p): p is CompanyPost => p != null)
                .filter(p => postMatchesCompany(p.companyName, companyName));
        }

        const totalMatched =
            list.length > 0
                ? list.length
                : typeof exact.totalMatched === 'number'
                  ? exact.totalMatched
                  : 0;

        return {
            posts: list.slice(0, limit),
            totalMatched,
            filterCompanyName: resolvePostsCompanyFilter(companyName, list),
        };
    } catch {
        return empty;
    }
}

export function formatCompanyPostDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function truncateText(text: string, maxLen: number): string {
    const t = text.trim();
    if (t.length <= maxLen) return t;
    return `${t.slice(0, maxLen).trim()}…`;
}
