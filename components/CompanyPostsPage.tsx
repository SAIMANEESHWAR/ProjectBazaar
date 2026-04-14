import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useAuth } from '../App';
import CompanyPostDetailView from './CompanyPostDetailView';
import engagementLottie from '../lottiefiles/wired-outline-2803-engagement-alt-hover-pinch.json';
import type {
    CompanyPost,
    CompanyPostComment,
    CompanyPostOfferType,
    PostCategory,
} from '../types/companyPosts';

export type { CompanyPost, CompanyPostComment, CompanyPostOfferType, PostCategory } from '../types/companyPosts';

const POST_CATEGORIES = [
    'interview-experience',
    'company-feedback',
    'salary-compensation',
    'career-discussion',
] as const satisfies readonly PostCategory[];

/** Which form sections to render for create-post UI (single source for layout). */
type CategoryFormLayout = 'interview' | 'salary' | 'feedback' | 'career';

const EXPERIENCE_LEVEL_OPTIONS = ['Fresher', '0-1 years', '1-3 years', '3+ years'] as const;

const INTERVIEW_FOCUS_OPTIONS = [
    'Online Assessment',
    'Technical Interview',
    'System Design',
    'HR / Managerial',
] as const;

const OFFER_TYPE_OPTIONS = ['Internship', 'Full-time', 'Intern + PPO'] as const satisfies readonly CompanyPostOfferType[];

const CATEGORY_META: Record<
    PostCategory,
    {
        label: string;
        shortLabel: string;
        formLayout: CategoryFormLayout;
        requireCompany: boolean;
        requireRole: boolean;
        requireCtc: boolean;
        requireRating: boolean;
        titlePlaceholder: string;
        contentPlaceholder: string;
    }
> = {
    'interview-experience': {
        label: 'Interview Experience',
        shortLabel: 'Interview',
        formLayout: 'interview',
        requireCompany: true,
        requireRole: true,
        requireCtc: false,
        requireRating: false,
        titlePlaceholder: 'e.g., Google SDE Intern 2026 – 3 rounds, OA + interviews',
        contentPlaceholder:
            'Describe each round, questions you remember, difficulty level, preparation tips, and final result.',
    },
    'company-feedback': {
        label: 'Company Feedback',
        shortLabel: 'Feedback',
        formLayout: 'feedback',
        requireCompany: true,
        requireRole: false,
        requireCtc: false,
        requireRating: true,
        titlePlaceholder: 'e.g., Microsoft Work Culture Review - Great WLB, Supportive Team',
        contentPlaceholder:
            'Share your experience about company culture, work-life balance, team support, growth opportunities, management style, perks, and overall satisfaction.',
    },
    'salary-compensation': {
        label: 'Salary Compensation',
        shortLabel: 'Salary',
        formLayout: 'salary',
        requireCompany: true,
        requireRole: true,
        requireCtc: true,
        requireRating: false,
        titlePlaceholder: 'e.g., Amazon SDE1 package – 45 LPA CTC, 23 LPA base',
        contentPlaceholder:
            'Explain CTC vs in-hand, bonuses, stocks, cost of living, work-from-home policy, negotiation tips, etc.',
    },
    'career-discussion': {
        label: 'Career Discussion',
        shortLabel: 'Career',
        formLayout: 'career',
        requireCompany: false,
        requireRole: false,
        requireCtc: false,
        requireRating: false,
        titlePlaceholder: 'e.g., How to transition from Frontend to Full Stack Developer?',
        contentPlaceholder:
            'Share career advice, tips, experiences, challenges faced, solutions, and insights that can help others in their career journey.',
    },
};

function isPostCategory(value: unknown): value is PostCategory {
    return typeof value === 'string' && (POST_CATEGORIES as readonly string[]).includes(value);
}

function isValidOfferType(value: string): value is CompanyPostOfferType {
    return (OFFER_TYPE_OPTIONS as readonly string[]).includes(value);
}

function normalizeCompanyPostForCategory(p: CompanyPost): CompanyPost {
    const c = p.category;
    const rating =
        typeof p.companyRating === 'number' && p.companyRating >= 1 && p.companyRating <= 5
            ? p.companyRating
            : undefined;
    const rawOffer = p.packageDetails?.offerType;
    const offerType =
        typeof rawOffer === 'string' && isValidOfferType(rawOffer) ? rawOffer : undefined;

    return {
        ...p,
        packageDetails:
            c === 'salary-compensation' && p.packageDetails
                ? {
                      ...p.packageDetails,
                      offerType,
                  }
                : undefined,
        companyRating: c === 'company-feedback' ? rating : undefined,
        careerTopic: c === 'career-discussion' && typeof p.careerTopic === 'string' ? p.careerTopic : undefined,
        interviewRound: c === 'interview-experience' && typeof p.interviewRound === 'string' ? p.interviewRound : undefined,
    };
}

function sanitizeStoredPosts(raw: unknown): CompanyPost[] {
    if (!Array.isArray(raw)) return [];
    const out: CompanyPost[] = [];
    for (const item of raw) {
        if (!item || typeof item !== 'object') continue;
        const p = item as Partial<CompanyPost>;
        if (!p.id || typeof p.id !== 'string') continue;
        if (!isPostCategory(p.category)) continue;
        const base: CompanyPost = {
            ...p,
            category: p.category,
            companyName: typeof p.companyName === 'string' ? p.companyName : 'General',
            role: typeof p.role === 'string' ? p.role : 'General',
            title: typeof p.title === 'string' ? p.title : '',
            content: typeof p.content === 'string' ? p.content : '',
            comments: Array.isArray(p.comments) ? p.comments : [],
            upvotes: typeof p.upvotes === 'number' ? p.upvotes : 0,
            hasUpvoted: typeof p.hasUpvoted === 'boolean' ? p.hasUpvoted : false,
        } as CompanyPost;
        out.push(normalizeCompanyPostForCategory(base));
    }
    return out;
}

