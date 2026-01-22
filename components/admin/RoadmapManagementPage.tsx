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
    resources?: WeekResource[];
    quiz?: QuizQuestion[];
}

interface CategoryRoadmap {
    categoryId: string;
    categoryName: string;
    weeks: RoadmapWeek[];
}

interface Category {
    id: string;
    name: string;
    icon?: string;
}

// ============================================
// API CONFIGURATION
// ============================================

const API_ENDPOINT = 'https://YOUR_API_GATEWAY_URL/roadmap-management'; // Replace with your API Gateway URL

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
    const [editingWeek, setEditingWeek] = useState<RoadmapWeek | null>(null);
    const [isAddingWeek, setIsAddingWeek] = useState(false);
    const [_loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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

    const saveRoadmap = async (categoryId: string, autoSave = false) => {
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
                weeks: roadmap.weeks,
            });

            if (data.success) {
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
            };
        }
        return roadmaps[selectedCategory];
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

    const handleAddWeek = () => {
        const currentRoadmap = getCurrentRoadmap();
        const newWeek: RoadmapWeek = {
            weekNumber: currentRoadmap.weeks.length + 1,
            mainTopics: [],
            subtopics: [],
            practicalTasks: [],
            miniProject: '',
            resources: [],
            quiz: [],
        };
        setEditingWeek(newWeek);
        setIsAddingWeek(true);
    };

    const handleEditWeek = (week: RoadmapWeek) => {
        setEditingWeek({ ...week });
        setIsAddingWeek(false);
    };

    const handleDeleteWeek = async (weekNumber: number) => {
        if (window.confirm('Are you sure you want to delete this week?')) {
            const currentRoadmap = getCurrentRoadmap();
            const updatedWeeks = currentRoadmap.weeks
                .filter(w => w.weekNumber !== weekNumber)
                .map((w, idx) => ({ ...w, weekNumber: idx + 1 }));
            
            const updatedRoadmap = {
                ...currentRoadmap,
                weeks: updatedWeeks,
            };

            setRoadmaps({
                ...roadmaps,
                [selectedCategory]: updatedRoadmap,
            });

            // Auto-save to database
            await saveRoadmap(selectedCategory, true);
            setSuccess('Week deleted successfully!');
            setTimeout(() => setSuccess(null), 2000);
        }
    };

    const handleSaveWeek = async () => {
        if (!editingWeek) return;

        // Validate week data
        if (editingWeek.mainTopics.length === 0) {
            setError('Please add at least one main topic');
            return;
        }
        if (editingWeek.subtopics.length === 0) {
            setError('Please add at least one subtopic');
            return;
        }
        if (editingWeek.practicalTasks.length === 0) {
            setError('Please add at least one practical task');
            return;
        }
        if (!editingWeek.miniProject.trim()) {
            setError('Please enter a mini project description');
            return;
        }

        const currentRoadmap = getCurrentRoadmap();
        let updatedWeeks: RoadmapWeek[];

        if (isAddingWeek) {
            updatedWeeks = [...currentRoadmap.weeks, editingWeek];
        } else {
            updatedWeeks = currentRoadmap.weeks.map(w =>
                w.weekNumber === editingWeek.weekNumber ? editingWeek : w
            );
        }

        const updatedRoadmap = {
            ...currentRoadmap,
            weeks: updatedWeeks.sort((a, b) => a.weekNumber - b.weekNumber),
        };

        setRoadmaps({
            ...roadmaps,
            [selectedCategory]: updatedRoadmap,
        });

        setEditingWeek(null);
        setIsAddingWeek(false);
        
        // Auto-save to database
        await saveRoadmap(selectedCategory, true);
        setSuccess('Week saved successfully!');
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleAddArrayItem = (field: 'mainTopics' | 'subtopics' | 'practicalTasks', value: string) => {
        if (!editingWeek || !value.trim()) return;
        setEditingWeek({
            ...editingWeek,
            [field]: [...editingWeek[field], value.trim()],
        });
    };

    const handleRemoveArrayItem = (field: 'mainTopics' | 'subtopics' | 'practicalTasks', index: number) => {
        if (!editingWeek) return;
        setEditingWeek({
            ...editingWeek,
            [field]: editingWeek[field].filter((_, i) => i !== index),
        });
    };

    const handleAddResource = () => {
        if (!editingWeek) return;
        const newResource: WeekResource = {
            type: 'gfg',
            title: '',
            url: '',
        };
        setEditingWeek({
            ...editingWeek,
            resources: [...(editingWeek.resources || []), newResource],
        });
    };

    const handleUpdateResource = (index: number, field: keyof WeekResource, value: string) => {
        if (!editingWeek || !editingWeek.resources) return;
        const updated = [...editingWeek.resources];
        updated[index] = { ...updated[index], [field]: value };
        setEditingWeek({
            ...editingWeek,
            resources: updated,
        });
    };

    const handleRemoveResource = (index: number) => {
        if (!editingWeek || !editingWeek.resources) return;
        setEditingWeek({
            ...editingWeek,
            resources: editingWeek.resources.filter((_, i) => i !== index),
        });
    };

    const handleAddQuizQuestion = () => {
        if (!editingWeek) return;
        const newQuestion: QuizQuestion = {
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
        };
        setEditingWeek({
            ...editingWeek,
            quiz: [...(editingWeek.quiz || []), newQuestion],
        });
    };

    const handleUpdateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        if (!editingWeek || !editingWeek.quiz) return;
        const updated = [...editingWeek.quiz];
        updated[index] = { ...updated[index], [field]: value };
        setEditingWeek({
            ...editingWeek,
            quiz: updated,
        });
    };

    const handleUpdateQuizOption = (questionIndex: number, optionIndex: number, value: string) => {
        if (!editingWeek || !editingWeek.quiz) return;
        const updated = [...editingWeek.quiz];
        const newOptions = [...updated[questionIndex].options];
        newOptions[optionIndex] = value;
        updated[questionIndex] = { ...updated[questionIndex], options: newOptions };
        setEditingWeek({
            ...editingWeek,
            quiz: updated,
        });
    };

    const handleRemoveQuizQuestion = (index: number) => {
        if (!editingWeek || !editingWeek.quiz) return;
        setEditingWeek({
            ...editingWeek,
            quiz: editingWeek.quiz.filter((_, i) => i !== index),
        });
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
                                    className={`group flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                                        selectedCategory === category.id
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
                    {editingWeek ? (
                        /* Comprehensive Week Form */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {isAddingWeek ? '➕ Add New Week' : `✏️ Edit Week ${editingWeek.weekNumber}`}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">Fill in all the details for this week</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditingWeek(null);
                                        setIsAddingWeek(false);
                                    }}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            <div className="space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
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
                                                        const updated = [...editingWeek.mainTopics];
                                                        updated[idx] = e.target.value;
                                                        setEditingWeek({ ...editingWeek, mainTopics: updated });
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <button
                                                    onClick={() => handleRemoveArrayItem('mainTopics', idx)}
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
                                                        handleAddArrayItem('mainTopics', e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    if (input) {
                                                        handleAddArrayItem('mainTopics', input.value);
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
                                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
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
                                                        const updated = [...editingWeek.subtopics];
                                                        updated[idx] = e.target.value;
                                                        setEditingWeek({ ...editingWeek, subtopics: updated });
                                                    }}
                                                    className="text-sm outline-none bg-transparent min-w-[150px]"
                                                    placeholder="Subtopic..."
                                                />
                                                <button
                                                    onClick={() => handleRemoveArrayItem('subtopics', idx)}
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
                                            placeholder="➕ Add subtopic (Press Enter or click Add)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddArrayItem('subtopics', e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                            className="flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
                                        />
                                        <button
                                            onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                if (input && input.value.trim()) {
                                                    handleAddArrayItem('subtopics', input.value);
                                                    input.value = '';
                                                    input.focus();
                                                }
                                            }}
                                            className="px-5 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium shadow-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Practical Tasks */}
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                                    <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>✅</span> Practical Tasks *
                                    </label>
                                    <div className="space-y-3">
                                        {editingWeek.practicalTasks.map((task, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2">
                                                <span className="text-sm text-gray-500 w-8">{idx + 1}.</span>
                                                <input
                                                    type="text"
                                                    value={task}
                                                    onChange={(e) => {
                                                        const updated = [...editingWeek.practicalTasks];
                                                        updated[idx] = e.target.value;
                                                        setEditingWeek({ ...editingWeek, practicalTasks: updated });
                                                    }}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                                    placeholder="Enter practical task..."
                                                />
                                                <button
                                                    onClick={() => handleRemoveArrayItem('practicalTasks', idx)}
                                                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="➕ Add new practical task (Press Enter or click Add)"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddArrayItem('practicalTasks', e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                className="flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                    if (input && input.value.trim()) {
                                                        handleAddArrayItem('practicalTasks', input.value);
                                                        input.value = '';
                                                        input.focus();
                                                    }
                                                }}
                                                className="px-5 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium shadow-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Project */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                                    <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>🚀</span> Mini Project *
                                    </label>
                                    <textarea
                                        value={editingWeek.miniProject}
                                        onChange={(e) => setEditingWeek({ ...editingWeek, miniProject: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none bg-white resize-none"
                                        placeholder="Describe the mini project for this week in detail..."
                                    />
                                    <p className="text-xs text-gray-500 mt-2">Provide a clear description of what students will build this week</p>
                                </div>

                                {/* Resources */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-base font-bold text-gray-900 flex items-center gap-2">
                                            <span>🔗</span> Learning Resources
                                        </label>
                                        <button
                                            onClick={handleAddResource}
                                            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <span>+</span> Add Resource
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingWeek.resources || []).map((resource, idx) => (
                                            <div key={idx} className="p-4 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 transition-colors">
                                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                    <div className="md:col-span-2">
                                                        <label className="text-xs text-gray-600 mb-1 block">Type</label>
                                                        <select
                                                            value={resource.type}
                                                            onChange={(e) => handleUpdateResource(idx, 'type', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                                        >
                                                            <option value="gfg">📖 GeeksforGeeks</option>
                                                            <option value="youtube">▶️ YouTube</option>
                                                            <option value="documentation">📘 Documentation</option>
                                                            <option value="practice">💪 Practice</option>
                                                            <option value="article">📄 Article</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-4">
                                                        <label className="text-xs text-gray-600 mb-1 block">Title</label>
                                                        <input
                                                            type="text"
                                                            value={resource.title}
                                                            onChange={(e) => handleUpdateResource(idx, 'title', e.target.value)}
                                                            placeholder="Resource title..."
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                                        />
                                                    </div>
                                                    <div className="md:col-span-5">
                                                        <label className="text-xs text-gray-600 mb-1 block">URL</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="url"
                                                                value={resource.url}
                                                                onChange={(e) => handleUpdateResource(idx, 'url', e.target.value)}
                                                                placeholder="https://..."
                                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                                            />
                                                            <button
                                                                onClick={() => handleRemoveResource(idx)}
                                                                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                                                title="Remove resource"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-1"></div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!editingWeek.resources || editingWeek.resources.length === 0) && (
                                            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                                No resources added. Click "Add Resource" to add learning materials.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quiz Questions */}
                                <div className="bg-pink-50 border border-pink-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-base font-bold text-gray-900 flex items-center gap-2">
                                            <span>❓</span> Quiz Questions (Optional)
                                        </label>
                                        <button
                                            onClick={handleAddQuizQuestion}
                                            className="px-4 py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors shadow-sm flex items-center gap-2"
                                        >
                                            <span>+</span> Add Question
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {(editingWeek.quiz || []).map((question, qIdx) => (
                                            <div key={qIdx} className="p-5 bg-white border-2 border-pink-200 rounded-xl hover:border-pink-400 transition-colors">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-bold">
                                                            Q{qIdx + 1}
                                                        </span>
                                                        <span className="text-sm text-gray-500">Question {qIdx + 1}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveQuizQuestion(qIdx)}
                                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <div className="mb-4">
                                                    <label className="text-xs text-gray-600 mb-1 block font-semibold">Question Text *</label>
                                                    <textarea
                                                        value={question.question}
                                                        onChange={(e) => handleUpdateQuizQuestion(qIdx, 'question', e.target.value)}
                                                        placeholder="Enter the question text..."
                                                        rows={2}
                                                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-600 mb-2 block font-semibold">Options (Select correct answer) *</label>
                                                    <div className="space-y-2">
                                                        {question.options.map((option, optIdx) => (
                                                            <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                                                question.correctAnswer === optIdx
                                                                    ? 'bg-green-50 border-green-400 shadow-sm'
                                                                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                            }`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`correct-${qIdx}`}
                                                                    checked={question.correctAnswer === optIdx}
                                                                    onChange={() => handleUpdateQuizQuestion(qIdx, 'correctAnswer', optIdx)}
                                                                    className="w-5 h-5 text-pink-600 cursor-pointer"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                                                                    placeholder={`Option ${optIdx + 1}...`}
                                                                    className={`flex-1 px-3 py-2 border rounded-lg outline-none ${
                                                                        question.correctAnswer === optIdx
                                                                            ? 'border-green-400 bg-white focus:ring-2 focus:ring-green-500'
                                                                            : 'border-gray-300 bg-white focus:ring-2 focus:ring-pink-500'
                                                                    }`}
                                                                />
                                                                {question.correctAnswer === optIdx && (
                                                                    <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold flex items-center gap-1">
                                                                        <span>✓</span> Correct
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(!editingWeek.quiz || editingWeek.quiz.length === 0) && (
                                            <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                                <p className="mb-2">No quiz questions added yet.</p>
                                                <p>Click "Add Question" to create quiz questions for this week.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex gap-4 pt-6 border-t-2 border-gray-300 sticky bottom-0 bg-white pb-2">
                                    <button
                                        onClick={handleSaveWeek}
                                        className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Save Week & Continue
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingWeek(null);
                                            setIsAddingWeek(false);
                                        }}
                                        className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Weeks List */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                {currentRoadmap.categoryName} - Roadmap Weeks
                            </h3>
                            {currentRoadmap.weeks.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">No weeks added yet.</p>
                                    <button
                                        onClick={handleAddWeek}
                                        className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
                                    >
                                        Add First Week
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {currentRoadmap.weeks.map((week) => (
                                        <div key={week.weekNumber} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                                        Week {week.weekNumber}
                                                    </h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div>
                                                            <span className="font-semibold">Main Topics:</span>{' '}
                                                            {week.mainTopics.join(', ')}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Mini Project:</span>{' '}
                                                            {week.miniProject}
                                                        </div>
                                                        {week.resources && week.resources.length > 0 && (
                                                            <div>
                                                                <span className="font-semibold">Resources:</span>{' '}
                                                                {week.resources.length} resource(s)
                                                            </div>
                                                        )}
                                                        {week.quiz && week.quiz.length > 0 && (
                                                            <div>
                                                                <span className="font-semibold">Quiz Questions:</span>{' '}
                                                                {week.quiz.length} question(s)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditWeek(week)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors shadow-sm hover:shadow-md"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWeek(week.weekNumber)}
                                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors shadow-sm hover:shadow-md"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoadmapManagementPage;

