import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';

// Icons
const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
);

const PlacementIcon = () => (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

// Interfaces
interface WeeklyResource {
    name: string;
    url: string;
    type: string;
}

interface PhaseTask {
    id: string;
    title: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    practiceLink?: string;
    note?: string;
    needsRevision?: boolean;
    helpfulLinks?: WeeklyResource[];
    completed: boolean;
}

export interface PlacementPhase {
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
    resources: WeeklyResource[];
}

interface PlacementPrepSectionProps {
    phases: PlacementPhase[];
}

// Progress tracking key
const PLACEMENT_PROGRESS_KEY = 'placement_prep_progress';
const USER_PROGRESS_API_ENDPOINT = 'https://5xg2r5rgol.execute-api.ap-south-2.amazonaws.com/default/PlacementPrep'; // Reusing existing or need a new one?
// Actually I should probably use a dedicated endpoint or the same one with a different action.
// The user asked for a new lambda code, so I'll assume they will deploy it to a new URL or I'll use a placeholder.
const USER_SYNC_API_ENDPOINT = 'https://5xg2r5rgol.execute-api.ap-south-2.amazonaws.com/default/UserPlacementProgress'; // Placeholder URL for the new Lambda

interface PhaseProgress {
    phaseId: string;
    tasks: PhaseTask[];
}

interface PlacementProgress {
    phases: Record<string, PhaseProgress>;
    lastUpdated: string;
}

const PlacementPrepSection: React.FC<PlacementPrepSectionProps> = ({ phases }) => {
    const { userId, isLoggedIn } = useAuth();
    const safePhases = phases || [];
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState<PlacementProgress>(() => {
        const stored = localStorage.getItem(PLACEMENT_PROGRESS_KEY);
        return stored ? JSON.parse(stored) : { phases: {}, lastUpdated: new Date().toISOString() };
    });

    // Fetch progress from backend on mount if logged in
    useEffect(() => {
        const fetchRemoteProgress = async () => {
            if (!isLoggedIn || !userId) return;

            setIsSyncing(true);
            try {
                const response = await fetch(USER_SYNC_API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_progress', userId })
                });

                const result = await response.json();
                if (result.success && result.data) {
                    const remoteProgress = result.data;
                    setProgress(prev => {
                        const remoteTime = new Date(remoteProgress.lastUpdated || 0).getTime();
                        const localTime = new Date(prev.lastUpdated || 0).getTime();

                        if (remoteTime > localTime) {
                            return remoteProgress;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.error('Failed to fetch remote progress:', error);
            } finally {
                setIsSyncing(false);
            }
        };

        fetchRemoteProgress();
    }, [isLoggedIn, userId]);

    // Initialize/Sync progress with incoming phases
    useEffect(() => {
        if (safePhases.length === 0) return;

        setProgress(prev => {
            const updated = { ...prev };
            let hasChanges = false;

            safePhases.forEach(phase => {
                if (!updated.phases[phase.id]) {
                    hasChanges = true;
                    updated.phases[phase.id] = {
                        phaseId: phase.id,
                        tasks: (phase.tasks || []).map(task => ({
                            ...task,
                            completed: false
                        }))
                    };
                } else {
                    const storedTasks = updated.phases[phase.id].tasks || [];
                    const incomingTasks = phase.tasks || [];

                    if (storedTasks.length !== incomingTasks.length) {
                        hasChanges = true;
                        const mergedTasks = incomingTasks.map(inTask => {
                            const existing = storedTasks.find(st => st.id === inTask.id);
                            return {
                                ...inTask,
                                completed: existing ? existing.completed : false
                            };
                        });
                        updated.phases[phase.id].tasks = mergedTasks;
                    }
                }
            });

            if (hasChanges) {
                updated.lastUpdated = new Date().toISOString();
                localStorage.setItem(PLACEMENT_PROGRESS_KEY, JSON.stringify(updated));
                return updated;
            }
            return prev;
        });
    }, [safePhases]);

    // Save progress to localStorage and sync with backend
    useEffect(() => {
        localStorage.setItem(PLACEMENT_PROGRESS_KEY, JSON.stringify(progress));

        // Sync with backend if logged in
        if (isLoggedIn && userId) {
            const syncWithBackend = async () => {
                setIsSyncing(true);
                try {
                    await fetch(USER_SYNC_API_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'update_progress',
                            userId,
                            progress
                        })
                    });
                } catch (error) {
                    console.error('Failed to sync progress with backend:', error);
                } finally {
                    setIsSyncing(false);
                }
            };

            const timer = setTimeout(syncWithBackend, 1000);
            return () => clearTimeout(timer);
        }
    }, [progress, isLoggedIn, userId]);

    // Toggle task completion
    const toggleTask = (phaseId: string, taskId: string) => {
        setProgress(prev => {
            const updated = {
                ...prev,
                phases: { ...prev.phases },
                lastUpdated: new Date().toISOString()
            };

            if (updated.phases[phaseId]) {
                updated.phases[phaseId] = {
                    ...updated.phases[phaseId],
                    tasks: updated.phases[phaseId].tasks.map(task =>
                        task.id === taskId ? { ...task, completed: !task.completed } : task
                    )
                };
            }

            return updated;
        });
    };

    // Calculate progress for a phase
    const getPhaseProgress = (phaseId: string): number => {
        const phase = progress.phases[phaseId];
        if (!phase || !phase.tasks || phase.tasks.length === 0) return 0;
        const completed = phase.tasks.filter(t => t.completed).length;
        return Math.round((completed / phase.tasks.length) * 100);
    };

    // Calculate total progress - memoized
    const totalProgress = useMemo(() => {
        let totalTasks = 0;
        let completedTasks = 0;

        safePhases.forEach(phase => {
            const phaseData = progress.phases[phase.id];
            if (phaseData && phaseData.tasks) {
                totalTasks += phaseData.tasks.length;
                completedTasks += phaseData.tasks.filter(t => t.completed).length;
            } else if (phase.tasks) {
                totalTasks += phase.tasks.length;
            }
        });

        return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }, [progress, safePhases]);

    // Get analytics - memoized
    const analytics = useMemo(() => {
        const totalTasks = safePhases.reduce((sum, phase) => {
            return sum + (phase.tasks ? phase.tasks.length : 0);
        }, 0);

        const completedTasks = safePhases.reduce((sum, phase) => {
            const phaseData = progress.phases[phase.id];
            return sum + (phaseData && phaseData.tasks ? phaseData.tasks.filter(t => t.completed).length : 0);
        }, 0);

        const phasesCompleted = safePhases.filter(phase => {
            const phaseData = progress.phases[phase.id];
            if (!phase.tasks || phase.tasks.length === 0) return false;
            if (!phaseData || !phaseData.tasks) return false;

            return phase.tasks.every(t => {
                const progTask = phaseData.tasks.find(pt => pt.id === t.id);
                return progTask?.completed;
            });
        }).length;

        return {
            totalTasks,
            completedTasks,
            remainingTasks: totalTasks - completedTasks,
            phasesCompleted,
            totalPhases: safePhases.length,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        };
    }, [progress, safePhases]);

    return (
        <div className="space-y-8">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-500/20">
                    <div className="text-3xl font-bold mb-1">{totalProgress}%</div>
                    <div className="text-sm opacity-90">Total Progress</div>
                    <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/90 rounded-full transition-all duration-500" style={{ width: `${totalProgress}%` }}></div>
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative">
                    {isSyncing && (
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-gray-400 font-medium">Syncing</span>
                        </div>
                    )}
                    <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.completedTasks}/{analytics.totalTasks}</div>
                    <div className="text-sm text-gray-500">Tasks Completed</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.phasesCompleted}/{analytics.totalPhases}</div>
                    <div className="text-sm text-gray-500">Phases Completed</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="text-3xl font-bold text-gray-900 mb-1">{analytics.remainingTasks}</div>
                    <div className="text-sm text-gray-500">Tasks Remaining</div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-green-500 via-orange-500 to-red-500 hidden md:block"></div>

                <div className="space-y-6">
                    {safePhases.map((phase, idx) => {
                        const isExpanded = expandedPhase === phase.id;
                        const phaseProgress = getPhaseProgress(phase.id);
                        const isCompleted = phaseProgress === 100;

                        return (
                            <div key={phase.id} className="relative">
                                <div className={`relative flex items-start gap-4 transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
                                    {/* Timeline Dot */}
                                    <div className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${phase.colorClass} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 transition-transform ${isExpanded ? 'scale-110' : 'hover:scale-105'} cursor-pointer`}
                                        onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                                    >
                                        {phase.icon}
                                        {isCompleted && (
                                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs border-2 border-white">
                                                ✓
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`flex-1 bg-white border rounded-xl transition-all duration-300 overflow-hidden ${isExpanded ? 'border-orange-300 shadow-xl ring-2 ring-orange-100' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                        }`}>
                                        <div
                                            className="p-5 cursor-pointer"
                                            onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{phase.year}</span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${phase.badgeClass}`}>
                                                            {phase.months}
                                                        </span>
                                                        {phaseProgress > 0 && (
                                                            <span className="text-xs font-medium text-green-600">
                                                                {phaseProgress}% Complete
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{phase.title}</h3>
                                                    <p className="text-gray-600 text-sm leading-relaxed">{phase.description}</p>
                                                </div>
                                                <div className="ml-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {isExpanded ? '−' : '+'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar Mini */}
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${phase.colorClass}`}
                                                    style={{ width: `${phaseProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0'
                                            }`}>
                                            <div className="p-5 bg-gray-50/50 space-y-6">
                                                {/* Tasks */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                        <span>📋</span> Action Items
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {phase.tasks.map((task) => {
                                                            const isTaskCompleted = progress.phases[phase.id]?.tasks.find(t => t.id === task.id)?.completed || false;
                                                            return (
                                                                <div
                                                                    key={task.id}
                                                                    onClick={() => toggleTask(phase.id, task.id)}
                                                                    className={`group flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isTaskCompleted
                                                                        ? 'bg-green-50 border-green-200'
                                                                        : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                                                                        }`}
                                                                >
                                                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isTaskCompleted
                                                                        ? 'bg-green-500 border-green-500 text-white'
                                                                        : 'border-gray-300 group-hover:border-orange-400'
                                                                        }`}>
                                                                        {isTaskCompleted && <CheckIcon />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h5 className={`text-sm font-medium transition-colors ${isTaskCompleted ? 'text-green-800 line-through opacity-75' : 'text-gray-900'
                                                                            }`}>
                                                                            {task.title}
                                                                        </h5>
                                                                        {task.description && (
                                                                            <p className={`text-xs mt-0.5 ${isTaskCompleted ? 'text-green-600 opacity-75' : 'text-gray-500'
                                                                                }`}>
                                                                                {task.description}
                                                                            </p>
                                                                        )}
                                                                        {/* Helpful Links per task */}
                                                                        {task.helpfulLinks && task.helpfulLinks.length > 0 && (
                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                {task.helpfulLinks.map((link, lIdx) => (
                                                                                    <a
                                                                                        key={lIdx}
                                                                                        href={link.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors flex items-center gap-1"
                                                                                    >
                                                                                        🔗 {link.name}
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {task.difficulty && (
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${task.difficulty === 'Hard' ? 'bg-red-100 text-red-600' :
                                                                            task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                                                                'bg-green-100 text-green-600'
                                                                            }`}>
                                                                            {task.difficulty}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Resources - Now coming from Phase level resources */}
                                                {phase.resources && phase.resources.length > 0 && (
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                            <span>📚</span> Learning Resources
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {phase.resources.map((resource, rIdx) => (
                                                                <a
                                                                    key={rIdx}
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
                                                                >
                                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                                                                        {resource.type === 'Video' ? '▶️' : resource.type === 'Practice' ? '💻' : '📄'}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                                            {resource.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{resource.type}</div>
                                                                    </div>
                                                                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors">↗</div>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlacementPrepSection;
