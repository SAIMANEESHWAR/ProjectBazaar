import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '../../App';

/**
 * ResumeBuilderHero - Black hero section for the free resume builder.
 */
export const ResumeBuilderHero: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="w-full bg-black font-sans selection:bg-[#1F8268]/20 selection:text-[#2dd4a8]">
      <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16 lg:py-24">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16 lg:gap-24">
          <div className="flex w-full flex-col items-start text-left md:w-1/2">
            <h1 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[40px] lg:leading-[48px]">
              Free Resume Builder
            </h1>

            <p className="mb-8 max-w-[520px] text-lg leading-relaxed text-white/70 md:text-xl">
              Improve your existing resume or start from scratch and create a standout, ATS-friendly resume.
              Add job-specific content, download and apply.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className={cn(
                  'group inline-flex items-center gap-2 text-base font-semibold text-[#2dd4a8] transition-all duration-200',
                  'hover:text-[#1F8268] hover:underline underline-offset-4'
                )}
                aria-label="Start building your resume for free"
              >
                <span>Free Resume Builder</span>
                <ArrowUpRight
                  className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-[#64748b]">
              <div className="h-1 w-1 rounded-full bg-[#1F8268]/40" />
              <span>No credit card required</span>
              <div className="h-1 w-1 rounded-full bg-[#1F8268]/40" />
              <span>Download in PDF & Word</span>
            </div>
          </div>

          <div className="relative w-full md:w-1/2">
            <div className="relative mx-auto max-w-[534px]">
              <div
                className="absolute left-2 top-2 h-full w-full rounded-[22px] bg-[#1F8268]/10 md:left-3 md:top-3"
                aria-hidden="true"
              />

              <figure className="relative z-10 overflow-hidden rounded-[22px] bg-[#141414] shadow-[0_8px_40px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.08]">
                <picture>
                  <source
                    srcSet="https://www.monster.com/ResumeHero/monster-resume-builder-2x.png"
                    type="image/png"
                  />
                  <img
                    src="https://www.monster.com/ResumeHero/monster-resume-builder.png"
                    alt="Preview of the Monster Free Resume Builder interface showing a clean layout and editing tools"
                    className="aspect-[534/358] h-auto w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </picture>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeBuilderHero;
