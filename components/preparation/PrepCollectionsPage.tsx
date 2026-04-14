import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Collection } from '../../data/preparationMockData';
import { prepUserApi } from '../../services/preparationApi';
import PrepViewToggle, { useViewMode } from './PrepViewToggle';
import { RefreshCw } from 'lucide-react';
import { invalidateCache } from '../../lib/apiCache';

interface PrepCollectionsPageProps {
  toggleSidebar?: () => void;
}

const PRESET_COLORS = [
  '#f97316',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#6366f1',
  '#14b8a6',
];

const PrepCollectionsPage: React.FC<PrepCollectionsPageProps> = ({ toggleSidebar }) => {
  const [viewMode, setViewMode] = useViewMode('grid');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCollections = useCallback(async (cancelled = { current: false }) => {
    try {
      const apiCols = await prepUserApi.listCollections();
      if (!cancelled.current) {
        setCollections(apiCols.map((c) => ({
          id: c.collectionId,
          name: c.name,
          description: c.description,
          itemCount: c.itemCount,
          createdAt: c.createdAt,
          color: c.color,
        })));
      }
    } catch {
      setCollections([]);
    }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchCollections(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchCollections]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    invalidateCache('prep:collections');
    await fetchCollections();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...collections];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [collections, searchQuery, sortBy]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    const optimistic: Collection = {
      id: `col-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      itemCount: 0,
      createdAt: new Date().toISOString(),
      color: newColor,
    };
    setCollections((prev) => [optimistic, ...prev]);
    setNewName('');
    setNewDescription('');
    setNewColor(PRESET_COLORS[0]);
    setShowCreateForm(false);

    try {
      const created = await prepUserApi.createCollection(optimistic.name, optimistic.description, optimistic.color);
      if (created) {
        setCollections((prev) =>
          prev.map((c) => c.id === optimistic.id
            ? { ...c, id: created.collectionId }
            : c
          )
        );
      }
    } catch { /* optimistic item stays */ }
  }, [newName, newDescription, newColor]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Organize your resources from across the platform in one place
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
            placeholder="Search by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all duration-200 bg-white"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
          className="px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none transition-all duration-200 bg-white min-w-[160px]"
        >
          <option value="date">Date created</option>
          <option value="name">Name</option>
        </select>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center group/refresh">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-all duration-200 focus:outline-none ${isRefreshing ? 'text-orange-500' : 'text-gray-500 hover:text-gray-900'
                }`}
              aria-label="Refresh collections"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Refresh collections
            </div>
          </div>
          <PrepViewToggle view={viewMode} onChange={setViewMode} />
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all duration-200 whitespace-nowrap"
        >
          Create new collection
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Collection</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description"
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-all duration-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${newColor === color ? 'border-gray-900 scale-110' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewName('');
                  setNewDescription('');
                }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredAndSorted.length === 0 ? (
        <div className="py-20 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <svg
            className="mx-auto w-14 h-14 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-lg font-medium text-gray-600">No Collections Yet</p>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            Create your first collection to organize resources
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all duration-200"
          >
            Create collection
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSorted.map((collection) => (
            <div
              key={collection.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200"
            >
              <div
                className="w-1 h-12 rounded-full mb-3"
                style={{ backgroundColor: collection.color }}
              />
              <h3 className="font-semibold text-gray-900 truncate">{collection.name}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{collection.description || 'No description'}</p>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>{collection.itemCount} items</span>
                <span>{formatDate(collection.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">Color</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">Items</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((collection, idx) => (
                  <tr key={collection.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-5 py-4 text-sm text-gray-400 font-medium">{idx + 1}</td>
                    <td className="px-5 py-4 text-center"><span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: collection.color }} /></td>
                    <td className="px-5 py-4"><span className="text-sm font-semibold text-gray-900">{collection.name}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">{collection.description || 'No description'}</td>
                    <td className="px-5 py-4 text-center text-sm text-gray-600">{collection.itemCount}</td>
                    <td className="px-5 py-4 text-center text-sm text-gray-500">{formatDate(collection.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrepCollectionsPage;
