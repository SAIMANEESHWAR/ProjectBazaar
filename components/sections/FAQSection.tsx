import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { Plus } from 'lucide-react';
import { useNavigation } from '../../App';
import { CTAArrowIcon } from '../CTAArrowIcon';

const faqData = [
  {
    question: 'How do I sell my project?',
    answer: 'Sign up, create a listing with title, description, price, and category. Buyers can purchase directly. You get paid when the order is completed and both sides confirm.',
  },
  {
    question: 'Is it free to join?',
    answer: 'Yes. Creating an account and listing projects is free. We take a small fee only when a sale or hire happens, so we grow when you grow.',
  },
  {
    question: 'How do payments work?',
    answer: 'Payments are held securely until delivery. Once the buyer confirms they received what they paid for, funds are released to you. Disputes are handled by our support team.',
  },
  {
    question: 'Can I hire freelancers too?',
    answer: 'Absolutely. You can post a project and receive bids from freelancers, or browse freelancer profiles and invite them to work on your project.',
  },
  {
    question: 'What if I need help?',
    answer: 'We have a help center, FAQs, and support email. Reach out anytime—we’re here to help you succeed on the platform.',
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { navigateTo } = useNavigation();

  return (
    <section
      id="faqs"
      ref={ref}
      className="bg-gray-100 dark:bg-[#0a0a0a] text-gray-900 dark:text-white py-24 md:py-32 px-5 relative overflow-hidden transition-colors duration-300"
    >
      <div className="absolute inset-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-300" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-300" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="max-w-[800px] mx-auto flex flex-col items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="mb-12 text-center"
        >
          <p className="text-gray-500 dark:text-[#a1a1a1] uppercase tracking-[0.2em] text-sm font-semibold mb-4">FAQ</p>
          <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-white">
            Got Questions? <span className="text-[#ff7a00]">We&apos;ve got answers.</span>
          </h2>
        </motion.div>

        <div className="w-full space-y-2">
          {faqData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
              className="border border-gray-200 dark:border-[#262626] rounded-xl overflow-hidden bg-white dark:bg-[#141414] transition-colors duration-300"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">{item.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                  className="flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-gray-200 dark:bg-[#262626] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-gray-600 dark:text-[#a1a1a1]" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 dark:text-[#a1a1a1] leading-relaxed text-base md:text-lg">{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h3 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900 dark:text-white max-w-[400px] mx-auto">
            Still got questions? We&apos;re here to help.
          </h3>
          <motion.button
            onClick={() => navigateTo('faq')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] px-8 py-4 rounded-full text-white font-bold text-lg"
          >
            Visit Help Center
            <span className="bg-white rounded-full p-1 ml-1 group-hover:translate-x-1 transition-transform inline-flex">
              <CTAArrowIcon className="w-4 h-4 object-contain" />
            </span>
          </motion.button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-[#262626] to-transparent" />
    </section>
  );
};

export default FAQSection;
