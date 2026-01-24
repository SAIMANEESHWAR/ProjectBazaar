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

interface PhaseTask {
    id: string;
    title: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    practiceLink?: string;
    note?: string;
    needsRevision?: boolean;
    helpfulLinks?: PlacementResource[];
}

interface PlacementPhase {
    id: string;
    year: string;
    months: string;
    title: string;
    description: string;
    colorClass: string;
    badgeClass: string;
    icon: string;
    relatedTopics: string[];
    tasks: PhaseTask[];
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

const defaultPlacementPhases: PlacementPhase[] = [
    {
        id: 'phase-1',
        year: "3rd Year",
        months: "Jan-Jun",
        title: "Learn DSA Fundamentals",
        description: "Master the basics of Data Structures and Algorithms",
        colorClass: "from-blue-400 to-blue-600",
        badgeClass: "bg-blue-100 text-blue-700",
        icon: "📚",
        relatedTopics: ["Data Structures & Algorithms"],
        tasks: [
            { id: 'task-1-1', title: "Complete basic array and string problems", description: "Solve 50+ problems on arrays and strings", difficulty: "Easy" },
            { id: 'task-1-2', title: "Learn time and space complexity", description: "Understand Big O notation and complexity analysis", difficulty: "Medium" },
            { id: 'task-1-3', title: "Master sorting and searching algorithms", description: "Implement and understand various sorting algorithms", difficulty: "Medium" },
            { id: 'task-1-4', title: "Practice on LeetCode/GeeksforGeeks", description: "Solve at least 100 problems", difficulty: "Easy" },
        ],
        resources: []
    },
    {
        id: 'phase-2',
        year: "3rd Year",
        months: "Jul-Dec",
        title: "Practice & Build Projects",
        description: "Practice 200+ problems and start building projects",
        colorClass: "from-green-400 to-green-600",
        badgeClass: "bg-green-100 text-green-700",
        icon: "💻",
        relatedTopics: ["Data Structures & Algorithms"],
        tasks: [
            { id: 'task-2-1', title: "Solve 200+ DSA problems", description: "Cover all major topics: arrays, strings, trees, graphs", difficulty: "Hard" },
            { id: 'task-2-2', title: "Build 2-3 portfolio projects", description: "Create projects showcasing your skills", difficulty: "Medium" },
            { id: 'task-2-3', title: "Participate in coding contests", description: "Join contests on CodeChef, HackerRank, etc.", difficulty: "Medium" },
            { id: 'task-2-4', title: "Review and optimize solutions", description: "Focus on optimizing time and space complexity", difficulty: "Hard" },
        ],
        resources: []
    },
    {
        id: 'phase-3',
        year: "4th Year",
        months: "Jan-Apr",
        title: "System Design & Mock Interviews",
        description: "Learn system design and practice mock interviews",
        colorClass: "from-orange-400 to-orange-600",
        badgeClass: "bg-orange-100 text-orange-700",
        icon: "🎯",
        relatedTopics: ["System Design", "Core CS Subjects", "Communication Skills"],
        tasks: [
            { id: 'task-3-1', title: "Learn system design fundamentals", description: "Study scalability, load balancing, databases", difficulty: "Medium" },
            { id: 'task-3-2', title: "Practice mock interviews", description: "Do at least 10 mock interviews", difficulty: "Easy" },
            { id: 'task-3-3', title: "Review core CS subjects", description: "OS, DBMS, Computer Networks basics", difficulty: "Medium" },
            { id: 'task-3-4', title: "Improve communication skills", description: "Practice explaining solutions clearly", difficulty: "Easy" },
        ],
        resources: []
    },
    {
        id: 'phase-4',
        year: "4th Year",
        months: "May-Aug",
        title: "Campus Placements Begin",
        description: "Final preparation and placement interviews",
        colorClass: "from-red-400 to-red-600",
        badgeClass: "bg-red-100 text-red-700",
        icon: "🚀",
        relatedTopics: ["Aptitude & Reasoning", "Communication Skills"],
        tasks: [
            { id: 'task-4-1', title: "Prepare resume and portfolio", description: "Update resume with projects and achievements", difficulty: "Easy" },
            { id: 'task-4-2', title: "Practice aptitude questions", description: "Solve reasoning and aptitude problems", difficulty: "Medium" },
            { id: 'task-4-3', title: "Attend placement drives", description: "Apply and attend campus placements", difficulty: "Easy" },
            { id: 'task-4-4', title: "Review and revise key concepts", description: "Quick revision of important topics", difficulty: "Easy" },
        ],
        resources: []
    },
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

const createEmptyPhase = (): PlacementPhase => ({
    id: `phase-${Date.now()}`,
    year: '',
    months: '',
    title: '',
    description: '',
    colorClass: 'from-gray-400 to-gray-600',
    badgeClass: 'bg-gray-100 text-gray-700',
    icon: '📋',
    relatedTopics: [],
    tasks: [],
    resources: [],
});

const createEmptyTask = (): PhaseTask => ({
    id: `task-${Date.now()}`,
    title: '',
    description: '',
    difficulty: 'Easy',
    practiceLink: '',
    note: '',
    needsRevision: false,
    helpfulLinks: [],
});

// ============================================
// MAIN COMPONENT
// ============================================

const PlacementPrepManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'topics' | 'phases'>('phases');
    const [topics, setTopics] = useState<PlacementTopic[]>([]);
    const [phases, setPhases] = useState<PlacementPhase[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

    // Topic management
    const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
    const [topicForm, setTopicForm] = useState<PlacementTopic>(createEmptyTopic());
    const [editingResourceIndex, setEditingResourceIndex] = useState<number | null>(null);
    const [resourceForm, setResourceForm] = useState<PlacementResource>(createEmptyResource());

    // Phase management
    const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
    const [phaseForm, setPhaseForm] = useState<PlacementPhase>(createEmptyPhase());
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskForm, setTaskForm] = useState<PhaseTask>(createEmptyTask());
    // const [editingPhaseResourceIndex, setEditingPhaseResourceIndex] = useState<string | null>(null);
    const [editingTaskLinkIndex, setEditingTaskLinkIndex] = useState<number | null>(null);
    const [taskLinkForm, setTaskLinkForm] = useState<PlacementResource>(createEmptyResource());
    const [isAddingTaskLink, setIsAddingTaskLink] = useState(false);

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

    // ================= PHASE API FUNCTIONS =================
    const fetchPhases = async () => {
        try {
            // Load from localStorage for now (can be replaced with API)
            const stored = localStorage.getItem('admin_placement_phases');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPhases(parsed);
                    return;
                }
            }
            // Initialize with default phases and sync resources from topics
            const initializedPhases = defaultPlacementPhases.map(phase => {
                const phaseResources: PlacementResource[] = [];
                phase.relatedTopics.forEach(topicName => {
                    const topic = topics.find(t => t.title === topicName);
                    if (topic && topic.resources) {
                        phaseResources.push(...topic.resources);
                    }
                });
                return { ...phase, resources: phaseResources };
            });
            setPhases(initializedPhases);
            localStorage.setItem('admin_placement_phases', JSON.stringify(initializedPhases));
        } catch (err: any) {
            console.error('Error loading phases:', err);
            setPhases(defaultPlacementPhases);
        }
    };

    const savePhases = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            // Save to localStorage (can be replaced with API)
            localStorage.setItem('admin_placement_phases', JSON.stringify(phases));

            setSuccess(`Successfully saved ${phases.length} phases!`);
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            console.error('Error saving phases:', err);
            setError(`Failed to save: ${err.message}`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setSaving(false);
        }
    };

    // Sync phase resources when topics change
    useEffect(() => {
        if (topics.length > 0 && phases.length > 0) {
            const updatedPhases = phases.map(phase => {
                const phaseResources: PlacementResource[] = [];
                phase.relatedTopics.forEach(topicName => {
                    const topic = topics.find(t => t.title === topicName);
                    if (topic && topic.resources) {
                        phaseResources.push(...topic.resources);
                    }
                });
                return { ...phase, resources: phaseResources };
            });
            setPhases(updatedPhases);
        }
    }, [topics]);

    // Load topics and phases on mount
    useEffect(() => {
        const loadData = async () => {
            await fetchTopics();
            await fetchPhases();
        };
        loadData();
    }, []);

    // ================= FORM HANDLERS =================
    // Note: handleAddTopic is handled inline in the form
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

    // ================= PHASE HANDLERS =================
    const handleAddPhase = () => {
        setEditingPhaseId(null);
        setPhaseForm(createEmptyPhase());
        setExpandedPhase(null);
    };

    const handleEditPhase = (phaseId: string) => {
        const phase = phases.find(p => p.id === phaseId);
        if (phase) {
            setEditingPhaseId(phaseId);
            setPhaseForm({ ...phase });
            setExpandedPhase(phaseId);
        }
    };

    const handleSavePhase = () => {
        if (!phaseForm.title.trim() || !phaseForm.year.trim() || !phaseForm.months.trim()) {
            alert('Please fill in required fields (Title, Year, Months)');
            return;
        }

        const updatedPhases = [...phases];
        if (editingPhaseId) {
            const index = updatedPhases.findIndex(p => p.id === editingPhaseId);
            if (index >= 0) {
                updatedPhases[index] = { ...phaseForm };
            }
        } else {
            updatedPhases.push({ ...phaseForm });
        }
        setPhases(updatedPhases);
        setEditingPhaseId(null);
        setPhaseForm(createEmptyPhase());
    };

    const handleDeletePhase = (phaseId: string) => {
        if (!confirm('Are you sure you want to delete this phase?')) {
            return;
        }
        setPhases(phases.filter(p => p.id !== phaseId));
        if (expandedPhase === phaseId) {
            setExpandedPhase(null);
        }
    };

    // ================= TASK HANDLERS =================
    const handleAddTask = (phaseId: string) => {
        setEditingTaskId(null);
        setTaskForm(createEmptyTask());
        setIsAddingTaskLink(false);
        setEditingTaskLinkIndex(null);
        setTaskLinkForm(createEmptyResource());
        const phase = phases.find(p => p.id === phaseId);
        if (phase) {
            setExpandedPhase(phaseId);
        }
    };

    const handleEditTask = (phaseId: string, taskId: string) => {
        const phase = phases.find(p => p.id === phaseId);
        if (phase) {
            const task = phase.tasks.find(t => t.id === taskId);
            if (task) {
                setEditingTaskId(taskId);
                setTaskForm({
                    ...task,
                    helpfulLinks: task.helpfulLinks || []
                });
                setExpandedPhase(phaseId);
                setIsAddingTaskLink(false);
                setEditingTaskLinkIndex(null);
                setTaskLinkForm(createEmptyResource());
            }
        }
    };

    const handleSaveTask = (phaseId: string) => {
        if (!taskForm.title.trim()) {
            alert('Please enter a task title');
            return;
        }

        const updatedPhases = [...phases];
        const phaseIndex = updatedPhases.findIndex(p => p.id === phaseId);
        if (phaseIndex >= 0) {
            const updatedTasks = [...updatedPhases[phaseIndex].tasks];
            if (editingTaskId) {
                const taskIndex = updatedTasks.findIndex(t => t.id === editingTaskId);
                if (taskIndex >= 0) {
                    updatedTasks[taskIndex] = { ...taskForm };
                }
            } else {
                updatedTasks.push({ ...taskForm });
            }
            updatedPhases[phaseIndex] = {
                ...updatedPhases[phaseIndex],
                tasks: updatedTasks
            };
            setPhases(updatedPhases);
            setEditingTaskId(null);
            setTaskForm(createEmptyTask());
        }
    };

    const handleDeleteTask = (phaseId: string, taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        const updatedPhases = [...phases];
        const phaseIndex = updatedPhases.findIndex(p => p.id === phaseId);
        if (phaseIndex >= 0) {
            updatedPhases[phaseIndex] = {
                ...updatedPhases[phaseIndex],
                tasks: updatedPhases[phaseIndex].tasks.filter(t => t.id !== taskId)
            };
            setPhases(updatedPhases);
        }
    };

    // ================= TASK HELPFUL LINKS HANDLERS =================
    const handleAddTaskLink = () => {
        setEditingTaskLinkIndex(null);
        setIsAddingTaskLink(true);
        setTaskLinkForm(createEmptyResource());
    };

    const handleEditTaskLink = (linkIndex: number) => {
        setEditingTaskLinkIndex(linkIndex);
        setIsAddingTaskLink(false);
        if (taskForm.helpfulLinks && taskForm.helpfulLinks[linkIndex]) {
            setTaskLinkForm({ ...taskForm.helpfulLinks[linkIndex] });
        }
    };

    const handleSaveTaskLink = () => {
        if (!taskLinkForm.name.trim() || !taskLinkForm.url.trim()) {
            alert('Please enter resource name and URL');
            return;
        }

        const updatedLinks = taskForm.helpfulLinks ? [...taskForm.helpfulLinks] : [];
        if (editingTaskLinkIndex !== null) {
            updatedLinks[editingTaskLinkIndex] = { ...taskLinkForm };
        } else {
            updatedLinks.push({ ...taskLinkForm });
        }
        setTaskForm({ ...taskForm, helpfulLinks: updatedLinks });
        setEditingTaskLinkIndex(null);
        setIsAddingTaskLink(false);
        setTaskLinkForm(createEmptyResource());
    };

    const handleDeleteTaskLink = (linkIndex: number) => {
        const updatedLinks = taskForm.helpfulLinks ? taskForm.helpfulLinks.filter((_, i) => i !== linkIndex) : [];
        setTaskForm({ ...taskForm, helpfulLinks: updatedLinks });
    };

    // ================= PHASE RESOURCE HANDLERS =================
    // Note: Phase resources are automatically synced from topics based on relatedTopics
    // These handlers are kept for future use if direct phase resource management is needed
    /*
    const handleAddPhaseResource = (phaseId: string) => {
        setEditingPhaseResourceIndex(phaseId);
        setResourceForm(createEmptyResource());
    };

    const handleSavePhaseResource = (phaseId: string) => {
        if (!resourceForm.name.trim() || !resourceForm.url.trim()) {
            alert('Please enter resource name and URL');
            return;
        }

        const updatedPhases = [...phases];
        const phaseIndex = updatedPhases.findIndex(p => p.id === phaseId);
        if (phaseIndex >= 0) {
            updatedPhases[phaseIndex] = {
                ...updatedPhases[phaseIndex],
                resources: [...updatedPhases[phaseIndex].resources, { ...resourceForm }]
            };
            setPhases(updatedPhases);
            setEditingPhaseResourceIndex(null);
            setResourceForm(createEmptyResource());
        }
    };

    const handleDeletePhaseResource = (phaseId: string, resourceIndex: number) => {
        const updatedPhases = [...phases];
        const phaseIndex = updatedPhases.findIndex(p => p.id === phaseId);
        if (phaseIndex >= 0) {
            updatedPhases[phaseIndex] = {
                ...updatedPhases[phaseIndex],
                resources: updatedPhases[phaseIndex].resources.filter((_, i) => i !== resourceIndex)
            };
            setPhases(updatedPhases);
        }
    };
    */

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
                    <p className="text-gray-600 mt-1">Manage phases, tasks, topics and resources</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            if (activeTab === 'topics') fetchTopics();
                            else fetchPhases();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            if (activeTab === 'topics') saveTopics();
                            else savePhases();
                        }}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => setActiveTab('phases')}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'phases'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    📅 Phases & Tasks
                </button>
                <button
                    onClick={() => setActiveTab('topics')}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'topics'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    📚 Topics & Resources
                </button>
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

            {/* PHASES TAB */}
            {activeTab === 'phases' && (
                <div className="space-y-6">
                    {/* Add Phase Button */}
                    {!editingPhaseId && (
                        <button
                            onClick={handleAddPhase}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            + Add New Phase
                        </button>
                    )}

                    {/* Phase Form */}
                    {(!editingPhaseId || phases.find(p => p.id === editingPhaseId)) && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {editingPhaseId ? 'Edit Phase' : 'Add New Phase'}
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                                        <input
                                            type="text"
                                            value={phaseForm.year}
                                            onChange={(e) => setPhaseForm({ ...phaseForm, year: e.target.value })}
                                            placeholder="e.g., 3rd Year"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Months *</label>
                                        <input
                                            type="text"
                                            value={phaseForm.months}
                                            onChange={(e) => setPhaseForm({ ...phaseForm, months: e.target.value })}
                                            placeholder="e.g., Jan-Jun"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <input
                                        type="text"
                                        value={phaseForm.title}
                                        onChange={(e) => setPhaseForm({ ...phaseForm, title: e.target.value })}
                                        placeholder="e.g., Learn DSA Fundamentals"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={phaseForm.description}
                                        onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                                        placeholder="Phase description..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon (emoji)</label>
                                        <input
                                            type="text"
                                            value={phaseForm.icon}
                                            onChange={(e) => setPhaseForm({ ...phaseForm, icon: e.target.value })}
                                            placeholder="📚"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Color Class</label>
                                        <select
                                            value={phaseForm.colorClass}
                                            onChange={(e) => setPhaseForm({ ...phaseForm, colorClass: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="from-blue-400 to-blue-600">Blue</option>
                                            <option value="from-green-400 to-green-600">Green</option>
                                            <option value="from-orange-400 to-orange-600">Orange</option>
                                            <option value="from-red-400 to-red-600">Red</option>
                                            <option value="from-purple-400 to-purple-600">Purple</option>
                                            <option value="from-gray-400 to-gray-600">Gray</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Related Topics (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={phaseForm.relatedTopics.join(', ')}
                                        onChange={(e) => setPhaseForm({ ...phaseForm, relatedTopics: e.target.value.split(',').map(t => t.trim()).filter(t => t) })}
                                        placeholder="Data Structures & Algorithms, System Design"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSavePhase}
                                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                                    >
                                        {editingPhaseId ? 'Update Phase' : 'Add Phase'}
                                    </button>
                                    {editingPhaseId && (
                                        <button
                                            onClick={() => {
                                                setEditingPhaseId(null);
                                                setPhaseForm(createEmptyPhase());
                                            }}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phases Timeline - Matching Buyer UI */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-xl">📅</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Preparation Timeline</h3>
                        </div>
                        <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-green-500 via-orange-500 to-red-500 hidden md:block"></div>

                            <div className="space-y-4">
                                {phases.map((phase, idx) => {
                                    const isExpanded = expandedPhase === phase.id;
                                    const isEditing = editingPhaseId === phase.id;

                                    return (
                                        <div key={phase.id} className="relative">
                                            <div className={`relative flex items-start gap-4 transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
                                                {/* Timeline Dot */}
                                                <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${phase.colorClass} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
                                                    {phase.icon}
                                                </div>

                                                {/* Content Card */}
                                                <div className={`flex-1 bg-gradient-to-br from-gray-50 to-white border-2 rounded-xl transition-all duration-300 ${isExpanded ? 'border-orange-300 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                                    }`}>
                                                    <div className="p-5">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{phase.year}</span>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${phase.badgeClass}`}>
                                                                        Phase {idx + 1}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-lg font-bold text-gray-900 mb-1">{phase.months}</h4>
                                                                <h5 className="text-base font-semibold text-gray-800 mb-1">{phase.title}</h5>
                                                                <p className="text-gray-600 text-sm leading-relaxed">{phase.description}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        if (isExpanded) setExpandedPhase(null);
                                                                        else {
                                                                            setExpandedPhase(phase.id);
                                                                            setEditingPhaseId(null);
                                                                        }
                                                                    }}
                                                                    className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded"
                                                                >
                                                                    {isExpanded ? 'Collapse' : 'Expand'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEditPhase(phase.id)}
                                                                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePhase(phase.id)}
                                                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content - Tasks Table */}
                                                    {isExpanded && !isEditing && (
                                                        <div className="px-5 pb-5 border-t border-gray-200 mt-4 pt-5">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <h6 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                                                    Tasks ({phase.tasks.length})
                                                                </h6>
                                                                <button
                                                                    onClick={() => handleAddTask(phase.id)}
                                                                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                                                                >
                                                                    + Add Task
                                                                </button>
                                                            </div>

                                                            {/* Task Form - Show when adding new task or editing existing */}
                                                            {expandedPhase === phase.id && !isEditing && (
                                                                <div className="mb-4">
                                                                    {(editingTaskId === null || phase.tasks.some(t => t.id === editingTaskId)) && (
                                                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                                                            <h6 className="text-sm font-semibold mb-3">
                                                                                {editingTaskId ? 'Edit Task' : 'Add New Task'}
                                                                            </h6>
                                                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                                                <div className="col-span-2">
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={taskForm.title}
                                                                                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                                                                        placeholder="Task title"
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-2">
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                                                                    <textarea
                                                                                        value={taskForm.description || ''}
                                                                                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                                                                        placeholder="Task description"
                                                                                        rows={2}
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                                                                                    <select
                                                                                        value={taskForm.difficulty || 'Easy'}
                                                                                        onChange={(e) => setTaskForm({ ...taskForm, difficulty: e.target.value as any })}
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                                                    >
                                                                                        <option value="Easy">Easy</option>
                                                                                        <option value="Medium">Medium</option>
                                                                                        <option value="Hard">Hard</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div>
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Practice Link</label>
                                                                                    <input
                                                                                        type="url"
                                                                                        value={taskForm.practiceLink || ''}
                                                                                        onChange={(e) => setTaskForm({ ...taskForm, practiceLink: e.target.value })}
                                                                                        placeholder="https://..."
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-2">
                                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={taskForm.note || ''}
                                                                                        onChange={(e) => setTaskForm({ ...taskForm, note: e.target.value })}
                                                                                        placeholder="Additional notes"
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                                                                                    />
                                                                                </div>
                                                                                <div className="col-span-2 flex items-center gap-2">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={taskForm.needsRevision || false}
                                                                                        onChange={(e) => setTaskForm({ ...taskForm, needsRevision: e.target.checked })}
                                                                                        className="w-4 h-4 text-orange-500 rounded"
                                                                                    />
                                                                                    <label className="text-xs text-gray-700">Needs Revision</label>
                                                                                </div>
                                                                            </div>

                                                                            {/* Helpful Links Section */}
                                                                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-3">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <label className="block text-xs font-medium text-gray-700">Helpful Links</label>
                                                                                    {editingTaskLinkIndex === null && !isAddingTaskLink && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={handleAddTaskLink}
                                                                                            className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded"
                                                                                        >
                                                                                            + Add Link
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                {/* Add/Edit Link Form */}
                                                                                {(editingTaskLinkIndex !== null || isAddingTaskLink) && (
                                                                                    <div className="bg-white border border-gray-200 rounded p-3 mb-2">
                                                                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                                                                            <div>
                                                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={taskLinkForm.name}
                                                                                                    onChange={(e) => setTaskLinkForm({ ...taskLinkForm, name: e.target.value })}
                                                                                                    placeholder="e.g., LeetCode"
                                                                                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-xs font-medium text-gray-700 mb-1">URL *</label>
                                                                                                <input
                                                                                                    type="url"
                                                                                                    value={taskLinkForm.url}
                                                                                                    onChange={(e) => setTaskLinkForm({ ...taskLinkForm, url: e.target.value })}
                                                                                                    placeholder="https://..."
                                                                                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                                                                                />
                                                                                            </div>
                                                                                            <div>
                                                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={taskLinkForm.type}
                                                                                                    onChange={(e) => setTaskLinkForm({ ...taskLinkForm, type: e.target.value })}
                                                                                                    placeholder="e.g., Practice"
                                                                                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex gap-2">
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={handleSaveTaskLink}
                                                                                                className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                                                                                            >
                                                                                                {editingTaskLinkIndex !== null ? 'Update' : 'Add'}
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    setEditingTaskLinkIndex(null);
                                                                                                    setIsAddingTaskLink(false);
                                                                                                    setTaskLinkForm(createEmptyResource());
                                                                                                }}
                                                                                                className="px-3 py-1 text-xs border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                                                                            >
                                                                                                Cancel
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Helpful Links List */}
                                                                                <div className="space-y-1">
                                                                                    {taskForm.helpfulLinks && taskForm.helpfulLinks.length > 0 ? (
                                                                                        taskForm.helpfulLinks.map((link, linkIndex) => (
                                                                                            <div key={linkIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                                                                                                <div className="flex-1">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="font-medium text-gray-900">{link.name}</span>
                                                                                                        {link.type && (
                                                                                                            <span className="text-gray-500">({link.type})</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <a
                                                                                                        href={link.url}
                                                                                                        target="_blank"
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="text-gray-500 hover:text-orange-600 break-all"
                                                                                                    >
                                                                                                        {link.url}
                                                                                                    </a>
                                                                                                </div>
                                                                                                <div className="flex gap-1 ml-2">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleEditTaskLink(linkIndex)}
                                                                                                        className="px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 rounded"
                                                                                                    >
                                                                                                        Edit
                                                                                                    </button>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleDeleteTaskLink(linkIndex)}
                                                                                                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                                                                                                    >
                                                                                                        Delete
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        ))
                                                                                    ) : (
                                                                                        <p className="text-xs text-gray-400 text-center py-2">No helpful links added yet</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => handleSaveTask(phase.id)}
                                                                                    className="px-4 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                                                                                >
                                                                                    {editingTaskId ? 'Update Task' : 'Add Task'}
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingTaskId(null);
                                                                                        setIsAddingTaskLink(false);
                                                                                        setEditingTaskLinkIndex(null);
                                                                                        setTaskLinkForm(createEmptyResource());
                                                                                        setTaskForm(createEmptyTask());
                                                                                    }}
                                                                                    className="px-4 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Tasks List - Matching Resources Format */}
                                                            <div className="space-y-2">
                                                                {phase.tasks.map((task) => {
                                                                    // Build task type string from available fields
                                                                    const taskTypeParts: string[] = [];
                                                                    if (task.difficulty) taskTypeParts.push(task.difficulty);
                                                                    if (task.practiceLink) taskTypeParts.push('Practice');
                                                                    if (task.needsRevision) taskTypeParts.push('Revision');
                                                                    const taskType = taskTypeParts.length > 0 ? `(${taskTypeParts.join(', ')})` : '';

                                                                    return (
                                                                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-medium text-gray-900">
                                                                                        {task.title}
                                                                                    </span>
                                                                                    {taskType && (
                                                                                        <span className="text-xs text-gray-500">{taskType}</span>
                                                                                    )}
                                                                                </div>
                                                                                {task.description && (
                                                                                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                                                                )}
                                                                                {task.practiceLink && (
                                                                                    <a
                                                                                        href={task.practiceLink}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-xs text-gray-500 hover:text-orange-600 break-all block mt-1"
                                                                                    >
                                                                                        {task.practiceLink}
                                                                                    </a>
                                                                                )}
                                                                                {task.note && (
                                                                                    <p className="text-xs text-gray-400 mt-1 italic">Note: {task.note}</p>
                                                                                )}
                                                                                {/* Helpful Links from Task */}
                                                                                {task.helpfulLinks && task.helpfulLinks.length > 0 && (
                                                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                                                        {task.helpfulLinks.map((link, idx) => {
                                                                                            const typeLower = link.type.toLowerCase();
                                                                                            const isVideo = typeLower.includes('video') || typeLower.includes('youtube');
                                                                                            const isPractice = typeLower.includes('practice') || typeLower.includes('leetcode');
                                                                                            const isRoadmap = typeLower.includes('roadmap');
                                                                                            const domain = link.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

                                                                                            return (
                                                                                                <a
                                                                                                    key={idx}
                                                                                                    href={link.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                                                                    title={link.name}
                                                                                                >
                                                                                                    {isVideo ? (
                                                                                                        <span className="text-red-500">▶️</span>
                                                                                                    ) : isPractice ? (
                                                                                                        <span className="text-orange-500">💪</span>
                                                                                                    ) : isRoadmap ? (
                                                                                                        <span className="text-blue-500">🗺️</span>
                                                                                                    ) : (
                                                                                                        <span className="text-gray-600">📚</span>
                                                                                                    )}
                                                                                                    <span>{domain}</span>
                                                                                                </a>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex gap-2 ml-4">
                                                                                <button
                                                                                    onClick={() => handleEditTask(phase.id, task.id)}
                                                                                    className="px-3 py-1 text-sm text-orange-600 hover:bg-orange-50 rounded"
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteTask(phase.id, task.id)}
                                                                                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {phase.tasks.length === 0 && (
                                                                    <p className="text-sm text-gray-500 text-center py-4">No tasks added yet. Click "Add Task" to get started.</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {phases.length === 0 && (
                                    <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                                        <p className="text-gray-500">No phases added yet. Click "Add New Phase" to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TOPICS TAB */}
            {activeTab === 'topics' && (
                <div className="space-y-6">
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
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${topic.importance === 'Critical' ? 'bg-red-100 text-red-700' :
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
            )}
        </div>
    );
};

export default PlacementPrepManagementPage;

