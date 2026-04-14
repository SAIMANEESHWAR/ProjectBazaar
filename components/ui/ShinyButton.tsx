"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const animationProps = {
  initial: { "--x": "100%", scale: 0.8 } as Record<string, string | number>,
  animate: { "--x": "-100%", scale: 1 } as Record<string, string | number>,
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop" as const,
    repeatDelay: 1,
    type: "spring" as const,
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring" as const,
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
};

const MOTION_BUTTON_CONFLICT_PROPS = [
  "onDrag",
  "onDragStart",
  "onDragEnd",
  "onDragConstraints",
  "onDirectionLock",
  "onDragTransition",
  "onAnimationStart",
  "onAnimationEnd",
  "onAnimationIteration",
] as const;

export interface ShinyButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | (typeof MOTION_BUTTON_CONFLICT_PROPS)[number]
  > {
  children: React.ReactNode;
  className?: string;
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(
          "relative cursor-pointer rounded-lg border px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow dark:bg-[radial-gradient(circle_at_50%_0%,var(--primary)/10%_0%,transparent_60%)] dark:hover:shadow-[0_0_20px_var(--primary)/10%]",
          "border-orange-200 bg-white/80 dark:border-orange-800 dark:bg-gray-900/80",
          "[--primary:theme(colors.orange.500)]",
          className
        )}
        {...animationProps}
        {...props}
      >
        <span
          className="relative block size-full text-sm tracking-wide text-[rgb(0,0,0,65%)] uppercase dark:font-light dark:text-[rgb(255,255,255,90%)]"
          style={{
            maskImage:
              "linear-gradient(-75deg,var(--primary) calc(var(--x) + 20%),transparent calc(var(--x) + 30%),var(--primary) calc(var(--x) + 100%))",
          }}
        >
          {children}
        </span>
        <span
          style={{
            mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
            WebkitMask:
              "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
            backgroundImage:
              "linear-gradient(-75deg,var(--primary)/10% calc(var(--x)+20%),var(--primary)/50% calc(var(--x)+25%),var(--primary)/10% calc(var(--x)+100%))",
          }}
          className="absolute inset-0 z-10 block rounded-[inherit] p-px [--primary:theme(colors.orange.500)]"
        />
      </motion.button>
    );
  }
);

ShinyButton.displayName = "ShinyButton";
