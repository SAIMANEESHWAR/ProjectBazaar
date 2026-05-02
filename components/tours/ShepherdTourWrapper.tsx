import React, { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import type { Tour } from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './shepherd-tour.css';
import { useAuth, useNavigation } from '../../App';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TOUR_TARGET_SELECTORS = [
  '[data-tour="job-hunt-card"]',
  '[data-tour="prep-mode-card"]',
  '[data-tour="live-ai-card"]',
  '[data-tour="ats-card"]',
] as const;

const DOM_WAIT_TIMEOUT_MS  = 8_000;
const DOM_SETTLE_DELAY_MS  = 300;
const MAX_RETRIES          = 1;

const tourKey = (uid: string) => `tourDone_${uid}`;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface ShepherdTourWrapperProps {
  children: React.ReactNode;
}

type StartTourOptions = {
  force?: boolean;
};

declare global {
  interface Window {
    startTour?: (options?: StartTourOptions) => Promise<void>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// (A) CONTROLLER LOGIC
// Unified async controller — both auto-start and manual trigger run through here.
// All cancellation is handled via a single AbortController signal.
// No global flags, no mixed patterns.
// ─────────────────────────────────────────────────────────────────────────────

/** Waits until all selectors are present in the DOM, or timeout/abort occurs.
 *  Uses rAF when tab is visible, setTimeout(100) when hidden — both paths check abort. */
function waitForSelectors(
  selectors: readonly string[],
  timeoutMs: number,
  signal: AbortSignal,
): Promise<'ready' | 'timeout' | 'aborted'> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve('aborted');

    const start = Date.now();

    const tick = () => {
      if (signal.aborted)                    return resolve('aborted');
      if (Date.now() - start > timeoutMs)    return resolve('timeout');

      if (selectors.every((s) => document.querySelector(s) !== null)) {
        return resolve('ready');
      }

      // rAF is suspended in background tabs — fall back to setTimeout there
      if (document.visibilityState === 'hidden') {
        setTimeout(tick, 100);
      } else {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);

    // Also resolve immediately if aborted externally while waiting
    signal.addEventListener('abort', () => resolve('aborted'), { once: true });
  });
}

/** Waits until the tab is visible, or aborts. Returns false if aborted. */
function waitForVisible(signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted)                              return resolve(false);
    if (document.visibilityState === 'visible')      return resolve(true);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        cleanup();
        resolve(!signal.aborted);
      }
    };
    const onAbort = () => { cleanup(); resolve(false); };

    const cleanup = () => {
      document.removeEventListener('visibilitychange', onVisible);
      signal.removeEventListener('abort', onAbort);
    };

    document.addEventListener('visibilitychange', onVisible);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Waits for a settled delay via setTimeout, abort-aware. */
function settleDelay(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(false);

    const id = setTimeout(() => resolve(true), ms);
    signal.addEventListener('abort', () => { clearTimeout(id); resolve(false); }, { once: true });
  });
}

interface ControllerContext {
  tour:        Tour;
  userId:      string;
  isLoggedIn:  boolean;
  page:        string;
  signal:      AbortSignal;
  force?:      boolean;
  retryCount?: number;
}

/** Single pipeline used by BOTH auto-start and manual trigger.
 *
 *  Stages:
 *  1. Pre-flight guards (logged in, on dashboard, not done)
 *  2. Wait for all DOM targets (with limited retry on timeout)
 *  3. Wait for tab visibility
 *  4. Settle delay (let animations finish)
 *  5. Final guard battery
 *  6. Start tour
 */
