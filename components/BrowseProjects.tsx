import React, { useState, useMemo } from 'react';
import Header from './Header';
import Footer from './Footer';
import type { BrowseProject } from '../types/browse';
import projectsData from '../mock/projects.json';

type SortOption = 'latest' | 'budget-high-low';
type ProjectTypeFilter = 'all' | 'fixed' | 'hourly';

const BrowseProjects: React.FC = () => {
  const [projects] = useState<BrowseProject[]>(projectsData as BrowseProject[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectType, setProjectType] = useState<ProjectTypeFilter>('all');
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 10000]);
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [receiveAlerts, setReceiveAlerts] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    projectType: true,
    budget: true
  });

  // Calculate budget range from projects
  const { minBudget, maxBudget } = useMemo(() => {
    if (projects.length === 0) return { minBudget: 0, maxBudget: 10000 };
    const budgets = projects.flatMap(p => [p.budget.min, p.budget.max]);
    return {
      minBudget: Math.floor(Math.min(...budgets)),
      maxBudget: Math.ceil(Math.max(...budgets))
    };
  }, [projects]);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Project type filter
    if (projectType !== 'all') {
      filtered = filtered.filter(p => p.type === projectType);
    }

    // Budget filter
    filtered = filtered.filter(p => {
      const projectMax = p.budget.max;
      return projectMax >= budgetRange[0] && p.budget.min <= budgetRange[1];
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'budget-high-low':
          return b.budget.max - a.budget.max;
        case 'latest':
        default:
          // Sort by posted time (most recent first)
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      }
    });

    return filtered;
  }, [projects, searchQuery, projectType, budgetRange, sortOption]);

  const clearFilters = () => {
    setProjectType('all');
    setBudgetRange([minBudget, maxBudget]);
    setSearchQuery('');
    setSortOption('latest');
  };

  const hasActiveFilters = projectType !== 'all' || budgetRange[0] > minBudget || budgetRange[1] < maxBudget;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const minPercent = ((budgetRange[0] - minBudget) / (maxBudget - minBudget)) * 100;
  const maxPercent = ((budgetRange[1] - minBudget) / (maxBudget - minBudget)) * 100;

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-x-hidden transition-colors duration-300 min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Browse Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find projects that match your skills
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for projects"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 border-2 border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-gray-100 text-lg"
            />
            <svg
              className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-80">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg h-fit lg:sticky lg:top-4 z-10 transition-all duration-300">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-semibold transition-colors duration-200 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Sort By</label>
                <div className="relative">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="latest">Latest</option>
                    <option value="budget-high-low">Budget High → Low</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Project Type */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('projectType')}
                  className="w-full flex items-center justify-between mb-3 group"
                >
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Project Type
                  </label>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.projectType ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.projectType && (
                  <div className="space-y-2">
                    {(['all', 'fixed', 'hourly'] as ProjectTypeFilter[]).map((type) => (
                      <label
                        key={type}
                        className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200"
                      >
                        <input
                          type="radio"
                          name="projectType"
                          value={type}
                          checked={projectType === type}
                          onChange={(e) => setProjectType(e.target.value as ProjectTypeFilter)}
                          className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium capitalize">
                          {type === 'all' ? 'All Projects' : type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('budget')}
                  className="w-full flex items-center justify-between mb-3 group"
                >
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Budget Range
                  </label>
                  <svg
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedSections.budget ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.budget && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="relative h-8 py-3">
                      <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full transform -translate-y-1/2"></div>
                      <div
                        className="absolute top-1/2 h-2 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transform -translate-y-1/2"
                        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                      ></div>
                      <input
                        type="range"
                        min={minBudget}
                        max={maxBudget}
                        value={budgetRange[0]}
                        onChange={(e) => setBudgetRange([Number(e.target.value), budgetRange[1]])}
                        className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-30"
                      />
                      <input
                        type="range"
                        min={minBudget}
                        max={maxBudget}
                        value={budgetRange[1]}
                        onChange={(e) => setBudgetRange([budgetRange[0], Number(e.target.value)])}
                        className="absolute top-0 left-0 w-full h-8 bg-transparent appearance-none cursor-pointer z-20"
                      />
                      <style>{`
                        input[type="range"]::-webkit-slider-thumb {
                          -webkit-appearance: none;
                          appearance: none;
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #f97316;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        input[type="range"]::-moz-range-thumb {
                          width: 20px;
                          height: 20px;
                          border-radius: 50%;
                          background: #f97316;
                          cursor: pointer;
                          border: 2px solid white;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                      `}</style>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Min</label>
                        <input
                          type="number"
                          min={minBudget}
                          max={maxBudget}
                          value={budgetRange[0]}
                          onChange={(e) => {
                            const val = Math.max(minBudget, Math.min(maxBudget, Number(e.target.value)));
                            setBudgetRange([val, budgetRange[1]]);
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Max</label>
                        <input
                          type="number"
                          min={minBudget}
                          max={maxBudget}
                          value={budgetRange[1]}
                          onChange={(e) => {
                            const val = Math.max(minBudget, Math.min(maxBudget, Number(e.target.value)));
                            setBudgetRange([budgetRange[0], val]);
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-gray-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Receive Alerts Toggle */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveAlerts}
                    onChange={(e) => setReceiveAlerts(e.target.checked)}
                    className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                    Receive alerts for this search
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredAndSortedProjects.length}</span> project{filteredAndSortedProjects.length !== 1 ? 's' : ''}
            </div>

            {filteredAndSortedProjects.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Left Content */}
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 hover:text-orange-600 dark:hover:text-orange-400 transition-colors cursor-pointer">
                          {project.title}
                        </h3>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                          {truncateDescription(project.description)}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {project.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{project.bidsCount} {project.bidsCount === 1 ? 'bid' : 'bids'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{project.postedTimeAgo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Content */}
                      <div className="flex flex-col items-end gap-4 md:min-w-[200px]">
                        {/* Budget */}
                        <div className="text-right">
                          {project.type === 'fixed' ? (
                            <div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                ${project.budget.min.toLocaleString()}
                                {project.budget.max !== project.budget.min && ` - $${project.budget.max.toLocaleString()}`}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Fixed Price</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                ${project.budget.min}/{project.budget.currency}/hr
                                {project.budget.max !== project.budget.min && ` - $${project.budget.max}/${project.budget.currency}/hr`}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">Hourly</div>
                            </div>
                          )}
                        </div>

                        {/* CTA Button */}
                        <button className="w-full md:w-auto px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors duration-200 whitespace-nowrap">
                          {project.bidsCount === 0 ? 'Be First to Bid' : 'Place Bid'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No projects found</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrowseProjects;

