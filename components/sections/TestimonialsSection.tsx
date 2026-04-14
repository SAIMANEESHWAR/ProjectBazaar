import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Quote, MoveRight, MoveLeft } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string;
  before: string;
  after: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Alex Chen',
    role: 'CS Graduate',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop',
    before: '"I had no idea where to sell my final-year project. It just sat on GitHub."',
    after: '"I listed it on ProjectBazaar and sold it within two weeks. Now I list every project I build."',
  },
  {
    id: 2,
    name: 'Samira Khan',
    role: 'Startup Founder',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop',
    before: '"We needed an MVP fast. Hiring a full team was too slow and expensive."',
    after: '"I bought a ready-made dashboard and customized it. Launched in a month. Game changer."',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    role: 'Freelance Developer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop',
    before: '"I was tired of cold outreach and lowball gigs on generic platforms."',
    after: '"ProjectBazaar connects me with buyers who actually want quality. My earnings doubled."',
  },
  {
    id: 4,
    name: 'Riley Moore',
    role: 'Product Manager',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop',
    before: '"I needed a prototype for investor demos but had no dev budget."',
    after: '"Found a similar project, bought it, and tweaked the copy. Closed our seed round."',
  },
];

const TestimonialsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });
  const dragRef = useRef<HTMLDivElement>(null);

  return (
    <section id="reviews" ref={sectionRef} className="bg-[#f2f1ee] dark:bg-[#0f0f0f] py-24 md:py-32 overflow-hidden transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-5 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center"
        >
          <p className="text-[#a1a1a1] dark:text-gray-400 uppercase tracking-widest text-sm font-semibold mb-4">Testimonials</p>
          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-[#1a1a1a] dark:text-gray-100 leading-[1.1] tracking-tight">
            Real People. <span className="text-[#ff7a00]">Real Results.</span>
          </h2>
        </motion.div>
      </div>

      <motion.div
        ref={dragRef}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-5 md:px-10 lg:px-20 overflow-x-auto scrollbar-hide"
      >
        <motion.div
          drag="x"
          dragConstraints={dragRef}
          dragElastic={0.1}
          className="flex gap-6 cursor-grab active:cursor-grabbing select-none pb-4"
          style={{ width: 'max-content' }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.15 + i * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="w-[340px] md:w-[380px] bg-white dark:bg-[#1a1a1a] rounded-[24px] p-8 shadow-sm border border-[#e8e8e8] dark:border-[#262626] flex-shrink-0 transition-colors duration-300"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#f2f1ee] dark:border-[#333]">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[#1a1a1a] dark:text-white font-bold text-lg leading-tight">{t.name}</h4>
                    <p className="text-[#a1a1a1] dark:text-gray-400 text-xs mt-1 font-medium">{t.role}</p>
                    <div className="mt-2 flex items-center gap-1">
                      {[...Array(5)].map((_, si) => (
                        <svg key={si} width="12" height="12" viewBox="0 0 24 24" fill="#ff7a00">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <Quote className="text-[#ff7a00] opacity-20 shrink-0" size={32} />
              </div>

              <div className="mb-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1a1] dark:text-gray-400 mb-3">Before</div>
                <div className="border-b border-dashed border-[#e8e8e8] dark:border-[#333] pb-6">
                  <p className="text-[#444] dark:text-gray-300 text-sm leading-relaxed italic">{t.before}</p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] dark:bg-[#262626] rounded-2xl p-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1a1] dark:text-gray-400 mb-3 opacity-60">After</div>
                <p className="text-white text-sm leading-relaxed font-medium">{t.after}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-3 mt-10 text-[#a1a1a1] dark:text-gray-400 text-sm"
      >
        <MoveLeft size={16} />
        <span>Drag to explore</span>
        <MoveRight size={16} />
      </motion.div>
    </section>
  );
};

export default TestimonialsSection;
