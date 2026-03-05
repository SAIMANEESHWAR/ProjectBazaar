import React, { useState } from 'react';
import { interviewQuestions, dsaProblems, quizzes, coldDMTemplates, massRecruitmentCompanies, jobPortals, handwrittenNotes, roadmaps, positionResources } from '../../data/preparationMockData';
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

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

const ActionBtns: React.FC<{ name: string; onEdit: () => void; onDelete: () => void }> = ({ name, onEdit, onDelete }) => (
    <div className="flex gap-1">
        <button onClick={onEdit} title={`Edit ${name}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
            <EditIcon />
        </button>
        <button onClick={onDelete} title={`Delete ${name}`} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200">
            <DeleteIcon />
        </button>
    </div>
);

const PrepContentManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PrepTab>('overview');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const [iqData, setIqData] = useState(interviewQuestions);
    const [dsaData, setDsaData] = useState(dsaProblems);
    const [quizData, setQuizData] = useState(quizzes);
    const [dmData, setDmData] = useState(coldDMTemplates);
    const [jpData, setJpData] = useState(jobPortals);
    const [noteData, setNoteData] = useState(handwrittenNotes);
    const [rmData, setRmData] = useState(roadmaps);
    const [mrData, setMrData] = useState(massRecruitmentCompanies);
    const [posData, setPosData] = useState(positionResources);
    const [hldData, setHldData] = useState(hldQuestions);
    const [lldData, setLldData] = useState(lldQuestions);
    const [oopsData, setOopsData] = useState(oopsConcepts);
    const [langData, setLangData] = useState(languageConcepts);

    const showToast = (message: string, type: 'success' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };

    const confirmDelete = (name: string, id: string | number, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
        if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            setter((prev: any[]) => prev.filter((item: any) => item.id !== id));
            showToast(`"${name}" deleted successfully`, 'success');
        }
    };

    const triggerEdit = (name: string) => {
        showToast(`Editing "${name}" — editor modal coming soon`, 'info');
    };

    const overviewStats = [
        { label: 'Interview Questions', value: iqData.length, color: 'bg-blue-500' },
        { label: 'DSA Problems', value: dsaData.length, color: 'bg-green-500' },
        { label: 'HLD Questions', value: hldData.length, color: 'bg-cyan-500' },
        { label: 'LLD Questions', value: lldData.length, color: 'bg-sky-500' },
        { label: 'OOPs Concepts', value: oopsData.length, color: 'bg-violet-500' },
        { label: 'Language Concepts', value: langData.length, color: 'bg-fuchsia-500' },
        { label: 'Quizzes', value: quizData.length, color: 'bg-purple-500' },
        { label: 'Cold DM Templates', value: dmData.length, color: 'bg-orange-500' },
        { label: 'Job Portals', value: jpData.length, color: 'bg-pink-500' },
        { label: 'Handwritten Notes', value: noteData.length, color: 'bg-indigo-500' },
        { label: 'Roadmaps', value: rmData.length, color: 'bg-teal-500' },
        { label: 'Companies (Mass Recruit)', value: mrData.length, color: 'bg-red-500' },
        { label: 'Position Resources', value: posData.length, color: 'bg-yellow-500' },
    ];

    return (
        <div className="space-y-6 relative">
            <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
            {toast && (
                <div style={{ animation: 'slideIn 0.3s ease-out' }} className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {toast.message}
                    </div>
                </div>
            )}

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
                        <h3 className="text-lg font-semibold">Interview Questions ({iqData.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Question</button>
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
                                {iqData.map((q, i) => (
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
                                            <ActionBtns name={q.question} onEdit={() => triggerEdit(q.question)} onDelete={() => confirmDelete(q.question, q.id, setIqData)} />
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
                        <h3 className="text-lg font-semibold">DSA Problems ({dsaData.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Problem</button>
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
                                {dsaData.map((p, i) => (
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
                                            <ActionBtns name={p.title} onEdit={() => triggerEdit(p.title)} onDelete={() => confirmDelete(p.title, p.id, setDsaData)} />
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
                        <h3 className="text-lg font-semibold">Quizzes ({quizData.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Quiz</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                        {quizData.map((quiz) => (
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
                                    <ActionBtns name={quiz.title} onEdit={() => triggerEdit(quiz.title)} onDelete={() => confirmDelete(quiz.title, quiz.id, setQuizData)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'cold-dms' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Cold DM Templates ({dmData.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Template</button>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {dmData.map((dm, i) => (
                            <div key={dm.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-400">{i + 1}</span>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{dm.title}</h4>
                                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{dm.category}</span>
                                        </div>
                                    </div>
                                    <ActionBtns name={dm.title} onEdit={() => triggerEdit(dm.title)} onDelete={() => confirmDelete(dm.title, dm.id, setDmData)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'job-portals' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Job Portals ({jpData.length})</h3>
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
                                {jpData.map((portal) => (
                                    <tr key={portal.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{portal.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{portal.category}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{portal.region}</td>
                                        <td className="px-6 py-4">
                                            <ActionBtns name={portal.name} onEdit={() => triggerEdit(portal.name)} onDelete={() => confirmDelete(portal.name, portal.id, setJpData)} />
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
                        <h3 className="text-lg font-semibold">Handwritten Notes ({noteData.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Upload Note</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {noteData.map((note) => (
                            <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <h4 className="font-semibold text-gray-900">{note.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">{note.description}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{note.topic}</span>
                                    <span className="text-xs text-gray-400">{note.pageCount} pages</span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <ActionBtns name={note.title} onEdit={() => triggerEdit(note.title)} onDelete={() => confirmDelete(note.title, note.id, setNoteData)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'roadmaps' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Roadmaps ({rmData.length})</h3>
                        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">Add Roadmap</button>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {rmData.map((rm) => (
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
                                    <ActionBtns name={rm.title} onEdit={() => triggerEdit(rm.title)} onDelete={() => confirmDelete(rm.title, rm.id, setRmData)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'mass-recruitment' && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Mass Recruitment Companies ({mrData.length})</h3>
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
                                {mrData.map((company) => (
                                    <tr key={company.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.interviewQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.dsaProblems}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{company.aptitudeQuestions}</td>
                                        <td className="px-6 py-4">
                                            <ActionBtns name={company.name} onEdit={() => triggerEdit(company.name)} onDelete={() => confirmDelete(company.name, company.id, setMrData)} />
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
                        <h3 className="text-lg font-semibold">High Level Design Questions ({hldData.length})</h3>
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
                                {hldData.map((q, i) => (
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
                                            <ActionBtns name={q.title} onEdit={() => triggerEdit(q.title)} onDelete={() => confirmDelete(q.title, q.id, setHldData)} />
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
                        <h3 className="text-lg font-semibold">Low Level Design Questions ({lldData.length})</h3>
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
                                {lldData.map((q, i) => (
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
                                            <ActionBtns name={q.title} onEdit={() => triggerEdit(q.title)} onDelete={() => confirmDelete(q.title, q.id, setLldData)} />
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
                        <h3 className="text-lg font-semibold">OOPs Concepts ({oopsData.length})</h3>
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
                                {oopsData.map((c, i) => (
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
                                            <ActionBtns name={c.title} onEdit={() => triggerEdit(c.title)} onDelete={() => confirmDelete(c.title, c.id, setOopsData)} />
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
                        <h3 className="text-lg font-semibold">Language Fundamentals ({langData.length})</h3>
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
                                {langData.map((c, i) => (
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
                                            <ActionBtns name={c.title} onEdit={() => triggerEdit(c.title)} onDelete={() => confirmDelete(c.title, c.id, setLangData)} />
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
                        <h3 className="text-lg font-semibold">Position Resources ({posData.length})</h3>
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
                                {posData.map((pos) => (
                                    <tr key={pos.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{pos.role}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.interviewQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.dsaQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.aptitudeQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.sqlQuestions}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{pos.coreCSQuestions}</td>
                                        <td className="px-6 py-4">
                                            <ActionBtns name={pos.role} onEdit={() => triggerEdit(pos.role)} onDelete={() => confirmDelete(pos.role, pos.id, setPosData)} />
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
