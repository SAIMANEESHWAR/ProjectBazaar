import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'motion/react';

function useCountUp(target: number, inView: boolean, duration = 1800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const iv = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(iv);
      } else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(iv);
  }, [inView, target, duration]);
  return value;
}

const ICON_BASE =
  'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/0fea2819-e0b6-4ab2-b4ab-ab4c64535352-oma-mindly-framer-website/assets/svgs';

const resultsData = [
  {
    icon: `${ICON_BASE}/nbF8E6vj0W01XalsJDmeBX1qhCA-15.svg`,
    metric: '10K+',
    suffix: ' Projects',
    description: 'From capstone projects to production apps, all in one marketplace.',
    target: 10,
  },
  {
    icon: `${ICON_BASE}/SX4jbFogH7FuJomOuJFbLrZFs-16.svg`,
    metric: '5K+',
    suffix: ' Users',
    description: 'Buyers, sellers, and freelancers building and earning together.',
    target: 5,
  },
  {
    icon: `${ICON_BASE}/22goEz9gsdxvFQOgJsQm2yapQs-17.svg`,
    metric: '4.9',
    suffix: '/5 Rating',
    description: 'Rated highly for ease of use, support, and quality of projects.',
    target: 49,
    decimal: true,
  },
  {
    icon: `${ICON_BASE}/d6m9TA9VJcWC81A5Cd463zkR1E-18.svg`,
    metric: '99%',
    suffix: ' Satisfaction',
    description: 'Users report successful transactions and would recommend us.',
    target: 99,
  },
  {
    icon: `${ICON_BASE}/87X2pajaYeK2WqDYNyghvROswl0-19.svg`,
    metric: '1K+',
    suffix: ' Sellers',
    description: 'Creators monetizing their work and growing their reputation.',
    target: 1,
  },
  {
    icon: `${ICON_BASE}/JM2Xea24TJbYdSTCkNEyA8Kbas-20.svg`,
    metric: '50+',
    suffix: ' Categories',
    description: 'Web, mobile, AI, DevOps, design, and more to explore.',
    target: 50,
  },
];

function ResultCard({
  item,
  index,
  inView,
}: {
  item: (typeof resultsData)[0];
  index: number;
  inView: boolean;
}) {
  const count = useCountUp(item.target, inView, 1600 + index * 100);
  const display = item.decimal ? (count / 10).toFixed(1) : count;
  const symbol = item.metric.includes('+') ? '+' : item.metric.includes('%') ? '%' : '';
  const suffixText = item.suffix.replace(/^\d+[+%]?\s*/, '').trim();
  const titleSpace = suffixText.startsWith('/') ? '' : ' ';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ backgroundColor: 'rgba(255,122,0,0.03)', transition: { duration: 0.2 } }}
      className={`p-10 flex flex-col items-center text-center border-[#E8E8E8] dark:border-[#262626] font-sans transition-colors duration-300
        ${index < 3 ? 'border-b' : ''}
        ${(index + 1) % 3 !== 0 ? 'border-r' : ''}
      `}
    >
      <motion.div
        className="w-[44px] h-[44px] mb-6 flex items-center justify-center"
        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
      >
        <img src={item.icon} alt={item.metric} width={44} height={44} className="object-contain" />
      </motion.div>
      <h3 className="text-[20px] font-bold text-[#1A1A1A] dark:text-white mb-4 tabular-nums">
        {display}{symbol}{titleSpace}{suffixText}
      </h3>
      <p className="text-[14px] leading-[1.6] text-[#A1A1A1] dark:text-gray-400 max-w-[280px]">{item.description}</p>
    </motion.div>
  );
}

const ResultsGridSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="bg-[#F2F1EE] dark:bg-[#0a0a0a] py-16 md:py-24 lg:py-[120px] px-5 flex flex-col items-center font-sans transition-colors duration-300">
      <div ref={ref} className="max-w-[1200px] w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-12 md:mb-[60px] relative"
        >
          <p className="text-[14px] font-medium text-[#1A1A1A] dark:text-gray-300 mb-4 uppercase tracking-wider">
            Why choose us?
          </p>
          <h2 className="text-[40px] md:text-[48px] font-bold leading-[1.2] text-[#1A1A1A] dark:text-white max-w-[600px] mx-auto">
            The <span className="text-[#FF7A00]">Results</span> Speak for Themselves
          </h2>
          <div className="absolute right-[10%] top-[70%] hidden lg:block">
            <div className="flex flex-col items-center -rotate-12 translate-y-4 translate-x-12">
              <span className="font-sans text-[14px] text-[#1A1A1A] dark:text-gray-300 opacity-70 mb-1 leading-none uppercase italic">
                This can be you
              </span>
              <svg
                width="40"
                height="25"
                viewBox="0 0 40 25"
                fill="none"
                className="opacity-40"
                aria-hidden
              >
                <path
                  d="M5 5C5 5 15 20 35 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M30 10L35 15L30 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-white/40 dark:bg-[#141414]/60 rounded-[24px] overflow-hidden border border-[#E8E8E8] dark:border-[#262626] transition-colors duration-300">
          {resultsData.map((item, index) => (
            <ResultCard key={index} item={item} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsGridSection;
