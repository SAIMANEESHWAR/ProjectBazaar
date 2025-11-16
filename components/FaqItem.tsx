
import React from 'react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900/50">
      <button
        onClick={onClick}
        className="w-full flex justify-between items-center text-left p-5 focus:outline-none"
      >
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{question}</h3>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="p-5 pt-0 text-gray-600 dark:text-gray-400">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default FaqItem;
