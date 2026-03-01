import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';

// Icons
const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
const USER_SYNC_API_ENDPOINT = 'https://t1vy5sinc2.execute-api.ap-south-2.amazonaws.com/default/User_placement_progress';

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
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0.3); }
                    50% { opacity: 1; transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                @keyframes progressBar {
                    from { width: 0%; }
                }
                @keyframes timelineFlow {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 0% 100%; }
                }
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
                    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
                }
                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    background-size: 1000px 100%;
                    animation: shimmer 3s infinite;
                }
                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out forwards;
                }
                .animate-slideInLeft {
                    animation: slideInLeft 0.6s ease-out forwards;
                }
                .animate-slideInRight {
                    animation: slideInRight 0.6s ease-out forwards;
                    opacity: 0;
                }
                .animate-slideInUp {
                    animation: slideInUp 0.6s ease-out forwards;
                    opacity: 0;
                }
                .animate-bounceIn {
                    animation: bounceIn 0.8s ease-out forwards;
                }
                .animate-progressBar {
                    animation: progressBar 1.5s ease-out forwards;
                }
                .animate-timelineFlow {
                    background-size: 100% 200%;
                    animation: timelineFlow 3s ease-in-out infinite;
                }
                .animate-iconPulse {
                    animation: iconPulse 2s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
                .animate-countUp {
                    animation: fadeIn 0.8s ease-out forwards;
                }
            `}</style>
            <div className="w-full space-y-10 py-6 animate-fadeIn">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/30 relative overflow-hidden animate-slideInLeft hover:scale-105 transition-transform duration-300 animate-glow">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute inset-0 animate-shimmer"></div>
                    <div className="relative z-10">
                        <div className="text-4xl font-black mb-2 animate-countUp">{totalProgress}%</div>
                        <div className="text-sm font-medium opacity-90 mb-3">Total Progress</div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-lg animate-progressBar" style={{ width: `${totalProgress}%` }}></div>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 relative group animate-slideInUp" style={{ animationDelay: '0.1s' }}>
                    {isSyncing && (
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 animate-fadeIn">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-gray-500 font-medium">Syncing</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 mb-1">{analytics.completedTasks}/{analytics.totalTasks}</div>
                    <div className="text-sm font-medium text-gray-600">Tasks Completed</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group animate-slideInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 mb-1">{analytics.phasesCompleted}/{analytics.totalPhases}</div>
                    <div className="text-sm font-medium text-gray-600">Phases Completed</div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:scale-105 transition-all duration-300 group animate-slideInUp" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 mb-1">{analytics.remainingTasks}</div>
                    <div className="text-sm font-medium text-gray-600">Tasks Remaining</div>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative">
                <div className="absolute left-10 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-green-400 via-orange-400 to-red-400 rounded-full hidden md:block shadow-lg animate-timelineFlow"></div>

                <div className="space-y-8">
                    {safePhases.map((phase, idx) => {
                        const isExpanded = expandedPhase === phase.id;
                        const phaseProgress = getPhaseProgress(phase.id);
                        const isCompleted = phaseProgress === 100;

                        return (
                            <div key={phase.id} className="relative animate-slideInRight" style={{ animationDelay: `${idx * 0.15}s` }}>
                                <div className={`relative flex items-start gap-6 transition-all duration-500 ${isExpanded ? 'mb-6' : ''}`}>
                                    {/* Timeline Dot */}
                                    <div className={`relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br ${phase.colorClass} flex items-center justify-center text-3xl shadow-xl flex-shrink-0 transition-all duration-500 ${isExpanded ? 'scale-110 ring-4 ring-orange-200 animate-pulse shadow-2xl' : 'hover:scale-110 hover:shadow-2xl hover:rotate-3 hover:ring-2 hover:ring-white/50'} cursor-pointer border-4 border-white animate-bounceIn`}
                                        onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                                    >
                                        <div className="animate-iconPulse">{phase.icon}</div>
                                        {isCompleted && (
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full flex items-center justify-center text-sm border-4 border-white shadow-lg animate-pulse animate-spin-slow">
                                                <CheckIcon />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`flex-1 bg-white rounded-2xl transition-all duration-500 overflow-hidden ${isExpanded ? 'shadow-2xl ring-4 ring-orange-100 border-2 border-orange-300 scale-[1.02]' : 'shadow-lg border border-gray-200 hover:shadow-xl hover:border-orange-200 hover:scale-[1.01]'
                                        }`}>
                                        <div
                                            className="p-6 cursor-pointer bg-gradient-to-br from-white to-gray-50/50 transition-all duration-300"
                                            onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">{phase.year}</span>
                                                        <span className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm ${phase.badgeClass}`}>
                                                            {phase.months}
                                                        </span>
                                                        {phaseProgress > 0 && (
                                                            <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                                                {phaseProgress}% Complete
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-2xl font-black text-gray-900 mb-2">{phase.title}</h3>
                                                    <p className="text-gray-600 text-base leading-relaxed">{phase.description}</p>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 text-lg font-bold ${isExpanded ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg rotate-180' : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'}`}>
                                                        {isExpanded ? '−' : '+'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar Mini */}
                                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${phase.colorClass} shadow-sm`}
                                                    style={{ width: `${phaseProgress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Expanded Content */}
                                        <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100 border-t-2 border-gray-200' : 'max-h-0 opacity-0'
                                            }`}>
                                            <div className={`p-6 bg-gradient-to-br from-gray-50 to-white space-y-8 transition-all duration-500 ${isExpanded ? 'animate-fadeIn' : ''}`}>
                                                {/* Tasks */}
                                                <div>
                                                    <h4 className="text-base font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                        <span className="text-xl animate-iconPulse">📋</span> Action Items
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {phase.tasks.map((task, taskIdx) => {
                                                            const isTaskCompleted = progress.phases[phase.id]?.tasks.find(t => t.id === task.id)?.completed || false;
                                                            return (
                                                                <div
                                                                    key={task.id}
                                                                    onClick={() => toggleTask(phase.id, task.id)}
                                                                    className={`group flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${isTaskCompleted
                                                                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md'
                                                                        : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-lg'
                                                                        }`}
                                                                    style={{ animationDelay: `${taskIdx * 0.1}s` }}
                                                                >
                                                                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isTaskCompleted
                                                                        ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white shadow-md'
                                                                        : 'border-gray-300 group-hover:border-orange-400 group-hover:bg-orange-50'
                                                                        }`}>
                                                                        {isTaskCompleted && <CheckIcon />}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h5 className={`text-base font-bold transition-colors ${isTaskCompleted ? 'text-green-800 line-through opacity-80' : 'text-gray-900'
                                                                            }`}>
                                                                            {task.title}
                                                                        </h5>
                                                                        {task.description && (
                                                                            <p className={`text-sm mt-1 leading-relaxed ${isTaskCompleted ? 'text-green-700 opacity-70' : 'text-gray-600'
                                                                                }`}>
                                                                                {task.description}
                                                                            </p>
                                                                        )}
                                                                        {/* Helpful Links per task */}
                                                                        {task.helpfulLinks && task.helpfulLinks.length > 0 && (
                                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                                {task.helpfulLinks.map((link, lIdx) => (
                                                                                    <a
                                                                                        key={lIdx}
                                                                                        href={link.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-1.5 font-medium"
                                                                                    >
                                                                                        🔗 {link.name}
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {task.difficulty && (
                                                                        <span className={`text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm ${task.difficulty === 'Hard' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                                            task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                                                'bg-green-100 text-green-700 border border-green-200'
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
                                                        <h4 className="text-base font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                            <span className="text-xl animate-iconPulse">📚</span> Learning Resources
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {phase.resources.map((resource, rIdx) => (
                                                                <a
                                                                    key={rIdx}
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 group transform hover:scale-[1.02] hover:-translate-y-1"
                                                                    style={{ animationDelay: `${rIdx * 0.1}s` }}
                                                                >
                                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform shadow-sm">
                                                                        {resource.type === 'Video' ? '▶️' : resource.type === 'Practice' ? '💻' : '📄'}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                                            {resource.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 font-medium mt-0.5">{resource.type}</div>
                                                                    </div>
                                                                    <div className="text-gray-400 group-hover:text-blue-500 transition-colors text-lg font-bold">↗</div>
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
        </>
    );
};

export default PlacementPrepSection;
