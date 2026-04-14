import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Plus, Check } from 'lucide-react';
import { useNavigation } from '../../App';
import { CTAArrowIcon } from '../CTAArrowIcon';

interface Step {
  id: string;
  number: string;
  title: string;
  content: string;
}

const steps: Step[] = [
  { id: '01', number: 'Step 01', title: 'Sign up & set your profile', content: 'Create your account in seconds. Add your skills, portfolio, or what you’re looking to buy or sell.' },
  { id: '02', number: 'Step 02', title: 'List or browse projects', content: 'Sellers list projects with clear descriptions and pricing. Buyers browse by category and filter by stack.' },
  { id: '03', number: 'Step 03', title: 'Place bids or buy', content: 'Freelancers place bids on projects. Buyers purchase ready-made projects or hire for custom work.' },
  { id: '04', number: 'Step 04', title: 'Secure delivery & payment', content: 'Work is delivered through the platform. Payments are released when both sides are satisfied.' },
  { id: '05', number: 'Step 05', title: 'Build reputation', content: 'Reviews and ratings help the next buyer or seller trust you. Grow your profile over time.' },
];

const partners = [
  { name: 'TechFlow' },
  { name: 'BuildHub' },
  { name: 'CodeSphere' },
  { name: 'DevStack' },
];

const CurriculumSection: React.FC = () => {
  const [openStep, setOpenStep] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { navigateTo } = useNavigation();

  const toggleStep = (id: string) => setOpenStep(openStep === id ? null : id);

  return (
    <section id="curriculum" className="relative py-24 md:py-32 bg-[#f2f0e9] dark:bg-[#0f0f0f] text-[#1a1a1a] dark:text-gray-200 overflow-hidden transition-colors duration-300">
      <div ref={ref} className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-14 md:mb-16"
        >
          <p className="text-gray-500 dark:text-[#a1a1a1] text-sm font-medium uppercase tracking-wider mb-4">How it works</p>
          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight">
            From idea to <span className="text-[#ff7a00]">revenue</span> in a few steps
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-[#e8e8e8] dark:border-[#262626] overflow-hidden transition-colors duration-300"
              >
                <button
                  onClick={() => toggleStep(step.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-[#faf9f6] dark:hover:bg-[#222] transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold text-[#1a1a1a] dark:text-white">{step.title}</span>
                    <span className="text-sm text-[#a1a1a1] dark:text-gray-400 mt-1">{step.number}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: openStep === step.id ? 45 : 0 }}
                    transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                    className="p-2 rounded-full border border-[#e8e8e8] dark:border-[#333] flex-shrink-0"
                  >
                    <Plus className="w-5 h-5 text-[#1a1a1a] dark:text-gray-300" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {openStep === step.id && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <p className="text-gray-600 dark:text-[#a1a1a1] text-base leading-relaxed">{step.content}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <div className="bg-gray-900 dark:bg-[#0a0a0a] rounded-[24px] p-8 text-white relative overflow-hidden shadow-2xl transition-colors duration-300">
              <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] bg-[#ff7a00] opacity-20 blur-[80px]" />
              <div className="relative z-10">
                <div className="inline-block bg-[#ff7a00] px-3 py-1 rounded-full text-xs font-bold mb-6">
                  Free to join
                </div>
                <h3 className="text-2xl md:text-[32px] font-bold mb-8">Join ProjectBazaar Today</h3>
                <div className="grid grid-cols-2 gap-y-6 mb-10">
                  {['List projects', 'Browse talent', 'Secure payments', 'Build portfolio'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="p-2 bg-[#1a1a1a] rounded-lg">
                        <Check className="w-4 h-4 text-[#ff7a00]" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#262626] pt-8 mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#a1a1a1] mb-6">What you get</p>
                  <ul className="space-y-4">
                    {['Instant access to list & browse', 'Bidding and project discovery', 'Portfolio & resume tools', 'Support when you need it'].map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={inView ? { opacity: 1, x: 0 } : {}}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="flex items-center gap-3 text-[15px]"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <motion.button
                  onClick={() => navigateTo('auth')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-between bg-[#ff7a00] hover:bg-[#ff9533] p-4 rounded-full font-bold text-white transition-colors group"
                >
                  <span className="ml-4">Get started free</span>
                  <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center transition-transform group-hover:translate-x-1">
                    <CTAArrowIcon className="w-5 h-5 object-contain" />
                  </span>
                </motion.button>
              </div>
              <div className="absolute top-10 right-10 rotate-12">
                <div className="bg-[#1a1a1a] border border-[#262626] p-2 rounded-lg flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-[#ff7a00]">✦</span>
                  <span className="text-[10px] font-bold tracking-widest">PB</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 pt-10 border-t border-dashed border-[#e8e8e8] dark:border-[#333]"
        >
          <p className="text-center text-[#a1a1a1] dark:text-gray-400 text-sm font-medium mb-8">Trusted by teams</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
            {partners.map((p, idx) => (
              <span key={idx} className="text-lg font-semibold text-[#1a1a1a] dark:text-gray-300">{p.name}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CurriculumSection;
