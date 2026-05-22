import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewCardData {
  id: number;
  role: string;
  company: string;
  logo: string;
  bgGif: string;
  interviewer: string;
  color: string;
  link: string;
}

const CARDS: InterviewCardData[] = [
  {
    id: 1,
    role: "Software Developer",
    company: "Google",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/google.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/google/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/google/Human.png",
    color: "#460299",
    link: "#",
  },
  {
    id: 2,
    role: "Product Manager",
    company: "Shaadi.com",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/shaadi-com.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/shaadi-com/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/shaadi-com/Human.png",
    color: "#460299",
    link: "#",
  },
  {
    id: 3,
    role: "Software Engineer",
    company: "Tesla",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/tesla.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/tesla/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/tesla/Human.png",
    color: "#460299",
    link: "#",
  },
  {
    id: 4,
    role: "Sales Lead",
    company: "Spotify",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/spotify.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/spotify/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/spotify/Human.png",
    color: "#460299",
    link: "#",
  },
  {
    id: 5,
    role: "Video Editor",
    company: "TVF",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/tvf.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/tvf/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/tvf/Human.png",
    color: "#460299",
    link: "#",
  },
  {
    id: 6,
    role: "Tour Manager",
    company: "Diljit Dosanjh",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/diljit-dosanjh.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/diljit-dosanjh/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/diljit-dosanjh/Human.png",
    color: "#460299",
    link: "#",
  },
  {
    id: 7,
    role: "Security Engineer",
    company: "OpenAI",
    logo: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/company_name/openai.webp",
    bgGif: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/openai/Card.gif",
    interviewer: "https://storage.googleapis.com/mumbai_apnatime_prod/interview-prep/carousels/openai/Human.png",
    color: "#460299",
    link: "#",
  },
];

const ROTATING_TITLE_WORDS = [
  { word: "Preparation", className: "text-[#1F8268]" },
  { word: "Hunt", className: "orange-gradient-text" },
] as const;

const JobRotatingTitle: React.FC = () => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_TITLE_WORDS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const current = ROTATING_TITLE_WORDS[wordIndex];

  return (
    <h2 className="inline-flex items-center gap-x-[0.35em] font-bold leading-none tracking-tight">
      <span className="text-[#190A28] dark:text-white">Job</span>
      <span className="relative inline-block h-[1.05em] min-w-[11.5ch] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={current.word}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 top-0 flex h-full items-center whitespace-nowrap",
              current.className
            )}
          >
            {current.word}
          </motion.span>
        </AnimatePresence>
      </span>
    </h2>
  );
};

const JobPrepAiIcon: React.FC = () => (
  <div className="size-[1.15em] shrink-0" aria-hidden="true">
    <div className="flex h-full w-full items-center justify-center rounded-[0.28em] bg-white p-[0.06em] shadow-sm dark:shadow-none">
      <div className="flex h-full w-full items-center justify-center rounded-[0.22em] bg-gradient-to-tr from-[#1F8268] via-[#7dd3a8] to-[#f5e6a3] p-[0.05em]">
        <div className="flex h-full w-full items-center justify-center rounded-[0.18em] bg-white">
          <span className="text-[0.42em] font-bold lowercase leading-none text-[#1F8268]">ai</span>
        </div>
      </div>
    </div>
  </div>
);

export const JobPrepSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CARDS.length);
  }, []);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + CARDS.length) % CARDS.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-10 z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center justify-center gap-[0.65em] text-4xl md:text-5xl md:justify-start">
              <JobPrepAiIcon />
              <JobRotatingTitle />
            </div>
            <p className="text-2xl md:text-3xl font-medium text-[#190A28] dark:text-gray-200 max-w-lg leading-snug">
              Prepare your interview with top companies.
              <br />
              Free AI mock interviews on{" "}
              <span className="orange-gradient-text font-semibold">CodeXCareer</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center min-h-[500px] w-full max-w-lg">
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-0 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#1F826880] hover:bg-[#1F8268] text-white transition-colors duration-300"
          aria-label="Previous interview"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-0 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-[#1F826880] hover:bg-[#1F8268] text-white transition-colors duration-300"
          aria-label="Next interview"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="relative w-full h-[400px] flex items-center justify-center">
          {CARDS.map((card, index) => {
            let position = index - currentIndex;
            if (position < -Math.floor(CARDS.length / 2)) position += CARDS.length;
            if (position > Math.floor(CARDS.length / 2)) position -= CARDS.length;
            const isCenter = position === 0;
            const isVisible = Math.abs(position) <= 2;
            if (!isVisible) return null;
            return (
              <motion.div
                key={card.id}
                initial={false}
                animate={{
                  x: position * 100,
                  scale: isCenter ? 1 : 0.8,
                  zIndex: 10 - Math.abs(position),
                  opacity: isVisible ? 1 - Math.abs(position) * 0.3 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className={cn(
                  "absolute w-[280px] h-[360px] cursor-pointer",
                  !isCenter && "pointer-events-none"
                )}
              >
                <InterviewCard card={card} active={isCenter} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const InterviewCard: React.FC<{
  card: InterviewCardData;
  active: boolean;
}> = ({ card, active }) => {
  return (
    <div
      className={cn(
        "relative w-full h-full rounded-[24px] overflow-hidden border-4 border-[#F4F2F6] transition-all duration-500",
        active ? "shadow-2xl scale-100" : "shadow-lg scale-95 opacity-80"
      )}
      style={{ backgroundColor: card.color }}
    >
      <img src={card.bgGif} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />

      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      <div className="relative z-[2] p-6 flex flex-col items-center">
        <h3 className="text-xl font-bold text-white text-center drop-shadow-md">{card.role}</h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="bg-white p-1 rounded-md shadow-sm">
            <img src={card.logo} alt={card.company} className="w-8 h-8 object-contain" />
          </div>
          <p className="text-lg font-semibold text-white drop-shadow-sm">{card.company}</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[1] w-full flex justify-center pointer-events-none">
        <img
          src={card.interviewer}
          alt="Interviewer"
          className="h-[280px] w-auto object-contain object-bottom"
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[2] p-6 flex flex-col items-center gap-2">
        <button
          type="button"
          className="px-6 py-2 rounded-full bg-[#1F8268] text-white font-bold text-sm hover:bg-[#196b56] transition-colors shadow-lg"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Practice Interview
        </button>
        <p className="text-xs font-medium text-white/90">5 min AI Interview</p>
      </div>
    </div>
  );
};

export default JobPrepSection;
