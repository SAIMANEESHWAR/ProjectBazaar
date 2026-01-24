import React, { useState, useEffect } from 'react';

// ============================================
// TYPES & INTERFACES
// ============================================

interface PlacementResource {
    name: string;
    url: string;
    type: string;
}

interface PlacementTopic {
    id?: string;
    title: string;
    importance: 'Critical' | 'Important' | 'Good to Know';
    timeNeeded: string;
    resources: PlacementResource[];
}

// ============================================
// API CONFIGURATION
// ============================================

const API_ENDPOINT = 'https://YOUR_API_GATEWAY_URL.execute-api.ap-south-2.amazonaws.com/default/placement_prep_handler'; // Replace with your API Gateway URL

// ============================================
// DEFAULT DATA (Fallback)
// ============================================

const defaultPlacementTopics: PlacementTopic[] = [
    {
        title: "Data Structures & Algorithms",
        importance: "Critical",
        timeNeeded: "3-4 months",
        resources: [
            { name: "LeetCode", url: "https://leetcode.com", type: "Practice" },
            { name: "Striver's A2Z DSA Sheet", url: "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", type: "Roadmap" },
            { name: "NeetCode", url: "https://neetcode.io", type: "Video + Practice" },
            { name: "GeeksforGeeks", url: "https://www.geeksforgeeks.org", type: "Theory + Practice" }
        ]
    },
    {
        title: "System Design",
        importance: "Important",
        timeNeeded: "1-2 months",
        resources: [
            { name: "System Design Primer", url: "https://github.com/donnemartin/system-design-primer", type: "GitHub" },
            { name: "Gaurav Sen YouTube", url: "https://www.youtube.com/@gaborsen", type: "Video" },
            { name: "ByteByteGo", url: "https://bytebytego.com", type: "Newsletter" }
        ]
    },
    {
        title: "Core CS Subjects",
        importance: "Important",
        timeNeeded: "1-2 months",
        resources: [
            { name: "OS - Gate Smashers", url: "https://www.youtube.com/@GateSmashers", type: "Video" },
            { name: "DBMS - Knowledge Gate", url: "https://www.youtube.com/@TheKnowledgeGate", type: "Video" },
            { name: "CN - Neso Academy", url: "https://www.youtube.com/@nesoacademy", type: "Video" }
        ]
    },
    {
        title: "Aptitude & Reasoning",
        importance: "Good to Know",
        timeNeeded: "2-3 weeks",
        resources: [
            { name: "IndiaBix", url: "https://www.indiabix.com", type: "Practice" },
            { name: "PrepInsta", url: "https://prepinsta.com", type: "Practice" }
        ]
    },
    {
        title: "Communication Skills",
        importance: "Important",
        timeNeeded: "Ongoing",
        resources: [
            { name: "Mock Interviews - Pramp", url: "https://www.pramp.com", type: "Practice" },
            { name: "InterviewBit", url: "https://www.interviewbit.com", type: "Practice" }
        ]
    }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

const createEmptyTopic = (): PlacementTopic => ({
    title: '',
    importance: 'Important',
    timeNeeded: '',
    resources: [],
});

const createEmptyResource = (): PlacementResource => ({
    name: '',
    url: '',
    type: '',
});

// ============================================
// MAIN COMPONENT
// ============================================

const PlacementPrepManagementPage: React.FC = () => {
    const [topics, setTopics] = useState<PlacementTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
    const [topicForm, setTopicForm] = useState<PlacementTopic>(createEmptyTopic());
    const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
    const [resourceForm, setResourceForm] = useState<PlacementResource>(createEmptyResource());

    // ================= API FUNCTIONS =================
    const fetchTopics = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'list',
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch topics: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success && data.topics) {
                setTopics(data.topics);
            } else {
                setTopics(defaultPlacementTopics);
            }
        } catch (err: any) {
            console.error('Error fetching topics:', err);
            setError(`Failed to load topics: ${err.message}`);
            setTopics(defaultPlacementTopics);
        } finally {
            setLoading(false);
        }
    };

    const saveTopics = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'put',
                    topics: topics,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setSuccess(`Successfully saved ${data.count || topics.length} topics!`);
                setTimeout(() => setSuccess(null), 5000);
            } else {
                throw new Error(data.message || 'Save failed');
            }
        } catch (err: any) {
            console.error('Error saving topics:', err);
            setError(`Failed to save: ${err.message}`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setSaving(false);
        }
    };

    const deleteTopic = async (topicId: string) => {
        if (!confirm('Are you sure you want to delete this topic?')) {
            return;
        }

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                    id: topicId,
                }),
            });

            if (response.ok) {
                await fetchTopics();
                setSuccess('Topic deleted successfully!');
                setTimeout(() => setSuccess(null), 5000);
            }
        } catch (err: any) {
            setError(`Failed to delete: ${err.message}`);
            setTimeout(() => setError(null), 5000);
        }
    };

    // Load topics on mount
    useEffect(() => {
        fetchTopics();
    }, []);

    // ================= FORM HANDLERS =================
    const handleEditTopic = (index: number) => {
        setEditingTopicIndex(index);
        setTopicForm({ ...topics[index] });
    };

    const handleSaveTopic = () => {
        if (!topicForm.title.trim()) {
            alert('Please enter a topic title');
            return;
        }

        const updatedTopics = [...topics];
        if (editingTopicIndex !== null) {
            updatedTopics[editingTopicIndex] = { ...topicForm };
        } else {
            updatedTopics.push({ ...topicForm });
        }
        setTopics(updatedTopics);
        setEditingTopicIndex(null);
        setTopicForm(createEmptyTopic());
    };

    const handleCancelEdit = () => {
        setEditingTopicIndex(null);
        setTopicForm(createEmptyTopic());
    };

    const handleAddResource = (topicIndex: number) => {
        setEditingResourceIndex(topicIndex);
        setResourceForm(createEmptyResource());
    };

    const handleEditResource = (topicIndex: number, resourceIndex: number) => {
        setEditingResourceIndex(topicIndex);
        setResourceForm({ ...topics[topicIndex].resources[resourceIndex] });
    };

    const handleSaveResource = (topicIndex: number, resourceIndex: number | null) => {
        if (!resourceForm.name.trim() || !resourceForm.url.trim()) {
            alert('Please enter resource name and URL');
            return;
        }

        const updatedTopics = [...topics];
        const resources = [...updatedTopics[topicIndex].resources];
        
        if (resourceIndex !== null) {
            resources[resourceIndex] = { ...resourceForm };
        } else {
            resources.push({ ...resourceForm });
        }
        
        updatedTopics[topicIndex].resources = resources;
        setTopics(updatedTopics);
        setEditingResourceIndex(null);
        setResourceForm(createEmptyResource());
    };

    const handleDeleteResource = (topicIndex: number, resourceIndex: number) => {
        const updatedTopics = [...topics];
        updatedTopics[topicIndex].resources = updatedTopics[topicIndex].resources.filter(
            (_, i) => i !== resourceIndex
        );
        setTopics(updatedTopics);
    };

    const handleDeleteTopic = (index: number) => {
        if (!confirm('Are you sure you want to delete this topic?')) {
            return;
        }
        const updatedTopics = topics.filter((_, i) => i !== index);
        setTopics(updatedTopics);
    };

    // ================= RENDER =================
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading placement topics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Placement Preparation Management</h2>
                    <p className="text-gray-600 mt-1">Manage placement preparation topics and resources</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchTopics}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={saveTopics}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Add Topic Form */}
            {editingTopicIndex === null && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingTopicIndex !== null ? 'Edit Topic' : 'Add New Topic'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Topic Title *
                            </label>
                            <input
                                type="text"
                                value={topicForm.title}
                                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                                placeholder="e.g., Data Structures & Algorithms"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Importance *
                                </label>
                                <select
                                    value={topicForm.importance}
                                    onChange={(e) => setTopicForm({ ...topicForm, importance: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="Critical">Critical</option>
                                    <option value="Important">Important</option>
                                    <option value="Good to Know">Good to Know</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time Needed
                                </label>
                                <input
                                    type="text"
                                    value={topicForm.timeNeeded}
                                    onChange={(e) => setTopicForm({ ...topicForm, timeNeeded: e.target.value })}
                                    placeholder="e.g., 3-4 months"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveTopic}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                            >
                                {editingTopicIndex !== null ? 'Update Topic' : 'Add Topic'}
                            </button>
                            {editingTopicIndex !== null && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Topics List */}
            <div className="space-y-4">
                {topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="bg-white border border-gray-200 rounded-lg p-6">
                        {editingTopicIndex === topicIndex ? (
                            // Edit Topic Form
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Topic Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={topicForm.title}
                                        onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Importance *
                                        </label>
                                        <select
                                            value={topicForm.importance}
                                            onChange={(e) => setTopicForm({ ...topicForm, importance: e.target.value as any })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        >
                                            <option value="Critical">Critical</option>
                                            <option value="Important">Important</option>
                                            <option value="Good to Know">Good to Know</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Time Needed
                                        </label>
                                        <input
                                            type="text"
                                            value={topicForm.timeNeeded}
                                            onChange={(e) => setTopicForm({ ...topicForm, timeNeeded: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSaveTopic}
                                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Topic Display
                            <>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                topic.importance === 'Critical' ? 'bg-red-100 text-red-700' :
                                                topic.importance === 'Important' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                                {topic.importance}
                                            </span>
                                            {topic.timeNeeded && (
                                                <span className="text-sm text-gray-500">⏱️ {topic.timeNeeded}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditTopic(topicIndex)}
                                            className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => topic.id ? deleteTopic(topic.id) : handleDeleteTopic(topicIndex)}
                                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Resources Section */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-gray-700">Resources</h4>
                                        {editingResourceIndex !== topicIndex && (
                                            <button
                                                onClick={() => handleAddResource(topicIndex)}
                                                className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded"
                                            >
                                                + Add Resource
                                            </button>
                                        )}
                                    </div>

                                    {/* Add/Edit Resource Form */}
                                    {editingResourceIndex === topicIndex && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                                            <div className="grid grid-cols-3 gap-3 mb-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Resource Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={resourceForm.name}
                                                        onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                                                        placeholder="e.g., LeetCode"
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        URL *
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={resourceForm.url}
                                                        onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                                                        placeholder="https://..."
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Type
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={resourceForm.type}
                                                        onChange={(e) => setResourceForm({ ...resourceForm, type: e.target.value })}
                                                        placeholder="e.g., Practice, Video"
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const resourceIndex = topic.resources.findIndex(
                                                            (r) => r.name === resourceForm.name && r.url === resourceForm.url
                                                        );
                                                        handleSaveResource(topicIndex, resourceIndex >= 0 ? resourceIndex : null);
                                                    }}
                                                    className="px-4 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                                                >
                                                    Save Resource
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingResourceIndex(null);
                                                        setResourceForm(createEmptyResource());
                                                    }}
                                                    className="px-4 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Resources List */}
                                    <div className="space-y-2">
                                        {topic.resources.map((resource, resourceIndex) => (
                                            <div key={resourceIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-gray-900 hover:text-orange-600"
                                                        >
                                                            {resource.name}
                                                        </a>
                                                        {resource.type && (
                                                            <span className="text-xs text-gray-500">({resource.type})</span>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-gray-500 hover:text-orange-600 break-all"
                                                    >
                                                        {resource.url}
                                                    </a>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditResource(topicIndex, resourceIndex)}
                                                        className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteResource(topicIndex, resourceIndex)}
                                                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {topic.resources.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">No resources added yet</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {topics.length === 0 && (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                        <p className="text-gray-500">No topics added yet. Click "Add New Topic" to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlacementPrepManagementPage;

