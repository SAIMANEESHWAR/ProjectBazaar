import React, { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import type { Tour } from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import './shepherd-tour.css';
import { useAuth, useNavigation } from '../../App';
import {
  hasPendingOnboardingTour,
  isOnboardingTourComplete,
  markOnboardingTourComplete,
  resolveUserId,
  tourDoneKey,
} from '../../lib/onboardingTour';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TOUR_TARGET_SELECTORS = [
  '[data-tour="job-hunt-card"]',
  '[data-tour="prep-mode-card"]',
  '[data-tour="live-ai-card"]',
  '[data-tour="hackathons-card"]',
  '[data-tour="ats-card"]',
] as const;

const DOM_WAIT_TIMEOUT_MS  = 8_000;
const DOM_SETTLE_DELAY_MS  = 300;
const MAX_RETRIES          = 1;

const TOUR_STEPS = [
  {
    id: 'step-01-job-hunt',
    title: 'Job Hunt',
    text: 'Browse roles and track applications quickly. Tap this card to open listings, filters, and your application pipeline.',
    attachTo: { element: '[data-tour="job-hunt-card"]', on: 'bottom' as const },
    icon: '↗',
  },
  {
    id: 'step-02-prep',
    title: 'Preparation Mode',
    text: 'Practice DSA, system design, and interview rounds in one hub. Use this card to start structured prep modules.',
    attachTo: { element: '[data-tour="prep-mode-card"]', on: 'bottom' as const },
    icon: '◆',
  },
  {
    id: 'step-03-live-ai',
    title: 'Live AI Interviews',
    text: 'Simulate real interviews with instant feedback. Open this card to start a voice mock interview anytime.',
    attachTo: { element: '[data-tour="live-ai-card"]', on: 'top' as const },
    icon: '◎',
  },
  {
    id: 'step-04-hackathons',
    title: 'Hackathons',
    text: 'Find upcoming hackathons and register faster. This card takes you to live events, deadlines, and sign-up links.',
    attachTo: { element: '[data-tour="hackathons-card"]', on: 'top' as const },
    icon: '★',
  },
  {
    id: 'step-05-ats',
    title: 'ATS Scorer',
    text: 'Check your resume match score before applying. Upload or paste your resume here to see how well it fits a role.',
    attachTo: { element: '[data-tour="ats-card"]', on: 'top' as const },
    icon: '✓',
  },
] as const;

const TOTAL_STEPS = TOUR_STEPS.length;

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
// CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────

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

      if (document.visibilityState === 'hidden') {
        setTimeout(tick, 100);
      } else {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
    signal.addEventListener('abort', () => resolve('aborted'), { once: true });
  });
}

function waitForVisible(signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted)                         return resolve(false);
    if (document.visibilityState === 'visible') return resolve(true);

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

function settleDelay(ms: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(false);

    const id = setTimeout(() => resolve(true), ms);
    signal.addEventListener('abort', () => { clearTimeout(id); resolve(false); }, { once: true });
  });
}

function shouldAutoStartTour(userId: string, force?: boolean): boolean {
  if (force) return true;
  if (!hasPendingOnboardingTour()) return false;
  return !isOnboardingTourComplete(userId);
}

