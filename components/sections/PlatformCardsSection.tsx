import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const IMAGES_BASE = '/images';

const cards = [
  {
    id: 'marketplace',
    title: 'Marketplace',
    description:
      'One trusted place to discover, buy, and sell projects. Whether you\'re a student with a capstone to monetize or a team looking for production-ready solutions, ProjectBazaar connects supply and demand with clear listings, secure payments, and real reviews.',
    image: `${IMAGES_BASE}/platform-marketplace.avif`,
    imagePosition: 'right' as const,
    alignment: 'left' as const,
    comingSoon: false,
  },
  {
    id: 'projects',
    title: 'Projects',
    description:
      'From academic projects to full applications—browse by tech stack, price, and delivery. Sellers get a simple way to list and earn; buyers get vetted projects with descriptions and support. No more endless searching across scattered platforms.',
    image: `${IMAGES_BASE}/platform-projects.avif`,
    imagePosition: 'right' as const,
    alignment: 'right' as const,
    comingSoon: false,
  },
  {
    id: 'freelancers-gigs',
    title: 'Freelancers & Gigs',
    description:
      'Find skilled freelancers who ship—not just promise. Post a project for bids or browse talent by skills and ratings. Hire for one-off gigs or ongoing work, with escrow and clear deliverables so you focus on building, not chasing.',
    image: `${IMAGES_BASE}/platform-freelancers-gigs.avif`,
    imagePosition: 'left' as const,
    alignment: 'left' as const,
    comingSoon: true,
  },
];

/* Per-card image styling to closely match the reference */
const imageStyles: Record<string, React.CSSProperties> = {
  marketplace: {
    width: '340px',
    height: '360px',
    right: '-20px',
    top: '-140px',
  },
  projects: {
    width: '320px',
    height: '350px',
    right: '-50px',
    top: '-130px',
  },
  'freelancers-gigs': {
    width: '310px',
    height: '350px',
    left: '-70px',
    bottom: '-70px',
  },
};

/* Card slides in from left or right based on alignment */
const getCardVariants = (alignment: 'left' | 'right') => ({
  hidden: {
    opacity: 0,
    x: alignment === 'left' ? -120 : 120,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
});

/* Image has a delayed parallax entrance from the opposite direction */
const getImageVariants = (imagePosition: 'left' | 'right') => ({
  hidden: {
    opacity: 0,
    x: imagePosition === 'left' ? -60 : 60,
    y: 30,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: 1,
      delay: 0.25,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
});

/* Each card has its own scroll observer so it animates independently */
const AnimatedCard: React.FC<{ card: (typeof cards)[number] }> = ({ card }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-60px' });
  const isImageLeft = card.imagePosition === 'left';
  const imgStyle = imageStyles[card.id] ?? {};
  const cardVariants = getCardVariants(card.alignment);
  const imageVariants = getImageVariants(card.imagePosition);

  return (
    <motion.article
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="w-full overflow-visible"
      style={{
        display: 'flex',
        justifyContent: card.alignment === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Card container */}
      <div
        className="relative rounded-[18px] bg-white dark:bg-[#1a1a1a] border border-[#e2e2e2] dark:border-[#2a2a2a] overflow-visible transition-colors duration-300"
        style={{
          width: '100%',
          maxWidth: '820px',
          minHeight: '190px',
        }}
      >
        <div
          className={`flex flex-col ${isImageLeft ? 'md:flex-row-reverse' : 'md:flex-row'} items-stretch`}
        >
          {/* Text content */}
          <div
            className={`flex-1 flex flex-col justify-center p-6 md:py-8 ${isImageLeft ? 'md:pl-8 md:pr-6' : 'md:pl-8 md:pr-2'
              }`}
            style={{ zIndex: 1 }}
          >
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <h3 className="text-[1.4rem] md:text-[1.8rem] font-bold text-[#1a1a1a] dark:text-white tracking-[-0.02em] leading-tight">
                {card.title}
              </h3>
              {card.comingSoon && (
                <span className="inline-flex items-center px-3 py-1 text-[0.7rem] font-medium text-[#555] dark:text-gray-400 border border-[#ccc] dark:border-gray-600 rounded-[4px] bg-transparent tracking-wide">
                  Coming soon
                </span>
              )}
            </div>
            <p
              className="text-[0.875rem] md:text-[0.925rem] text-[#555] dark:text-gray-400 leading-[1.75] max-w-[28rem]"
              style={{ fontWeight: 400 }}
            >
              {card.description}
            </p>
          </div>

          {/* Illustration — parallax delayed entrance, desktop only */}
          <div
            className="relative flex-shrink-0 hidden md:block"
            style={{ width: '220px' }}
          >
            <motion.div
              className="absolute pointer-events-none"
              variants={imageVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              style={{
                ...imgStyle,
                zIndex: 2,
              }}
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </div>

          {/* Mobile illustration */}
          <div className="md:hidden flex items-center justify-center px-6 pb-6">
            <div className="w-[140px] h-[160px]">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

const PlatformCardsSection: React.FC = () => {
  return (
    <section
      className="relative py-16 md:py-28 bg-[#F7F7F7] dark:bg-[#0f0f0f] overflow-visible transition-colors duration-300"
      id="platform"
    >
      <div className="max-w-[1100px] mx-auto px-5 md:px-8">
        <div className="flex flex-col gap-10 md:gap-8">
          {cards.map((card) => (
            <AnimatedCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformCardsSection;
