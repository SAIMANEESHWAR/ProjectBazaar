import React, { useState, useEffect } from 'react';

// ============================================
// TYPES & INTERFACES
// ============================================

interface WeekResource {
    type: 'gfg' | 'youtube' | 'documentation' | 'practice' | 'article';
    title: string;
    url: string;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option (0-3)
}

interface RoadmapWeek {
    weekNumber: number;
    mainTopics: string[];
    subtopics: string[];
    practicalTasks: string[];
    miniProject: string;
    roadmap?: string;
    resources?: WeekResource[];
    quiz?: QuizQuestion[];
}

interface CategoryRoadmap {
    categoryId: string;
    categoryName: string;
    weeks: RoadmapWeek[];
    programs?: Record<string, { weeks: RoadmapWeek[] }>;
}

interface Category {
    id: string;
    name: string;
    icon?: string;
}

// ============================================
// API CONFIGURATION
// ============================================

const API_ENDPOINT = 'https://07wee2lkxj.execute-api.ap-south-2.amazonaws.com/default/Roadmaps_get_post_put'; // Replace with your API Gateway URL

// ============================================
// MAIN COMPONENT
// ============================================

const RoadmapManagementPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('📚');
    const [_editingCategoryId, _setEditingCategoryId] = useState<string | null>(null);
    const [roadmaps, setRoadmaps] = useState<Record<string, CategoryRoadmap>>({});
    const [editingWeeks, setEditingWeeks] = useState<RoadmapWeek[]>([]);
    const [isAddingWeek, setIsAddingWeek] = useState(false);
    const [_loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [currentEditingDuration, setCurrentEditingDuration] = useState<number | null>(null);

    // Load roadmaps and categories from API
    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadRoadmap(selectedCategory);
        }
    }, [selectedCategory]);

    // API Functions
    const apiCall = async (body: any) => {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err: any) {
            console.error('API call error:', err);
            throw err;
        }
    };

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await apiCall({
                resource: 'categories',
                action: 'list',
            });

            if (data.success && data.categories) {
                setCategories(data.categories);
                if (data.categories.length > 0 && !selectedCategory) {
                    setSelectedCategory(data.categories[0].id);
                }
            }
        } catch (err: any) {
            setError('Failed to load categories: ' + err.message);
            // Fallback to default categories
            const defaultCategories: Category[] = [
                { id: 'ai-ml', name: 'AI/ML Engineer', icon: '🤖' },
                { id: 'web-dev', name: 'Web Development', icon: '🌐' },
                { id: 'data-science', name: 'Data Science', icon: '📊' },
                { id: 'devops', name: 'DevOps Engineer', icon: '⚙️' },
                { id: 'mobile-dev', name: 'Mobile Development', icon: '📱' },
                { id: 'cloud-engineer', name: 'Cloud Engineer', icon: '☁️' },
                { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
                { id: 'blockchain', name: 'Blockchain Developer', icon: '⛓️' },
                { id: 'ui-ux', name: 'UI/UX Designer', icon: '🎨' },
                { id: 'fullstack', name: 'Full Stack Developer', icon: '💻' },
            ];
            setCategories(defaultCategories);
            if (!selectedCategory) {
                setSelectedCategory(defaultCategories[0].id);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadRoadmap = async (categoryId: string) => {
        try {
            const data = await apiCall({
                resource: 'roadmap',
                action: 'get',
                categoryId: categoryId,
            });

            if (data.success && data.roadmap) {
                setRoadmaps((prev) => ({
                    ...prev,
                    [categoryId]: data.roadmap,
                }));
            }
        } catch (err: any) {
            console.error('Failed to load roadmap:', err);
            // Initialize empty roadmap if not found
            const category = categories.find((c) => c.id === categoryId);
            if (category) {
                setRoadmaps((prev) => ({
                    ...prev,
                    [categoryId]: {
                        categoryId: categoryId,
                        categoryName: category.name,
                        weeks: [],
                    },
                }));
            }
        }
    };

    const saveRoadmap = async (categoryId: string, autoSave = false, programDuration: number | null = null, weeksToSave: RoadmapWeek[] | null = null) => {
        const roadmap = roadmaps[categoryId];
        if (!roadmap) return;

        try {
            if (autoSave) {
                setAutoSaving(true);
            } else {
                setSaving(true);
            }
            setError(null);

            const category = categories.find(c => c.id === categoryId);
            const data = await apiCall({
                resource: 'roadmap',
                action: 'save',
                categoryId: roadmap.categoryId,
                categoryName: roadmap.categoryName || category?.name || '',
                icon: category?.icon || '📚',
                weeks: weeksToSave !== null ? weeksToSave : roadmap.weeks,
                programDuration: programDuration ? str(programDuration) : null,
            });

            if (data.success) {
                // Update local state with the returned roadmap to ensure sync
                if (data.roadmap) {
                    setRoadmaps(prev => ({
                        ...prev,
                        [categoryId]: data.roadmap
                    }));
                }

                if (!autoSave) {
                    setSuccess('Roadmap saved successfully!');
                    setTimeout(() => setSuccess(null), 3000);
                }
            } else {
                throw new Error(data.error || 'Failed to save roadmap');
            }
        } catch (err: any) {
            setError('Failed to save roadmap: ' + err.message);
        } finally {
            setSaving(false);
            setAutoSaving(false);
        }
    };

    // Helper to convert to string since Decimal might be returned
    const str = (v: any) => String(v);

    const saveAllRoadmaps = async () => {
        try {
            setSaving(true);
            setError(null);

            // Save all roadmaps
            const savePromises = Object.keys(roadmaps).map((categoryId) =>
                saveRoadmap(categoryId, true)
            );

            await Promise.all(savePromises);

            setSuccess('All roadmaps saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Failed to save roadmaps: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const getCurrentRoadmap = (): CategoryRoadmap => {
        if (!roadmaps[selectedCategory]) {
            return {
                categoryId: selectedCategory,
                categoryName: categories.find(c => c.id === selectedCategory)?.name || selectedCategory,
                weeks: [],
                programs: {},
            };
        }
        return {
            ...roadmaps[selectedCategory],
            programs: roadmaps[selectedCategory].programs || {},
        };
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            setError('Category name is required');
            return;
        }
        const newId = newCategoryName.toLowerCase().replace(/\s+/g, '-');
        if (categories.some(c => c.id === newId)) {
            setError('Category with this name already exists');
            return;
        }

        // Create category by saving an empty roadmap
        try {
            setSaving(true);
            const newCategory: Category = {
                id: newId,
                name: newCategoryName.trim(),
                icon: newCategoryIcon,
            };

            // Save empty roadmap to create category
            const data = await apiCall({
                resource: 'roadmap',
                action: 'save',
                categoryId: newId,
                categoryName: newCategoryName.trim(),
                icon: newCategoryIcon,
                weeks: [],
            });

            if (data.success) {
                setCategories([...categories, newCategory]);
                setRoadmaps({
                    ...roadmaps,
                    [newId]: {
                        categoryId: newId,
                        categoryName: newCategoryName.trim(),
                        weeks: [],
                    },
                });
                setNewCategoryName('');
                setNewCategoryIcon('📚');
                setIsAddingCategory(false);
                setSelectedCategory(newId);
                setSuccess('Category created successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(data.error || 'Failed to create category');
            }
        } catch (err: any) {
            setError('Failed to create category: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (window.confirm('Are you sure you want to delete this category? All weeks in this category will also be deleted.')) {
            try {
                setSaving(true);
                const data = await apiCall({
                    resource: 'categories',
                    action: 'delete',
                    categoryId: categoryId,
                });

                if (data.success) {
                    setCategories(categories.filter(c => c.id !== categoryId));
                    const updatedRoadmaps = { ...roadmaps };
                    delete updatedRoadmaps[categoryId];
                    setRoadmaps(updatedRoadmaps);
                    if (selectedCategory === categoryId && categories.length > 1) {
                        const remaining = categories.filter(c => c.id !== categoryId);
                        setSelectedCategory(remaining[0].id);
                    }
                    setSuccess('Category deleted successfully!');
                    setTimeout(() => setSuccess(null), 3000);
                } else {
                    throw new Error(data.error || 'Failed to delete category');
                }
            } catch (err: any) {
                setError('Failed to delete category: ' + err.message);
            } finally {
                setSaving(false);
            }
        }
    };

    const handleEditWeekRange = (upToWeek: number) => {
        const currentRoadmap = getCurrentRoadmap();
        setCurrentEditingDuration(upToWeek);

        // Try to get weeks from specific program first
        const programWeeks = currentRoadmap.programs?.[str(upToWeek)]?.weeks;

        const weeks: RoadmapWeek[] = [];
        for (let i = 1; i <= upToWeek; i++) {
            // Priority: 1. Program-specific week, 2. Global week (if compatible), 3. Template
            const existingInProgram = programWeeks?.find(w => w.weekNumber === i);
            const existingGlobal = currentRoadmap.weeks.find(w => w.weekNumber === i);

            const existing = existingInProgram || existingGlobal;

            if (existing) {
                weeks.push({ ...existing });
            } else {
                weeks.push({
                    weekNumber: i,
                    mainTopics: [],
                    subtopics: [],
                    practicalTasks: [],
                    miniProject: '',
                    roadmap: '',
                    resources: [],
                    quiz: [],
                });
            }
        }
        setEditingWeeks(weeks);
        setIsAddingWeek(false);
    };

    const handleAddWeek = () => {
        const currentRoadmap = getCurrentRoadmap();
        handleEditWeekRange(currentRoadmap.weeks.length + 1);
        setIsAddingWeek(true);
    };

    const handleDeleteWeek = async (duration: number) => {
        if (window.confirm(`Are you sure you want to delete the ${duration}-week program path?`)) {
            const currentRoadmap = getCurrentRoadmap();

            const updatedPrograms = { ...(currentRoadmap.programs || {}) };
            delete updatedPrograms[str(duration)];

            const updatedRoadmap = {
                ...currentRoadmap,
                programs: updatedPrograms,
                // Also update global weeks if this was the 8-week program
                weeks: duration === 8 ? [] : currentRoadmap.weeks
            };

            setRoadmaps({
                ...roadmaps,
                [selectedCategory]: updatedRoadmap,
            });

            // Auto-save to database (pass duration and empty weeks to indicate which program was cleared)
            await saveRoadmap(selectedCategory, true, duration, []);
            setSuccess(`${duration}-week program cleared!`);
            setTimeout(() => setSuccess(null), 2000);
        }
    };

    const handleSaveWeeks = async () => {
        if (editingWeeks.length === 0) return;

        // Validate all editingWeeks
        for (const week of editingWeeks) {
            if (week.mainTopics.length === 0) {
                setError(`Week ${week.weekNumber}: Please add at least one main topic`);
                return;
            }
            if (week.subtopics.length === 0) {
                setError(`Week ${week.weekNumber}: Please add at least one subtopic`);
                return;
            }
            if (week.practicalTasks.length === 0) {
                setError(`Week ${week.weekNumber}: Please add at least one practical task`);
                return;
            }
            if (!week.miniProject.trim()) {
                setError(`Week ${week.weekNumber}: Please enter a mini project description`);
                return;
            }
        }

        const currentRoadmap = getCurrentRoadmap();

        // Update the local programs map
        const updatedPrograms = { ...(currentRoadmap.programs || {}) };
        if (currentEditingDuration) {
            updatedPrograms[str(currentEditingDuration)] = {
                weeks: [...editingWeeks]
            };
        }

        const updatedRoadmap = {
            ...currentRoadmap,
            programs: updatedPrograms,
            // Also update global weeks if this is an 8-week program (for compatibility)
            weeks: currentEditingDuration === 8 ? [...editingWeeks] : currentRoadmap.weeks
        };

        setRoadmaps({
            ...roadmaps,
            [selectedCategory]: updatedRoadmap,
        });

        // Auto-save to database with program duration and the specific editing content
        await saveRoadmap(selectedCategory, true, currentEditingDuration, [...editingWeeks]);

        setEditingWeeks([]);
        setIsAddingWeek(false);
        setCurrentEditingDuration(null);
        setSuccess('Roadmap weeks updated successfully!');
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleAddArrayItem = (weekIdx: number, field: 'mainTopics' | 'subtopics' | 'practicalTasks', value: string) => {
        if (editingWeeks.length === 0 || !value.trim()) return;
        const updated = [...editingWeeks];
        updated[weekIdx] = {
            ...updated[weekIdx],
            [field]: [...updated[weekIdx][field], value.trim()],
        };
        setEditingWeeks(updated);
    };

    const handleRemoveArrayItem = (weekIdx: number, field: 'mainTopics' | 'subtopics' | 'practicalTasks', itemIdx: number) => {
        if (editingWeeks.length === 0) return;
        const updated = [...editingWeeks];
        updated[weekIdx] = {
            ...updated[weekIdx],
            [field]: updated[weekIdx][field].filter((_, i) => i !== itemIdx),
        };
        setEditingWeeks(updated);
    };

    const handleAddResource = (weekIdx: number) => {
        if (editingWeeks.length === 0) return;
        const newResource: WeekResource = {
            type: 'gfg',
            title: '',
            url: '',
        };
        const updated = [...editingWeeks];
        updated[weekIdx] = {
            ...updated[weekIdx],
            resources: [...(updated[weekIdx].resources || []), newResource],
        };
        setEditingWeeks(updated);
    };

    const handleUpdateResource = (weekIdx: number, resIdx: number, field: keyof WeekResource, value: string) => {
        if (editingWeeks.length === 0 || !editingWeeks[weekIdx].resources) return;
        const updated = [...editingWeeks];
        const updatedResources = [...(updated[weekIdx].resources || [])];
        updatedResources[resIdx] = { ...updatedResources[resIdx], [field]: value };
        updated[weekIdx] = {
            ...updated[weekIdx],
            resources: updatedResources,
        };
        setEditingWeeks(updated);
    };

    const handleRemoveResource = (weekIdx: number, resIdx: number) => {
        if (editingWeeks.length === 0 || !editingWeeks[weekIdx].resources) return;
        const updated = [...editingWeeks];
        updated[weekIdx] = {
            ...updated[weekIdx],
            resources: (updated[weekIdx].resources || []).filter((_, i) => i !== resIdx),
        };
        setEditingWeeks(updated);
    };

    const handleAddQuizQuestion = (weekIdx: number) => {
        if (editingWeeks.length === 0) return;
        const newQuestion: QuizQuestion = {
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
        };
        const updated = [...editingWeeks];
        updated[weekIdx] = {
            ...updated[weekIdx],
            quiz: [...(updated[weekIdx].quiz || []), newQuestion],
        };
        setEditingWeeks(updated);
    };

    const handleUpdateQuizQuestion = (weekIdx: number, qIdx: number, field: keyof QuizQuestion, value: any) => {
        if (editingWeeks.length === 0 || !editingWeeks[weekIdx].quiz) return;
        const updated = [...editingWeeks];
        const updatedQuiz = [...(updated[weekIdx].quiz || [])];
        updatedQuiz[qIdx] = { ...updatedQuiz[qIdx], [field]: value };
        updated[weekIdx] = {
            ...updated[weekIdx],
            quiz: updatedQuiz,
        };
        setEditingWeeks(updated);
    };

    const handleUpdateQuizOption = (weekIdx: number, qIdx: number, optIdx: number, value: string) => {
        if (editingWeeks.length === 0 || !editingWeeks[weekIdx].quiz) return;
        const updated = [...editingWeeks];
        const updatedQuiz = [...(updated[weekIdx].quiz || [])];
        const newOptions = [...updatedQuiz[qIdx].options];
        newOptions[optIdx] = value;
        updatedQuiz[qIdx] = { ...updatedQuiz[qIdx], options: newOptions };
        updated[weekIdx] = {
            ...updated[weekIdx],
            quiz: updatedQuiz,
        };
        setEditingWeeks(updated);
    };

    const handleRemoveQuizQuestion = (weekIdx: number, qIdx: number) => {
        if (editingWeeks.length === 0 || !editingWeeks[weekIdx].quiz) return;
        const updated = [...editingWeeks];
        updated[weekIdx] = {
            ...updated[weekIdx],
            quiz: (updated[weekIdx].quiz || []).filter((_, i) => i !== qIdx),
        };
        setEditingWeeks(updated);
    };

    const currentRoadmap = getCurrentRoadmap();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Roadmap Management</h2>
                        <p className="text-gray-600 mt-1">Manage learning roadmaps, categories, weeks, and quiz questions</p>
                    </div>
                    <div className="flex gap-3">
                        {autoSaving && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                Auto-saving...
                            </div>
                        )}
                        <button
                            onClick={saveAllRoadmaps}
                            disabled={saving || autoSaving}
                            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Save All Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Sidebar - Category Selection */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                            <button
                                onClick={() => setIsAddingCategory(true)}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                            >
                                <span>+</span> Add
                            </button>
                        </div>

                        {/* Add Category Form */}
                        {isAddingCategory && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Category name..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                                />
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm text-gray-600">Icon:</span>
                                    <input
                                        type="text"
                                        value={newCategoryIcon}
                                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                                        placeholder="📚"
                                        className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center"
                                        maxLength={2}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddCategory}
                                        className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsAddingCategory(false);
                                            setNewCategoryName('');
                                            setNewCategoryIcon('📚');
                                        }}
                                        className="flex-1 px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {categories.map(category => (
                                <div
                                    key={category.id}
                                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${selectedCategory === category.id
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <button
                                        onClick={() => setSelectedCategory(category.id)}
                                        className="flex-1 text-left flex items-center gap-2"
                                    >
                                        <span className="text-lg">{category.icon || '📚'}</span>
                                        <span className="font-medium">{category.name}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-opacity"
                                        title="Delete category"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-600">
                                    Weeks: <span className="font-semibold text-gray-900">{currentRoadmap.weeks.length}</span>
                                </p>
                            </div>
                            <button
                                onClick={handleAddWeek}
                                className="w-full px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">+</span>
                                <span>Add Week</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content - Weeks List or Edit Form */}
                <div className="lg:col-span-3">
                    {editingWeeks.length > 0 ? (
                        /* Comprehensive Multi-Week Form - DESIGNER GRADE UI */
                        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[85vh]">
                            {/* Premium Header */}
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-6 flex items-center justify-between shadow-lg z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                        <span className="bg-orange-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                            </svg>
                                        </span>
                                        Roadmap Architecture: Weeks 1 - {editingWeeks.length}
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1 font-medium italic opacity-80">Orchestrating a cumulative learning journey</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingWeeks([]);
                                        setIsAddingWeek(false);
                                    }}
                                    className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all duration-300"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 flex overflow-hidden">
                                {/* Sticky Sidebar Navigator */}
                                <div className="w-64 bg-gray-50 border-r border-gray-100 p-6 overflow-y-auto hidden md:block">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 px-2">Journey Navigator</h4>
                                    <div className="space-y-2">
                                        {editingWeeks.map((_, idx) => (
                                            <a
                                                key={idx}
                                                href={`#week-section-${idx}`}
                                                className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-sm transition-all duration-300 border border-transparent hover:border-gray-100"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700">Week {idx + 1}</span>
                                                    <span className="text-[10px] text-gray-400">Configure content</span>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                {/* Scrollable Content */}
                                <div className="flex-1 overflow-y-auto bg-white p-8 space-y-20 scroll-smooth custom-scrollbar">
                                    {editingWeeks.map((editingWeek, weekIdx) => (
                                        <section key={weekIdx} id={`#week-section-${weekIdx}`} className="relative">
                                            {/* Decorative Connector Line */}
                                            {weekIdx < editingWeeks.length - 1 && (
                                                <div className="absolute left-[2.25rem] top-12 bottom-[-5rem] w-0.5 bg-gradient-to-b from-orange-200 to-transparent z-0 opacity-50"></div>
                                            )}

                                            <div className="flex gap-8 relative z-10 transition-all duration-500 hover:translate-x-1">
                                                {/* Week Indicator Circle */}
                                                <div className="flex-shrink-0 mt-2">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20 text-lg">
                                                        {weekIdx + 1}
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-12 pb-12">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-2xl font-black text-gray-900 tracking-tight italic">WEEK {weekIdx + 1} MODULE</h4>
                                                            <p className="text-gray-400 text-sm font-medium">Define the core curriculum for this stage</p>
                                                        </div>
                                                        <span className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">Stage {weekIdx + 1}</span>
                                                    </div>
                                                    {/* Main Topics */}
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                            Main Topics *
                                                        </label>
                                                        <div className="space-y-2">
                                                            {editingWeek.mainTopics.map((topic, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={topic}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingWeeks];
                                                                            const updatedTopics = [...updated[weekIdx].mainTopics];
                                                                            updatedTopics[idx] = e.target.value;
                                                                            updated[weekIdx] = { ...updated[weekIdx], mainTopics: updatedTopics };
                                                                            setEditingWeeks(updated);
                                                                        }}
                                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleRemoveArrayItem(weekIdx, 'mainTopics', idx)}
                                                                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add main topic..."
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            handleAddArrayItem(weekIdx, 'mainTopics', e.currentTarget.value);
                                                                            e.currentTarget.value = '';
                                                                        }
                                                                    }}
                                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                                                                />
                                                                <button
                                                                    onClick={(e) => {
                                                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                        if (input) {
                                                                            handleAddArrayItem(weekIdx, 'mainTopics', input.value);
                                                                            input.value = '';
                                                                        }
                                                                    }}
                                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                                                >
                                                                    Add
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Subtopics */}
                                                    <div className="bg-green-50/50 border border-green-200 rounded-xl p-5">
                                                        <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                            <span>📋</span> Subtopics *
                                                        </label>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            {editingWeek.subtopics.map((subtopic, idx) => (
                                                                <div key={idx} className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-green-300">
                                                                    <input
                                                                        type="text"
                                                                        value={subtopic}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingWeeks];
                                                                            const updatedSub = [...updated[weekIdx].subtopics];
                                                                            updatedSub[idx] = e.target.value;
                                                                            updated[weekIdx] = { ...updated[weekIdx], subtopics: updatedSub };
                                                                            setEditingWeeks(updated);
                                                                        }}
                                                                        className="text-sm outline-none bg-transparent min-w-[150px]"
                                                                        placeholder="Subtopic..."
                                                                    />
                                                                    <button
                                                                        onClick={() => handleRemoveArrayItem(weekIdx, 'subtopics', idx)}
                                                                        className="text-red-500 hover:text-red-700 text-sm font-bold ml-1"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="➕ Add subtopic"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleAddArrayItem(weekIdx, 'subtopics', e.currentTarget.value);
                                                                        e.currentTarget.value = '';
                                                                    }
                                                                }}
                                                                className="flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                                            />
                                                            <button
                                                                onClick={(e) => {
                                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                    if (input && input.value.trim()) {
                                                                        handleAddArrayItem(weekIdx, 'subtopics', input.value);
                                                                        input.value = '';
                                                                    }
                                                                }}
                                                                className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Practical Tasks */}
                                                    <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-5">
                                                        <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                            <span>✅</span> Practical Tasks *
                                                        </label>
                                                        <div className="space-y-3">
                                                            {editingWeek.practicalTasks.map((task, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                                                                    <span className="text-sm text-gray-500 w-8">{idx + 1}.</span>
                                                                    <input
                                                                        type="text"
                                                                        value={task}
                                                                        onChange={(e) => {
                                                                            const updated = [...editingWeeks];
                                                                            const updatedTasks = [...updated[weekIdx].practicalTasks];
                                                                            updatedTasks[idx] = e.target.value;
                                                                            updated[weekIdx] = { ...updated[weekIdx], practicalTasks: updatedTasks };
                                                                            setEditingWeeks(updated);
                                                                        }}
                                                                        className="flex-1 px-3 py-2 border-none outline-none bg-transparent"
                                                                        placeholder="Enter practical task..."
                                                                    />
                                                                    <button
                                                                        onClick={() => handleRemoveArrayItem(weekIdx, 'practicalTasks', idx)}
                                                                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    placeholder="➕ Add new practical task"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            handleAddArrayItem(weekIdx, 'practicalTasks', e.currentTarget.value);
                                                                            e.currentTarget.value = '';
                                                                        }
                                                                    }}
                                                                    className="flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                                />
                                                                <button
                                                                    onClick={(e) => {
                                                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                                        if (input && input.value.trim()) {
                                                                            handleAddArrayItem(weekIdx, 'practicalTasks', input.value);
                                                                            input.value = '';
                                                                        }
                                                                    }}
                                                                    className="px-5 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium border border-purple-200 pl-2"
                                                                >
                                                                    Add
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {/* Mini Project */}
                                                        <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-5">
                                                            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                                <span>🚀</span> Mini Project *
                                                            </label>
                                                            <textarea
                                                                value={editingWeek.miniProject}
                                                                onChange={(e) => {
                                                                    const updated = [...editingWeeks];
                                                                    updated[weekIdx] = { ...updated[weekIdx], miniProject: e.target.value };
                                                                    setEditingWeeks(updated);
                                                                }}
                                                                rows={3}
                                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white resize-none"
                                                                placeholder="Describe the mini project..."
                                                            />
                                                        </div>

                                                        {/* Week Roadmap */}
                                                        <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-5">
                                                            <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                                <span>🗺️</span> Week Roadmap *
                                                            </label>
                                                            <textarea
                                                                value={editingWeek.roadmap || ''}
                                                                onChange={(e) => {
                                                                    const updated = [...editingWeeks];
                                                                    updated[weekIdx] = { ...updated[weekIdx], roadmap: e.target.value };
                                                                    setEditingWeeks(updated);
                                                                }}
                                                                rows={3}
                                                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white resize-none"
                                                                placeholder="Enter detailed roadmap explanation..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Resources */}
                                                    <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <label className="block text-base font-bold text-gray-900 flex items-center gap-2">
                                                                <span>🔗</span> Learning Resources
                                                            </label>
                                                            <button
                                                                onClick={() => handleAddResource(weekIdx)}
                                                                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm"
                                                            >
                                                                + Add Resource
                                                            </button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {(editingWeek.resources || []).map((resource, resIdx) => (
                                                                <div key={resIdx} className="p-4 bg-white border border-gray-200 rounded-lg">
                                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                                        <div className="md:col-span-3">
                                                                            <select
                                                                                value={resource.type}
                                                                                onChange={(e) => handleUpdateResource(weekIdx, resIdx, 'type', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                                                                            >
                                                                                <option value="gfg">📖 GeeksforGeeks</option>
                                                                                <option value="youtube">▶️ YouTube</option>
                                                                                <option value="documentation">📘 Documentation</option>
                                                                                <option value="practice">💪 Practice</option>
                                                                                <option value="article">📄 Article</option>
                                                                            </select>
                                                                        </div>
                                                                        <div className="md:col-span-4">
                                                                            <input
                                                                                type="text"
                                                                                value={resource.title}
                                                                                onChange={(e) => handleUpdateResource(weekIdx, resIdx, 'title', e.target.value)}
                                                                                placeholder="Resource title..."
                                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                                                                            />
                                                                        </div>
                                                                        <div className="md:col-span-5 flex gap-2">
                                                                            <input
                                                                                type="url"
                                                                                value={resource.url}
                                                                                onChange={(e) => handleUpdateResource(weekIdx, resIdx, 'url', e.target.value)}
                                                                                placeholder="https://..."
                                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                                                                            />
                                                                            <button
                                                                                onClick={() => handleRemoveResource(weekIdx, resIdx)}
                                                                                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Quiz */}
                                                    <div className="bg-pink-50/50 border border-pink-200 rounded-xl p-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <label className="block text-base font-bold text-gray-900 flex items-center gap-2">
                                                                <span>❓</span> Quiz Questions
                                                            </label>
                                                            <button
                                                                onClick={() => handleAddQuizQuestion(weekIdx)}
                                                                className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600"
                                                            >
                                                                + Add Question
                                                            </button>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {(editingWeek.quiz || []).map((question, qIdx) => (
                                                                <div key={qIdx} className="p-5 bg-white border border-gray-200 rounded-xl">
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <span className="font-bold text-gray-900">Q{qIdx + 1}</span>
                                                                        <button
                                                                            onClick={() => handleRemoveQuizQuestion(weekIdx, qIdx)}
                                                                            className="text-red-500 text-xs font-bold hover:underline"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <textarea
                                                                        value={question.question}
                                                                        onChange={(e) => handleUpdateQuizQuestion(weekIdx, qIdx, 'question', e.target.value)}
                                                                        placeholder="Enter question text..."
                                                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg mb-4 text-sm"
                                                                    />
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                        {question.options.map((option, optIdx) => (
                                                                            <div key={optIdx} className="flex items-center gap-2">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`correct-${weekIdx}-${qIdx}`}
                                                                                    checked={question.correctAnswer === optIdx}
                                                                                    onChange={() => handleUpdateQuizQuestion(weekIdx, qIdx, 'correctAnswer', optIdx)}
                                                                                />
                                                                                <input
                                                                                    type="text"
                                                                                    value={option}
                                                                                    onChange={(e) => handleUpdateQuizOption(weekIdx, qIdx, optIdx, e.target.value)}
                                                                                    placeholder={`Option ${optIdx + 1}`}
                                                                                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </div>

                            {/* Global Save Button */}
                            <div className="flex gap-4 pt-8 mt-6 border-t-2 border-gray-100 sticky bottom-0 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] pb-2 rounded-b-xl px-4">
                                <button
                                    onClick={handleSaveWeeks}
                                    className="flex-1 px-8 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 uppercase tracking-widest transform hover:-translate-y-1 active:scale-95"
                                >
                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Apply All Roadmap Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingWeeks([]);
                                        setIsAddingWeek(false);
                                    }}
                                    className="px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all border-2 border-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Weeks List */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {currentRoadmap.categoryName} - Unified Curriculum Map
                                </h3>
                                <p className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                                    Independent Duration Paths
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((weekNum) => {
                                    // A card for 'Week N' represents the N-week program path
                                    let programWeeks = currentRoadmap.programs?.[str(weekNum)]?.weeks || [];

                                    // Fallback: For 8-week, also check legacy global weeks if programs slot is empty
                                    if (programWeeks.length === 0 && weekNum === 8) {
                                        programWeeks = currentRoadmap.weeks || [];
                                    }

                                    const hasData = programWeeks.length > 0;
                                    // Display the last week of the program as the representative 'target'
                                    const weekDisplay = programWeeks[programWeeks.length - 1];

                                    return (
                                        <div
                                            key={weekNum}
                                            className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 ${hasData
                                                ? 'bg-white border-orange-200 shadow-md hover:shadow-lg'
                                                : 'bg-gray-50 border-gray-200 border-dashed hover:border-blue-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${hasData ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {weekNum}
                                                </div>
                                                {hasData && (
                                                    <span className="flex h-2 w-2 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="font-bold text-gray-900 mb-2 truncate" title={`${weekNum}-Week Program Path`}>
                                                {weekNum}-Week Journey
                                            </h4>

                                            {hasData ? (
                                                <>
                                                    <div className="flex-1 space-y-2 mb-4">
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Program Overview:</p>
                                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                            <span className="font-semibold text-gray-800">📜 Topics:</span> {
                                                                Array.from(new Set(
                                                                    programWeeks.flatMap(w => w.mainTopics || [])
                                                                )).join(', ') || 'No topics set.'
                                                            }
                                                        </p>
                                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed italic border-l-2 border-orange-200 pl-2">
                                                            <span className="font-semibold text-gray-800">🎯 Final Target:</span> {weekDisplay?.roadmap || 'No target set.'}
                                                        </p>
                                                    </div>
                                                    <div className="mt-auto flex gap-2 pt-4 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleEditWeekRange(weekNum)}
                                                            className="flex-1 text-xs font-bold py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWeek(weekNum)}
                                                            className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                                            title="Clear week data"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
                                                    <p className="text-xs text-gray-400 mb-4 px-2">No roadmap content configured for this week yet.</p>
                                                    <button
                                                        onClick={() => handleEditWeekRange(weekNum)}
                                                        className="w-full py-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-all shadow-sm"
                                                    >
                                                        + Add Roadmap
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapManagementPage;
