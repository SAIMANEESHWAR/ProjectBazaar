import React, { useState } from 'react';
import { interviewQuestions, dsaProblems, quizzes, coldDMTemplates, massRecruitmentCompanies, jobPortals, handwrittenNotes, roadmaps, positionResources, prepStats } from '../../data/preparationMockData';
import { hldQuestions, lldQuestions } from '../../data/systemDesignData';
import { oopsConcepts, languageConcepts } from '../../data/fundamentalsData';

type PrepTab = 'overview' | 'interview-questions' | 'dsa' | 'quizzes' | 'cold-dms' | 'job-portals' | 'notes' | 'roadmaps' | 'mass-recruitment' | 'positions' | 'hld' | 'lld' | 'oops' | 'language';

const tabs: { id: PrepTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'interview-questions', label: 'Interview Qs' },
    { id: 'dsa', label: 'DSA' },
    { id: 'hld', label: 'HLD' },
    { id: 'lld', label: 'LLD' },
    { id: 'oops', label: 'OOPs' },
    { id: 'language', label: 'Language' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'cold-dms', label: 'Cold DMs' },
    { id: 'job-portals', label: 'Job Portals' },
    { id: 'notes', label: 'Notes' },
    { id: 'roadmaps', label: 'Roadmaps' },
    { id: 'mass-recruitment', label: 'Mass Recruit' },
    { id: 'positions', label: 'Positions' },
];

const PrepContentManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PrepTab>('overview');

    const overviewStats = [
        { label: 'Interview Questions', value: prepStats.totalQuestions, color: 'bg-blue-500' },
        { label: 'DSA Problems', value: prepStats.totalDSA, color: 'bg-green-500' },
        { label: 'HLD Questions', value: hldQuestions.length, color: 'bg-cyan-500' },
        { label: 'LLD Questions', value: lldQuestions.length, color: 'bg-sky-500' },
        { label: 'OOPs Concepts', value: oopsConcepts.length, color: 'bg-violet-500' },
        { label: 'Language Concepts', value: languageConcepts.length, color: 'bg-fuchsia-500' },
        { label: 'Quizzes', value: prepStats.totalQuizzes, color: 'bg-purple-500' },
        { label: 'Cold DM Templates', value: prepStats.totalColdDMs, color: 'bg-orange-500' },
        { label: 'Job Portals', value: prepStats.totalJobPortals, color: 'bg-pink-500' },
        { label: 'Handwritten Notes', value: prepStats.totalNotes, color: 'bg-indigo-500' },
        { label: 'Roadmaps', value: prepStats.totalRoadmaps, color: 'bg-teal-500' },
        { label: 'Companies (Mass Recruit)', value: prepStats.totalCompanies, color: 'bg-red-500' },
        { label: 'Position Resources', value: prepStats.totalPositions, color: 'bg-yellow-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                            activeTab === tab.id
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-600 hover:bg-orange-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overviewStats.map((stat) => (
                            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                                    <span className="text-sm text-gray-500">{stat.label}</span>
                                </div>
                                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preparation Content Status</h3>
                        <div className="space-y-3">
                            {overviewStats.map((stat) => (
                                <div key={stat.label} className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600 w-48">{stat.label}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                        <div className={`${stat.color} h-2 rounded-full`} style={{ width: `${Math.min(100, (stat.value / 10))}%` }} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'interview-questions' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Interview Questions ({interviewQuestions.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                            Add Question
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {interviewQuestions.map((q, i) => (
                                    <tr key={q.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{q.question}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {q.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{q.category}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'dsa' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">DSA Problems ({dsaProblems.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                            Add Problem
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Companies</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dsaProblems.map((p, i) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.title}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${p.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : p.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {p.difficulty}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{p.topic}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                {p.company.slice(0, 2).map((c) => (
                                                    <span key={c} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{c}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'quizzes' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Quizzes ({quizzes.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Quiz</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {quizzes.map((quiz) => (
                            <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{quiz.questionCount} questions · {quiz.duration} min</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {quiz.difficulty}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                    <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'cold-dms' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Cold DM Templates ({coldDMTemplates.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Template</button>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {coldDMTemplates.map((dm, i) => (
                            <div key={dm.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-400">{i + 1}</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{dm.title}</h4>
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{dm.category}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                        <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'job-portals' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Job Portals ({jobPortals.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Portal</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {jobPortals.map((portal) => (
                                    <tr key={portal.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{portal.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{portal.category}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{portal.region}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'notes' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Handwritten Notes ({handwrittenNotes.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Upload Note</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {handwrittenNotes.map((note) => (
                            <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <h4 className="font-semibold text-gray-900">{note.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">{note.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{note.topic}</span>
                                    <span className="text-xs text-gray-400">{note.pageCount} pages</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                    <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'roadmaps' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Roadmaps ({roadmaps.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Roadmap</button>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {roadmaps.map((rm) => (
                            <div key={rm.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-gray-900">{rm.title}</h4>
                                        <p className="text-sm text-gray-500 mt-0.5">{rm.description}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{rm.category}</span>
                                            {rm.isFree && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Free</span>}
                                            <span className="text-xs text-gray-400">{rm.steps.length} steps</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                        <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'mass-recruitment' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Mass Recruitment Companies ({massRecruitmentCompanies.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Company</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interview Qs</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DSA</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aptitude</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {massRecruitmentCompanies.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.interviewQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.dsaProblems}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.aptitudeQuestions}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'hld' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">High Level Design Questions ({hldQuestions.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Question</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {hldQuestions.map((q, i) => (
                                    <tr key={q.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{q.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{q.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{q.section}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${q.isSolved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{q.isSolved ? 'Published' : 'Draft'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'lld' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Low Level Design Questions ({lldQuestions.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Question</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {lldQuestions.map((q, i) => (
                                    <tr key={q.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{q.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{q.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{q.section}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${q.isSolved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{q.isSolved ? 'Published' : 'Draft'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'oops' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">OOPs Concepts ({oopsConcepts.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Concept</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {oopsConcepts.map((c, i) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{c.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{c.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{c.category}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : c.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{c.difficulty}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{c.language}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'language' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Language Fundamentals ({languageConcepts.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Concept</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Language</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {languageConcepts.map((c, i) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{c.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{c.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{c.category}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : c.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{c.difficulty}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{c.language}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'positions' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Position Resources ({positionResources.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Position</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interview Qs</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DSA</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aptitude</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SQL</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Core CS</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {positionResources.map((pos) => (
                                    <tr key={pos.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{pos.role}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.interviewQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.dsaQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.aptitudeQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.sqlQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.coreCSQuestions}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                                                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                                            </div>
                                        </td>
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

export default PrepContentManagementPage;
