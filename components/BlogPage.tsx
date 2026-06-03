import React, { useEffect, useState } from 'react';
import { getBlogPosts, type BlogPost } from '../lib/cmsBlog';

const BlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getBlogPosts().then((data) => {
      if (!active) return;
      setPosts(data);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Blog</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">Insights from Anayattics</h1>
        <p className="mt-3 max-w-2xl text-base text-gray-600">
          Practical analytics guides, implementation checklists, and data strategy insights for product and growth teams.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <a href={`/blog/${post.slug}`} className="block">
                <img
                  src={post.coverImageUrl}
                  alt={post.coverImageAlt}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-xl font-semibold text-gray-900">{post.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-orange-600">
                    Read article
                  </span>
                </div>
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default BlogPage;

