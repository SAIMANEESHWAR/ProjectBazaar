import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { DiaTextReveal } from "./ui/dia-text-reveal"
import { PinkJobHuntStar } from "./icons/PinkJobHuntStar"

const TAGLINE = "Get ready for your dream job."

const REVEAL_DURATION = 1.5
const REVEAL_DELAY = 0.2
const HOLD_AFTER_REVEAL_MS = 1200
const INTRO_PLAY_MS = (REVEAL_DURATION + REVEAL_DELAY) * 1000 + HOLD_AFTER_REVEAL_MS
const FADE_OUT_MS = 900

interface JobHuntIntroOverlayProps {
  visible: boolean
  onComplete: () => void
}

const JobHuntIntroOverlay: React.FC<JobHuntIntroOverlayProps> = ({
  visible,
  onComplete,
}) => {
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<"idle" | "playing" | "closing">("idle")
  const completedRef = useRef(false)

  useEffect(() => {
    if (!visible) {
      setPhase("idle")
      completedRef.current = false
      return
    }

    setPhase("playing")
    completedRef.current = false

    if (prefersReducedMotion) {
      const timer = window.setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true
          onComplete()
        }
      }, 700)
      return () => window.clearTimeout(timer)
    }

    const closeTimer = window.setTimeout(() => setPhase("closing"), INTRO_PLAY_MS)
    return () => window.clearTimeout(closeTimer)
  }, [visible, prefersReducedMotion, onComplete])

  useEffect(() => {
    if (phase !== "closing") return
    const finishTimer = window.setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete()
      }
    }, FADE_OUT_MS)
    return () => window.clearTimeout(finishTimer)
  }, [phase, onComplete])

  const isClosing = phase === "closing"

  return (
    <AnimatePresence>
      {visible && phase !== "idle" && (
        <motion.div
          key="job-hunt-intro"
          className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: isClosing ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: isClosing ? FADE_OUT_MS / 1000 : 0.45,
            ease: [0.4, 0, 0.2, 1],
          }}
          aria-live="polite"
          aria-label="Entering Job Hunt"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 55% 45% at 50% 48%, rgba(244,114,182,0.16) 0%, transparent 70%)",
            }}
            aria-hidden
          />

          <motion.div
            className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 text-center sm:px-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isClosing ? 0 : 1,
              y: isClosing ? -20 : 0,
              scale: isClosing ? 1.03 : 1,
            }}
            transition={{
              duration: isClosing ? FADE_OUT_MS / 1000 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="mb-10 inline-flex items-center gap-2.5 rounded-full border border-white/35 bg-white/15 px-5 py-2.5 shadow-[0_0_24px_rgba(255,255,255,0.08)] backdrop-blur-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <PinkJobHuntStar className="h-4 w-4 shrink-0 animate-pink-star-shine" aria-hidden />
              <span className="text-sm font-bold uppercase tracking-[0.22em] text-white sm:text-base">
                Job Hunt
              </span>
            </motion.div>

            <motion.h1
              className="w-full py-2 text-white"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <DiaTextReveal
                text={TAGLINE}
                className="text-[clamp(1.75rem,5.5vw,4.5rem)] font-bold leading-tight tracking-tight"
                colors={["#22d3ee", "#818cf8", "#f472b6", "#34d399"]}
                textColor="#ffffff"
                startOnView={false}
                once={false}
                duration={REVEAL_DURATION}
                delay={REVEAL_DELAY}
              />
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default JobHuntIntroOverlay
