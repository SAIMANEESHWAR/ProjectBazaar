import { useState, useEffect, useCallback } from 'react';
import type { JobPortal } from '../../data/preparationMockData';
import { prepUserApi } from '../../services/preparationApi';
import Pagination from '../Pagination';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';

interface PrepJobPortalsPageProps {
  toggleSidebar?: () => void;
}

type TabType = 'dashboard' | 'favorites' | 'applied';

const PrepJobPortalsPage = (_props: PrepJobPortalsPageProps) => {
  const [viewMode, setViewMode] = useViewMode();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [portals, setPortals] = useState<JobPortal[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPortals = useCallback(async () => {
    try {
      const filters: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: itemsPerPage,
        search,
        category,
        region,
      };
      if (activeTab === 'favorites') filters.favoriteOnly = true;
      if (activeTab === 'applied') filters.appliedOnly = true;

      const resp = await prepUserApi.listContentWithProgress('job_portals', filters);
      if (resp.success) {
        setPortals((resp.items || []) as unknown as JobPortal[]);
        setTotalPages(resp.totalPages || 1);
        setTotalItems(resp.total || 0);
      } else {
        setPortals([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch { /* ignore */ }
  }, [currentPage, itemsPerPage, search, category, region, activeTab]);

  useEffect(() => {
    fetchPortals();
  }, [fetchPortals]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:job_portals');
    await fetchPortals();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Use static categories for the dropdown since pagination will otherwise break them
  const categories = ['General', 'Networking', 'Research', 'Startups', 'Internships', 'Competitions', 'Tech'];
  const regions = ['India', 'Global'];

  const toggleFavorite = useCallback((id: string) => {
    setPortals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
    prepUserApi.toggleFavorite('job_portals', id).catch(() => { });
  }, []);



  const tabs: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'favorites', label: 'Favorite Portals' },
    { key: 'applied', label: 'Applied Portals' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Portals</h1>
        <p className="text-gray-600 mt-1">
          Find and manage job opportunities across multiple platforms
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === tab.key
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-200'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search portals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all duration-200"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white transition-all duration-200"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center group/refresh">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none ${isRefreshing ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
                }`}
              aria-label="Refresh portals"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Refresh portals
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
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Description</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Category</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Region</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {portals.map((portal, idx) => (
                  <tr
                    key={portal.id}
                    className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-all duration-200"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {portal.logo ? (
                          <img src={portal.logo} alt={`${portal.name} logo`} className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{portal.name.charAt(0)}</div>
                        )}
                        <span className="font-bold text-gray-900">{portal.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {portal.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className="prep-topic-chip px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {portal.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="prep-topic-chip px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {portal.region}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleFavorite(portal.id)}
                          className={`p-1.5 transition-colors focus:outline-none ${portal.isFavorite
                            ? 'text-red-500'
                            : 'text-gray-400 hover:text-red-500'
                            }`}
                          title={portal.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg className="w-5 h-5" fill={portal.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={portal.isFavorite ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        <a
                          href={portal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors focus:outline-none"
                        >
                          Visit
                          <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {portals.length > 0 && (
            <div className="px-6 pb-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onItemsPerPageChange={(v) => {
                  setItemsPerPage(v);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
          {portals.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">No portals found.</div>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portals.map((portal) => (
              <div key={portal.id} className="group border border-gray-200 rounded-xl p-5 bg-white hover:shadow-md hover:border-gray-300 transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2">
                    <span className="prep-topic-chip text-xs px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">{portal.category}</span>
                    <span className="prep-topic-chip text-xs px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">{portal.region}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleFavorite(portal.id)} className={`p-1.5 transition-colors focus:outline-none ${portal.isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>
                      <svg className="w-4 h-4" fill={portal.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2 mt-1">
                  {portal.logo ? (
                    <img src={portal.logo} alt={`${portal.name} logo`} className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{portal.name.charAt(0)}</div>
                  )}
                  <h4 className="font-semibold text-gray-900 text-sm">{portal.name}</h4>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{portal.description}</p>
                <a href={portal.url} target="_blank" rel="noopener noreferrer" className="group mt-3 inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors duration-200">
                  Visit Portal
                  <svg className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            ))}
          </div>
          {portals.length > 0 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} totalItems={totalItems} onItemsPerPageChange={(v) => { setItemsPerPage(v); setCurrentPage(1); }} />
            </div>
          )}
          {portals.length === 0 && (
            <div className="py-12 text-center text-gray-500">No portals found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrepJobPortalsPage;
