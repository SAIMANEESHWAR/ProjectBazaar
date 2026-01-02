import React from 'react';

const Stats: React.FC = () => {
  const stats = [
    { number: '10K+', label: 'Projects' },
    { number: '5K+', label: 'Users' },
    { number: '1K+', label: 'Sellers' },
    { number: '99%', label: 'Satisfaction' }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-orange-50 to-orange-50 dark:from-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.number}</div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
