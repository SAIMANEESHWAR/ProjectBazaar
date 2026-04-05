import type { PeerTimezoneRegionId } from './peerInterviewMockData';

/**
 * Three concrete, peer-friendly windows per region (day + local time + tz label).
 * Used for connection requests and listing availability.
 */
export function getPeerSlotPresets(region: PeerTimezoneRegionId): string[] {
  switch (region) {
    case 'ist':
      return [
        'Tue or Thu · 7:00–9:00 PM IST (Google Meet)',
        'Sat · 10:00 AM–1:00 PM IST',
        'Sun · 4:00–7:00 PM IST',
      ];
    case 'us':
      return [
        'Mon or Wed · 6:00–8:00 PM ET / 3:00–5:00 PM PT',
        'Tue · 12:00–2:00 PM PT (lunch mock)',
        'Sat · 9:00–11:00 AM ET',
      ];
    case 'eu':
      return [
        'Tue or Thu · 6:00–8:00 PM GMT / 7:00–9:00 PM CET',
        'Wed · 12:30–2:00 PM CET (lunch slot)',
        'Sun · 3:00–6:00 PM GMT',
      ];
    case 'apac':
      return [
        'Mon–Thu · 7:00–9:00 PM SGT / 8:00–10:00 PM JST',
        'Sat · 10:00 AM–12:30 PM SGT',
        'Sun · 5:00–8:00 PM AEST (flex)',
      ];
    case 'other':
    default:
      return [
        'Weekday · 7:00–9:00 PM local (your TZ)',
        'Sat · 10:00 AM–1:00 PM local',
        'Sun · flexible — message to align',
      ];
  }
}

/** Optional IANA tz appended to each window when user provides it. */
export function mergeSlotsWithTimezoneNote(slots: string[], ianaOrNote: string): string[] {
  const note = ianaOrNote.trim();
  if (!note) return slots.filter(Boolean).slice(0, 5);
  return slots.filter(Boolean).slice(0, 5).map((s) => `${s} · ${note}`);
}
