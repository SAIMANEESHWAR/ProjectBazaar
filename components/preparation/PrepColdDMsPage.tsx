import React, { useState, useCallback, useEffect } from 'react';
import type { ColdDMTemplate } from '../../data/preparationTypes';
import { prepUserApi } from '../../services/preparationApi';
import { fetchDistinctFieldValues, isNonEmptyString } from '../../lib/prepContentHelpers';
import Pagination from '../Pagination';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import PrepColdDMDetailSidebar from './PrepColdDMDetailSidebar';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';
import { useClampPrepPage, usePrepContentAccess } from './prepContentAccess';

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

function normalizeColdDMTemplate(raw: Record<string, unknown>): ColdDMTemplate {
  const id =
    (raw.id as string) ??
    (raw.contentId as string) ??
    (raw.itemId as string) ??
    (raw._id as string) ??
    '';
  return {
    id,
    title: String(raw.title ?? ''),
    content: String(raw.content ?? ''),
    category: String(raw.category ?? 'General'),
    isCopied: Boolean(raw.isCopied),
  };
}

const PrepColdDMsPage: React.FC<PrepColdDMsPageProps> = ({ toggleSidebar }) => {
  const [viewMode, setViewMode] = useViewMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ColdDMTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [templates, setTemplates] = useState<ColdDMTemplate[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const { guardPageChange } = usePrepContentAccess();

  useClampPrepPage(currentPage, setCurrentPage);

  const handlePageChange = (page: number) => guardPageChange(page, setCurrentPage);

  const fetchTemplates = useCallback(async () => {
    try {
      const filters: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
      };

      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }

      const resp = await prepUserApi.listContent<ColdDMTemplate>('cold_dm_templates', filters);

      if (resp.success) {
        setTemplates(
          (resp.items || [])
            .map((item) =>
              normalizeColdDMTemplate(item as unknown as Record<string, unknown>),
            )
            .filter(
              (template) =>
                isNonEmptyString(template.title) && isNonEmptyString(template.content),
            ),
        );
        setTotalPages(resp.totalPages || 1);
        setTotalItems(resp.total || 0);
      } else {
        setTemplates([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch {
      setTemplates([]);
    }
  }, [currentPage, itemsPerPage, searchQuery, categoryFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:cold_dm_templates');
    await fetchTemplates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchDistinctFieldValues('cold_dm_templates', 'category').then(setCategories);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCopy = useCallback(async (template: ColdDMTemplate) => {
    await navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const selectedIndex = selectedTemplate
    ? templates.findIndex((t) => t.id === selectedTemplate.id)
    : -1;

  const openTemplate = useCallback((template: ColdDMTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const goToAdjacentTemplate = useCallback(
    (direction: 'next' | 'prev') => {
      if (selectedIndex < 0) return;
      const nextIndex = direction === 'next' ? selectedIndex + 1 : selectedIndex - 1;
      const adjacent = templates[nextIndex];
      if (adjacent) setSelectedTemplate(adjacent);
    },
    [selectedIndex, templates]
  );

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
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center group/refresh">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none ${
                isRefreshing ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Refresh templates"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Refresh templates
            </div>
          </div>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === 'table' && (
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
                {templates.map((template, idx) => {
                  const isSelected = selectedTemplate?.id === template.id;
                  return (
                    <tr
                      key={template.id}
                      onClick={() => openTemplate(template)}
                      className={`border-b border-gray-200 transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-orange-50/60' : ''
                      }`}
                    >
                      <td className="py-4 px-6 text-sm text-gray-500">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </td>
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
                        <div className="relative flex items-center group/tooltip">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(template);
                            }}
                            className={`p-2 rounded-lg transition-colors focus:outline-none ${
                              copiedId === template.id
                                ? 'text-green-500 bg-green-50'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                            aria-label="Copy template"
                          >
                            {copiedId === template.id ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                            {copiedId === template.id ? 'Copied!' : 'Copy to clipboard'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {templates.length === 0 && (
            <div className="py-16 text-center text-gray-500">
              No templates found matching your search.
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            </div>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => openTemplate(template)}
                  className={`group border rounded-xl p-5 bg-white hover:shadow-md transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-orange-300 bg-orange-50/40 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`prep-topic-chip inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeClass(template.category)}`}
                    >
                      {template.category}
                    </span>
                    <div className="relative flex items-center group/tooltip">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(template);
                        }}
                        className={`p-2 rounded-lg transition-colors focus:outline-none ${
                          copiedId === template.id
                            ? 'text-green-500 bg-green-50'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {copiedId === template.id ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {copiedId === template.id ? 'Copied!' : 'Copy to clipboard'}
                      </div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mt-2">{template.title}</h4>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-3">{template.content}</p>
                </div>
              );
            })}
          </div>
          {templates.length === 0 && (
            <div className="py-16 text-center text-gray-500">No templates found matching your search.</div>
          )}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            </div>
          )}
        </div>
      )}

      {selectedTemplate && (
        <PrepColdDMDetailSidebar
          template={selectedTemplate}
          copied={copiedId === selectedTemplate.id}
          onCopy={() => handleCopy(selectedTemplate)}
          onClose={() => setSelectedTemplate(null)}
          onNext={() => goToAdjacentTemplate('next')}
          onPrev={() => goToAdjacentTemplate('prev')}
          hasNext={selectedIndex >= 0 && selectedIndex < templates.length - 1}
          hasPrev={selectedIndex > 0}
        />
      )}
    </div>
  );
};

export default PrepColdDMsPage;
