export const ATTRIBUTION_STORAGE_KEY = 'cxc_attribution';

const DEFAULT_TTL_DAYS = 90;
const TTL_MS =
  (Number(import.meta.env.VITE_ATTRIBUTION_TTL_DAYS) || DEFAULT_TTL_DAYS) *
  24 *
  60 *
  60 *
  1000;

const CAMPAIGN_PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
] as const;

type CampaignParamKey = (typeof CAMPAIGN_PARAM_KEYS)[number];

export interface StoredAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page: string;
  referrer: string;
  captured_at: string;
  last_touch_at: string;
}

export interface AttributionApiPayload {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  landingPage?: string;
  signupReferrer?: string;
  attributionCapturedAt?: string;
}

export interface AttributionAnalyticsPayload {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  landing_page?: string;
  referrer?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function trimValue(value: string | null | undefined, maxLen = 200): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed || undefined;
}

function parseCampaignParamsFromUrl(): Partial<Record<CampaignParamKey, string>> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Partial<Record<CampaignParamKey, string>> = {};
  for (const key of CAMPAIGN_PARAM_KEYS) {
    const value = trimValue(params.get(key));
    if (value) result[key] = value;
  }
  return result;
}

function hasCampaignParams(params: Partial<Record<CampaignParamKey, string>>): boolean {
  return CAMPAIGN_PARAM_KEYS.some((key) => Boolean(params[key]));
}

function readLandingPage(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`.slice(0, 500);
}

function readReferrer(): string {
  if (typeof document === 'undefined') return '';
  return (document.referrer || '').slice(0, 500);
}

function isExpired(stored: StoredAttribution): boolean {
  const touchedAt = new Date(stored.last_touch_at).getTime();
  if (Number.isNaN(touchedAt)) return true;
  return Date.now() - touchedAt > TTL_MS;
}

function persistAttribution(stored: StoredAttribution): void {
  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage may be unavailable (private mode, quota, etc.)
  }
}

function clearStoredAttribution(): void {
  try {
    localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function createInitialAttribution(
  urlParams: Partial<Record<CampaignParamKey, string>>,
  timestamp: string
): StoredAttribution {
  return {
    ...urlParams,
    landing_page: readLandingPage(),
    referrer: readReferrer(),
    captured_at: timestamp,
    last_touch_at: timestamp,
  };
}

/**
 * Parse URL campaign params and persist first-touch attribution in localStorage.
 * Call once during application startup (before React render).
 */
export function captureAttributionFromUrl(): StoredAttribution | null {
  if (typeof window === 'undefined') return null;

  const timestamp = nowIso();
  const urlParams = parseCampaignParamsFromUrl();
  const newCampaignParams = hasCampaignParams(urlParams);

  let stored = getStoredAttribution();
  if (stored && isExpired(stored)) {
    clearStoredAttribution();
    stored = null;
  }

  if (!stored) {
    const initial = createInitialAttribution(urlParams, timestamp);
    persistAttribution(initial);
    return initial;
  }

  if (newCampaignParams) {
    const updated: StoredAttribution = { ...stored, last_touch_at: timestamp };
    for (const key of CAMPAIGN_PARAM_KEYS) {
      const incoming = urlParams[key];
      if (incoming && !updated[key]) {
        updated[key] = incoming;
      }
    }
    persistAttribution(updated);
    return updated;
  }

  return stored;
}

export function getStoredAttribution(): StoredAttribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.captured_at || !parsed.last_touch_at) return null;
    if (isExpired(parsed)) {
      clearStoredAttribution();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Shape for signup / OAuth API payloads (camelCase). */
export function getAttributionForApi(): AttributionApiPayload | null {
  const stored = getStoredAttribution();
  if (!stored) return null;

  const payload: AttributionApiPayload = {
    utmSource: stored.utm_source,
    utmMedium: stored.utm_medium,
    utmCampaign: stored.utm_campaign,
    utmTerm: stored.utm_term,
    utmContent: stored.utm_content,
    gclid: stored.gclid,
    fbclid: stored.fbclid,
    landingPage: stored.landing_page,
    signupReferrer: stored.referrer,
    attributionCapturedAt: stored.captured_at,
  };

  const hasValue = Object.values(payload).some((v) => v != null && v !== '');
  return hasValue ? payload : null;
}

/** Shape for analytics dataLayer / GA4 events (snake_case). */
export function getAttributionForAnalytics(): AttributionAnalyticsPayload {
  const stored = getStoredAttribution();
  if (!stored) return {};

  return {
    utm_source: stored.utm_source,
    utm_medium: stored.utm_medium,
    utm_campaign: stored.utm_campaign,
    utm_term: stored.utm_term,
    utm_content: stored.utm_content,
    gclid: stored.gclid,
    fbclid: stored.fbclid,
    landing_page: stored.landing_page,
    referrer: stored.referrer,
  };
}