/** Map Lambda GET response item → CompanyPost */
function mapApiPostToCompanyPost(raw: unknown): CompanyPost | null {
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

const STORAGE_KEY = 'dashboardCompanyPosts';

const CATEGORY_BADGE_STYLES: Record<PostCategory, string> = {
    'interview-experience': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'company-feedback': 'bg-blue-50 text-blue-700 border-blue-100',
    'salary-compensation': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'career-discussion': 'bg-purple-50 text-purple-700 border-purple-100',
};

function getCategoryValidationError(input: {
    category: PostCategory;
    title: string;
    content: string;
    companyName: string;
    role: string;
    ctc: string;
    companyRating: number;
    offerType: string;
}): string | null {
    const meta = CATEGORY_META[input.category];
    if (!input.title.trim() || !input.content.trim()) {
        return 'Add a title and details for your post.';
    }
    if (meta.requireCompany && !input.companyName.trim()) {
        return 'Select or enter a company name.';
    }
    if (meta.requireRole && !input.role.trim()) {
        return 'Enter your role or position.';
    }
    if (meta.requireCtc) {
        const ctcTrim = input.ctc.trim();
        if (!ctcTrim) {
            return 'Enter CTC (approx.) for salary posts.';
        }
        if (!/\d/.test(ctcTrim)) {
            return 'CTC should include a number (e.g., 18 LPA or 45,00,000).';
        }
    }
    if (meta.requireRating && (input.companyRating < 1 || input.companyRating > 5)) {
        return 'Choose an overall company rating from 1 to 5 stars.';
    }
    if (input.category === 'salary-compensation' && input.offerType.trim() && !isValidOfferType(input.offerType)) {
        return 'Select a valid offer type, or leave it blank.';
    }
    return null;
}

/**
 * JSON body for POST /posts — aligned with `lambda/company_posts_handler.py`.
 * Category-specific fields should match {@link normalizeCompanyPostForCategory} (same shape as persisted locally).
 */
export function toLambdaCreateBody(post: CompanyPost, isAnonymous: boolean): Record<string, unknown> {
    const body: Record<string, unknown> = {
        isAnonymous,
        authorName: post.authorName,
        companyName: post.companyName,
        isAdminCompany: post.isAdminCompany,
        role: post.role,
        category: post.category,
        title: post.title,
        content: post.content,
        tags: post.tags ?? [],
        upvotes: post.upvotes,
        comments: post.comments ?? [],
    };
    if (!isAnonymous && post.authorId) {
        body.authorId = post.authorId;
        body.authorUserId = post.authorId;
    }
    if (post.location) body.location = post.location;
    if (post.experienceLevel) body.experienceLevel = post.experienceLevel;
    if (post.interviewRound) body.interviewRound = post.interviewRound;
    if (post.packageDetails) body.packageDetails = post.packageDetails;
    if (post.companyRating != null) body.companyRating = post.companyRating;
    if (post.careerTopic) body.careerTopic = post.careerTopic;
    return body;
}

const defaultAdminCompanies = [
    'Google',
    'Microsoft',
    'Amazon',
    'Flipkart',
    'Swiggy',
    'Razorpay',
    'Zomato',
    'TCS',
    'Infosys',
    'Wipro',
];

/** Set `VITE_COMPANY_POSTS_OFFLINE=true` to use browser storage only. Otherwise uses env URL or default API. */
const companyPostsApiBase = (() => {
    if (import.meta.env.VITE_COMPANY_POSTS_OFFLINE === 'true') return '';
    const fromEnv = (import.meta.env.VITE_COMPANY_POSTS_API_URL as string | undefined)?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    return 'https://dj1gnnn8p9.execute-api.ap-south-2.amazonaws.com/default/company_posts_handler';
})();

const useCompanyPostsApi = Boolean(companyPostsApiBase);

const CompanyPostsPage: React.FC<{ toggleSidebar?: () => void }> = () => {
    const { userEmail } = useAuth();
    const [posts, setPosts] = useState<CompanyPost[]>([]);
    const [postsLoading, setPostsLoading] = useState(useCompanyPostsApi);
    const [postsFetchError, setPostsFetchError] = useState<string | null>(null);
    const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | PostCategory>('all');
    const [viewMineOnly, setViewMineOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isCreating, setIsCreating] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isAdminCompany, setIsAdminCompany] = useState(true);
    const [selectedAdminCompany, setSelectedAdminCompany] = useState<string>('');
    const [customCompanyName, setCustomCompanyName] = useState('');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [category, setCategory] = useState<PostCategory>('interview-experience');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [interviewRound, setInterviewRound] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Salary compensation fields
    const [ctc, setCtc] = useState('');
    const [basePay, setBasePay] = useState('');
    const [bonus, setBonus] = useState('');
    const [stock, setStock] = useState('');
    const [graduationYear, setGraduationYear] = useState('');
    const [offerType, setOfferType] = useState<CompanyPostOfferType | ''>('');

    // Company feedback fields
    const [companyRating, setCompanyRating] = useState<number>(0);

    // Career discussion fields
    const [careerTopic, setCareerTopic] = useState('');

    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [isSubmittingPost, setIsSubmittingPost] = useState(false);
    const [detailPostId, setDetailPostId] = useState<string | null>(null);
    const pageRootRef = useRef<HTMLDivElement>(null);
    const [mainPanelInset, setMainPanelInset] = useState<{ left: number; width: number } | null>(null);

    /** Track dashboard main column geometry so post detail matches flex area (sidebar open/collapsed). */
    useLayoutEffect(() => {
        const root = pageRootRef.current;
        const main = root?.closest('main');
        if (!main) return;
        const update = () => {
            const r = main.getBoundingClientRect();
            setMainPanelInset({ left: r.left, width: r.width });
        };
        update();
        const ro = new ResizeObserver(() => update());
        ro.observe(main);
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    useLayoutEffect(() => {
        if (!detailPostId) return;
        const main = pageRootRef.current?.closest('main');
        if (!main) return;
        const r = main.getBoundingClientRect();
        setMainPanelInset({ left: r.left, width: r.width });
    }, [detailPostId]);

    const detailPost = useMemo(
        () => (detailPostId ? posts.find(p => p.id === detailPostId) : undefined),
        [posts, detailPostId],
    );

    useEffect(() => {
        if (!detailPostId || !useCompanyPostsApi) return;
        let cancelled = false;
        (async () => {
            try {
                const h: Record<string, string> = {};
                if (userEmail) h['x-user-id'] = userEmail;
                const res = await fetch(
                    `${companyPostsApiBase}?postId=${encodeURIComponent(detailPostId)}`,
                    { headers: h },
                );
                const j = (await res.json()) as { post?: unknown; error?: string };
                if (!res.ok || cancelled) return;
                const mapped = mapApiPostToCompanyPost(j.post);
                if (!mapped || cancelled) return;
                setPosts(prev => {
                    const i = prev.findIndex(p => p.id === mapped.id);
                    if (i >= 0) {
                        const next = [...prev];
                        next[i] = mapped;
                        return next;
                    }
                    return [mapped, ...prev];
                });
            } catch {
                // ignore
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [detailPostId, useCompanyPostsApi, companyPostsApiBase, userEmail]);

    useEffect(() => {
        if (!detailPostId) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setDetailPostId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [detailPostId]);

    const loadRemotePosts = useCallback(async () => {
        if (!useCompanyPostsApi) return;
        setPostsLoading(true);
        setPostsFetchError(null);
        try {
            const headers: Record<string, string> = {};
            if (userEmail) headers['x-user-id'] = userEmail;
            const res = await fetch(companyPostsApiBase, { headers });
            const j = (await res.json()) as { posts?: unknown[]; error?: string };
            if (!res.ok) {
                throw new Error(j.error || `HTTP ${res.status}`);
            }
            const list = (j.posts ?? [])
                .map(mapApiPostToCompanyPost)
                .filter((p): p is CompanyPost => p != null);
            setPosts(list);
        } catch (e) {
            setPostsFetchError(e instanceof Error ? e.message : 'Failed to load posts');
            setPosts([]);
        } finally {
            setPostsLoading(false);
        }
    }, [companyPostsApiBase, userEmail]);

    // Load: remote API or localStorage
    useEffect(() => {
        if (!useCompanyPostsApi) {
            setPostsLoading(false);
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setPosts(sanitizeStoredPosts(parsed));
                }
            } catch {
                // ignore
            }
            return;
        }

        void loadRemotePosts();
    }, [loadRemotePosts]);

    // Persist to localStorage only when not using remote API
    useEffect(() => {
        if (useCompanyPostsApi) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        } catch {
            // ignore
        }
    }, [posts]);

    const currentUserName = useMemo(() => {
        if (!userEmail) return 'Anonymous User';
        return userEmail.split('@')[0] || 'Anonymous User';
    }, [userEmail]);

    const allCompanies = useMemo(() => {
        const customCompanies = posts
            .filter(p => !p.isAdminCompany)
            .map(p => p.companyName);
        const adminCompanies = [...defaultAdminCompanies, ...posts.filter(p => p.isAdminCompany).map(p => p.companyName)];
        return {
            admin: Array.from(new Set(adminCompanies)),
            custom: Array.from(new Set(customCompanies)),
        };
    }, [posts]);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            if (selectedCompanyFilter !== 'all' && post.companyName !== selectedCompanyFilter) return false;
            if (selectedCategoryFilter !== 'all' && post.category !== selectedCategoryFilter) return false;
            if (viewMineOnly) {
                const isMine =
                    (userEmail != null && post.authorId === userEmail) ||
                    (post.authorId == null && post.authorName === currentUserName);
                if (!isMine) return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const topicMatch =
                    post.careerTopic && post.careerTopic.toLowerCase().includes(q);
                const locationMatch =
                    post.location && post.location.toLowerCase().includes(q);
                const tagMatch =
                    post.tags?.some(t => t.toLowerCase().includes(q)) ?? false;
                const matches =
                    post.companyName.toLowerCase().includes(q) ||
                    post.role.toLowerCase().includes(q) ||
                    post.title.toLowerCase().includes(q) ||
                    post.content.toLowerCase().includes(q) ||
                    !!topicMatch ||
                    !!locationMatch ||
                    tagMatch;
                if (!matches) return false;
            }
            return true;
        });
    }, [posts, selectedCompanyFilter, selectedCategoryFilter, viewMineOnly, searchQuery, currentUserName, userEmail]);

    const filterExcludedAll =
        posts.length > 0 && filteredPosts.length === 0;

    const clearListFilters = () => {
        setSelectedCompanyFilter('all');
        setSelectedCategoryFilter('all');
        setViewMineOnly(false);
        setSearchQuery('');
    };

    const sortedAdminCompanyOptions = useMemo(
        () => [...allCompanies.admin].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
        [allCompanies.admin],
    );

    const resetForm = () => {
        setFormError(null);
        setIsCreating(false);
        setIsAdminCompany(true);
        setSelectedAdminCompany('');
        setCustomCompanyName('');
        setRole('');
        setLocation('');
        setCategory('interview-experience');
        setTitle('');
        setContent('');
        setExperienceLevel('');
        setInterviewRound('');
        setIsAnonymous(false);
        setCtc('');
        setBasePay('');
        setBonus('');
        setStock('');
        setGraduationYear('');
        setOfferType('');
        setCompanyRating(0);
        setCareerTopic('');
    };

    const handleCreatePost = async () => {
        const companyName = isAdminCompany ? selectedAdminCompany : customCompanyName;
        const validationError = getCategoryValidationError({
            category,
            title,
            content,
            companyName,
            role,
            ctc,
            companyRating,
            offerType,
        });
        if (validationError) {
            setFormError(validationError);
            return;
        }
        if (useCompanyPostsApi && !isAnonymous && !userEmail) {
            setFormError('Sign in to post with your name, or use Post as anonymous.');
            return;
        }
        setFormError(null);

        const id = `post-${Date.now()}`;
        const offerTypeClean =
            offerType && isValidOfferType(offerType) ? offerType : undefined;

        const newPost: CompanyPost = normalizeCompanyPostForCategory({
            id,
            authorId: isAnonymous || !userEmail ? null : userEmail,
            authorName: isAnonymous ? 'Anonymous' : currentUserName,
            companyName: companyName.trim() || 'General',
            isAdminCompany,
            role: role.trim() || 'General',
            category,
            createdAt: new Date().toISOString(),
            title: title.trim(),
            content: content.trim(),
            location: location.trim() || undefined,
            experienceLevel: experienceLevel || undefined,
            interviewRound: interviewRound || undefined,
            packageDetails: category === 'salary-compensation'
                ? {
                    ctc: ctc.trim(),
                    basePay: basePay.trim() || undefined,
                    bonus: bonus.trim() || undefined,
                    stock: stock.trim() || undefined,
                    graduationYear: graduationYear.trim() || undefined,
                    offerType: offerTypeClean,
                }
                : undefined,
            companyRating: category === 'company-feedback' ? companyRating : undefined,
            careerTopic: category === 'career-discussion' ? careerTopic.trim() || undefined : undefined,
            tags: [
                CATEGORY_META[category].label,
                ...(experienceLevel ? [experienceLevel] : []),
                ...(interviewRound ? [interviewRound] : []),
                ...(careerTopic.trim() ? [careerTopic.trim()] : []),
            ],
            upvotes: 0,
            hasUpvoted: false,
            comments: [],
        });

        if (!useCompanyPostsApi) {
            setPosts(prev => [newPost, ...prev]);
            resetForm();
            return;
        }

        setIsSubmittingPost(true);
        try {
            const body = toLambdaCreateBody(newPost, isAnonymous);
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (userEmail && !isAnonymous) {
                headers['x-user-id'] = userEmail;
                headers['x-user-name'] = currentUserName;
            }
            const res = await fetch(companyPostsApiBase, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            const j = (await res.json()) as { post?: unknown; error?: string; details?: string[] };
            if (!res.ok) {
                const msg = j.details?.length ? j.details.join(' ') : j.error || `HTTP ${res.status}`;
                throw new Error(msg);
            }
            const mapped = mapApiPostToCompanyPost(j.post);
            if (!mapped) throw new Error('Invalid response from server');
            setPosts(prev => [mapped, ...prev]);
            resetForm();
        } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Failed to create post');
        } finally {
            setIsSubmittingPost(false);
        }
    };

    const handleToggleComments = (postId: string) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handleAddComment = async (postId: string) => {
        const draft = (commentDrafts[postId] || '').trim();
        if (!draft) return;

        if (useCompanyPostsApi) {
            try {
                const res = await fetch(companyPostsApiBase, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'addComment',
                        postId,
                        author: currentUserName,
                        text: draft,
                    }),
                });
                const j = (await res.json()) as { post?: unknown; error?: string };
                if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
                const mapped = mapApiPostToCompanyPost(j.post);
                if (mapped) {
                    setPosts(prev => prev.map(p => (p.id === postId ? mapped : p)));
                }
                setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
                setExpandedComments(prev => ({ ...prev, [postId]: true }));
            } catch {
                // keep draft; optional: toast
            }
            return;
        }

        const newComment: CompanyPostComment = {
            id: `c-${Date.now()}`,
            author: currentUserName,
            text: draft,
            createdAt: new Date().toISOString(),
        };

        setPosts(prev =>
            prev.map(post =>
                post.id === postId ? { ...post, comments: [...post.comments, newComment] } : post,
            ),
        );
        setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
        setExpandedComments(prev => ({ ...prev, [postId]: true }));
    };

    const handleUpvote = async (postId: string) => {
        if (useCompanyPostsApi) {
            if (!userEmail) return;
            try {
                const res = await fetch(companyPostsApiBase, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userEmail,
                    },
                    body: JSON.stringify({ action: 'upvote', postId }),
                });
                const j = (await res.json()) as { post?: unknown; error?: string };
                if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
                const mapped = mapApiPostToCompanyPost(j.post);
                if (mapped) {
                    setPosts(prev => prev.map(p => (p.id === postId ? mapped : p)));
                }
            } catch {
                // ignore
            }
            return;
        }

        setPosts(prev =>
            prev.map(post => {
                if (post.id !== postId) return post;
                if (post.hasUpvoted) return post;
                return { ...post, upvotes: post.upvotes + 1, hasUpvoted: true };
            }),
        );
    };

    const renderCategoryBadge = (c: PostCategory) => (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${CATEGORY_BADGE_STYLES[c]}`}
        >
            {CATEGORY_META[c].label}
        </span>
    );

    const formatDate = (iso: string) => {
        try {
            const d = new Date(iso);
            return d.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return iso;
        }
    };

    return (
        <div
            ref={pageRootRef}
            className="relative h-full min-h-0 flex flex-col bg-gradient-to-b from-white via-slate-50 to-white"
        >
            <main className="w-full min-w-0">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Page hero + filters — full-width sticky bar (navbar-style); posts scroll underneath */}
                    <div className="sticky top-0 z-30 -mx-4 px-0 mb-1 bg-gradient-to-b from-white via-slate-50 to-slate-50">
                        <div className="w-full">
                            <div className="px-4 sm:px-5 pt-4 pb-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        <Lottie
                                            animationData={engagementLottie}
                                            loop
                                            autoplay
                                            className="h-9 w-9"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">
                                            Company Posts & Experiences
                                        </h1>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Share real interview stories, package details, and polls about companies to help the community.
                                        </p>
                                    </div>
                                </div>
                            </div>

                    {/* Mobile filters */}
                    <div className="lg:hidden px-4 sm:px-5 pb-4 pt-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                    Filters
                                </h2>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
                                        onClick={clearListFilters}
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(true)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5 border border-gray-900 hover:bg-gray-800 transition-colors"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Post
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-700 mb-1.5">
                                        Posts
                                    </label>
                                    <select
                                        value={viewMineOnly ? 'mine' : 'all'}
                                        onChange={e => setViewMineOnly(e.target.value === 'mine')}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
                                    >
                                        <option value="all">All posts</option>
                                        <option value="mine">My posts</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-700 mb-1.5">
                                        Company
                                    </label>
                                    <select
                                        value={selectedCompanyFilter}
                                        onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
                                    >
                                        <option value="all">All companies</option>
                                        {!!allCompanies.admin.length && (
                                            <optgroup label="Admin companies">
                                                {allCompanies.admin.map(name => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {!!allCompanies.custom.length && (
                                            <optgroup label="Student added">
                                                {allCompanies.custom.map(name => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-700 mb-1.5">
                                        Category
                                    </label>
                                    <select
                                        value={selectedCategoryFilter}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setSelectedCategoryFilter(v === 'all' ? 'all' : (v as PostCategory));
                                        }}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
                                    >
                                        <option value="all">All categories</option>
                                        {POST_CATEGORIES.map(c => (
                                            <option key={c} value={c}>
                                                {CATEGORY_META[c].shortLabel}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-700 mb-1.5">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Title, company, role, tags…"
                                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60"
                                            autoComplete="off"
                                        />
                                        <svg className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                    </div>

                    <div className="hidden lg:block w-full min-w-0 px-4 sm:px-5 pb-4 pt-3">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                                Filters
                                            </h2>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
                                                    onClick={clearListFilters}
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsCreating(true)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5 border border-gray-900 hover:bg-gray-800 transition-colors"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Post
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 min-[1100px]:grid-cols-4 gap-3 w-full min-w-0">
                                            <div className="min-w-0">
                                                <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
                                                    Posts
                                                </label>
                                                <select
                                                    value={viewMineOnly ? 'mine' : 'all'}
                                                    onChange={e => setViewMineOnly(e.target.value === 'mine')}
                                                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
                                                >
                                                    <option value="all">All posts</option>
                                                    <option value="mine">My posts</option>
                                                </select>
                                            </div>
                                            <div className="min-w-0">
                                                <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
                                                    Company
                                                </label>
                                                <select
                                                    value={selectedCompanyFilter}
                                                    onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                                                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
                                                >
                                                    <option value="all">All companies</option>
                                                    {!!allCompanies.admin.length && (
                                                        <optgroup label="Admin companies">
                                                            {allCompanies.admin.map(name => (
                                                                <option key={name} value={name}>
                                                                    {name}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                    {!!allCompanies.custom.length && (
                                                        <optgroup label="Student added">
                                                            {allCompanies.custom.map(name => (
                                                                <option key={name} value={name}>
                                                                    {name}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    )}
                                                </select>
                                            </div>
                                            <div className="min-w-0">
                                                <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
                                                    Category
                                                </label>
                                                <select
                                                    value={selectedCategoryFilter}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        setSelectedCategoryFilter(v === 'all' ? 'all' : (v as PostCategory));
                                                    }}
                                                    className="w-full min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
                                                >
                                                    <option value="all">All categories</option>
                                                    {POST_CATEGORIES.map(c => (
                                                        <option key={c} value={c}>
                                                            {CATEGORY_META[c].shortLabel}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="min-w-0">
                                                <label className="block text-[11px] font-medium text-gray-700 mb-1 truncate">
                                                    Search
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="search"
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="Title, company, role, tags..."
                                                        className="w-full min-w-0 pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60"
                                                        autoComplete="off"
                                                    />
                                                    <svg className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                    </div>
                        </div>
                    </div>

                    <div className="pt-4 pb-8 space-y-4">
                    {/* Posts list - full width */}
                    <section className="space-y-3">
                            {postsFetchError && useCompanyPostsApi && (
                                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 flex flex-wrap items-center justify-between gap-2">
                                    <span>{postsFetchError}</span>
                                    <button
                                        type="button"
                                        onClick={() => void loadRemotePosts()}
                                        className="px-2 py-1 rounded-lg bg-white border border-red-200 font-medium hover:bg-red-100/80"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}

                            {postsLoading ? (
                                <div className="mt-3 rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500">
                                    Loading posts…
                                </div>
                            ) : filteredPosts.length === 0 ? (
                                <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white/60 px-4 py-6 text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-600 mb-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    {filterExcludedAll ? (
                                        <>
                                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No matching posts</h3>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Nothing matches your company, category, &quot;My posts&quot;, or search. Try clearing filters or a different keyword.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={clearListFilters}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-800 text-xs font-semibold hover:bg-gray-50 mb-2"
                                            >
                                                Clear filters &amp; search
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No posts yet</h3>
                                            <p className="text-xs text-gray-500 mb-3">
                                                Start by sharing your latest interview experience, package details, or a quick poll about a company.
                                            </p>
                                            <button
                                                onClick={() => setIsCreating(true)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-500/30"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Share first post
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPosts.map(post => (
                                        <article
                                            key={post.id}
                                            className="rounded-2xl border border-gray-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                            onClick={e => {
                                                const t = e.target as HTMLElement;
                                                if (t.closest('[data-stop-detail]')) return;
                                                setDetailPostId(post.id);
                                            }}
                                        >
                                            <div className="p-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-900 text-white">
                                                            {post.companyName}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">
                                                            {post.role} {post.location ? `· ${post.location}` : ''}
                                                        </span>
                                                        {renderCategoryBadge(post.category)}
                                                    </div>
                                                    <h2 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">
                                                        {post.title}
                                                    </h2>
                                                    <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-3 overflow-hidden break-words">
                                                        {post.content}
                                                    </p>
                                                    {post.content.trim().length > 160 && (
                                                        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                                                            Read full post
                                                        </p>
                                                    )}
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className="text-[11px] text-gray-500">
                                                            Posted by <span className="font-medium text-gray-800">{post.authorName}</span>
                                                        </span>
                                                        <span className="text-[11px] text-gray-400">· {formatDate(post.createdAt)}</span>
                                                        {post.experienceLevel && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-100">
                                                                {post.experienceLevel}
                                                            </span>
                                                        )}
                                                        {post.interviewRound && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-100">
                                                                {post.interviewRound}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {post.packageDetails && (
                                                    <div className="flex flex-col items-end text-right text-[11px] min-w-[120px]">
                                                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mb-1">
                                                            {post.packageDetails.ctc || 'Package'}
                                                        </span>
                                                        {post.packageDetails.offerType && (
                                                            <span className="text-[10px] text-gray-500">
                                                                {post.packageDetails.offerType}
                                                            </span>
                                                        )}
                                                        {post.packageDetails.graduationYear && (
                                                            <span className="text-[10px] text-gray-400">
                                                                {post.packageDetails.graduationYear} pass-out
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Company Rating Display */}
                                            {post.companyRating && (
                                                <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-blue-50/60">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-blue-900">Rating:</span>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                                <svg
                                                                    key={rating}
                                                                    className={`w-4 h-4 ${
                                                                        rating <= post.companyRating!
                                                                            ? 'text-yellow-400 fill-current'
                                                                            : 'text-gray-300'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-blue-700 font-medium">{post.companyRating}/5</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Career Topic Display */}
                                            {post.careerTopic && (
                                                <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-purple-50/60">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold text-purple-900">Topic:</span>
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                            {post.careerTopic}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions + comments */}
                                            <div
                                                className="px-4 py-2.5 flex flex-col gap-2 bg-slate-50/60 rounded-b-2xl"
                                                data-stop-detail
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpvote(post.id)}
                                                            disabled={Boolean(useCompanyPostsApi && !userEmail)}
                                                            title={
                                                                useCompanyPostsApi && !userEmail
                                                                    ? 'Sign in to mark as helpful'
                                                                    : undefined
                                                            }
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border transition text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
                                                                post.hasUpvoted
                                                                    ? 'bg-orange-50 border-orange-200 text-orange-900'
                                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <svg
                                                                className={`h-3.5 w-3.5 ${post.hasUpvoted ? 'text-orange-600 fill-current' : 'text-orange-500'}`}
                                                                fill={post.hasUpvoted ? 'currentColor' : 'none'}
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-8 7 8" />
                                                            </svg>
                                                            <span className="font-medium">{post.upvotes}</span>
                                                            <span>Helpful</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleComments(post.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 transition"
                                                        >
                                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m-9 1a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H7l-3 3v-3z" />
                                                            </svg>
                                                            <span className="font-medium">{post.comments.length}</span>
                                                            <span>Comments</span>
                                                        </button>
                                                    </div>
                                                    {post.tags && post.tags.length > 0 && (
                                                        <div className="flex flex-wrap justify-end gap-1">
                                                            {post.tags.slice(0, 3).map(tag => (
                                                                <span
                                                                    key={tag}
                                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white border border-gray-200 text-gray-600"
                                                                >
                                                                    #{tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {expandedComments[post.id] && (
                                                    <div className="mt-1 space-y-2">
                                                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                                                            {post.comments.map(comment => (
                                                                <div key={comment.id} className="flex items-start gap-2 text-[11px]">
                                                                    <div className="mt-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-[9px] font-semibold">
                                                                        {comment.author.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="font-semibold text-gray-800">{comment.author}</span>
                                                                            <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                                                                        </div>
                                                                        <p className="text-gray-700">{comment.text}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {post.comments.length === 0 && (
                                                                <p className="text-[11px] text-gray-500 italic">
                                                                    No comments yet. Be the first to ask a question or share a tip.
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={commentDrafts[post.id] || ''}
                                                                onChange={(e) =>
                                                                    setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))
                                                                }
                                                                placeholder="Add a comment..."
                                                                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddComment(post.id)}
                                                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-[11px] font-medium hover:bg-black transition"
                                                            >
                                                                Post
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {isCreating ? (
                <>
                <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
                    {/* Modal header */}
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-3 bg-white">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                New Company Post
                            </p>
                            <p className="text-base font-medium text-gray-900 mt-0.5">
                                Share an interview experience, company feedback, salary details, or career discussion
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                            {formError && (
                                <p
                                    className="w-full sm:max-w-md text-right sm:text-left text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
                                    role="alert"
                                >
                                    {formError}
                                </p>
                            )}
                            <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleCreatePost()}
                                disabled={isSubmittingPost}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Post
                            </button>
                            </div>
                        </div>
                    </div>

                    {/* Modal body - Full screen */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6 p-6 overflow-y-auto bg-gray-50">
                        {/* Left: Title + Details */}
                        <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={CATEGORY_META[category].titlePlaceholder}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                                        Use line breaks between rounds or topics. Only the first three lines show in the feed; readers open the post for the full story.
                                    </p>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={14}
                                        placeholder={CATEGORY_META[category].contentPlaceholder}
                                        spellCheck
                                        className="w-full min-h-[220px] rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400/80 resize-y"
                                    />
                                </div>
                        </div>

                        {/* Right: Category selection + metadata & category-specific fields */}
                        <div className="space-y-4">
                                {/* Category Selection */}
                                <div className="rounded-xl border border-gray-300 bg-white p-4 space-y-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            Post Category
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {POST_CATEGORIES.map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => {
                                                        setCategory(c);
                                                        setFormError(null);
                                                    }}
                                                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${category === c
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {CATEGORY_META[c].label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Common Fields */}
                                <div className="rounded-xl border border-gray-300 bg-white p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">
                                            Company Information
                                        </p>
                                        <p className="text-xs text-gray-500 mb-2">
                                            {CATEGORY_META[category].requireCompany
                                                ? 'Company is required for this category.'
                                                : 'Optional — leave blank or pick General if the post is not about one employer.'}
                                        </p>
                                        <div className="inline-flex rounded-full bg-gray-100 border border-gray-300 p-1 text-xs mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsAdminCompany(true)}
                                                className={`px-3 py-1 rounded-full font-medium transition ${isAdminCompany
                                                    ? 'bg-gray-900 text-white shadow-sm'
                                                    : 'text-gray-700 hover:text-gray-900'
                                                    }`}
                                            >
                                                Admin list
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAdminCompany(false)}
                                                className={`px-3 py-1 rounded-full font-medium transition ${!isAdminCompany
                                                    ? 'bg-gray-900 text-white shadow-sm'
                                                    : 'text-gray-700 hover:text-gray-900'
                                                    }`}
                                            >
                                                Add new
                                            </button>
                                        </div>
                                    </div>

                                    {isAdminCompany ? (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                Company (admin) {CATEGORY_META[category].requireCompany && <span className="text-red-500">*</span>}
                                            </label>
                                            <select
                                                value={selectedAdminCompany}
                                                onChange={(e) => setSelectedAdminCompany(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                            >
                                                <option value="">Select company</option>
                                                {sortedAdminCompanyOptions.map(name => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                New company name {CATEGORY_META[category].requireCompany && <span className="text-red-500">*</span>}
                                            </label>
                                            <input
                                                type="text"
                                                value={customCompanyName}
                                                onChange={(e) => setCustomCompanyName(e.target.value)}
                                                placeholder="e.g., Startup XYZ"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                            />
                                        </div>
                                    )}

                                    {(CATEGORY_META[category].formLayout === 'interview' ||
                                        CATEGORY_META[category].formLayout === 'salary') && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Role / Position{' '}
                                                        {CATEGORY_META[category].requireRole && (
                                                            <span className="text-red-500">*</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value)}
                                                        placeholder="e.g., SDE Intern, Data Analyst"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Location (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        placeholder="e.g., Bangalore, Remote"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Experience level
                                                    </label>
                                                    <select
                                                        value={experienceLevel}
                                                        onChange={(e) => setExperienceLevel(e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    >
                                                        <option value="">Select</option>
                                                        {EXPERIENCE_LEVEL_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>
                                                                {opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {CATEGORY_META[category].formLayout === 'interview' && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                            Focus / round (optional)
                                                        </label>
                                                        <select
                                                            value={interviewRound}
                                                            onChange={(e) => setInterviewRound(e.target.value)}
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                        >
                                                            <option value="">General</option>
                                                            {INTERVIEW_FOCUS_OPTIONS.map(opt => (
                                                                <option key={opt} value={opt}>
                                                                    {opt}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {CATEGORY_META[category].formLayout === 'feedback' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Role / Position{' '}
                                                        {CATEGORY_META[category].requireRole ? (
                                                            <span className="text-red-500">*</span>
                                                        ) : (
                                                            <span className="text-gray-500 font-normal">(optional)</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value)}
                                                        placeholder="e.g., SDE, Product Manager"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Location (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        placeholder="e.g., Bangalore, Remote"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Overall Rating{' '}
                                                    {CATEGORY_META[category].requireRating && (
                                                        <span className="text-red-500">*</span>
                                                    )}
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    {[1, 2, 3, 4, 5].map((rating) => (
                                                        <button
                                                            key={rating}
                                                            type="button"
                                                            onClick={() => setCompanyRating(rating)}
                                                            className={`w-10 h-10 rounded-lg border-2 transition ${
                                                                companyRating >= rating
                                                                    ? 'bg-yellow-400 border-yellow-500 text-yellow-900'
                                                                    : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        </button>
                                                    ))}
                                                    <span className="text-xs text-gray-600 ml-2">
                                                        {companyRating > 0 ? `${companyRating}/5` : 'Select rating'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Work Experience Level
                                                </label>
                                                <select
                                                    value={experienceLevel}
                                                    onChange={(e) => setExperienceLevel(e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                >
                                                    <option value="">Select</option>
                                                    {EXPERIENCE_LEVEL_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {CATEGORY_META[category].formLayout === 'career' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                    Career Topic / Tag
                                                </label>
                                                <input
                                                    type="text"
                                                    value={careerTopic}
                                                    onChange={(e) => setCareerTopic(e.target.value)}
                                                    placeholder="e.g., Career Transition, Skill Development, Job Search"
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Role / Position{' '}
                                                        {CATEGORY_META[category].requireRole ? (
                                                            <span className="text-red-500">*</span>
                                                        ) : (
                                                            <span className="text-gray-500 font-normal">(optional)</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value)}
                                                        placeholder="e.g., SDE, Data Scientist"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Experience level (optional)
                                                    </label>
                                                    <select
                                                        value={experienceLevel}
                                                        onChange={(e) => setExperienceLevel(e.target.value)}
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    >
                                                        <option value="">Select</option>
                                                        {EXPERIENCE_LEVEL_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>
                                                                {opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                    {/* Salary Compensation Specific Fields */}
                                    {CATEGORY_META[category].formLayout === 'salary' && (
                                        <div className="rounded-xl border border-gray-300 bg-white p-4 space-y-3 mt-4">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Compensation Details
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        CTC (approx.){' '}
                                                        {CATEGORY_META[category].requireCtc && (
                                                            <span className="text-red-500">*</span>
                                                        )}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={ctc}
                                                        onChange={(e) => setCtc(e.target.value)}
                                                        placeholder="e.g., 18 LPA"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Base pay (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={basePay}
                                                        onChange={(e) => setBasePay(e.target.value)}
                                                        placeholder="e.g., 11 LPA"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Bonus / joining (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={bonus}
                                                        onChange={(e) => setBonus(e.target.value)}
                                                        placeholder="e.g., 1.5 LPA joining bonus"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Stocks / ESOP (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={stock}
                                                        onChange={(e) => setStock(e.target.value)}
                                                        placeholder="e.g., 10L RSUs over 4 years"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Graduation year (optional)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={graduationYear}
                                                        onChange={(e) => setGraduationYear(e.target.value)}
                                                        placeholder="e.g., 2026"
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Offer type
                                                    </label>
                                                    <select
                                                        value={offerType}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            if (v === '') setOfferType('');
                                                            else if (isValidOfferType(v)) setOfferType(v);
                                                        }}
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    >
                                                        <option value="">Select</option>
                                                        {OFFER_TYPE_OPTIONS.map(opt => (
                                                            <option key={opt} value={opt}>
                                                                {opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Controls */}
                                    <div className="rounded-xl border border-gray-300 bg-white p-4 flex items-center justify-between">
                                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                                checked={isAnonymous}
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                            />
                                            <span>Post as anonymous</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="text-sm text-gray-500 hover:text-gray-700 transition"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                </div>
                        </div>
                    </div>
                </>
            ) : null}
            {detailPost && (
                <CompanyPostDetailView
                    post={detailPost}
                    mainPanelInset={mainPanelInset}
                    categoryBadge={renderCategoryBadge(detailPost.category)}
                    commentDraft={commentDrafts[detailPost.id] || ''}
                    onCommentDraftChange={v =>
                        setCommentDrafts(prev => ({ ...prev, [detailPost.id]: v }))
                    }
                    onBack={() => setDetailPostId(null)}
                    onUpvote={() => void handleUpvote(detailPost.id)}
                    onAddComment={() => void handleAddComment(detailPost.id)}
                    upvoteDisabled={Boolean(useCompanyPostsApi && !userEmail)}
                    upvoteDisabledTitle="Sign in to mark as helpful"
                />
            )}
        </div>
    );
};

export default CompanyPostsPage;


