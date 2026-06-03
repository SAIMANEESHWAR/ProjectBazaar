import * as Sentry from "@sentry/react";

const SENTRY_DSN = "https://d2b4b7675ec75eaab29ac2303fea1604@o4510947769057280.ingest.us.sentry.io/4510947776462848";
const COOKIE_CONSENT_KEY = "cookieConsent";
const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined)?.trim();

let sentryInitialized = false;
let gtmInitialized = false;
let autoTrackingBound = false;

type DataLayerValue = string | number | boolean | null | undefined;
type DataLayerEvent = Record<string, DataLayerValue>;

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

export function initSentry() {
  if (sentryInitialized) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    // Keep Sentry helpful, but avoid attaching PII by default.
    sendDefaultPii: false,
  });
  sentryInitialized = true;
}

function isInternalTraffic(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  // Never track local development traffic.
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".local")) return true;
  return false;
}

function looksLikePii(value: string): boolean {
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phoneRegex = /(?:\+?\d[\d\s-]{7,}\d)/;
  return emailRegex.test(value) || phoneRegex.test(value);
}

function sanitizeValue(value: DataLayerValue): DataLayerValue {
  if (typeof value !== "string") return value;
  const trimmed = value.trim().slice(0, 120);
  return looksLikePii(trimmed) ? "[redacted]" : trimmed;
}

function pushDataLayerEvent(event: DataLayerEvent) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent() || isInternalTraffic()) return;
  window.dataLayer = window.dataLayer || [];
  const safePayload: DataLayerEvent = {};
  Object.entries(event).forEach(([k, v]) => {
    safePayload[k] = sanitizeValue(v);
  });
  window.dataLayer.push(safePayload);
}

function initGtm() {
  if (gtmInitialized || !GTM_ID || typeof document === "undefined") return;
  const existing = document.querySelector(`script[data-gtm="${GTM_ID}"]`);
  if (existing) {
    gtmInitialized = true;
    return;
  }
  const script = document.createElement("script");
  script.async = true;
  script.dataset.gtm = GTM_ID;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
  gtmInitialized = true;
}

export function trackPageView(path: string, pageTitle?: string) {
  pushDataLayerEvent({
    event: "page_view",
    page_path: path,
    page_title: pageTitle || document.title,
  });
}

export function trackCtaClick(ctaId: string, location?: string) {
  pushDataLayerEvent({
    event: "cta_click",
    cta_id: ctaId || "unknown_cta",
    cta_location: location || window.location.pathname,
  });
}

export function trackFormSubmit(formId: string, formAction?: string) {
  pushDataLayerEvent({
    event: "form_submit",
    form_id: formId || "unknown_form",
    form_action: formAction || "",
    page_path: window.location.pathname,
  });
}

function bindAutoTracking() {
  if (autoTrackingBound || typeof document === "undefined") return;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const clickable = target.closest<HTMLElement>("[data-cta], [data-track='cta']");
    if (!clickable) return;
    const ctaId =
      clickable.getAttribute("data-cta") ||
      clickable.id ||
      clickable.getAttribute("aria-label") ||
      "cta";
    trackCtaClick(ctaId, window.location.pathname);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target as HTMLFormElement | null;
    if (!form) return;
    const formId = form.getAttribute("data-form-id") || form.id || form.name || "form";
    const action = form.getAttribute("action") || "";
    trackFormSubmit(formId, action);
  });

  autoTrackingBound = true;
}

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === "all";
  } catch {
    return false;
  }
}

export function bootAnalytics() {
  if (hasAnalyticsConsent()) {
    initSentry();
    initGtm();
    bindAutoTracking();
  }
}
