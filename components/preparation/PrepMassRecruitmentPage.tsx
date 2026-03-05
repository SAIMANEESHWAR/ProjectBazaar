import React, { useState, useMemo } from 'react';
import {
  massRecruitmentCompanies,
  interviewQuestions,
  dsaProblems,
} from '../../data/preparationMockData';
import type { MassRecruitmentCompany } from '../../data/preparationMockData';

interface PrepMassRecruitmentPageProps {
  toggleSidebar?: () => void;
}

type SubTab = 'interview' | 'dsa' | 'aptitude' | 'sql' | 'corecs';

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'interview', label: 'Interview Questions' },
  { id: 'dsa', label: 'DSA' },
  { id: 'aptitude', label: 'Aptitude' },
  { id: 'sql', label: 'SQL' },
  { id: 'corecs', label: 'Core CS' },
];

const MOCK_APTITUDE = [
  { id: 'a1', question: 'If 5x + 3 = 18, find x.', difficulty: 'Easy' },
  { id: 'a2', question: 'A train travels 120 km in 2 hours. What is its speed?', difficulty: 'Easy' },
  { id: 'a3', question: 'Complete the series: 2, 6, 12, 20, 30, ?', difficulty: 'Medium' },
  { id: 'a4', question: 'A is taller than B. C is shorter than B. Who is the shortest?', difficulty: 'Medium' },
  { id: 'a5', question: 'If PROFIT is coded as 123456, what is RIFT?', difficulty: 'Hard' },
];

const MOCK_SQL = [
  { id: 's1', question: 'Write a query to find the second highest salary from employees table.', difficulty: 'Medium' },
  { id: 's2', question: 'Explain the difference between INNER JOIN and LEFT JOIN.', difficulty: 'Easy' },
  { id: 's3', question: 'Write a query to find duplicate records in a table.', difficulty: 'Medium' },
  { id: 's4', question: 'What are window functions? Give an example of ROW_NUMBER().', difficulty: 'Hard' },
  { id: 's5', question: 'Write a query to get the nth row from a table without using LIMIT.', difficulty: 'Hard' },
];

const MOCK_CORE_CS = [
  { id: 'c1', question: 'Explain the difference between process and thread.', difficulty: 'Medium' },
  { id: 'c2', question: 'What is deadlock and how can it be prevented?', difficulty: 'Hard' },
  { id: 'c3', question: 'Explain the OSI model layers.', difficulty: 'Medium' },
  { id: 'c4', question: 'What is normalization in DBMS? Explain 3NF.', difficulty: 'Medium' },
  { id: 'c5', question: 'Explain the four pillars of OOP.', difficulty: 'Easy' },
];

const PrepMassRecruitmentPage: React.FC<PrepMassRecruitmentPageProps> = ({ toggleSidebar }) => {
  const [selectedCompany, setSelectedCompany] = useState<MassRecruitmentCompany | null>(
    massRecruitmentCompanies[0] ?? null
  );
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('interview');

  const companyStats = useMemo(() => {
    if (!selectedCompany) return null;
    const sqlCount = Math.floor(selectedCompany.interviewQuestions * 0.4);
    const coreCSCount = Math.floor(selectedCompany.interviewQuestions * 0.35);
    return {
      interviewQuestions: selectedCompany.interviewQuestions,
      dsaProblems: selectedCompany.dsaProblems,
      aptitudeQuestions: selectedCompany.aptitudeQuestions,
      sqlQuestions: sqlCount,
      coreCSQuestions: coreCSCount,
    };
  }, [selectedCompany]);

  const questionList = useMemo(() => {
    switch (activeSubTab) {
      case 'interview':
        return interviewQuestions.slice(0, 12).map((q) => ({
          id: q.id,
          title: q.question,
          difficulty: q.difficulty,
        }));
      case 'dsa':
        return dsaProblems
          .filter((p) => p.company.some((c) => selectedCompany?.name && c.toLowerCase().includes(selectedCompany.name.toLowerCase())))
          .slice(0, 12)
          .map((p) => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
          }));
      case 'aptitude':
        return MOCK_APTITUDE;
      case 'sql':
        return MOCK_SQL;
      case 'corecs':
        return MOCK_CORE_CS;
      default:
        return [];
    }
  }, [activeSubTab, selectedCompany]);

  const dsaFallback = useMemo(() => {
    if (activeSubTab !== 'dsa') return [];
    const filtered = dsaProblems.filter((p) =>
      p.company.some((c) => selectedCompany?.name && c.toLowerCase().includes(selectedCompany.name.toLowerCase()))
    );
    if (filtered.length > 0) return filtered.slice(0, 12).map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty }));
    return dsaProblems.slice(0, 12).map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty }));
  }, [activeSubTab, selectedCompany]);

  const displayQuestions = activeSubTab === 'dsa' && questionList.length === 0 ? dsaFallback : questionList;

  const getStatForTab = (tab: SubTab) => {
    if (!companyStats) return 0;
    switch (tab) {
      case 'interview':
        return companyStats.interviewQuestions;
      case 'dsa':
        return companyStats.dsaProblems;
      case 'aptitude':
        return companyStats.aptitudeQuestions;
      case 'sql':
        return companyStats.sqlQuestions;
      case 'corecs':
        return companyStats.coreCSQuestions;
      default:
        return 0;
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Mass Recruitment Resources</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Interview questions, DSA problems, and aptitude resources for mass recruiters
        </p>
      </div>

      <div className="overflow-x-auto pb-2 -mx-2 scrollbar-thin">
        <div className="flex gap-2 min-w-max px-2">
          {massRecruitmentCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 whitespace-nowrap ${
                selectedCompany?.id === company.id
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <span className="text-lg">{company.logo}</span>
              <span className="font-medium">{company.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedCompany && (
        <>
          <div className="flex flex-wrap gap-2 mt-6 mb-4">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSubTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">Interview Questions</p>
              <p className="text-2xl font-bold text-gray-900">{companyStats?.interviewQuestions ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">DSA Problems</p>
              <p className="text-2xl font-bold text-gray-900">{companyStats?.dsaProblems ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500">Aptitude Questions</p>
              <p className="text-2xl font-bold text-gray-900">{companyStats?.aptitudeQuestions ?? 0}</p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-all duration-200">
              My progress
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {SUB_TABS.find((t) => t.id === activeSubTab)?.label} ({getStatForTab(activeSubTab)})
              </h3>
              <ul className="space-y-3">
                {displayQuestions.map((q) => (
                  <li
                    key={q.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50/50 transition-all duration-200"
                  >
                    <span className="text-gray-800 flex-1 truncate mr-4">
                      {'question' in q ? q.question : q.title}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        q.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-700'
                          : q.difficulty === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrepMassRecruitmentPage;
