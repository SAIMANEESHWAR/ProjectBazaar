import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '../../App';

const HI = 'https://files.hellointerview.com/build-assets/PRODUCTION/_next/static/media';

type LogoPlacement = {
  name: string;
  className: string;
  size: number;
  opacity?: number;
  delay?: number;
  content: React.ReactNode;
};

const GoogleLogo = () => (
  <img
    alt=""
    src={`${HI}/google-square.0v3n9d4108zfs.svg?dpl=86f4ec5b4620f1836f69690a019834eb7c1e5bd6`}
    className="h-[58%] w-[58%] object-contain"
  />
);

const AmazonLogo = () => (
  <img
    alt=""
    src={`${HI}/amazon-icon.0u2y0dgp1rlnw.svg?dpl=86f4ec5b4620f1836f69690a019834eb7c1e5bd6`}
    className="h-[58%] w-[58%] object-contain"
  />
);

const MicrosoftLogo = () => (
  <img
    alt=""
    src={`${HI}/microsoft.17j4k5_o3lv8a.svg?dpl=86f4ec5b4620f1836f69690a019834eb7c1e5bd6`}
    className="h-[58%] w-[58%] object-contain"
  />
);

const MetaLogo = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="#0081FB" aria-hidden>
    <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" />
  </svg>
);

const OpenAILogo = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="#412991" aria-hidden>
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const NetflixLogo = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="#E50914" aria-hidden>
    <path d="m5.398 0 8.348 23.602c2.346.059 4.856.398 4.856.398L10.113 0H5.398zm8.489 0v9.172l4.715 13.33V0h-4.715zM5.398 1.5V24c1.873-.225 2.81-.312 4.715-.398V14.83L5.398 1.5z" />
  </svg>
);

const StripeLogo = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="#635BFF" aria-hidden>
    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
  </svg>
);

const UberLogo = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden>
    <path d="M0 7.97v4.958c0 1.867 1.302 3.101 3 3.101.826 0 1.562-.316 2.094-.87v.736H6.27V7.97H5.082v4.888c0 1.257-.85 2.106-1.947 2.106-1.11 0-1.946-.827-1.946-2.106V7.971H0zm7.44 0v7.925h1.13v-.725c.521.532 1.257.86 2.06.86a3.006 3.006 0 0 0 3.034-3.01 3.01 3.01 0 0 0-3.033-3.024 2.86 2.86 0 0 0-2.049.861V7.971H7.439zm9.869 2.038c-1.687 0-2.965 1.37-2.965 3 0 1.72 1.334 3.01 3.066 3.01 1.053 0 1.913-.463 2.49-1.233l-.826-.611c-.43.577-.996.847-1.664.847-.973 0-1.753-.7-1.912-1.64h4.697v-.373c0-1.72-1.222-3-2.886-3zm6.295.068c-.634 0-1.098.294-1.381.758v-.713h-1.131v5.774h1.142V12.61c0-.894.544-1.47 1.291-1.47H24v-1.065h-.396zm-6.319.928c.85 0 1.564.588 1.756 1.47H15.52c.203-.882.916-1.47 1.765-1.47zm-6.732.012c1.086 0 1.98.883 1.98 2.004a1.993 1.993 0 0 1-1.98 2.001A1.989 1.989 0 0 1 8.56 13.02a1.99 1.99 0 0 1 1.992-2.004z" />
  </svg>
);

const AnthropicLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#D4A27F" aria-hidden>
    <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
  </svg>
);

