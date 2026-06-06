/** UTM / marketing attribution fields stored on DynamoDB Users records. */
export interface UserAttribution {
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

export interface AdminUserWithAttribution {
  userId: string;
  email: string;
  fullName?: string;
  createdAt?: string;
  createdBy?: string;
  status?: string;
  attribution: UserAttribution;
}

const ATTRIBUTION_KEYS: (keyof UserAttribution)[] = [
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'utmTerm',
  'utmContent',
  'gclid',
  'fbclid',
  'landingPage',
  'signupReferrer',
  'attributionCapturedAt',
];

export function extractAttributionFromUser(
  record: object | null | undefined
): UserAttribution {
  if (!record) return {};
  const data = record as Record<string, unknown>;
  const out: UserAttribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      out[key] = value.trim();
    }
  }
  return out;
}

export function hasAttribution(attribution: UserAttribution): boolean {
  return Boolean(
    attribution.utmSource ||
      attribution.utmMedium ||
      attribution.utmCampaign ||
      attribution.gclid ||
      attribution.fbclid
  );
}

export function formatAttributionLabel(attribution: UserAttribution): string {
  const parts = [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '—';
}

export function formatCapturedAt(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