async function runTourController(ctx: ControllerContext): Promise<void> {
  const { tour, userId, isLoggedIn, page, signal, force, retryCount = 0 } = ctx;

  // ── Stage 1: Pre-flight ──────────────────────────────────────────────────
  if (signal.aborted)              return;
  if (!isLoggedIn)                 return;
  if (page !== 'dashboard')        return;
  if (!userId)                     return;

  const key = tourKey(userId);
  if (!force && localStorage.getItem(key) === 'true') return;

  // ── Stage 2: DOM readiness ───────────────────────────────────────────────
  const domResult = await waitForSelectors(TOUR_TARGET_SELECTORS, DOM_WAIT_TIMEOUT_MS, signal);

  if (domResult === 'aborted') return;

  if (domResult === 'timeout') {
    // Retry once if we haven't already
    if (retryCount < MAX_RETRIES) {
      return runTourController({ ...ctx, retryCount: retryCount + 1 });
    }
    // Exceeded retries — silent fail, release so next visit retries
    return;
  }

  // ── Stage 3: Tab visibility ──────────────────────────────────────────────
  const visible = await waitForVisible(signal);
  if (!visible || signal.aborted) return;

  // ── Stage 4: Settle delay (animations, skeleton → content transitions) ───
  const settled = await settleDelay(DOM_SETTLE_DELAY_MS, signal);
  if (!settled || signal.aborted) return;

  // ── Stage 5: Final guard battery (state may have changed during waits) ───
  if (
    signal.aborted                             ||
    !isLoggedIn                                ||
    page !== 'dashboard'                       ||
    (!force && localStorage.getItem(key) === 'true') ||
    tour.isActive()
  ) return;

  // ── Stage 6: Start ───────────────────────────────────────────────────────
  tour.start();
}

// ─────────────────────────────────────────────────────────────────────────────
// (B) REACT INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────

