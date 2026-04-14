import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Package, FileCode, Users } from 'lucide-react';
import { useNavigation } from '../../App';
import { CTAArrowIcon } from '../CTAArrowIcon';

const roleTagVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.3 + i * 0.15, ease: 'easeOut' as const },
  }),
};

const featureVariants = {
  hidden: { opacity: 0, x: 30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, delay: 0.2 + i * 0.15, ease: 'easeOut' as const },
  }),
};

const roles = [
  { label: 'Sellers', opacity: 1 },
  { label: 'Buyers', opacity: 1 },
  { label: 'Freelancers', opacity: 0.5 },
];

const features = [
  {
    icon: <Package className="w-6 h-6 text-[#ff7a00]" />,
    label: 'Project Library',
    text: 'List, browse, and sell projects in one place. From capstone projects to production-ready apps.',
  },
  {
    icon: <FileCode className="w-6 h-6 text-[#ff7a00]" />,
    label: 'Secure & Simple',
    text: 'Escrow payments, clear deliverables, and dispute resolution so everyone wins.',
  },
  {
    icon: <Users className="w-6 h-6 text-[#ff7a00]" />,
    label: 'Portfolio & Bids',
    text: 'Build your portfolio, place bids, and get hired. One platform for projects and talent.',
  },
];

const UniSystemSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { navigateTo } = useNavigation();

  return (
    <section className="bg-white dark:bg-[#0a0a0a] py-24 md:py-32 px-5 relative overflow-hidden transition-colors duration-300" id="why-choose-us">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#ff7a0033] rounded-full blur-[120px]"
        />
      </div>

      <div ref={ref} className="landing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-12 flex flex-col items-center gap-4"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626]">
            <span className="text-gray-600 dark:text-[#a1a1a1] text-sm font-medium tracking-wide uppercase">Introducing ProjectBazaar</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-gray-900 dark:text-white tracking-tight leading-[1.2] max-w-2xl mx-auto">
            The A-to-Z Platform for <span className="text-[#ff7a00]">High-Value</span> Projects & Talent
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-[24px] border border-gray-200 dark:border-[#262626] overflow-hidden p-6 lg:p-12 shadow-2xl relative transition-colors duration-300"
        >
          <div className="lg:col-span-7 flex flex-col gap-8 relative">
            <div className="flex flex-col gap-6">
              <div className="inline-block self-start px-3 py-1 rounded-md bg-gray-200 dark:bg-[#262626] border border-gray-300 dark:border-[#333]">
                <span className="text-xs font-semibold text-gray-800 dark:text-white uppercase tracking-wider">Get Started</span>
              </div>
              <h3 className="text-3xl lg:text-[40px] font-bold text-gray-900 dark:text-white leading-[1.15] tracking-tight max-w-[500px]">
                One marketplace for projects, freelancers, and opportunities.
              </h3>
              <motion.button
                onClick={() => navigateTo('auth')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="group flex items-center self-start bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white px-6 py-3.5 rounded-full font-semibold"
              >
                Join for free
                <span className="ml-3 flex items-center justify-center w-6 h-6 bg-white rounded-full">
                  <CTAArrowIcon className="w-4 h-4 object-contain" />
                </span>
              </motion.button>
            </div>
            <p className="text-gray-600 dark:text-[#a1a1a1] text-lg leading-relaxed max-w-[480px]">
              Whether you want to sell your project, buy a ready-made solution, or hire talent—we’ve got you.
            </p>
            <div className="flex flex-wrap gap-3 max-w-[450px]">
              {roles.map((role, i) => (
                <motion.div
                  key={i}
                  variants={roleTagVariants}
                  initial="hidden"
                  animate={inView ? 'visible' : 'hidden'}
                  custom={i}
                  style={{ opacity: role.opacity }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-200/80 dark:bg-[#262626]/80 backdrop-blur-md border border-gray-300/50 dark:border-white/5"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-[#3d3d3d] flex items-center justify-center text-[10px]">👤</div>
                  <span className="text-[13px] font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">{role.label}</span>
                </motion.div>
              ))}
            </div>
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-[#ff7a00]/40 to-transparent rounded-full blur-[80px] pointer-events-none" />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6 justify-center">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                variants={featureVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                custom={i}
                className="flex gap-5 group"
              >
                <motion.div
                  whileHover={{ borderColor: 'rgba(255,122,0,0.4)', scale: 1.05 }}
                  className="w-16 h-16 rounded-[16px] bg-gray-200 dark:bg-[#262626] border border-gray-300 dark:border-[#333] flex items-center justify-center shrink-0 shadow-lg transition-colors"
                >
                  {feat.icon}
                </motion.div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-[#a1a1a1] uppercase mb-1 tracking-widest">{feat.label}</h4>
                  <p className="text-gray-900 dark:text-white font-medium leading-[1.4] text-lg">{feat.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UniSystemSection;
