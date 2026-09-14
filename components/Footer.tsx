import React from 'react';
import { useNavigation } from '../App';
import { CODEXCAREER_LOGO_SRC } from '../lib/brandAssets';

const SocialIcon: React.FC<{ href: string; children: React.ReactNode; label: string }> = ({ href, children, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-[#e8e6e1] hover:border-[#ff7a00] transition-all duration-200 shadow-sm text-[#666] hover:text-[#ff7a00]"
    aria-label={label}
  >
    {children}
  </a>
);

const Footer: React.FC = () => {
  const { navigateTo } = useNavigation();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#f2f1ee] pt-24 md:pt-32 pb-12 md:pb-16 px-5 sm:px-10 font-sans text-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-x-8">
          {/* Logo and description */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center">
              <img
                src={CODEXCAREER_LOGO_SRC}
                alt="CodeXCareer — codexcareer, CODE • LEARN • LAUNCH"
                width={260}
                height={56}
                className="h-11 w-auto max-w-full object-contain object-left md:h-12"
              />
            </div>
            <p className="text-base md:text-lg leading-relaxed text-[#666] max-w-[280px]">
              All-in-one career platform for students—placement prep, ATS resumes, AI mock interviews, coding practice, and projects.
            </p>
            <div className="flex gap-4 mt-4 lg:mt-8">
              <SocialIcon href="https://github.com/SAIMANEESHWAR/ProjectBazaar" label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </SocialIcon>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-8">
            <h4 className="text-lg md:text-xl font-bold">Links</h4>
            <ul className="flex flex-col gap-4 text-base text-[#666]">
              <li><button onClick={() => scrollTo('projects')} className="hover:text-[#ff7a00] transition-colors text-left">Projects</button></li>
              <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-[#ff7a00] transition-colors text-left">How it works</button></li>
              <li><a href="/pricing" className="hover:text-[#ff7a00] transition-colors">Pricing</a></li>
              <li><button onClick={() => navigateTo('faq')} className="hover:text-[#ff7a00] transition-colors text-left">FAQs</button></li>
              <li><a href="/blog" className="hover:text-[#ff7a00] transition-colors">Comparisons &amp; Blog</a></li>
              <li><a href="/placement-preparation" className="hover:text-[#ff7a00] transition-colors">Placement prep</a></li>
              <li><a href="/ats-resume-builder" className="hover:text-[#ff7a00] transition-colors">ATS resume</a></li>
              <li><a href="/compare/codexcareer-vs-upwork" className="hover:text-[#ff7a00] transition-colors">vs Upwork</a></li>
              <li><a href="/compare/codexcareer-vs-leetcode" className="hover:text-[#ff7a00] transition-colors">vs LeetCode</a></li>
              <li><a href="/about" className="hover:text-[#ff7a00] transition-colors">About</a></li>
            </ul>
          </div>

          <div className="hidden lg:block" />

          {/* Legal */}
          <div className="flex flex-col gap-8">
            <h4 className="text-lg md:text-xl font-bold">Legal</h4>
            <ul className="flex flex-col gap-4 text-base text-[#666]">
              <li><button onClick={() => navigateTo('terms')} className="hover:text-[#ff7a00] transition-colors text-left">Terms of Service</button></li>
              <li><button onClick={() => navigateTo('privacy')} className="hover:text-[#ff7a00] transition-colors text-left">Privacy Policy</button></li>
            </ul>
            <div className="mt-4">
              <p className="text-sm text-[#666]">Support: <a href="mailto:support@codexcareer.com" className="hover:text-[#ff7a00]">support@codexcareer.com</a></p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#e8e6e1] flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#666]">
          <p>© {new Date().getFullYear()} CodeXCareer.</p>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
