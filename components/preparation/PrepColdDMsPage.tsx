import React, { useState, useMemo } from 'react';
import { coldDMTemplates } from '../../data/preparationMockData';
import type { ColdDMTemplate } from '../../data/preparationMockData';
import Pagination from '../Pagination';

interface PrepColdDMsPageProps {
  toggleSidebar?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Skill Showcase': 'bg-blue-100 text-blue-700',
  'Networking': 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-green-100 text-green-700',
  'Feedback': 'bg-amber-100 text-amber-700',
  'Introduction': 'bg-cyan-100 text-cyan-700',
  'Research': 'bg-indigo-100 text-indigo-700',
  'Referral': 'bg-pink-100 text-pink-700',
};

const PrepColdDMsPage: React.FC<PrepColdDMsPageProps> = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const categories = useMemo(() => {
    const cats = new Set(coldDMTemplates.map((t) => t.category));
    return Array.from(cats).sort();
  }, []);

  const filteredTemplates = useMemo(() => {
    let result = [...coldDMTemplates];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((t) => t.category === categoryFilter);
    }
    return result;
  }, [searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);

  const handleCopy = async (template: ColdDMTemplate) => {
    await navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadgeClass = (category: string) =>
    CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="mt-4 sm:mt-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          {toggleSidebar && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Cold DMs & Email Templates</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Professional templates for reaching out to recruiters and hiring managers
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, description, or category..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all duration-200 bg-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all duration-200 bg-white min-w-[180px]"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 w-12">#</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Title</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 hidden md:table-cell">Preview</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700 w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTemplates.map((template, idx) => (
                <React.Fragment key={template.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    className="border-b border-gray-200 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm text-gray-500">{startIndex + idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-gray-900">{template.title}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 hidden md:table-cell max-w-xs truncate">
                      {template.content}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`prep-topic-chip inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClass(
                          template.category
                        )}`}
                      >
                        {template.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(template);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all duration-200"
                      >
                        {copiedId === template.id ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === template.id && (
                    <tr className="bg-orange-50/30">
                      <td colSpan={5} className="py-4 px-6">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap rounded-lg p-4 bg-white border border-gray-200">
                          {template.content}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            No templates found matching your search.
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTemplates.length}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrepColdDMsPage;
