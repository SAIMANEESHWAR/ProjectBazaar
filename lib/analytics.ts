import * as Sentry from "@sentry/react";

const SENTRY_DSN = "https://d2b4b7675ec75eaab29ac2303fea1604@o4510947769057280.ingest.us.sentry.io/4510947776462848";
const COOKIE_CONSENT_KEY = "cookieConsent";

let sentryInitialized = false;

export function initSentry() {
  if (sentryInitialized) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true,
  });
  sentryInitialized = true;
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
  }
}