/** Orbital placements within the wide hero frame (xl+), matched to reference layout */
const FLOATING_LOGOS: LogoPlacement[] = [
  {
    name: 'Google',
    className: 'left-[4%] top-[6%]',
    size: 54,
    opacity: 0.65,
    delay: 0.1,
    content: <GoogleLogo />,
  },
  {
    name: 'Meta',
    className: 'left-[1%] top-[34%]',
    size: 66,
    opacity: 1,
    delay: 0.2,
    content: <MetaLogo />,
  },
  {
    name: 'Amazon',
    className: 'left-[7%] top-[58%]',
    size: 54,
    opacity: 0.65,
    delay: 0.3,
    content: <AmazonLogo />,
  },
  {
    name: 'OpenAI',
    className: 'left-[3%] top-[76%]',
    size: 66,
    opacity: 1,
    delay: 0.45,
    content: <OpenAILogo />,
  },
  {
    name: 'Netflix',
    className: 'right-[7%] top-[8%]',
    size: 54,
    opacity: 0.65,
    delay: 0.15,
    content: <NetflixLogo />,
  },
  {
    name: 'Stripe',
    className: 'right-[2%] top-[32%]',
    size: 66,
    opacity: 1,
    delay: 0.25,
    content: <StripeLogo />,
  },
  {
    name: 'Uber',
    className: 'right-[5%] top-[54%]',
    size: 66,
    opacity: 1,
    delay: 0.35,
    content: <UberLogo />,
  },
  {
    name: 'Anthropic',
    className: 'right-[1%] top-[48%]',
    size: 54,
    opacity: 0.65,
    delay: 0.45,
    content: <AnthropicLogo />,
  },
  {
    name: 'Microsoft',
    className: 'right-[6%] top-[72%]',
    size: 54,
    opacity: 0.65,
    delay: 0.55,
    content: <MicrosoftLogo />,
  },
];

const FloatingLogoBubble: React.FC<{ logo: LogoPlacement }> = ({ logo }) => (
  <motion.div
    className={cn(
      'absolute flex items-center justify-center',
      logo.className
    )}
    style={{ opacity: logo.opacity ?? 1 }}
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{
      opacity: logo.opacity ?? 1,
      scale: 1,
      y: [0, -6, 0],
    }}
    transition={{
      opacity: { duration: 0.6, delay: logo.delay ?? 0 },
      scale: { duration: 0.6, delay: logo.delay ?? 0 },
      y: { duration: 5 + (logo.delay ?? 0), repeat: Infinity, ease: 'easeInOut' },
    }}
    aria-hidden
  >
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#141414] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.04)_inset]"
      style={{ width: logo.size, height: logo.size }}
    >
      {logo.content}
    </div>
  </motion.div>
);

export const InterviewPrepBlackHero: React.FC = () => {
  const { navigateTo } = useNavigation();

  return (
    <section className="relative w-full overflow-x-clip bg-black pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(31,130,104,0.12),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_50%_55%,rgba(31,130,104,0.06),transparent_70%)]" />

      <div className="relative mx-auto min-h-[520px] max-w-[1200px] px-6 lg:min-h-[580px] lg:px-12">
        {/* Logo orbit — full hero width so icons sit in side margins */}
        <div className="pointer-events-none absolute inset-0 hidden xl:block" aria-hidden>
          {FLOATING_LOGOS.map((logo) => (
            <FloatingLogoBubble key={logo.name} logo={logo} />
          ))}
        </div>

        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center justify-center py-8 text-center lg:min-h-[580px] lg:py-0">
        <motion.div
            className="flex w-full flex-col items-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-sans text-[36px] font-bold leading-[1.12] tracking-tight text-white sm:text-[48px] md:text-[56px] lg:text-[64px]">
            How top software engineers
            <br />
            <span className="relative inline-block">
              <span
                className="pointer-events-none absolute -inset-x-4 -inset-y-2 rounded-2xl bg-[#1F8268]/25 blur-2xl"
                aria-hidden
              />
              <span className="relative bg-gradient-to-r from-[#2dd4a8] via-[#1F8268] to-[#14b8a6] bg-clip-text text-transparent">
                prepare for interviews
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-[540px] text-base leading-relaxed text-[#94a3b8] sm:text-lg md:mt-8">
            Practical interview prep loved by 100,000+ software engineers and managers.
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <motion.button
              type="button"
              onClick={() => navigateTo('auth')}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-transparent px-8 text-[15px] font-medium text-white transition-colors hover:border-white/35 hover:bg-white/[0.06]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Buy Premium
            </motion.button>
            <motion.button
              type="button"
              onClick={() => navigateTo('codingQuestions')}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1e293b] px-8 text-[15px] font-medium text-white shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-colors hover:bg-[#273549]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start with System Design
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </motion.button>
          </div>

          <p className="mt-6 text-sm text-[#64748b]">Start free. Go deep when you&apos;re ready.</p>
        </motion.div>
        </div>

        {/* Mobile / tablet logo strip */}
        <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-3 xl:hidden">
          {FLOATING_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-[#141414]"
              style={{ opacity: logo.opacity ?? 1 }}
            >
              {logo.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InterviewPrepBlackHero;
