import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useNavigation, useAuth } from '../../App';

const MockInterviewSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const { navigateTo } = useNavigation();
  const { isLoggedIn } = useAuth();

  const handleSchedulePeerInterview = () => {
    if (!isLoggedIn) {
      navigateTo('auth');
    } else {
      navigateTo('mockAssessment');
    }
  };

  const handleStartAIInterview = () => {
    navigateTo('liveMockInterview');
  };

  return (
    <section
      ref={ref}
      className="relative py-20 md:py-32 overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-300"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-0 top-1/4 w-[400px] h-[400px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[120px]" />
        <div className="absolute right-0 bottom-1/4 w-[350px] h-[350px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-5 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Text content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight text-gray-900 dark:text-white mb-6">
              Practice mock interviews{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">
                with peers and AI
              </span>
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
              Join thousands of tech candidates practicing interviews to land jobs. Practice real questions over video chat in a collaborative environment with helpful AI feedback.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                onClick={handleSchedulePeerInterview}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                Schedule peer mock interview
              </motion.button>

              <motion.button
                onClick={handleStartAIInterview}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3.5 bg-white dark:bg-[#161616] border-2 border-gray-200 dark:border-white/10 hover:border-purple-500/50 dark:hover:border-purple-500/50 text-gray-900 dark:text-white font-semibold rounded-lg transition-all duration-300"
              >
                Start an AI interview
              </motion.button>
            </div>
          </motion.div>

          {/* Right side - Mock interview interface preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f]">
              {/* Browser chrome */}
              <div className="bg-gray-100 dark:bg-[#1a1a1a] px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-white/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Interview Session</span>
                </div>
              </div>

              {/* Mock interface content */}
              <div className="p-6 space-y-4">
                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 dark:border-white/10 pb-2">
                  <button className="text-sm font-semibold text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 pb-2">
                    Question
                  </button>
                  <button className="text-sm font-medium text-gray-400 dark:text-gray-500 pb-2">
                    Hints
                  </button>
                  <button className="text-sm font-medium text-gray-400 dark:text-gray-500 pb-2">
                    Solution
                  </button>
                </div>

                {/* Question content */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    1. Two Sum
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
                  </p>
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Input:</span> nums = [2,7,11,15], target = 9
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Output:</span> [0,1]
                    </p>
                  </div>
                </div>

                {/* Code editor mockup */}
                <div className="bg-[#1e1e1e] rounded-lg p-4 font-mono text-xs space-y-1 overflow-hidden">
                  <div className="text-gray-500">
                    <span className="text-purple-400">def</span>{' '}
                    <span className="text-yellow-300">twoSum</span>
                    <span className="text-gray-300">(self, nums, target):</span>
                  </div>
                  <div className="text-gray-500 pl-4">
                    <span className="text-purple-400">for</span>{' '}
                    <span className="text-gray-300">i</span>{' '}
                    <span className="text-purple-400">in</span>{' '}
                    <span className="text-blue-400">range</span>
                    <span className="text-gray-300">(</span>
                    <span className="text-blue-400">len</span>
                    <span className="text-gray-300">(nums)):</span>
                  </div>
                  <div className="text-gray-500 pl-8">
                    <span className="text-purple-400">for</span>{' '}
                    <span className="text-gray-300">j</span>{' '}
                    <span className="text-purple-400">in</span>{' '}
                    <span className="text-blue-400">range</span>
                    <span className="text-gray-300">(i + </span>
                    <span className="text-orange-400">1</span>
                    <span className="text-gray-300">, </span>
                    <span className="text-blue-400">len</span>
                    <span className="text-gray-300">(nums)):</span>
                  </div>
                  <div className="text-gray-500 pl-12">
                    <span className="text-purple-400">if</span>{' '}
                    <span className="text-gray-300">nums[i] + nums[j] == target:</span>
                  </div>
                  <div className="text-gray-500 pl-16">
                    <span className="text-purple-400">return</span>{' '}
                    <span className="text-gray-300">[i, j]</span>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Connected</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Time: 15:30
                  </div>
                </div>
              </div>

              {/* Video chat avatars */}
              <div className="absolute top-20 right-6 space-y-2">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white dark:border-[#0f0f0f] shadow-lg flex items-center justify-center text-white font-bold"
                >
                  AI
                </motion.div>
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-white dark:border-[#0f0f0f] shadow-lg flex items-center justify-center text-white font-bold"
                >
                  You
                </motion.div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -left-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
            >
              ✓ Real-time feedback
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
            >
              🎯 Practice coding
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MockInterviewSection;
