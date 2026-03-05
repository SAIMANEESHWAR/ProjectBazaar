import { useState, useMemo } from 'react';
import { oopsConcepts, languageConcepts, groupByCategory, type Concept } from '../../data/fundamentalsData';

interface Props { toggleSidebar?: () => void; }

type FundSection = 'language' | 'oops';
type DiffFilter = 'all' | 'Easy' | 'Medium' | 'Hard';

const diffBadge = (d: string) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700';
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

export default function PrepFundamentalsPage(_props: Props) {
  const [section, setSection] = useState<FundSection>('oops');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const concepts = section === 'oops' ? oopsConcepts : languageConcepts;

  const filtered = useMemo(() => {
    if (diffFilter === 'all') return concepts;
    return concepts.filter(c => c.difficulty === diffFilter);
  }, [concepts, diffFilter]);

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  if (selectedConcept) {
    return (
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
          <button onClick={() => setSelectedConcept(null)} className="hover:text-orange-600 transition-colors">
            {section === 'oops' ? 'OOPs Concepts' : 'Language Fundamentals'}
          </button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 font-medium">{selectedConcept.title}</span>
        </div>

        {/* Concept Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedConcept.title}</h1>
            <p className="text-gray-500 mt-1">{selectedConcept.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${diffBadge(selectedConcept.difficulty)}`}>
                {selectedConcept.difficulty.toLowerCase()} level
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                {selectedConcept.topic}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
              Bookmark Concept
            </button>
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Explanation</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedConcept.explanation}</p>
        </div>

        {/* Code Example */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Code Example</h2>
          </div>
          <div className="bg-[#1e1e2e] p-6 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed">
              <code className="text-gray-200">
                {selectedConcept.codeExample
                  .replace(/```\w*\n?/g, '')
                  .replace(/```$/g, '')
                  .split('\n')
                  .map((line, i) => {
                    let colored = line;
                    colored = colored.replace(/\b(class|interface|extends|implements|abstract|public|private|protected|static|final|void|int|double|String|boolean|new|return|if|else|for|while|this|super|try|catch|finally|throw|import)\b/g, '<kw>$1</kw>');
                    colored = colored.replace(/"([^"]*)"/g, '<str>"$1"</str>');
                    colored = colored.replace(/\/\/.*/g, '<cmt>$&</cmt>');

                    return (
                      <span key={i} className="block">
                        {colored.split(/(<kw>.*?<\/kw>|<str>.*?<\/str>|<cmt>.*?<\/cmt>)/g).map((part, j) => {
                          if (part.startsWith('<kw>')) return <span key={j} className="text-purple-400">{part.replace(/<\/?kw>/g, '')}</span>;
                          if (part.startsWith('<str>')) return <span key={j} className="text-green-400">{part.replace(/<\/?str>/g, '')}</span>;
                          if (part.startsWith('<cmt>')) return <span key={j} className="text-gray-500 italic">{part.replace(/<\/?cmt>/g, '')}</span>;
                          return <span key={j}>{part}</span>;
                        })}
                      </span>
                    );
                  })}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {section === 'oops' ? 'OOPs Concepts' : 'Language Fundamentals'}
          </h1>
          <p className="text-gray-500 mt-1">
            {section === 'oops'
              ? 'Master Object-Oriented Programming concepts with detailed explanations and examples.'
              : 'Core language fundamentals with practical examples and explanations.'}
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Search
        </button>
      </div>

      {/* Section tabs */}
      <div className="mb-5 flex gap-1 border-b border-gray-200">
        {([['language', 'Language'], ['oops', 'OOPs Concepts']] as [FundSection, string][]).map(([key, lbl]) => (
          <button key={key} onClick={() => { setSection(key); setDiffFilter('all'); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${section === key ? 'text-orange-600 border-orange-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Difficulty filter tabs */}
      <div className="mb-6 flex gap-1 border-b border-gray-200">
        {([['all', 'All Concepts'], ['Easy', 'Easy'], ['Medium', 'Medium'], ['Hard', 'Hard']] as [DiffFilter, string][]).map(([key, lbl]) => (
          <button key={key} onClick={() => setDiffFilter(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 ${diffFilter === key ? 'text-orange-600 border-orange-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Concept groups */}
      {groups.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 font-medium">No concepts match this filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(group => (
            <div key={group.category}>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{group.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.concepts.map(concept => (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept)}
                    className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-orange-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{concept.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{concept.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${diffBadge(concept.difficulty)}`}>
                        {concept.difficulty.toLowerCase()} level
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        {concept.topic}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
