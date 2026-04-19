import type { Education, Experience, ResumeInfo, Skill } from '../context/ResumeInfoContext';

export type GaramondContact = { icon: string; label: string; href: string };

export type GaramondSection =
  | { type: 'table'; title: string; headers: string[]; rows: string[][] }
  | { type: 'skills'; title: string; items: { label: string; value: string }[] }
  | { type: 'entries'; title: string; items: { title: string; org?: string; bullets: string[] }[] }
  | { type: 'list'; title: string; items: (string | { text: string; meta?: string; desc?: string })[] };

export type GaramondResumeModel = {
  name: string;
  subtitle: string[];
  contacts: GaramondContact[];
  sections: GaramondSection[];
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtYm(dateStr: string): string {
  if (!dateStr?.trim()) return '';
  const [y, m] = dateStr.split('-');
  if (!y) return dateStr;
  const mi = m ? parseInt(m, 10) : NaN;
  if (m && mi >= 1 && mi <= 12) return `${MONTHS[mi - 1]} ${y}`;
  return y;
}

function expDateRange(exp: Experience): string {
  const a = fmtYm(exp.startDate);
  const b = exp.currentlyWorking ? 'Present' : fmtYm(exp.endDate);
  if (a && b) return `${a} – ${b}`;
  return a || b || '';
}

function cleanExperienceBulletText(t: string): string {
  return t
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[-–•·▪\u2022\s]+/g, '')
    .replace(/^[-–]\s*[-–•·]\s*/g, '')
    .replace(/(\w)-\s+(\w)/g, '$1$2')
    .trim();
}

function workSummaryToBullets(html: string): string[] {
  const raw = (html || '').trim();
  if (!raw) return [];
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const bullets: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = liRe.exec(raw)) !== null) {
    const t = cleanExperienceBulletText(m[1]);
    if (t) bullets.push(t);
  }
  if (bullets.length) return bullets;
  const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = plain.split(/(?<=[.!?])\s+/).map((p) => p.trim()).filter((p) => p.length > 12);
  return parts.length ? parts.slice(0, 12) : plain ? [plain.slice(0, 500)] : [];
}

function cleanProjectBulletLine(l: string): string {
  return l
    .replace(/^[-–•·▪\u2022\s]+/g, '')
    .replace(/^[-–]\s*[-–•·]\s*/g, '')
    .replace(/(\w)-\s+(\w)/g, '$1$2')
    .trim();
}

function projectDescToBullets(desc: string): string[] {
  const d = (desc || '').trim();
  if (!d) return [];
  const lines = d
    .split(/\n+/)
    .map((l) => cleanProjectBulletLine(l))
    .filter(Boolean);
  if (lines.length > 1) return lines.slice(0, 14);
  const parts = d.split(/(?<=[.!?])\s+/).map((x) => cleanProjectBulletLine(x)).filter((x) => x.length > 10);
  return parts.length ? parts.slice(0, 10) : [cleanProjectBulletLine(d)];
}

function eduGpaCell(edu: Education): string {
  const d = (edu.description || '').trim();
  const m = d.match(/(?:CPI|GPA|Score)[^0-9]*(\d{1,2}(?:\.\d+)?)/i);
  if (m) return m[1];
  const tail = d.match(/(\d{1,2}(?:\.\d+)?)\s*$/);
  return tail ? tail[1] : '';
}

function eduYearCell(edu: Education): string {
  const a = fmtYm(edu.startDate);
  const b = fmtYm(edu.endDate);
  if (a && b) return `${a} – ${b}`;
  if (a || b) return a || b;
  const d = (edu.description || '').trim();
  const pm = d.match(/Period:\s*([^·|]+?)(?:\s*·|\s*\||$)/i);
  if (pm) return pm[1].trim();
  const ym = d.match(/(\d{4})\s*[-–]\s*(?:Present|\d{4})/i);
  if (ym) return ym[0];
  const single = d.match(/\bYear:\s*((?:19|20)\d{2})\b/i);
  return single ? single[1] : '';
}

/** Rejoin common two-word skills split across commas (e.g. "Machine, Learning"). */
function repairCommaSkillList(s: string): string {
  let t = s;
  const fixes: [RegExp, string][] = [
    [/\bMachine\s*,\s*Learning\b/gi, 'Machine Learning'],
    [/\bDeep\s*,\s*Learning\b/gi, 'Deep Learning'],
    [/\bNatural\s*,\s*Language\b/gi, 'Natural Language'],
    [/\bComputer\s*,\s*Vision\b/gi, 'Computer Vision'],
    [/\bNeural\s*,\s*Networks?\b/gi, 'Neural Networks'],
    [/\bData\s*,\s*Science\b/gi, 'Data Science'],
    [/\bArtificial\s*,\s*Intelligence\b/gi, 'Artificial Intelligence'],
    [/\bPower\s*,\s*BI\b/gi, 'Power BI'],
    [/\bLarge\s*,\s*Language\b/gi, 'Large Language'],
  ];
  for (const [re, rep] of fixes) t = t.replace(re, rep);
  return t;
}

