import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  duration = 2000,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const startTime = performance.now();
    startTimeRef.current = startTime;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) return;

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;

      setDisplayValue(Math.floor(currentValue));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  // Format number with K, M suffixes for large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
    }
    if (num >= 1000) {
      const kValue = num / 1000;
      // If it's a whole number, don't show decimals
      return kValue % 1 === 0 ? kValue.toString() + 'k' : kValue.toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <span className={className}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </span>
  );
};

interface RotatingStatsProps {
  stats: Array<{ value: number; label: string; suffix?: string }>;
  rotationInterval?: number;
  className?: string;
}

export const RotatingStats: React.FC<RotatingStatsProps> = ({
  stats,
  rotationInterval = 3000,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % stats.length);
        setIsTransitioning(false);
      }, 300);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [stats.length, rotationInterval]);

  const currentStat = stats[currentIndex];

  return (
    <div className={`text-center ${className}`}>
      <div className="text-5xl md:text-6xl font-bold text-white mb-2 block min-h-[4rem] flex items-center justify-center">
        <AnimatedCounter
          value={currentStat.value}
          suffix={currentStat.suffix || '+'}
          className="transition-opacity duration-300"
          duration={1500}
        />
      </div>
      <div
        className={`text-white/60 text-lg transition-opacity duration-500 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {currentStat.label}
      </div>
    </div>
  );
};

