import * as React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '../../App';

interface ResumeHeroCardProps {
  className?: string;
  title?: string;
  description?: string;
  linkText?: string;
  imageSrc?: string;
  imageAlt?: string;
}

/**
 * ResumeHeroCard - A premium, responsive hero card for promoting resume templates.
 * Recreates the provided design with a warm human touch and polished typography.
 */
export const ResumeHeroCard: React.FC<ResumeHeroCardProps> = ({
  className,
  title = 'Professional Resume Templates',
  description =
    'Browse dozens of recruiter approved resume templates, layouts and formats. Choose your favorite and make it your own in minutes.',
  linkText = 'Free Professional Resume Templates',
  imageSrc = 'https://www.monster.com/ResumeHero/monster-resume-templates-2x.png',
  imageAlt = 'Monster Professional Resume Templates hero',
}) => {
  const { navigateTo } = useNavigation();

  return (
    <section
      className={cn(
        'w-full max-w-[1200px] mx-auto py-12 md:py-16 px-4 md:px-8 lg:px-0',
        'flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16',
        className
      )}
    >
      <div className="relative w-full md:basis-1/2 flex justify-center md:justify-end">
        <div className="relative max-w-[534px] w-full group">
          <div
            className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-full h-full bg-[#F5F5F5] dark:bg-neutral-800 rounded-[22px] -z-10 transition-transform duration-300 group-hover:translate-x-1 group-hover:translate-y-1"
            aria-hidden="true"
          />

          <figure className="relative overflow-hidden rounded-[22px] bg-white dark:bg-[#141414] shadow-sm border border-neutral-100 dark:border-white/10">
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-auto object-cover block"
              loading="lazy"
            />
          </figure>
        </div>
      </div>

      <div className="w-full md:basis-1/2 flex flex-col items-start text-left md:p-12 lg:p-16">
        <h2 className="text-[#212121] dark:text-white text-3xl md:text-4xl lg:text-[32px] font-bold leading-tight mb-4 tracking-tight">
          {title}
        </h2>

        <p className="text-[#212121] dark:text-white/70 text-base md:text-lg leading-relaxed mb-6 opacity-90 max-w-xl">
          {description}
        </p>

        <button
          type="button"
          onClick={() => navigateTo('auth')}
          className={cn(
            'group inline-flex items-center gap-1.5 text-[#00788C] dark:text-[#2dd4a8] font-semibold text-base',
            'transition-colors duration-200 hover:text-[#005F6E] dark:hover:text-[#1F8268]'
          )}
        >
          <span className="border-b border-transparent group-hover:border-[#00788C] dark:group-hover:border-[#2dd4a8] transition-all">
            {linkText}
          </span>
          <ArrowUpRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </button>
      </div>
    </section>
  );
};

export default ResumeHeroCard;
