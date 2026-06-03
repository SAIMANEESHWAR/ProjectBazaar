import React, { useEffect, useState } from 'react';
import { getBlogPostBySlug, type BlogPost } from '../lib/cmsBlog';

interface BlogPostPageProps {
  slug: string | null;
}

function updatePostMeta(post: BlogPost) {
  const title = post.seo.title || `${post.title} | Anayattics`;
  const description = post.seo.description || post.excerpt;
  const ogImage = post.seo.ogImageUrl || post.coverImageUrl;
  const canonicalUrl = `https://projectbazaar.in/blog/${post.slug}`;

  document.title = title;

  const descEl = document.querySelector('meta[name="description"]');
  if (descEl) descEl.setAttribute('content', description);

  const ogTitleEl = document.querySelector('meta[property="og:title"]');
  if (ogTitleEl) ogTitleEl.setAttribute('content', title);

  const ogDescEl = document.querySelector('meta[property="og:description"]');
  if (ogDescEl) ogDescEl.setAttribute('content', description);

  const ogImageEl = document.querySelector('meta[property="og:image"]');
  if (ogImageEl) ogImageEl.setAttribute('content', ogImage);

  const twitterTitleEl = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitleEl) twitterTitleEl.setAttribute('content', title);

  const twitterDescEl = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescEl) twitterDescEl.setAttribute('content', description);

  const twitterImageEl = document.querySelector('meta[name="twitter:image"]');
  if (twitterImageEl) twitterImageEl.setAttribute('content', ogImage);

  const canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonicalEl) canonicalEl.setAttribute('href', canonicalUrl);
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setPost(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    void getBlogPostBySlug(slug).then((data) => {
      if (!active) return;
      setPost(data);
      setIsLoading(false);
      if (data) updatePostMeta(data);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="h-10 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-gray-100" />
      </section>
    );
  }

  if (!post) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Article not found</h1>
        <p className="mt-3 text-gray-600">The requested blog article is unavailable right now.</p>
        <a
          href="/blog"
          className="mt-6 inline-flex rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Blog
        </a>
      </section>
    );
  }

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <a href="/blog" className="inline-flex text-sm font-semibold text-orange-600 hover:text-orange-700">
        ← Back to Blog
      </a>
      <header className="mt-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">{post.title}</h1>
        <p className="mt-3 text-sm text-gray-500">
          {new Date(post.publishedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}{' '}
          · {post.authorName}
        </p>
      </header>
      <img
        src={post.coverImageUrl}
        alt={post.coverImageAlt}
        className="mt-8 h-auto w-full rounded-2xl border border-gray-200 object-cover"
      />
      <section className="prose prose-gray mt-8 max-w-none">
        {post.content.map((paragraph, idx) => (
          <p key={`${idx}-${paragraph.slice(0, 32)}`} className="mb-4 text-base leading-relaxed text-gray-700">
            {paragraph}
          </p>
        ))}
      </section>
    </article>
  );
};

export default BlogPostPage;

