import React, { useState, useMemo } from 'react';
import { collections as initialCollections } from '../../data/preparationMockData';
import type { Collection } from '../../data/preparationMockData';

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
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

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

  const handleCreate = () => {
    if (!newName.trim()) return;
    const newCollection: Collection = {
      id: `col-${Date.now()}`,
      name: newName.trim(),
      description: newDescription.trim(),
      itemCount: 0,
      createdAt: new Date().toISOString(),
      color: newColor,
    };
    setCollections((prev) => [newCollection, ...prev]);
    setNewName('');
    setNewDescription('');
    setNewColor(PRESET_COLORS[0]);
    setShowCreateForm(false);
  };

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
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                      newColor === color ? 'border-gray-900 scale-110' : 'border-gray-200 hover:border-gray-400'
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
      ) : (
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
      )}
    </div>
  );
};

export default PrepCollectionsPage;