export const ShepherdTourWrapper: React.FC<ShepherdTourWrapperProps> = ({ children }) => {
  const tourRef = useRef<Tour | null>(null);
  // Stable snapshot of current auth/nav for use inside async closures
  const stateRef   = useRef({ isLoggedIn: false, userId: null as string | null, page: 'home' });
  // AbortController for the currently running auto-start pipeline
  const autoAbortRef = useRef<AbortController | null>(null);

  const { isLoggedIn, userId } = useAuth();
  const { page } = useNavigation();

  // Keep stateRef in sync so async closures always read current values
  useEffect(() => {
    stateRef.current = { isLoggedIn, userId: userId ?? null, page };
  }, [isLoggedIn, userId, page]);

  // ── EFFECT 1: Build tour ONCE on mount ────────────────────────────────────
  useEffect(() => {
    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'shepherd-step-custom shepherd-theme-arrows',
        scrollTo: false,
        canClickTarget: false,
      },
    });

    const navButtons = (isLast = false) => [
      {
        text: 'Skip Tour',
        action() { tour.cancel(); },
      },
      {
        text: isLast ? 'Done' : 'Next →',
        action() { isLast ? tour.complete() : tour.next(); },
      },
    ];

    tour.addStep({
      id: 'step-01-job-hunt',
      title: '1 of 4 — Find Your Dream Job',
      text: 'Search 300+ real job listings. Filter by role, location, and work setting.',
      attachTo: { element: '[data-tour="job-hunt-card"]', on: 'bottom' },
      buttons: navButtons(),
    });

    tour.addStep({
      id: 'step-02-prep',
      title: '2 of 4 — Ace Your Interviews',
      text: 'Practice DSA, mock interviews, and quizzes — 12 modules in one place.',
      attachTo: { element: '[data-tour="prep-mode-card"]', on: 'bottom' },
      buttons: navButtons(),
    });

    tour.addStep({
      id: 'step-03-live-ai',
      title: '3 of 4 — Practice with AI',
      text: 'Simulate real interviews with AI voice and instant feedback.',
      attachTo: { element: '[data-tour="live-ai-card"]', on: 'bottom' },
      buttons: navButtons(),
    });

    tour.addStep({
      id: 'step-04-ats',
      title: '4 of 4 — Build & Score Your Resume',
      text: 'Create an ATS-friendly resume with AI and check your job match score.',
      attachTo: { element: '[data-tour="ats-card"]', on: 'bottom' },
      buttons: navButtons(true),
    });

    const markDone = () => {
      const id = stateRef.current.userId;
      if (id) localStorage.setItem(tourKey(id), 'true');
    };

    tour.on('complete', () => {
      markDone();

      const toast = document.createElement('div');
      toast.textContent = "🎉 You're ready to explore CodeXCareer!";
      Object.assign(toast.style, {
        position:      'fixed',
        bottom:        '32px',
        left:          '50%',
        transform:     'translateX(-50%) translateY(80px)',
        background:    'linear-gradient(90deg, #ff7a00, #ff9533)',
        color:         '#ffffff',
        padding:       '16px 32px',
        borderRadius:  '50px',
        fontSize:      '15px',
        fontWeight:    '600',
        boxShadow:     '0 8px 32px rgba(255,122,0,0.4)',
        zIndex:        '99999',
        whiteSpace:    'nowrap',
        transition:    'transform 400ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease',
        opacity:       '0',
        pointerEvents: 'none',
      });
      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.style.transform = 'translateX(-50%) translateY(0)';
          toast.style.opacity   = '1';
        });
      });

      setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(80px)';
        toast.style.opacity   = '0';
        setTimeout(() => toast.remove(), 400);
      }, 2500);
    });

    // Only mark done on user-initiated skip/cancel, not programmatic ones.
    // We detect programmatic cancel by checking if tour is being force-restarted
    // via window.startTour — that flow cancels without needing markDone.
    tour.on('cancel', markDone);

    tourRef.current = tour;

    // ── Manual trigger — reuses same controller pipeline ──────────────────
    window.startTour = async (options) => {
      if (!tourRef.current) return;

      const { isLoggedIn: li, userId: uid, page: pg } = stateRef.current;
      if (!uid) return;

      // Abort any running auto-start before force-starting
      if (autoAbortRef.current) {
        autoAbortRef.current.abort();
        autoAbortRef.current = null;
      }

      // Cancel active tour without triggering markDone
      // We remove and re-add the cancel listener around this call
      if (tourRef.current.isActive()) {
        tour.off('cancel', markDone);
        tourRef.current.cancel();
        tour.on('cancel', markDone);
      }

      if (options?.force) {
        localStorage.removeItem(tourKey(uid));
      }

      const manualAbort = new AbortController();

      await runTourController({
        tour:       tourRef.current,
        userId:     uid,
        isLoggedIn: li,
        page:       pg,
        signal:     manualAbort.signal,
        force:      options?.force,
      });
    };

    return () => {
      // Abort any in-flight auto-start
      autoAbortRef.current?.abort();
      autoAbortRef.current = null;
      if (tour.isActive()) tour.cancel();
      window.startTour = undefined;
    };
  }, []); // runs ONCE

  // ── EFFECT 2: Auto-start trigger ─────────────────────────────────────────
  // Fires whenever login state, page, or userId changes.
  // Cancels any previous in-flight attempt before starting a new one.
  useEffect(() => {
    // Abort previous pipeline if still running (e.g. user navigated away + back)
    if (autoAbortRef.current) {
      autoAbortRef.current.abort();
      autoAbortRef.current = null;
    }

    // Hard guards — don't even start the pipeline
    if (!isLoggedIn || page !== 'dashboard' || !userId) return;
    if (localStorage.getItem(tourKey(userId)) === 'true') return;
    if (!tourRef.current) return;

    const ac = new AbortController();
    autoAbortRef.current = ac;

    void runTourController({
      tour:       tourRef.current,
      userId,
      isLoggedIn,
      page,
      signal:     ac.signal,
    }).finally(() => {
      // Release the ref once the pipeline settles (success, fail, or abort)
      if (autoAbortRef.current === ac) autoAbortRef.current = null;
    });

    return () => {
      ac.abort();
      if (autoAbortRef.current === ac) autoAbortRef.current = null;
    };
  }, [isLoggedIn, page, userId]);

  return <>{children}</>;
};

export default ShepherdTourWrapper;
