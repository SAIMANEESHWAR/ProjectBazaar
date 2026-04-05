import React, { useId } from 'react';

/** Two-star mark from pink_star.svg — gradients #CB5BB2 → #F3747B */
export function PinkJobHuntStar({
  className = '',
  'aria-hidden': ariaHidden = true,
}: {
  className?: string;
  'aria-hidden'?: boolean;
}) {
  const safeId = useId().replace(/:/g, '');
  const paint0 = `pink_star_g0_${safeId}`;
  const paint1 = `pink_star_g1_${safeId}`;

  return (
    <svg
      width="10"
      height="11"
      viewBox="0 0 10 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d="M3.81243 0.506901C3.87686 0.332777 4.12314 0.332777 4.18757 0.506901L5.04845 2.83339C5.06871 2.88813 5.11187 2.93129 5.16661 2.95155L7.4931 3.81243C7.66722 3.87686 7.66722 4.12314 7.4931 4.18757L5.16661 5.04845C5.11187 5.06871 5.06871 5.11187 5.04845 5.16661L4.18757 7.4931C4.12314 7.66722 3.87686 7.66722 3.81243 7.4931L2.95155 5.16661C2.93129 5.11187 2.88813 5.06871 2.83339 5.04845L0.506901 4.18757C0.332777 4.12314 0.332777 3.87686 0.506901 3.81243L2.83339 2.95155C2.88813 2.93129 2.93129 2.88813 2.95155 2.83339L3.81243 0.506901Z"
        fill={`url(#${paint0})`}
      />
      <path
        d="M7.31243 6.5069C7.37686 6.33278 7.62314 6.33278 7.68757 6.5069L8.14331 7.73852C8.16357 7.79327 8.20673 7.83643 8.26148 7.85669L9.4931 8.31243C9.66722 8.37686 9.66722 8.62314 9.4931 8.68757L8.26148 9.14331C8.20673 9.16357 8.16357 9.20673 8.14331 9.26148L7.68757 10.4931C7.62314 10.6672 7.37686 10.6672 7.31243 10.4931L6.85669 9.26148C6.83643 9.20673 6.79327 9.16357 6.73852 9.14331L5.5069 8.68757C5.33278 8.62314 5.33278 8.37686 5.5069 8.31243L6.73852 7.85669C6.79327 7.83643 6.83643 7.79327 6.85669 7.73852L7.31243 6.5069Z"
        fill={`url(#${paint1})`}
      />
      <defs>
        <linearGradient
          id={paint0}
          x1="0.114286"
          y1="2.66667"
          x2="7.78271"
          y2="2.84325"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#CB5BB2" />
          <stop offset="1" stopColor="#F3747B" />
        </linearGradient>
        <linearGradient
          id={paint1}
          x1="5.07143"
          y1="7.66667"
          x2="9.8642"
          y2="7.77703"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#CB5BB2" />
          <stop offset="1" stopColor="#F3747B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
