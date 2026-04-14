import React, { useMemo, useState } from 'react';
import {
    ArrowBigDown,
    ArrowBigUp,
    Calendar,
    ChevronLeft,
    Eye,
    MessageCircle,
    Pencil,
} from 'lucide-react';
import type { CompanyPost } from '../types/companyPosts';

function formatRelativeTime(iso: string): string {
    try {
        const d = new Date(iso);
        const diff = Date.now() - d.getTime();
        if (diff < 0) return 'just now';
        const sec = Math.floor(diff / 1000);
        if (sec < 60) return 'just now';
        const min = Math.floor(sec / 60);
        if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
        const day = Math.floor(hr / 24);
        if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
}

type CommentSort = 'new' | 'old';

export interface CompanyPostDetailViewProps {
    post: CompanyPost;
    /** When set, overlay is pinned to the dashboard main column (excludes sidebar); updates on resize. */
    mainPanelInset?: { left: number; width: number } | null;
    categoryBadge: React.ReactNode;
    commentDraft: string;
    onCommentDraftChange: (value: string) => void;
    onBack: () => void;
    onUpvote: () => void;
    onAddComment: () => void;
    /** When true (e.g. API mode without signed-in user), helpful is disabled */
    upvoteDisabled?: boolean;
    upvoteDisabledTitle?: string;
}

const CompanyPostDetailView: React.FC<CompanyPostDetailViewProps> = ({
    post,
    mainPanelInset,
    categoryBadge,
    commentDraft,
    onCommentDraftChange,
    onBack,
    onUpvote,
    onAddComment,
    upvoteDisabled = false,
    upvoteDisabledTitle,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [commentSort, setCommentSort] = useState<CommentSort>('new');

    const sortedComments = useMemo(() => {
        const list = [...post.comments];
        list.sort((a, b) => {
            const ta = new Date(a.createdAt).getTime();
            const tb = new Date(b.createdAt).getTime();
            return commentSort === 'new' ? tb - ta : ta - tb;
        });
        return list;
    }, [post.comments, commentSort]);

    const edited =
        post.updatedAt &&
        post.createdAt &&
        post.updatedAt !== post.createdAt &&
        new Date(post.updatedAt).getTime() > new Date(post.createdAt).getTime() + 1000;

    const initials = (post.authorName || '?').slice(0, 2).toUpperCase();

    const handleReply = (authorName: string) => {
        onCommentDraftChange(`@${authorName} `);
    };

    /** 75% of the main content column (not the full window when sidebar is visible). */
    const contentShell = 'w-full md:w-3/4 md:max-w-none mx-auto';

    const panelStyle: React.CSSProperties | undefined =
        mainPanelInset != null
            ? {
                  left: mainPanelInset.left,
                  width: mainPanelInset.width,
              }
            : undefined;

    return (
        <div
            className={`fixed top-0 z-[45] flex flex-col bg-white h-[100dvh] min-h-0 ${
                mainPanelInset == null ? 'left-0 right-0 w-full' : ''
            }`}
            style={panelStyle}
        >
            <header className="flex-shrink-0 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-3 py-2.5 sm:px-4 sm:py-3">
                <div className={`${contentShell} flex items-center`}>
                    <button
                        type="button"
                        onClick={onBack}
                        className="group inline-flex items-center gap-0.5 rounded-full border border-gray-200 bg-white pl-2 pr-3 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2"
                        aria-label="Back to posts"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-500 transition group-hover:text-gray-800" strokeWidth={2.25} />
                        <span>Back</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto">
                <article className={`${contentShell} px-4 py-6 sm:px-6`}>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-5">{post.title}</h1>

                    <div className="flex items-start gap-3 mb-4">
                        <div
                            className="h-11 w-11 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-md"
                            aria-hidden
                        >
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{post.authorName}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1" title="Views are not tracked yet">
                                    <Eye className="h-3.5 w-3.5" />
                                    —
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatRelativeTime(post.createdAt)}
                                </span>
                                {edited && post.updatedAt && (
                                    <span className="inline-flex items-center gap-1">
                                        <Pencil className="h-3.5 w-3.5" />
                                        {formatRelativeTime(post.updatedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {categoryBadge}
                        {post.companyName && (
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                                {post.companyName}
                            </span>
                        )}
                        {post.tags?.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {post.packageDetails && (
                        <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 text-sm text-indigo-900">
                            <span className="font-semibold">Package: </span>
                            {post.packageDetails.ctc}
                            {post.packageDetails.offerType && ` · ${post.packageDetails.offerType}`}
                        </div>
                    )}

                    {post.companyRating != null && (
                        <div className="mb-6 text-sm text-blue-900">
                            <span className="font-semibold">Company rating: </span>
                            {post.companyRating}/5
                        </div>
                    )}

                    <div className="max-w-none rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-4 sm:px-5 sm:py-5">
                        <p className="text-[15px] sm:text-base text-gray-800 leading-[1.65] whitespace-pre-wrap break-words">
                            {post.content}
                        </p>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-6">
                        <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-0.5">
                            <button
                                type="button"
                                onClick={onUpvote}
                                disabled={upvoteDisabled}
                                title={upvoteDisabled ? upvoteDisabledTitle : undefined}
                                className={`inline-flex items-center rounded-lg px-2 py-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                                    post.hasUpvoted
                                        ? 'text-orange-600 bg-white'
                                        : 'text-gray-600 hover:bg-white hover:text-orange-600'
                                }`}
                                aria-label={post.hasUpvoted ? 'Already marked helpful' : 'Mark as helpful'}
                                aria-pressed={post.hasUpvoted}
                            >
                                <ArrowBigUp className={`h-5 w-5 ${post.hasUpvoted ? 'fill-current' : ''}`} />
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-gray-900">
                                {post.upvotes}
                            </span>
                            <span
                                className="inline-flex items-center rounded-lg px-2 py-1.5 text-gray-300 cursor-not-allowed"
                                title="Downvotes are not enabled"
                                aria-disabled
                            >
                                <ArrowBigDown className="h-5 w-5" />
                            </span>
                        </div>

                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                            <MessageCircle className="h-5 w-5 text-gray-400" />
                            <span className="font-medium">{post.comments.length}</span>
                            <span>comments</span>
                        </span>
                    </div>

                    <section className="mt-10 border-t border-gray-200 pt-8">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                            <h2 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-gray-400" />
                                Comments ({post.comments.length})
                            </h2>
                            <label className="flex items-center gap-2 text-xs text-gray-600">
                                <span>Sort by:</span>
                                <select
                                    value={commentSort}
                                    onChange={e => setCommentSort(e.target.value as CommentSort)}
                                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                                >
                                    <option value="new">Newest</option>
                                    <option value="old">Oldest</option>
                                </select>
                            </label>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 mb-8">
                            <textarea
                                value={commentDraft}
                                onChange={e => onCommentDraftChange(e.target.value)}
                                placeholder="Type comment here..."
                                rows={4}
                                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-400/60 min-h-[100px]"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onAddComment}
                                    className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                                >
                                    Comment
                                </button>
                            </div>
                        </div>

                        <ul className="space-y-6">
                            {sortedComments.map(c => (
                                <li key={c.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="flex gap-3">
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                            {c.author.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                                <span className="font-semibold text-gray-900">{c.author}</span>
                                                <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                                            </div>
                                            <p className="mt-1.5 text-sm text-gray-800 whitespace-pre-wrap">{c.text}</p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                                <span className="inline-flex items-center gap-0.5 opacity-40 cursor-not-allowed" title="Comment votes coming soon">
                                                    <ArrowBigUp className="h-4 w-4" />
                                                </span>
                                                <span className="inline-flex items-center gap-0.5 opacity-40 cursor-not-allowed" title="Comment votes coming soon">
                                                    <ArrowBigDown className="h-4 w-4" />
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleReply(c.author)}
                                                    className="font-medium text-gray-600 hover:text-orange-600"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {post.comments.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-8">No comments yet. Start the thread above.</p>
                        )}
                    </section>
                </article>
            </div>
        </div>
    );
};

export default CompanyPostDetailView;
