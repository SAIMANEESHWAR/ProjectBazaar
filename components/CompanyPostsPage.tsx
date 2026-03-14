import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';

type PostCategory = 'interview-experience' | 'company-feedback' | 'salary-compensation' | 'career-discussion';

interface CompanyPostComment {
    id: string;
    author: string;
    text: string;
    createdAt: string;
}


export interface CompanyPost {
    id: string;
    authorId: string | null;
    authorName: string;
    companyName: string;
    isAdminCompany: boolean;
    role: string;
    category: PostCategory;
    createdAt: string;
    title: string;
    content: string;
    location?: string;
    experienceLevel?: string;
    interviewRound?: string;
    packageDetails?: {
        ctc: string;
        basePay?: string;
        bonus?: string;
        stock?: string;
        graduationYear?: string;
        offerType?: 'Internship' | 'Full-time' | 'Intern + PPO';
    };
    companyRating?: number; // 1-5 for company feedback
    careerTopic?: string; // Topic/tag for career discussion
    tags?: string[];
    upvotes: number;
    comments: CompanyPostComment[];
}

const STORAGE_KEY = 'dashboardCompanyPosts';

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

const CompanyPostsPage: React.FC = () => {
    const { userEmail } = useAuth();
    const [posts, setPosts] = useState<CompanyPost[]>([]);
    const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | PostCategory>('all');
    const [viewMineOnly, setViewMineOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isCreating, setIsCreating] = useState(false);
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
    const [offerType, setOfferType] = useState<'Internship' | 'Full-time' | 'Intern + PPO' | ''>('');

    // Company feedback fields
    const [companyRating, setCompanyRating] = useState<number>(0);

    // Career discussion fields
    const [careerTopic, setCareerTopic] = useState('');

    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setPosts(parsed);
                }
            }
        } catch {
            // ignore
        }
    }, []);

    // Persist to localStorage whenever posts change
    useEffect(() => {
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
            if (viewMineOnly && post.authorName !== currentUserName && post.authorId !== null) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matches =
                    post.companyName.toLowerCase().includes(q) ||
                    post.role.toLowerCase().includes(q) ||
                    post.title.toLowerCase().includes(q) ||
                    post.content.toLowerCase().includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [posts, selectedCompanyFilter, selectedCategoryFilter, viewMineOnly, searchQuery, currentUserName]);

    const resetForm = () => {
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

    const handleCreatePost = () => {
        const companyName = isAdminCompany ? selectedAdminCompany : customCompanyName;
        
        // Basic validation
        if (!title.trim() || !content.trim()) {
            return;
        }

        // Category-specific validation
        if (category === 'interview-experience' || category === 'salary-compensation') {
            if (!companyName.trim() || !role.trim()) {
                return;
            }
            if (category === 'salary-compensation' && !ctc.trim()) {
                return;
            }
        } else if (category === 'company-feedback') {
            if (!companyName.trim() || companyRating === 0) {
                return;
            }
        }

        const id = `post-${Date.now()}`;
        const categoryLabels: Record<PostCategory, string> = {
            'interview-experience': 'Interview Experience',
            'company-feedback': 'Company Feedback',
            'salary-compensation': 'Salary Compensation',
            'career-discussion': 'Career Discussion',
        };

        const newPost: CompanyPost = {
            id,
            authorId: null,
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
                    offerType: offerType || undefined,
                }
                : undefined,
            companyRating: category === 'company-feedback' ? companyRating : undefined,
            careerTopic: category === 'career-discussion' ? careerTopic.trim() || undefined : undefined,
            tags: [
                categoryLabels[category],
                ...(experienceLevel ? [experienceLevel] : []),
                ...(interviewRound ? [interviewRound] : []),
                ...(careerTopic ? [careerTopic] : []),
            ],
            upvotes: 0,
            comments: [],
        };

        setPosts(prev => [newPost, ...prev]);
        resetForm();
    };

    const handleToggleComments = (postId: string) => {
        setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    const handleAddComment = (postId: string) => {
        const draft = (commentDrafts[postId] || '').trim();
        if (!draft) return;

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

    const handleUpvote = (postId: string) => {
        setPosts(prev =>
            prev.map(post =>
                post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post,
            ),
        );
    };

    const renderCategoryBadge = (c: PostCategory) => {
        switch (c) {
            case 'interview-experience':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Interview Experience
                    </span>
                );
            case 'company-feedback':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        Company Feedback
                    </span>
                );
            case 'salary-compensation':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Salary Compensation
                    </span>
                );
            case 'career-discussion':
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                        Career Discussion
                    </span>
                );
            default:
                return null;
        }
    };

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
        <div className="h-full flex flex-col bg-gradient-to-b from-white via-slate-50 to-white">
            <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        {/* Left: Title section */}
                        <div className="flex items-start gap-3 flex-1">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shadow-md shadow-orange-500/30 text-white flex-shrink-0">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h4M5 5a2 2 0 00-2 2v11l3-3h11a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1.5">
                                    Company Posts & Experiences
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                        New
                                    </span>
                                </h1>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Share real interview stories, package details, and polls about companies to help the community.
                                </p>
                            </div>
                        </div>
                        
                        {/* Right: Filters panel */}
                        <div className="lg:flex-shrink-0 w-full lg:w-auto lg:self-start">
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-3 space-y-2 lg:w-[380px]">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                        Filters
                                    </h2>
                                    <button
                                        className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
                                        onClick={() => {
                                            setSelectedCompanyFilter('all');
                                            setSelectedCategoryFilter('all');
                                            setViewMineOnly(false);
                                            setSearchQuery('');
                                        }}
                                    >
                                        Reset
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                            Company
                                        </label>
                                        <select
                                            value={selectedCompanyFilter}
                                            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 transition"
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
                                        <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {(['all', 'interview-experience', 'company-feedback', 'salary-compensation', 'career-discussion'] as const).map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedCategoryFilter(
                                                            c === 'all' ? 'all' : (c as PostCategory),
                                                        )
                                                    }
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${selectedCategoryFilter === c || (c === 'all' && selectedCategoryFilter === 'all')
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {c === 'all'
                                                        ? 'All'
                                                        : c === 'interview-experience'
                                                            ? 'Interview'
                                                            : c === 'company-feedback'
                                                                ? 'Feedback'
                                                                : c === 'salary-compensation'
                                                                    ? 'Salary'
                                                                    : 'Career'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
                    {/* Mobile filters */}
                    <div className="lg:hidden">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                    Filters
                                </h2>
                                <button
                                    className="text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
                                    onClick={() => {
                                        setSelectedCompanyFilter('all');
                                        setSelectedCategoryFilter('all');
                                        setViewMineOnly(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                            <div className="space-y-3">
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
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {(['all', 'interview-experience', 'company-feedback', 'salary-compensation', 'career-discussion'] as const).map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedCategoryFilter(
                                                        c === 'all' ? 'all' : (c as PostCategory),
                                                    )
                                                }
                                                className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${selectedCategoryFilter === c || (c === 'all' && selectedCategoryFilter === 'all')
                                                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {c === 'all'
                                                    ? 'All'
                                                    : c === 'interview-experience'
                                                        ? 'Interview'
                                                        : c === 'company-feedback'
                                                            ? 'Feedback'
                                                            : c === 'salary-compensation'
                                                                ? 'Salary'
                                                                : 'Career'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile create post button */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Share your experience
                        </button>
                    </div>

                    {/* Posts list - full width */}
                    <section className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition ${!viewMineOnly
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setViewMineOnly(false)}
                                    >
                                        All Posts
                                    </button>
                                    <button
                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition ${viewMineOnly
                                            ? 'bg-gray-900 text-white border-gray-900'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setViewMineOnly(true)}
                                    >
                                        My Posts
                                    </button>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[11px] text-orange-700 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                        {posts.length ? `${posts.length} active discussions` : 'Be the first to post'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-56">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by company, role, keyword"
                                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60"
                                        />
                                        <svg className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14z" />
                                        </svg>
                                    </div>
                                    <button
                                        onClick={() => setIsCreating(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow-md shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 transition-all whitespace-nowrap"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Post
                                    </button>
                                </div>
                            </div>

                            {filteredPosts.length === 0 ? (
                                <div className="mt-3 rounded-2xl border border-dashed border-gray-300 bg-white/60 px-4 py-6 text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-600 mb-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
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
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredPosts.map(post => (
                                        <article
                                            key={post.id}
                                            className="rounded-2xl border border-gray-200 bg-white/90 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="p-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-900 text-white">
                                                            {post.companyName}
                                                        </span>
                                                        <span className="text-[11px] text-gray-500">
                                                            {post.role} {post.location ? `· ${post.location}` : ''}
                                                        </span>
                                                        {renderCategoryBadge(post.category)}
                                                    </div>
                                                    <h2 className="text-sm font-semibold text-gray-900 mb-1.5">
                                                        {post.title}
                                                    </h2>
                                                    <p className="text-xs text-gray-600 line-clamp-3">
                                                        {post.content}
                                                    </p>
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
                                            <div className="px-4 py-2.5 flex flex-col gap-2 bg-slate-50/60 rounded-b-2xl">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpvote(post.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition text-gray-700"
                                                        >
                                                            <svg className="h-3.5 w-3.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                onClick={handleCreatePost}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 transition"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Post
                            </button>
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
                                        placeholder={
                                            category === 'interview-experience'
                                                ? 'e.g., Google SDE Intern 2026 – 3 rounds, OA + interviews'
                                                : category === 'company-feedback'
                                                    ? 'e.g., Microsoft Work Culture Review - Great WLB, Supportive Team'
                                                    : category === 'salary-compensation'
                                                        ? 'e.g., Amazon SDE1 package – 45 LPA CTC, 23 LPA base'
                                                        : 'e.g., How to transition from Frontend to Full Stack Developer?'
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Details
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        rows={16}
                                        placeholder={
                                            category === 'interview-experience'
                                                ? 'Describe each round, questions you remember, difficulty level, preparation tips, and final result.'
                                                : category === 'company-feedback'
                                                    ? 'Share your experience about company culture, work-life balance, team support, growth opportunities, management style, perks, and overall satisfaction.'
                                                    : category === 'salary-compensation'
                                                        ? 'Explain CTC vs in-hand, bonuses, stocks, cost of living, work-from-home policy, negotiation tips, etc.'
                                                        : 'Share career advice, tips, experiences, challenges faced, solutions, and insights that can help others in their career journey.'
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500 resize-none"
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
                                            {(['interview-experience', 'company-feedback', 'salary-compensation', 'career-discussion'] as const).map(c => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => setCategory(c)}
                                                    className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${category === c
                                                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {c === 'interview-experience'
                                                        ? 'Interview Experience'
                                                        : c === 'company-feedback'
                                                            ? 'Company Feedback'
                                                            : c === 'salary-compensation'
                                                                ? 'Salary Compensation'
                                                                : 'Career Discussion'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Common Fields */}
                                <div className="rounded-xl border border-gray-300 bg-white p-4 space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 mb-2">
                                            Company Information
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
                                                Company (admin) {category !== 'career-discussion' && <span className="text-red-500">*</span>}
                                            </label>
                                            <select
                                                value={selectedAdminCompany}
                                                onChange={(e) => setSelectedAdminCompany(e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                            >
                                                <option value="">Select company</option>
                                                {defaultAdminCompanies.map(name => (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                New company name {category !== 'career-discussion' && <span className="text-red-500">*</span>}
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

                                    {(category === 'interview-experience' || category === 'salary-compensation') && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Role / Position <span className="text-red-500">*</span>
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
                                                        <option value="Fresher">Fresher</option>
                                                        <option value="0-1 years">0-1 years</option>
                                                        <option value="1-3 years">1-3 years</option>
                                                        <option value="3+ years">3+ years</option>
                                                    </select>
                                                </div>
                                                {category === 'interview-experience' && (
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
                                                            <option value="Online Assessment">Online Assessment</option>
                                                            <option value="Technical Interview">Technical Interview</option>
                                                            <option value="System Design">System Design</option>
                                                            <option value="HR / Managerial">HR / Managerial</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {category === 'company-feedback' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        Role / Position (optional)
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
                                                    Overall Rating <span className="text-red-500">*</span>
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
                                                    <option value="Fresher">Fresher</option>
                                                    <option value="0-1 years">0-1 years</option>
                                                    <option value="1-3 years">1-3 years</option>
                                                    <option value="3+ years">3+ years</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {category === 'career-discussion' && (
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
                                                        Role / Position (optional)
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
                                                        <option value="Fresher">Fresher</option>
                                                        <option value="0-1 years">0-1 years</option>
                                                        <option value="1-3 years">1-3 years</option>
                                                        <option value="3+ years">3+ years</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                    {/* Salary Compensation Specific Fields */}
                                    {category === 'salary-compensation' && (
                                        <div className="rounded-xl border border-gray-300 bg-white p-4 space-y-3 mt-4">
                                            <p className="text-sm font-semibold text-gray-900 mb-2">
                                                Compensation Details
                                            </p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                                        CTC (approx.) <span className="text-red-500">*</span>
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
                                                        onChange={(e) =>
                                                            setOfferType(e.target.value as typeof offerType)
                                                        }
                                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="Internship">Internship</option>
                                                        <option value="Full-time">Full-time</option>
                                                        <option value="Intern + PPO">Intern + PPO</option>
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
                </div>
                </>
            ) : null}
            {!isCreating && (
                <button
                    onClick={() => setIsCreating(true)}
                    className="hidden lg:fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/40 hover:shadow-xl hover:shadow-orange-500/50 transition-all hover:scale-110"
                    aria-label="Create new post"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default CompanyPostsPage;


