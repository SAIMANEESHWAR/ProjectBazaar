import * as React from 'react';
import Lottie from 'lottie-react';
import { ArrowRight, MessageSquare, ThumbsUp } from 'lucide-react';
import { useAuth } from '../../../App';
import { useDashboard } from '../../../context/DashboardContext';
import noPostsLottie from '../../../lottiefiles/User like share group.json';
import {
    COMPANY_POSTS_CATEGORY_BADGE,
    COMPANY_POSTS_CATEGORY_LABELS,
    fetchCompanyPostsPreview,
    formatCompanyPostDate,
    truncateText,
} from '../../../lib/companyPostsClient';
import type { CompanyPost } from '../../../types/companyPosts';
import { cn } from '../../../lib/utils';

export interface CompanyPostsPreviewSectionProps {
    companyName: string;
}

export const CompanyPostsPreviewSection: React.FC<CompanyPostsPreviewSectionProps> = ({ companyName }) => {
    const { userEmail } = useAuth();
    const { openCompanyPostsForCompany } = useDashboard();
    const [posts, setPosts] = React.useState<CompanyPost[]>([]);
    const [totalMatched, setTotalMatched] = React.useState(0);
    const [filterCompanyName, setFilterCompanyName] = React.useState(companyName);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        void fetchCompanyPostsPreview(companyName, { limit: 5, userEmail }).then(result => {
            if (cancelled) return;
            setPosts(result.posts);
            setTotalMatched(result.totalMatched);
            setFilterCompanyName(result.filterCompanyName);
            setLoading(false);
        }).catch(() => {
            if (cancelled) return;
            setError('Could not load community posts.');
            setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [companyName, userEmail]);

    const handleViewAll = () => {
        openCompanyPostsForCompany(filterCompanyName);
    };

    return (
        <section className="mt-6 rounded-xl border border-[#EBF0F6] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[#EBF0F6] bg-[#FAFCFF] px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-[#1E223C]">Community posts &amp; comments</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Posts and comments shared about <strong>{companyName}</strong> on Company Posts
                        </p>
                    </div>
                    {!loading && totalMatched > 0 && (
                        <button
                            type="button"
                            onClick={handleViewAll}
                            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#5670FB] px-3 py-2 text-sm font-semibold text-[#5670FB] hover:bg-[#5670FB]/5 transition-colors"
                        >
                            View all posts
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <p className="text-sm text-rose-600">{error}</p>
                )}

                {!loading && !error && posts.length === 0 && (
                    <div className="flex flex-col items-center rounded-xl border border-dashed border-[#EBF0F6] bg-white px-4 py-10 text-center">
                        <Lottie
                            animationData={noPostsLottie}
                            loop
                            autoplay
                            className="mx-auto h-[210px] w-full max-w-[302px]"
                        />
                        <p className="mt-4 text-sm font-medium text-[#1E223C]">No posts yet for this company</p>
                        <p className="mt-1 text-xs text-gray-500">
                            Be the first to share an interview experience, salary, or feedback on Company Posts.
                        </p>
                        <button
                            type="button"
                            onClick={() => openCompanyPostsForCompany(companyName)}
                            className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 hover:underline"
                        >
                            Go to Company Posts
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}

                {!loading && !error && posts.length > 0 && (
                    <div className="space-y-3">
                        {posts.map(post => (
                            <article
                                key={post.id}
                                className="rounded-xl border border-[#EBF0F6] bg-white overflow-hidden"
                            >
                                <div className="px-4 pt-4 pb-3">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span
                                            className={cn(
                                                'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                                                COMPANY_POSTS_CATEGORY_BADGE[post.category],
                                            )}
                                        >
                                            {COMPANY_POSTS_CATEGORY_LABELS[post.category].shortLabel}
                                        </span>
                                        <span className="text-[11px] text-gray-400">
                                            {post.authorName || 'Anonymous'} · {formatCompanyPostDate(post.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-[#1E223C]">{post.title}</h3>
                                    <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                                        {truncateText(post.content, 180)}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                                        <span className="inline-flex items-center gap-1">
                                            <ThumbsUp size={12} className="text-orange-500" />
                                            {post.upvotes} helpful
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MessageSquare size={12} />
                                            {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                {post.comments.length > 0 && (
                                    <div className="border-t border-[#EBF0F6] bg-slate-50/70 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                            Recent comments
                                        </p>
                                        <div className="space-y-2">
                                            {post.comments.slice(0, 2).map(comment => (
                                                <div key={comment.id} className="flex items-start gap-2 text-[11px]">
                                                    <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-[9px] font-semibold">
                                                        {comment.author.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="font-semibold text-gray-800">{comment.author}</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {formatCompanyPostDate(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600">{truncateText(comment.text, 120)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </article>
                        ))}

                        {totalMatched > posts.length && (
                            <button
                                type="button"
                                onClick={handleViewAll}
                                className="w-full rounded-lg border border-[#EBF0F6] py-2.5 text-sm font-semibold text-[#5670FB] hover:bg-[#5670FB]/5 transition-colors"
                            >
                                View all {totalMatched} posts for {filterCompanyName}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};
