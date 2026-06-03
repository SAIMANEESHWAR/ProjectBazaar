import React from 'react';

/** Dedupe, trim, drop 1-char noise; longest phrases first for regex alternation. */
export function normalizeHighlightTerms(terms: string[]): string[] {
  return [...new Set(terms.map((t) => t.trim()).filter((t) => t.length >= 2))].sort((a, b) => b.length - a.length);
}

/**
 * Split plain text on case-insensitive keyword matches and wrap hits in <mark>.
 * Safe for arbitrary résumé text (no HTML parsing).
 */
export function highlightAddedKeywords(
  text: string,
  terms: string[],
  markClassName = 'garamond-injected-kw'
): React.ReactNode {
  if (!text) return null;
  const keys = normalizeHighlightTerms(terms);
  if (!keys.length) return text;
  try {
    const escaped = keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const re = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = String(text).split(re);
    return parts.map((part, i) => {
      const hit = keys.some((k) => part.toLowerCase() === k.toLowerCase());
      return hit ? (
        <mark key={i} className={markClassName}>
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      );
    });
  } catch {
    return text;
  }
}
