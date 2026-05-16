/** Session flag: set only after signup; cleared when tour completes or is dismissed. */
export const PENDING_ONBOARDING_TOUR_KEY = 'pendingOnboardingTour';

export const tourDoneKey = (userId: string) => `tourDone_${userId}`;

export function scheduleOnboardingTour(): void {
  sessionStorage.setItem(PENDING_ONBOARDING_TOUR_KEY, '1');
}

export function clearPendingOnboardingTour(): void {
  sessionStorage.removeItem(PENDING_ONBOARDING_TOUR_KEY);
}

export function hasPendingOnboardingTour(): boolean {
  return sessionStorage.getItem(PENDING_ONBOARDING_TOUR_KEY) === '1';
}

export function isOnboardingTourComplete(userId: string): boolean {
  return localStorage.getItem(tourDoneKey(userId)) === 'true';
}

export function markOnboardingTourComplete(userId: string): void {
  localStorage.setItem(tourDoneKey(userId), 'true');
  clearPendingOnboardingTour();
}

export function resolveUserId(fallbackUserId: string | null): string | null {
  if (fallbackUserId) return fallbackUserId;
  try {
    const raw = localStorage.getItem('userData');
    if (!raw) return null;
    const data = JSON.parse(raw) as { userId?: string };
    return data.userId ?? null;
  } catch {
    return null;
  }
}
