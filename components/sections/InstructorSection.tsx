import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'motion/react';
import { Youtube, Twitter, Linkedin, Instagram, Play } from 'lucide-react';

const InstructorSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const imgRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: imgRef, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], [-20, 20]);

  const socialIcons = [
    { icon: <Youtube className="w-5 h-5" />, href: '#' },
    { icon: <Twitter className="w-4 h-4" />, href: '#' },
    { icon: <Linkedin className="w-4 h-4" />, href: '#' },
    { icon: <Instagram className="w-4 h-4" />, href: '#' },
  ];

  return (
    <section ref={ref} className="relative py-24 md:py-32 px-5 overflow-hidden bg-[#f2f1ee] dark:bg-[#0a0a0a] transition-colors duration-300">
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="landing-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-12 md:mb-16"
        >
          <p className="text-[#a1a1a1] dark:text-gray-400 font-medium uppercase tracking-wider mb-4 text-sm">Behind ProjectBazaar</p>
          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-[#1a1a1a] dark:text-white">
            Built by makers, <br />
            <span className="text-[#ff7a00]">for makers</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <motion.div
            ref={imgRef}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative group rounded-[24px] overflow-hidden bg-gray-800 dark:bg-[#1a1a1a] aspect-square lg:aspect-auto min-h-[320px] border-[10px] border-gray-200 dark:border-[#1a1a1a]"
          >
            <motion.div style={{ y: imgY }} className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                alt="Team collaboration"
                className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 cursor-pointer"
              >
                <Play className="w-8 h-8 text-white fill-current translate-x-1" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-gray-900 dark:bg-[#0a0a0a] rounded-[24px] p-8 md:p-10 flex-1 border border-gray-700 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
              <div className="flex flex-col gap-6 mb-8">
                <h3 className="text-2xl md:text-[28px] font-bold text-white mb-1">Our mission</h3>
                <p className="text-[#a1a1a1] text-base">Turn every project into an opportunity.</p>
              </div>
              <div className="border-t border-white/10 pt-8 mt-4">
                <p className="text-[#a1a1a1] font-bold text-sm uppercase tracking-widest mb-4">Why we built this</p>
                <p className="text-white/90 text-lg leading-[1.6]">
                  &quot;We saw too many great projects end up in folders. Students, indie hackers, and freelancers deserved one place to sell, buy, and collaborate. ProjectBazaar is that place.&quot;
                </p>
              </div>
              <motion.div
                animate={{ opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-20 -right-20 w-[200px] h-[200px] bg-[#ff7a00] rounded-full blur-[80px] pointer-events-none"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="bg-gray-900 dark:bg-[#0a0a0a] rounded-[100px] py-4 px-8 border border-gray-700 dark:border-white/5 flex items-center justify-between transition-colors duration-300"
            >
              <div className="flex items-center gap-4">
                {socialIcons.map((social, idx) => (
                  <motion.a
                    key={idx}
                    href={social.href}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    className="w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
              <div className="text-white/40 text-sm font-medium">
                <span className="text-white">Follow us</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 pt-10 text-center border-t border-black/5 dark:border-white/10"
        >
          <p className="text-[#1a1a1a] dark:text-gray-300 font-semibold text-[15px] mb-8">As featured on</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 grayscale opacity-60">
            <span className="text-xl font-bold text-[#1a1a1a] dark:text-gray-400">TechFlow</span>
            <span className="text-xl font-bold text-[#1a1a1a] dark:text-gray-400">BuildHub</span>
            <span className="text-xl font-bold text-[#1a1a1a] dark:text-gray-400">CodeSphere</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InstructorSection;
