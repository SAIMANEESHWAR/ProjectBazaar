import { useState, useMemo } from 'react';
import { jobPortals } from '../../data/preparationMockData';
import Pagination from '../Pagination';

interface PrepJobPortalsPageProps {
  toggleSidebar?: () => void;
}

type TabType = 'dashboard' | 'favorites' | 'applied';

const PrepJobPortalsPage = (_props: PrepJobPortalsPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [region, setRegion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [portals, setPortals] = useState(jobPortals);

  const categories = useMemo(() => [...new Set(jobPortals.map((p) => p.category))], []);
  const regions = useMemo(() => [...new Set(jobPortals.map((p) => p.region))], []);

  const filteredPortals = useMemo(() => {
    let list = portals;
    if (activeTab === 'favorites') list = list.filter((p) => p.isFavorite);
    if (activeTab === 'applied') list = list.filter((p) => p.isApplied);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (category) list = list.filter((p) => p.category === category);
    if (region) list = list.filter((p) => p.region === region);
    return list;
  }, [portals, activeTab, search, category, region]);

  const paginatedPortals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPortals.slice(start, start + itemsPerPage);
  }, [filteredPortals, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPortals.length / itemsPerPage);

  const toggleFavorite = (id: string) => {
    setPortals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p))
    );
  };

  const toggleApplied = (id: string) => {
    setPortals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isApplied: !p.isApplied } : p))
    );
  };

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
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              activeTab === tab.key
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
      </div>

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
              {paginatedPortals.map((portal, idx) => (
                <tr
                  key={portal.id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-all duration-200"
                >
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{portal.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                    {portal.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {portal.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {portal.region}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(portal.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          portal.isFavorite ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
                        }`}
                        title="Favorite"
                      >
                        <svg className="w-5 h-5" fill={portal.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggleApplied(portal.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          portal.isApplied ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
                        }`}
                        title="Applied"
                      >
                        <svg className="w-5 h-5" fill={portal.isApplied ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 transition-all duration-200"
                      >
                        Visit
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPortals.length > 0 && (
          <div className="px-6 pb-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredPortals.length}
              onItemsPerPageChange={(v) => {
                setItemsPerPage(v);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        {filteredPortals.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">No portals found.</div>
        )}
      </div>
    </div>
  );
};

export default PrepJobPortalsPage;