function dedupeCommaList(value: string): string {
  const parts = repairCommaSkillList(value)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out.join(', ');
}

/** True if splitting at idx would break a two-word category (e.g. Machine|Learning:). */
function shouldSkipSkillCategorySplit(s: string, idx: number): boolean {
  const before = s.slice(0, idx).replace(/\s+$/, '');
  const after = s.slice(idx).replace(/^\s+/, '');
  const pairs: [RegExp, RegExp][] = [
    [/Machine$/i, /^Learning\b/i],
    [/Natural$/i, /^Language\b/i],
    [/Deep$/i, /^Learning\b/i],
    [/Data$/i, /^Science\b/i],
    [/Computer$/i, /^Vision\b/i],
    [/Large$/i, /^Language\b/i],
    [/Power$/i, /^BI\b/i],
    [/Neural$/i, /^Networks?\b/i],
    [/Artificial$/i, /^Intelligence\b/i],
    [/Feature$/i, /^Engineering\b/i],
  ];
  for (const [reB, reA] of pairs) {
    if (reB.test(before) && reA.test(after)) return true;
  }
  return false;
}

/**
 * Split on boundaries like " … Tools:" (Title Case multiword + colon).
 * Skips splits inside "Machine Learning:", "Data Science:", etc.
 */
function splitSkillCategoryChunks(t: string): string[] {
  const s = t.trim().replace(/\r/g, ' ');
  if (!s) return [];
  if (/\n/.test(s)) {
    return s.split(/\n+/).map((x) => x.trim()).filter(Boolean);
  }
  const boundary = /\s+(?=[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:\s)/g;
  const chunks: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(s)) !== null) {
    if (shouldSkipSkillCategorySplit(s, m.index)) continue;
    if (m.index > 0 && s[m.index - 1] === '&') continue;
    chunks.push(s.slice(last, m.index).trim());
    last = m.index;
  }
  chunks.push(s.slice(last).trim());
  if (chunks.length <= 1) {
    const alt = s.split(/,\s+(?=[A-Z][A-Za-z &]{0,50}:\s)/);
    if (alt.length > 1) return alt.map((x) => x.trim()).filter(Boolean);
  }
  return chunks.filter(Boolean);
}

const SKILL_COMMA_TOKEN =
  /^(Java|Python|JavaScript|TypeScript|Ruby|Go|Rust|Swift|Kotlin|Scala|R|C\+\+|C#|HTML|CSS|SQL|MongoDB|PostgreSQL|MySQL|React|Node|Vue|Angular|Django|Flask|FastAPI|AWS|GCP|Azure|Docker|Kubernetes|Git|GitHub|Jupyter|Streamlit|pandas|NumPy|Matplotlib|Seaborn|scikit-learn)$/i;

/** Merge per-line skill fragments from mapSkills (e.g. "Languages: Python" + "Java"; "Machine" + "Learning: …"). */
function mergeSkillContinuationLines(lines: string[]): string[] {
  const q = lines.map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  const compoundFirst = new Set([
    'machine',
    'natural',
    'deep',
    'data',
    'computer',
    'large',
    'power',
    'neural',
    'artificial',
  ]);
  let i = 0;
  while (i < q.length) {
    const t = q[i];
    const nxt = q[i + 1];
    if (
      nxt &&
      !t.includes(':') &&
      compoundFirst.has(t.toLowerCase()) &&
      nxt.includes(':')
    ) {
      const ci = nxt.indexOf(':');
      out.push(
        `${t} ${nxt.slice(0, ci).trim()}: ${nxt.slice(ci + 1).trim()}`.replace(/\s+/g, ' ')
      );
      i += 2;
      continue;
    }
    if (!t.includes(':') && out.length) {
      const prev = out[out.length - 1];
      const sep = SKILL_COMMA_TOKEN.test(t) ? ', ' : ' ';
      out[out.length - 1] = `${prev}${sep}${t}`.replace(/\s+/g, ' ');
      i += 1;
      continue;
    }
    out.push(t);
    i += 1;
  }
  return out;
}

/** Merge "Machine" + { label: "Learning", value } → one row. */
function mergeCompoundSkillLabels(items: { label: string; value: string }[]): { label: string; value: string }[] {
  const PREFIX = new Set([
    'machine',
    'natural',
    'deep',
    'data',
    'computer',
    'large',
    'power',
    'neural',
    'artificial',
  ]);
  const out: { label: string; value: string }[] = [];
  let i = 0;
  while (i < items.length) {
    const cur = items[i];
    const nxt = items[i + 1];
    if (
      nxt &&
      !cur.label &&
      cur.value &&
      !/[,:]/.test(cur.value) &&
      PREFIX.has(cur.value.toLowerCase()) &&
      nxt.label
    ) {
      out.push({ label: `${cur.value} ${nxt.label}`, value: nxt.value });
      i += 2;
    } else {
      out.push(cur);
      i += 1;
    }
  }
  return out;
}

/** Append unlabeled fragments to the previous category (same line). */
function consolidateSkillCategoryRows(items: { label: string; value: string }[]): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  for (const it of items) {
    const label = it.label.trim();
    const value = it.value.trim();
    if (!label && value && out.length) {
      const prev = out[out.length - 1];
      if (prev.label) {
        prev.value = dedupeCommaList(`${prev.value}, ${value}`);
      } else {
        out.push({ label, value });
      }
    } else if (label && value) {
      const hit = out.find((x) => x.label.toLowerCase() === label.toLowerCase());
      if (hit) hit.value = dedupeCommaList(`${hit.value}, ${value}`);
      else out.push({ label, value: dedupeCommaList(value) });
    } else if (label || value) {
      out.push({ label, value: dedupeCommaList(value) });
    }
  }
  return out.filter((x) => x.label || x.value);
}

