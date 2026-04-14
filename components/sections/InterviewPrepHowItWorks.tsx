import React from 'react';
import AIExtractionAnimation from '../ui/AIExtractionAnimation';
import WalkInReadyAnimation from '../ui/WalkInReadyAnimation';
import AIFeedbackAnimation from '../ui/AIFeedbackAnimation';

const STEPS = [
    {
        id: 1,
        title: 'Tell us about your interview',
        description: 'Upload your resume or paste your LinkedIn URL. Add the job posting. The AI maps your experience against the role and identifies the gaps you need to close.',
        time: '3 minutes',
        animation: <AIExtractionAnimation />
    },
    {
        id: 2,
        title: 'Practice and get real feedback',
        description: 'Record your answer by speaking or typing. AI evaluates structure, relevance, specificity, and impact — then shows you exactly what to change. Practice again until it clicks.',
        time: '15 min/session',
        animation: <AIFeedbackAnimation />
    },
    {
        id: 3,
        title: 'Walk in ready',
        description: "You've practiced the questions that matter. You've seen your scores improve. You know what to say. That's not confidence — that's preparation.",
        time: 'Interview day',
        animation: <WalkInReadyAnimation />
    }
];

const InterviewPrepHowItWorks: React.FC = () => {
    return (
        <section className="py-12 bg-[#faf9f6] dark:bg-[#0a0a0a] transition-colors duration-300" id="how-it-works">
            <div className="container mx-auto px-6 max-w-[1200px]">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#1f2937] dark:text-white mb-4">How it works</h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Three simple steps to go from nervous to confident.
                    </p>
                </div>

                <div className="flex flex-col gap-16 md:gap-20 relative">
                    {STEPS.map((step, index) => {
                        const isEven = index % 2 === 1;
                        return (
                            <div key={step.id} className={`flex flex-col ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-start gap-8 lg:gap-12 relative z-10 py-6 md:py-8`}>
                                {/* Text Column */}
                                <div className={`lg:w-[45%] flex flex-col ${isEven ? 'lg:items-end lg:text-right' : 'lg:items-start lg:text-left'} shrink-0`}>
                                    {/* Step Tag */}
                                    <div className="flex items-center gap-4 mb-3">
                                        <span className="text-5xl lg:text-6xl text-[#ea580c] opacity-[0.15] font-light leading-none">{step.id}</span>
                                        <div className="flex items-center gap-2 bg-[#ffedd5] text-[#ea580c] px-3.5 py-1.5 rounded-full font-bold text-xs shadow-sm whitespace-nowrap">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {step.time}
                                        </div>
                                    </div>

                                    {/* Headline */}
                                    <h3 className="text-2xl md:text-3xl font-bold text-[#1f2937] dark:text-gray-100 mb-3 tracking-tight leading-[1.2]">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed font-normal max-w-md">
                                        {step.description}
                                    </p>
                                </div>

                                {/* Animation Column - visible, no clipping */}
                                <div className="lg:w-[55%] flex justify-center items-center w-full relative min-h-[280px] lg:min-h-[320px] overflow-visible">
                                    {/* Gradient Blur Background - behind animation */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] bg-gradient-to-r from-orange-500/10 to-green-500/10 dark:from-orange-500/5 dark:to-green-500/5 blur-2xl rounded-full pointer-events-none z-0" aria-hidden="true" />

                                    <div className="relative z-10 w-full flex justify-center items-center overflow-visible transition-transform duration-700">
                                        {step.animation}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default InterviewPrepHowItWorks;
