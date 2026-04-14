import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FolderOpen, Handshake, Rocket, Code2, BookOpen, Clock, Users } from 'lucide-react';
import { useNavigation } from '../../App';
import { CTAArrowIcon } from '../CTAArrowIcon';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop',
];

const companies = ['TechFlow', 'BuildHub', 'CodeSphere', 'DevStack', 'Nexus', 'InnovateLab'];

const floatingIcons = [
  { Icon: FolderOpen, style: 'top-[10%] left-[-20px]', delay: 0 },
  { Icon: Handshake, style: 'top-[10%] right-[-20px]', delay: 0.5 },
  { Icon: Rocket, style: 'bottom-[20%] left-[5%]', delay: 1 },
  { Icon: Code2, style: 'bottom-[20%] right-[5%]', delay: 1.5 },
];

const perks = [
  { Icon: BookOpen, label: 'List & browse projects in minutes' },
  { Icon: Clock, label: 'Secure payments & delivery' },
  { Icon: Users, label: 'Portfolio, bids & hiring' },
];

const FinalCTASection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { navigateTo } = useNavigation();

  return (
    <section id="pricing" ref={ref} className="relative w-full bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden py-24 md:py-32 transition-colors duration-300">
      <div
        className="absolute inset-x-0 top-0 h-full pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'perspective(1000px) rotateX(60deg) scale(2)',
          transformOrigin: 'top',
        }}
      />

      <div className="landing-container relative z-10 flex flex-col items-center px-5">
        <div className="absolute w-full max-w-[1000px] h-[300px] pointer-events-none hidden md:block">
          {floatingIcons.map(({ Icon, style, delay }, i) => (
            <motion.div
              key={i}
              className={`absolute text-gray-400 dark:text-white/20 ${style}`}
              animate={{ y: [0, -14, 0], rotate: [0, i % 2 === 0 ? 5 : -5, 0] }}
              transition={{ duration: 3.5 + i * 0.5, delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className="w-16 h-16" />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-gray-500 dark:text-[#a1a1a1] uppercase tracking-[0.1em] text-sm font-medium mb-6"
        >
          Join thousands of makers
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
          className="flex -space-x-3 mb-8"
        >
          {AVATARS.map((src, i) => (
            <div key={i} className="w-12 h-12 rounded-full border-2 border-gray-200 dark:border-[#1a1a1a] overflow-hidden bg-gray-300 dark:bg-gray-700">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-center text-gray-900 dark:text-white text-4xl md:text-5xl lg:text-[64px] font-extrabold leading-[1.1] mb-6 max-w-[900px]"
        >
          Join Now & Get <span className="text-[#ff7a00]">Instant Access</span> for Free
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-gray-600 dark:text-[#a1a1a1] text-center text-lg max-w-[600px] mb-12"
        >
          List your first project or find your next opportunity in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center gap-6 mb-16 md:mb-20"
        >
          <motion.button
            onClick={() => navigateTo('browseProjects')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] rounded-full shadow-[0_0_30px_rgba(255,122,0,0.3)] group text-white font-bold text-lg"
          >
            Get started free
            <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1">
              <CTAArrowIcon className="w-4 h-4 object-contain" />
            </span>
          </motion.button>

          <div className="flex items-center gap-3">
            <svg width="45" height="25" viewBox="0 0 45 25" fill="none" className="rotate-[-10deg] stroke-current text-gray-600 dark:text-white">
              <path
                d="M1 24C6.5 18 15 2 44 1M44 1L38 4M44 1L41 7"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-gray-700 dark:text-white font-normal text-sm italic opacity-80 uppercase tracking-tight max-w-[150px] leading-tight">
              Join creators already earning
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 border-t border-gray-200 dark:border-white/10 pt-16 w-full max-w-[900px]"
        >
          {perks.map(({ Icon, label }, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-4 text-[#ff7a00]">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="text-gray-900 dark:text-white font-semibold text-lg">{label}</h4>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mt-24 border-t border-gray-200 dark:border-white/5 pt-12 overflow-hidden bg-gray-200/30 dark:bg-white/[0.02]">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="flex whitespace-nowrap"
        >
          {[...companies, ...companies, ...companies, ...companies].map((name, i) => (
            <div
              key={i}
              className="flex items-center gap-2 mx-12 text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white transition-all cursor-default font-bold text-xl tracking-tight"
            >
              {name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
