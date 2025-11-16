
import React from 'react';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

const ReviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const EarnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const steps = [
  {
    icon: <UploadIcon />,
    title: '1. Upload Your Project',
    description: 'Package your project, add a title, description, and set your price. Our simple uploader makes it a breeze.',
  },
  {
    icon: <ReviewIcon />,
    title: '2. Get Reviewed',
    description: 'Our team reviews your submission to ensure quality and originality, maintaining a trustworthy marketplace for all.',
  },
  {
    icon: <EarnIcon />,
    title: '3. Start Earning',
    description: 'Once approved, your project goes live! Reach thousands of buyers and earn from your hard work.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-[#111111]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          Monetizing your projects is just three simple steps away.
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 p-8 rounded-xl text-center flex flex-col items-center">
              <div className="mb-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 text-blue-500 dark:text-blue-300 p-4 rounded-full">
                {step.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