function applyStepChrome(tour: Tour): void {
  const current = tour.getCurrentStep();
  if (!current?.el) return;

  const index = tour.steps.indexOf(current);
  if (index < 0) return;

  const meta = TOUR_STEPS[index];
  if (!meta) return;

  current.el.dataset.shepherdStepId = meta.id;

  const iconEl = current.el.querySelector('.shepherd-step-icon');
  if (iconEl) iconEl.textContent = meta.icon;

  const footer = current.el.querySelector('.shepherd-footer');
  if (!footer) return;

  let progress = footer.querySelector('.shepherd-step-progress');
  if (!progress) {
    progress = document.createElement('span');
    progress.className = 'shepherd-step-progress';
    progress.setAttribute('aria-live', 'polite');
    footer.prepend(progress);
  }

  progress.textContent = `${index + 1} out of ${TOTAL_STEPS}`;
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

async function runTourController(ctx: ControllerContext): Promise<void> {
  const { tour, userId, isLoggedIn, page, signal, force, retryCount = 0 } = ctx;

  if (signal.aborted) return;
  if (!isLoggedIn) return;
  if (page !== 'dashboard') return;
  if (!userId) return;
  if (!shouldAutoStartTour(userId, force)) return;

  const domResult = await waitForSelectors(TOUR_TARGET_SELECTORS, DOM_WAIT_TIMEOUT_MS, signal);

  if (domResult === 'aborted') return;

  if (domResult === 'timeout') {
    if (retryCount < MAX_RETRIES) {
      return runTourController({ ...ctx, retryCount: retryCount + 1 });
    }
    return;
  }

  const visible = await waitForVisible(signal);
  if (!visible || signal.aborted) return;

  const settled = await settleDelay(DOM_SETTLE_DELAY_MS, signal);
  if (!settled || signal.aborted) return;

  if (
    signal.aborted ||
    !isLoggedIn ||
    page !== 'dashboard' ||
    !shouldAutoStartTour(userId, force) ||
    tour.isActive()
  ) return;

  tour.start();
}

// ─────────────────────────────────────────────────────────────────────────────
// REACT
// ─────────────────────────────────────────────────────────────────────────────

export const ShepherdTourWrapper: React.FC<ShepherdTourWrapperProps> = ({ children }) => {
  const tourRef = useRef<Tour | null>(null);
  const stateRef = useRef({ isLoggedIn: false, userId: null as string | null, page: 'home' });
  const autoAbortRef = useRef<AbortController | null>(null);

  const { isLoggedIn, userId } = useAuth();
  const { page } = useNavigation();

  useEffect(() => {
    stateRef.current = { isLoggedIn, userId: userId ?? null, page };
  }, [isLoggedIn, userId, page]);

  useEffect(() => {
    const tour = new Shepherd.Tour({
      useModalOverlay: false,
      defaultStepOptions: {
        classes: 'shepherd-step-custom',
        scrollTo: false,
        canClickTarget: true,
        cancelIcon: { enabled: true },
        arrow: true,
      },
    });

    const navButton = (isLast: boolean) => [
      {
        text: isLast ? 'Done' : 'Next',
        action() {
          if (isLast) tour.complete();
          else tour.next();
        },
      },
    ];

    TOUR_STEPS.forEach((step, index) => {
      tour.addStep({
        id: step.id,
        title: step.title,
        text: step.text,
        attachTo: step.attachTo,
        buttons: navButton(index === TOUR_STEPS.length - 1),
      });
    });

    tour.on('show', () => {
      const header = tour.getCurrentStep()?.el?.querySelector('.shepherd-header');
      if (header && !header.querySelector('.shepherd-header-top')) {
        const topRow = document.createElement('div');
        topRow.className = 'shepherd-header-top';
        const icon = document.createElement('span');
        icon.className = 'shepherd-step-icon';
        icon.setAttribute('aria-hidden', 'true');
        topRow.appendChild(icon);
        header.insertBefore(topRow, header.firstChild);
      }
      applyStepChrome(tour);
    });

    const markDone = () => {
      const id = resolveUserId(stateRef.current.userId);
      if (id) markOnboardingTourComplete(id);
    };

    tour.on('complete', () => {
      markDone();

      const toastDiv = document.createElement('div');
      toastDiv.textContent = "You're ready to explore CodeXCareer!";
      Object.assign(toastDiv.style, {
        position:      'fixed',
        bottom:        '32px',
        left:          '50%',
        transform:     'translateX(-50%) translateY(80px)',
        background:    '#1a1a1c',
        color:         '#ffffff',
        padding:       '14px 28px',
        borderRadius:  '999px',
        fontSize:      '14px',
        fontWeight:    '600',
        border:        '1px solid rgba(255,255,255,0.12)',
        boxShadow:     '0 12px 40px rgba(0,0,0,0.35)',
        zIndex:        '99999',
        whiteSpace:    'nowrap',
        transition:    'transform 400ms cubic-bezier(0.34,1.56,0.64,1), opacity 300ms ease',
        opacity:       '0',
        pointerEvents: 'none',
      });
      document.body.appendChild(toastDiv);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toastDiv.style.transform = 'translateX(-50%) translateY(0)';
          toastDiv.style.opacity   = '1';
        });
      });

      setTimeout(() => {
        toastDiv.style.transform = 'translateX(-50%) translateY(80px)';
        toastDiv.style.opacity   = '0';
        setTimeout(() => toastDiv.remove(), 400);
      }, 2500);
    });

    tour.on('cancel', markDone);

    tourRef.current = tour;

    window.startTour = async (options) => {
      if (!tourRef.current) return;

      const { isLoggedIn: li, userId: uid, page: pg } = stateRef.current;
      const resolvedId = resolveUserId(uid);
      if (!resolvedId) return;

      if (autoAbortRef.current) {
        autoAbortRef.current.abort();
        autoAbortRef.current = null;
      }

      if (tourRef.current.isActive()) {
        tour.off('cancel', markDone);
        tourRef.current.cancel();
        tour.on('cancel', markDone);
      }

      if (options?.force) {
        localStorage.removeItem(tourDoneKey(resolvedId));
      }

      const manualAbort = new AbortController();

      await runTourController({
        tour:       tourRef.current,
        userId:     resolvedId,
        isLoggedIn: li,
        page:       pg,
        signal:     manualAbort.signal,
        force:      options?.force,
      });
    };

    return () => {
      autoAbortRef.current?.abort();
      autoAbortRef.current = null;
      if (tour.isActive()) tour.cancel();
      window.startTour = undefined;
    };
  }, []);

  useEffect(() => {
    if (autoAbortRef.current) {
      autoAbortRef.current.abort();
      autoAbortRef.current = null;
    }

    if (!isLoggedIn || page !== 'dashboard' || !userId) return;
    if (!hasPendingOnboardingTour()) return;
    if (isOnboardingTourComplete(userId)) return;
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
