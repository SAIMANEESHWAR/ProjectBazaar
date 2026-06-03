import React from 'react';
import { LOREM_LONG, LOREM_MEDIUM } from './lorem';

const MOCK_POSTS = [
  {
    company: 'Wells Fargo',
    role: 'Associate SDE',
    location: 'Chennai',
    category: 'Company Feedback',
    categoryClass: 'bg-blue-50 text-blue-700 border-blue-100',
    title: 'Expected CTC | Wells Fargo | Technology Program Analyst | Off Campus',
    content: LOREM_LONG,
    author: 'lorem_user',
    date: '2 days ago',
    experience: '1-3 years',
    rating: 4,
    helpful: 6,
    comments: 2,
    tags: ['Company Feedback', '1-3 years'],
    package: null as string | null,
  },
  {
    company: 'Amazon',
    role: 'SDE Intern',
    location: 'Bangalore',
    category: 'Salary Compensation',
    categoryClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    title: 'Amazon SDE Intern Offer | 2024 Batch | On-campus',
    content: LOREM_MEDIUM,
    author: 'ipsum_dev',
    date: '5 days ago',
    experience: 'Fresher',
    rating: 5,
    helpful: 12,
    comments: 3,
    tags: ['Salary Compensation', 'Fresher'],
    package: '25 LPA',
    offerType: 'Full-time',
    gradYear: '2024 pass-out',
  },
];

const CompanyPostsPreview: React.FC = () => (
  <div className="bg-gradient-to-b from-white via-slate-50 to-white min-h-[720px] rounded-xl">
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Hero */}
      <div className="flex items-start gap-3 mb-4">
        <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 text-xl">
          💬
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
            Company Posts & Experiences
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Share real interview stories, package details, and polls about companies to help the community.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">Filters</h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Reset</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Post
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['All posts', 'All companies', 'All categories'].map((label) => (
            <div key={label}>
              <label className="block text-[11px] font-medium text-gray-700 mb-1">{label.split(' ')[0]}</label>
              <div className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-500">
                {label}
              </div>
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-xs text-gray-400">
                Title, company, role, tags…
              </div>
              <svg className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 17a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Post cards */}
      <div className="space-y-3">
        {MOCK_POSTS.map((post) => (
          <article
            key={post.title}
            className="rounded-2xl border border-gray-200 bg-white/90 shadow-sm"
          >
            <div className="p-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-900 text-white">
                    {post.company}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {post.role} · {post.location}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${post.categoryClass}`}>
                    {post.category}
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">{post.title}</h2>
                <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-3">{post.content}</p>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium">Read full post</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    Posted by <span className="font-medium text-gray-800">{post.author}</span>
                  </span>
                  <span className="text-[11px] text-gray-400">· {post.date}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-100">
                    {post.experience}
                  </span>
                </div>
              </div>
              {post.package && (
                <div className="flex flex-col items-end text-right text-[11px] min-w-[100px] shrink-0">
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full mb-1">
                    {post.package}
                  </span>
                  {post.offerType && (
                    <span className="text-[10px] text-gray-500">{post.offerType}</span>
                  )}
                  {post.gradYear && (
                    <span className="text-[10px] text-gray-400">{post.gradYear}</span>
                  )}
                </div>
              )}
            </div>

            {/* Rating */}
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 bg-blue-50/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-900">Rating:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= post.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-blue-700 font-medium">{post.rating}/5</span>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-4 py-2.5 flex items-center justify-between gap-3 bg-slate-50/60 rounded-b-2xl">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border bg-orange-50 border-orange-200 text-orange-900">
                  <svg className="h-3.5 w-3.5 text-orange-600 fill-current" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-8 7 8" />
                  </svg>
                  <span className="font-medium">{post.helpful}</span>
                  <span>Helpful</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-gray-600">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m-9 1a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H7l-3 3v-3z" />
                  </svg>
                  <span className="font-medium">{post.comments}</span>
                  <span>Comments</span>
                </span>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white border border-gray-200 text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </div>
);

export default CompanyPostsPreview;
