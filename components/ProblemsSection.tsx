import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Package, Search, Clock, FolderOpen, Users, Sparkles } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const, delay: i * 0.1 },
  }),
};

const iconClass = 'w-11 h-11 text-[#FF8C00] stroke-[1.5]';

const problems = [
  {
    icon: <Search className={iconClass} strokeWidth={2} />,
    text: 'Spending hours searching for the right project or freelancer with no clear results?',
  },
  {
    icon: <FolderOpen className={iconClass} strokeWidth={2} />,
    text: 'Your best projects sit in a folder after graduation—never seen, never sold?',
  },
  {
    icon: <Clock className={iconClass} strokeWidth={2} />,
    text: 'Worrying that your skills are underused while others monetize theirs?',
  },
  {
    icon: <Package className={iconClass} strokeWidth={2} />,
    text: 'Do you have a growing fear of buying a project that doesn’t match the description?',
  },
  {
    icon: <Users className={iconClass} strokeWidth={2} />,
    text: 'Are you overwhelmed by too many platforms and no single place to build, buy, and sell?',
  },
  {
    icon: <Sparkles className={iconClass} strokeWidth={2} />,
    text: 'Do you waste time juggling portfolios, bids, and payments across different tools?',
  },
];

const ProblemCard: React.FC<{ icon: React.ReactNode; text: string; index: number }> = ({ icon, text, index }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={index}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="flex flex-col items-start text-left p-6 md:p-8 bg-transparent"
    >
      <motion.div
        className="mb-5 flex items-center justify-center text-[#FF8C00]"
        whileHover={{ scale: 1.05 }}
      >
        {icon}
      </motion.div>
      <p className="text-[15px] md:text-base leading-relaxed font-normal text-[#1a1a1a] dark:text-gray-300 max-w-[320px]">{text}</p>
    </motion.div>
  );
};

const ProblemsSection: React.FC = () => {
  const headRef = useRef(null);
  const headInView = useInView(headRef, { once: true, margin: '-80px' });

  return (
    <section id="why-choose-us" className="bg-[#F9F8F6] dark:bg-[#0f0f0f] py-20 md:py-28 px-5 overflow-hidden transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          ref={headRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 md:mb-20 relative"
        >
          <p className="text-[#6b7280] dark:text-gray-400 text-sm font-medium mb-4">Is this you?</p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-[56px] leading-[1.15] font-bold text-[#1a1a1a] dark:text-gray-100 max-w-[900px] mx-auto tracking-tight">
            Does Your Experience with Project Marketplaces Feel More{' '}
            <span className="text-[#FF8C00]">Frustrating</span> Than Futuristic?
          </h2>

          {/* Hand-drawn style annotation */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end translate-x-4">
            <p className="text-[#1a1a1a] dark:text-gray-300 text-sm font-semibold uppercase tracking-[0.2em] whitespace-nowrap" style={{ fontFamily: 'cursive' }}>
              Sounds familiar?
            </p>
            <svg className="w-12 h-8 mt-1 text-[#1a1a1a] dark:text-gray-400 opacity-80 -rotate-[20deg]" viewBox="0 0 50 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 25 Q25 5 45 8" />
              <path d="M38 5 L45 8 L42 12" />
            </svg>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 lg:gap-x-10 lg:gap-y-14">
          {problems.map((problem, index) => (
            <ProblemCard key={index} icon={problem.icon} text={problem.text} index={index % 3} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