/** One merged blob → labelled rows; one UI line per category. */
function skillsToLabelledItems(skills: Skill[]): { label: string; value: string }[] {
  const lines = skills.map((s) => (s.name || '').trim()).filter(Boolean);
  if (!lines.length) return [];
  const mergedLines = mergeSkillContinuationLines(lines);
  const blob = mergedLines.join(' ');
  const rawItems: { label: string; value: string }[] = [];
  for (const piece of splitSkillCategoryChunks(blob)) {
    const p = piece.trim();
    if (!p) continue;
    const ci = p.indexOf(':');
    if (ci === -1) {
      rawItems.push({ label: '', value: dedupeCommaList(p) });
      continue;
    }
    const label = p.slice(0, ci).trim();
    const value = dedupeCommaList(p.slice(ci + 1).trim());
    if (label.length <= 56 && value) rawItems.push({ label, value });
    else rawItems.push({ label: '', value: dedupeCommaList(p) });
  }
  return consolidateSkillCategoryRows(mergeCompoundSkillLabels(rawItems));
}

function buildContacts(info: ResumeInfo): GaramondContact[] {
  const out: GaramondContact[] = [];
  if (info.email?.trim()) {
    const e = info.email.trim();
    out.push({ icon: '✉', label: e, href: `mailto:${e}` });
  }
  if (info.phone?.trim()) {
    const p = info.phone.trim();
    const tel = p.replace(/[^\d+]/g, '');
    out.push({ icon: '📞', label: p, href: `tel:${tel || p}` });
  }
  if (info.linkedIn?.trim()) {
    let u = info.linkedIn.trim();
    if (!/^https?:/i.test(u)) u = `https://${u.replace(/^\/+/, '')}`;
    const label = u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    out.push({ icon: 'in', label, href: u });
  }
  if (info.github?.trim()) {
    let u = info.github.trim();
    if (!/^https?:/i.test(u)) u = `https://github.com/${u.replace(/^\/+/, '')}`;
    const label = u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
    out.push({ icon: '⌥', label, href: u });
  }
  if (info.portfolio?.trim()) {
    let u = info.portfolio.trim();
    if (!/^https?:/i.test(u)) u = `https://${u}`;
    out.push({ icon: '◇', label: u.replace(/^https?:\/\//i, ''), href: u });
  }
  return out;
}

function skillsToGaramond(skills: Skill[]): GaramondSection | null {
  if (!skills.length) return null;
  const items = skillsToLabelledItems(skills);
  if (!items.length) return null;
  return {
    type: 'skills',
    title: 'Technical Skills',
    items,
  };
}

/** Pull project title vs tech list when the fix pipeline merges them. */
function normalizeProjectForDisplay(p: {
  name: string;
  description: string;
  technologies?: string[];
}): { title: string; bullets: string[]; technologies: string[] } {
  let title = (p.name || '').trim();
  let desc = (p.description || '').trim();
  const tech = new Set<string>();
  (p.technologies || []).forEach((x) => {
    const z = x.trim();
    if (z) tech.add(z);
  });

  const pipe = title.split(/\s*\|\s*/);
  if (pipe.length === 2 && /[,]/.test(pipe[1])) {
    title = pipe[0].trim();
    pipe[1].split(',').forEach((x) => {
      const z = x.trim();
      if (z) tech.add(z);
    });
  }

  const mdash = title.match(/^(.{2,80}?)\s*[—–-]\s+(.+)$/);
  if (mdash && mdash[2].length < 120 && /[,]|(?:\b(?:\.js|\.ts|React|Node|AWS|API)\b)/i.test(mdash[2])) {
    title = mdash[1].trim();
    mdash[2].split(',').forEach((x) => {
      const z = x.trim();
      if (z) tech.add(z);
    });
  }

  title = title.replace(/\s+/g, ' ');
  let bullets = projectDescToBullets(desc);
  if (tech.size) {
    bullets = [...bullets, `Technologies: ${Array.from(tech).join(', ')}`];
  }
  if (!bullets.length) bullets = ['Highlights and outcomes.'];
  return { title: title || 'Project', bullets, technologies: Array.from(tech) };
}

/** Map Fix / builder `ResumeInfo` into the Garamond template data model. */
export function resumeInfoToGaramondModel(info: ResumeInfo): GaramondResumeModel {
  const name = `${info.firstName || ''} ${info.lastName || ''}`.trim() || 'Your Name';
  const subtitle = [info.jobTitle, info.address].map((s) => (s || '').trim()).filter(Boolean);
  const contacts = buildContacts(info);
  const sections: GaramondSection[] = [];

  const sum = (info.summary || '').trim();
  if (sum) {
    const paras = sum.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    sections.push({
      type: 'list',
      title: 'Professional Profile',
      items: paras.length > 1 ? paras : [sum],
    });
  }

  if (info.education.length > 0) {
    const headers = ['Degree', 'Specialization', 'Institute', 'Year', 'GPA / CPI'];
    const rows = info.education.map((edu) => [
      edu.degree || '—',
      edu.major || '—',
      edu.universityName || '—',
      eduYearCell(edu) || '—',
      eduGpaCell(edu) || '—',
    ]);
    sections.push({ type: 'table', title: 'Education', headers, rows });
  }

  const sk = skillsToGaramond(info.skills);
  if (sk) sections.push(sk);

  if (info.experience.length > 0) {
    sections.push({
      type: 'entries',
      title: 'Experience',
      items: info.experience.map((exp) => {
        const loc = [exp.companyName, exp.city, exp.state].filter(Boolean).join(', ');
        const dr = expDateRange(exp);
        const org = [loc, dr].filter(Boolean).join(' · ') || undefined;
        let bullets = workSummaryToBullets(exp.workSummary);
        if (!bullets.length) bullets = dr ? [dr] : ['Key contributions and measurable impact.'];
        return { title: exp.title || 'Role', org, bullets };
      }),
    });
  }

  if (info.projects.length > 0) {
    sections.push({
      type: 'entries',
      title: 'Projects',
      items: info.projects.map((p) => {
        const norm = normalizeProjectForDisplay(p);
        return { title: norm.title, bullets: norm.bullets };
      }),
    });
  }

  const achievementsSection = buildAchievementsSection(info.fixResumeExtra);
  if (achievementsSection) sections.push(achievementsSection);

  return { name, subtitle, contacts, sections };
}

/** Fix soft line-breaks in PDF text (e.g. "environ- ments") and trim noisy spaces around punctuation. */
function normalizeAchievementLine(s: string): string {
  return s
    .replace(/\u00a0/g, ' ')
    .replace(/(\w)-\s+(\w)/g, '$1$2')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim();
}

/** Build achievements list (rendered last in the résumé). */
function buildAchievementsSection(fixResumeExtra: string | undefined): GaramondSection | null {
  const extra = (fixResumeExtra || '').trim();
  if (!extra) return null;

  let items: string[];
  if (/[•·▪▸]/.test(extra)) {
    items = extra
      .split(/[•·▪▸]+/)
      .map((s) => normalizeAchievementLine(s))
      .filter((s) => s.length > 3);
    if (items.length < 2) items = [normalizeAchievementLine(extra.replace(/[•·▪▸]+/g, ' '))];
  } else {
    const paras = extra.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    if (paras.length > 1) {
      items = paras.map(normalizeAchievementLine);
    } else if (extra.length > 280 && !extra.includes('\n')) {
      items = extra
        .split(/(?<=[.!?])\s+(?=[A-Z(])/)
        .map((s) => normalizeAchievementLine(s))
        .filter((s) => s.length > 12);
      if (items.length < 2) items = [normalizeAchievementLine(extra)];
    } else {
      items = extra.split(/\n+/).map((l) => normalizeAchievementLine(l)).filter(Boolean);
    }
  }

  if (!items.length) return null;
  return {
    type: 'list',
    title: 'Achievements & other highlights',
    items,
  };
}
