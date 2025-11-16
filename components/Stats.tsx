import React from 'react';

const stats = [
  { value: '200+', label: 'Active Users' },
  { value: '15+', label: 'Project Categories' },
  { value: '50+', label: 'Tech Stacks' },
  { value: '100+', label: 'Projects Sold' },
];

const Stats: React.FC = () => {
  return (
    <section className="py-12 bg-transparent">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
              <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 dark:from-blue-400 to-purple-600 dark:to-purple-500 mb-1">
                {stat.value}
              </p>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;