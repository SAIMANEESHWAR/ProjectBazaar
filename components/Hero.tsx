import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useNavigation } from '../App';
import { CTAArrowIcon } from './CTAArrowIcon';

const TYPEWRITER_PHRASES = [
  'Sell your capstone project and earn real revenue',
  'Buy production-ready apps and save months of dev time',
  'Find freelancers who ship—not just promise',
  'Turn academic projects into assets that pay you back',
  'Discover. Build. Earn.—all in one marketplace.',
];

function useTypewriter(phrases: string[], speed = 45, pause = 1800) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx((c) => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx((c) => c - 1), speed / 2.5);
    } else {
      setDeleting(false);
      setPhraseIdx((p) => (p + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  useEffect(() => {
    setDisplayed(phrases[phraseIdx].slice(0, charIdx));
  }, [charIdx, phraseIdx, phrases]);

  return displayed;
}

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs);
  useEffect(() => {
    const iv = setInterval(() => setRemaining((r) => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(iv);
  }, []);
  const d = Math.floor(remaining / 86400000);
  const h = Math.floor((remaining % 86400000) / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return { d, h, m, s };
}

const Pad = (n: number) => String(n).padStart(2, '0');

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: 'easeOut' as const, delay: i * 0.12 },
  }),
};

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
];

const Hero: React.FC = () => {
  const { navigateTo } = useNavigation();
  const text = useTypewriter(TYPEWRITER_PHRASES);
  const { d, h, m, s } = useCountdown(6 * 86400000);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  return (
    <header
      ref={ref}
      className="relative w-full overflow-hidden bg-[#f5f5f5] dark:bg-[#0a0a0a] pt-32 pb-20 md:pt-40 md:pb-32 transition-colors duration-300"
    >
      {/* Background grid parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-10 dark:opacity-0 transition-opacity duration-300"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            backgroundPosition: 'center top',
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-10 transition-opacity duration-300"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: '60px 60px', backgroundPosition: 'center top' }}
        />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#ff7a0015] dark:bg-[#ff7a001a] blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-black/5 dark:bg-[#ffffff05] blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[50%] bg-gradient-to-t from-[#f5f5f5] dark:from-[#0a0a0a] via-transparent to-transparent z-10" />
      </motion.div>

      <div className="landing-container relative z-10 flex flex-col items-center">
        {/* Countdown */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-8 flex items-center justify-center"
        >
          <div className="flex items-center gap-0 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
            <div className="bg-gray-200/80 dark:bg-[#1a1a1a] px-4 py-2 text-[14px] font-medium text-gray-700 dark:text-white/80 whitespace-nowrap font-sans">
              Limited time offer ends in
            </div>
            <div className="bg-white dark:bg-white px-4 py-2 text-[14px] font-bold text-black font-mono tabular-nums font-sans">
              {Pad(d)} : {Pad(h)} : {Pad(m)} : {Pad(s)}
            </div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="max-w-[1000px] text-center mb-10"
        >
          <h1 className="text-[44px] md:text-[72px] lg:text-[80px] font-extrabold leading-[1.08] tracking-tight text-gray-900 dark:text-white font-sans">
            Discover. Build. &{' '}
            <span className="orange-gradient-text italic">Earn.</span>
          </h1>
        </motion.div>

        {/* Typewriter prompt box */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="w-full max-w-[680px] mb-12"
        >
          <div className="rounded-[16px] p-6 shadow-2xl bg-white/80 dark:glass-panel border border-gray-200/80 dark:border-white/10 dark:bg-[#1a1a1a]/40 backdrop-blur-[12px]">
            <div className="text-gray-800 dark:text-white/90 text-lg md:text-xl font-medium mb-8 min-h-[56px] flex items-start font-sans">
              <span>{text}</span>
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-[3px] h-[24px] bg-[#ff7a00] ml-1 mt-1 flex-shrink-0"
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/5">
              <button type="button" className="flex items-center gap-2 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60 transition-colors text-sm font-medium font-sans">
                <span className="text-xl">+</span>
                <div className="flex items-center gap-1.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Tools
                </div>
              </button>
              <div className="flex items-center gap-3">
                <button type="button" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-500 dark:text-white/40">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </button>
                <button type="button" className="p-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                    <path d="M12 2v2M12 20v2M20 12h2M2 12h2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA + Avatars */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col md:flex-row items-center gap-8 mb-20"
        >
          <motion.button
            onClick={() => navigateTo('auth')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary-orange group h-[60px] px-8 text-lg font-semibold flex items-center justify-between min-w-[260px] font-sans"
          >
            <span>Join now — it&apos;s free</span>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center ml-4 group-hover:scale-110 transition-transform">
              <CTAArrowIcon className="w-4 h-[14px] object-contain" />
            </div>
          </motion.button>

          <div className="flex items-center gap-12 relative">
            <div className="flex -space-x-3">
              {AVATARS.map((src, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.08 }}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-[#1a1a1a] overflow-hidden relative"
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
            <div className="relative">
              <p className="text-gray-500 dark:text-[#a1a1a1] uppercase text-[12px] font-bold tracking-widest leading-tight w-[200px] font-sans">
                2k+ creators are already ahead of you.
              </p>
              <div className="absolute top-1/2 left-[-60px] transform -translate-y-1/2 rotate-[-10deg] hidden md:block opacity-40 text-gray-400 dark:text-white">
                <svg width="45" height="32" viewBox="0 0 45 32" fill="none" className="stroke-current">
                  <path d="M1 31C5 25 10 10 44 1" strokeWidth="2" strokeLinecap="round" />
                  <path d="M38 6L44 1L37 1.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Video / Hero visual */}
        <motion.div
          style={{ y: videoY }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="w-full max-w-[1140px] relative mt-10"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 60px rgba(255,122,0,0.1)',
                '0 0 100px rgba(255,122,0,0.25)',
                '0 0 60px rgba(255,122,0,0.1)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative aspect-video rounded-[24px] overflow-hidden border border-gray-200 dark:border-white/10 group"
          >
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop"
              alt="Project Bazaar"
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-full bg-[#ff7a00] flex items-center justify-center cursor-pointer shadow-[0_0_30px_rgba(255,122,0,0.4)]"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
};

export default Hero;
