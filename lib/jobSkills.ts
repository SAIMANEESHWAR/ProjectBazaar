/** Split skills on commas/semicolons at depth 0 so text in parentheses stays one chip */
export function splitSkillsToChips(raw: string): string[] {
  const s = raw.trim();
  if (!s) return [];
  let depth = 0;
  let cur = '';
  const parts: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(') depth += 1;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) {
      const t = cur.trim();
      if (t) parts.push(t);
      cur = '';
    } else {
      cur += ch;
    }
  }
  const t = cur.trim();
  if (t) parts.push(t);
  return parts;
}
