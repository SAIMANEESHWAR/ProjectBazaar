import { createClient } from '@sanity/client';

export interface BlogSeoMeta {
  title?: string;
  description?: string;
  ogImageUrl?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  coverImageAlt: string;
  publishedAt: string;
  authorName: string;
  content: string[];
  seo: BlogSeoMeta;
}

const FALLBACK_POSTS: BlogPost[] = [
  {
    slug: 'how-to-build-data-pipelines',
    title: 'How To Build Reliable Data Pipelines',
    excerpt:
      'A practical guide to designing analytics pipelines with quality checks, observability, and scalable architecture.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop',
    coverImageAlt: 'Dashboard charts representing analytics data pipeline flow',
    publishedAt: '2026-04-20',
    authorName: 'Anayattics Team',
    content: [
      'Reliable analytics starts with clean ingestion contracts. Define each source, expected schema, and validation rules before scaling.',
      'Introduce layered processing (raw, staged, curated) and track lineage so teams can debug quickly when metrics drift.',
      'Operational monitoring is mandatory. Alerts should capture delayed loads, schema changes, and freshness SLA breaches.',
    ],
    seo: {
      title: 'How To Build Reliable Data Pipelines | Anayattics',
      description:
        'Learn how to architect scalable, reliable analytics data pipelines with validation, monitoring, and governance best practices.',
    },
  },
  {
    slug: 'ga4-implementation-checklist',
    title: 'GA4 Implementation Checklist For Growth Teams',
    excerpt:
      'A field-tested checklist to implement GA4 with clean event design, privacy controls, and reporting consistency.',
    coverImageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop',
    coverImageAlt: 'Laptop screen showing growth and analytics reporting charts',
    publishedAt: '2026-04-22',
    authorName: 'Anayattics Team',
    content: [
      'Start by defining a canonical event taxonomy and shared naming conventions used across product, marketing, and BI.',
      'Ensure no PII is sent in event payloads, and use GTM for controlled rollout rather than hardcoded event logic.',
      'Build QA dashboards for real-time validation of critical conversions before reporting metrics to stakeholders.',
    ],
    seo: {
      title: 'GA4 Implementation Checklist For Growth Teams | Anayattics',
      description:
        'Implement GA4 correctly with a practical checklist covering event taxonomy, privacy-safe tracking, and analytics QA.',
    },
  },
];

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || 'production';
const apiVersion = (import.meta.env.VITE_SANITY_API_VERSION as string | undefined) || '2025-01-01';
const useCdn = (import.meta.env.VITE_SANITY_USE_CDN as string | undefined) !== 'false';

const hasSanityConfig = Boolean(projectId && dataset);

const sanityClient = hasSanityConfig
  ? createClient({
      projectId: projectId!,
      dataset,
      apiVersion,
      useCdn,
    })
  : null;

interface SanityPostResult {
  slug?: string;
  title?: string;
  excerpt?: string;
  publishedAt?: string;
  authorName?: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
  body?: Array<{ _type?: string; children?: Array<{ text?: string }> }>;
  seoTitle?: string;
  seoDescription?: string;
  seoOgImageUrl?: string;
}

function toParagraphs(blocks?: SanityPostResult['body']): string[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((b) => b?._type === 'block' && Array.isArray(b.children))
    .map((b) => (b.children || []).map((c) => c.text || '').join('').trim())
    .filter(Boolean);
}

function mapSanityPost(post: SanityPostResult): BlogPost {
  const fallbackDate = new Date().toISOString().slice(0, 10);
  return {
    slug: post.slug || 'untitled-post',
    title: post.title || 'Untitled blog post',
    excerpt: post.excerpt || 'No excerpt provided yet.',
    coverImageUrl:
      post.coverImageUrl ||
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop',
    coverImageAlt: post.coverImageAlt || `${post.title || 'Blog'} cover image`,
    publishedAt: post.publishedAt || fallbackDate,
    authorName: post.authorName || 'Anayattics Team',
    content: toParagraphs(post.body),
    seo: {
      title: post.seoTitle || undefined,
      description: post.seoDescription || undefined,
      ogImageUrl: post.seoOgImageUrl || undefined,
    },
  };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  if (!sanityClient) return FALLBACK_POSTS;

  try {
    const query = `*[_type == "blogPost"] | order(publishedAt desc){
      "slug": slug.current,
      title,
      excerpt,
      publishedAt,
      "authorName": author->name,
      "coverImageUrl": coverImage.asset->url,
      "coverImageAlt": coalesce(coverImage.alt, title),
      body,
      "seoTitle": seo.title,
      "seoDescription": seo.description,
      "seoOgImageUrl": seo.ogImage.asset->url
    }`;
    const result = (await sanityClient.fetch(query)) as SanityPostResult[];
    if (!Array.isArray(result) || result.length === 0) return FALLBACK_POSTS;
    return result.map(mapSanityPost);
  } catch {
    return FALLBACK_POSTS;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

