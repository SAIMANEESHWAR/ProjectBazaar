import type {
  Education,
  Experience,
  Project,
  ResumeInfo,
  ResumeTemplate,
  Skill,
} from '../context/ResumeInfoContext';

const FIX_PREVIEW_TEMPLATE: ResumeTemplate = 'professional';
const FIX_PREVIEW_THEME = '#FF6B00';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plain / line-broken text → safe HTML block (experience bullets — templates use dangerouslySetInnerHTML). */
function textToRichHtml(text: string): string {
  const t = (text || '').trim();
  if (!t) return '';
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return '';
  return paras
    .map((p) => {
      const withBr = escapeHtml(p).replace(/\n/g, '<br/>');
      return `<p>${withBr}</p>`;
    })
    .join('');
}

/** Single-line plain text (summary one-liner fallback). */
function toPlainResumeText(text: string): string {
  return (text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Keep newlines for whitespace-pre-wrap sections (projects, multi-para summary). */
function toPlainMultiline(text: string): string {
  let s = (text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r\n/g, '\n');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s
    .split('\n')
    .map((ln) => ln.trim())
    .join('\n')
    .trim();
}

/** Remove common PDF / merge glitches. */
function stripNoise(s: string): string {
  return s.replace(/\bv\d+\b/gi, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Clean header line: drop URLs, mangled "/envel…" segments, handles merged with phone.
 */
function sanitizeDisplayName(raw: string): string {
  let s = stripNoise(String(raw || '').replace(/\r/g, '')).trim();
  s = s.replace(/https?:\/\/[^\s)]+/gi, '');
  s = s.replace(/\s*\/\s*in\/[^\s]+/gi, '');
  s = s.replace(/\s*\/envel[^\s]*/gi, '');
  s = s.replace(/\/[^\s]*linkedin[^\s]*/gi, '');
  // Slash followed by long token-no-spaces (garbled handle)
  s = s.replace(/\s*\/\s*[^\s/]{1,3}[^\s]{12,}/g, '');
  const slashIdx = s.indexOf('/');
  if (slashIdx >= 2) {
    const after = s.slice(slashIdx + 1).trim();
    if (after.length > 25 && !/\s/.test(after)) {
      s = s.slice(0, slashIdx).trim();
    }
  }
  s = s.replace(/\+?\d[\d\s\-]{8,}\d/g, ' ').trim();
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** +91… or similar from anywhere in blob. */
// NOTE: Fix Resume preview now expects AI-filled contact fields; no regex extraction fallback.

function pickStr(data: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

// NOTE: Email/contacts extraction from text was removed in favor of AI-filled fields.

// NOTE: Fix Resume preview now expects AI-filled contact fields; no blob scanning fallback.

function normalizeHttpUrl(u: string): string {
  let s = u.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s.replace(/^\/+/, '')}`;
  return s;
}

function normalizeGithubUrl(s: string): string {
  const t = s.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  if (/github\.com/i.test(t)) return `https://${t.replace(/^\/+/, '')}`;
  return `https://github.com/${t.replace(/^\/+/, '')}`;
}

/**
 * Split mashed education paragraph into separate rows (B.Tech / Intermediate / SSC, …).
 */
function parseEducationString(raw: string): Education[] {
  const t = stripNoise(String(raw || '').replace(/\r/g, ' ')).replace(/\s+/g, ' ').trim();
  if (!t) return [];

  const degreeRe =
    /\b(B\.Tech|B\.E\.|M\.Tech|M\.E\.|B\.Sc\.?|M\.Sc\.?|MBA|MCA|BCA|B\.Com|M\.Com|BBA|Intermediate|SSC|Diploma|Ph\.?D)\b/gi;
  const hits: { idx: number; label: string }[] = [];
  for (const m of t.matchAll(degreeRe)) {
    if (m.index !== undefined) hits.push({ idx: m.index, label: m[1] });
  }
  if (hits.length === 0) {
    return [
      {
        id: 'fix_edu_0',
        universityName: t.slice(0, 140),
        degree: '',
        major: '',
        startDate: '',
        endDate: '',
        description: t.length > 140 ? t.slice(140) : '',
      },
    ];
  }

  const chunks: string[] = [];
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].idx;
    const end = i + 1 < hits.length ? hits[i + 1].idx : t.length;
    chunks.push(t.slice(start, end).trim());
  }

  return chunks.map((chunk, i) => {
    const dm = chunk.match(
      /^(B\.Tech|B\.E\.|M\.Tech|M\.E\.|B\.Sc\.?|M\.Sc\.?|MBA|MCA|BCA|B\.Com|M\.Com|BBA|Intermediate|SSC|Diploma|Ph\.?D)\s*(.*)$/i
    );
    const degree = dm ? dm[1] : '';
    let rest = dm ? dm[2].trim() : chunk;
    const yearM = rest.match(/(\d{4})\s*[-–]\s*(Present|\d{4})/i);
    const yearSpan = yearM ? yearM[0] : '';
    if (yearM && yearM.index !== undefined) {
      const yi = yearM.index;
      rest = (rest.slice(0, yi) + rest.slice(yi + yearM[0].length)).replace(/\s+/g, ' ').trim();
    }
    const cpiM = rest.match(/\b(\d{1,2}(?:\.\d+)?)\s*$/);
    const cpi = cpiM ? cpiM[1] : '';
    if (cpiM && cpiM.index !== undefined) rest = rest.slice(0, cpiM.index).trim();

    rest = rest.replace(/^in\s+/i, '').trim();
    const { major, institute: instituteRaw } = splitMajorAndInstitute(rest);
    let uni = instituteRaw || rest.slice(0, 80) || 'Institution';
    const peeled = peelTrailingSchoolYear(uni);
    uni = peeled.name;
    const looseYear = !yearSpan && peeled.year ? peeled.year : '';
    const descParts = [
      yearSpan && `Period: ${yearSpan}`,
      looseYear && `Year: ${looseYear}`,
      cpi && `CPI / Score: ${cpi}`,
    ].filter(Boolean);
    return {
      id: `fix_edu_${i}`,
      universityName: uni.slice(0, 200),
      degree: degree || '',
      major: (major || '').slice(0, 200),
      startDate: '',
      endDate: '',
      description: descParts.join(' · '),
    };
  });
}

/**
 * Split stream/specialization (left) from school name (right) when the parser merged one blob.
 * Handles "AI & ML SNIST", "Mathematics, Physics & Chemistry Sri Chaitanya Jr", "… IIT Academy", etc.
 */
function splitMajorAndInstitute(restRaw: string): { major: string; institute: string } {
  const rest = restRaw.replace(/^in\s+/i, '').trim();
  if (!rest) return { major: '', institute: '' };

  const instKeyword =
    /\b([A-Za-z][A-Za-z0-9&.,'\s\-]{0,80}(?:University|College|Institute|School|Convent|Academy|NIT|IIT|IIIT|NIST)\b[A-Za-z0-9&.,'\s\-]{0,32})/i;
  let m = rest.match(instKeyword);
  if (m && m.index !== undefined && m.index >= 0) {
    const institute = m[0].trim();
    const major = rest.slice(0, m.index).trim().replace(/[,\s]+$/g, '');
    return { major, institute };
  }

  m = rest.match(/\s+(Sri\s+[A-Za-z]+(?:\s+[A-Za-z]+)*(?:\s+Jr\.?))\s*$/i);
  if (m && m.index !== undefined && m.index > 1) {
    return { major: rest.slice(0, m.index).trim(), institute: m[1].trim() };
  }

  m = rest.match(/\s+((?:[A-Za-z]+\s+){0,3}IIT\s+Academy)\s*$/i);
  if (m && m.index !== undefined && m.index > 1) {
    return { major: rest.slice(0, m.index).trim(), institute: m[1].trim() };
  }

  m = rest.match(/\s+([A-Za-z][A-Za-z0-9&.,'\s\-]{0,50}(?:College|University|School))\s*$/i);
  if (m && m.index !== undefined && m.index > 1) {
    return { major: rest.slice(0, m.index).trim(), institute: m[1].trim() };
  }

  m = rest.match(/\s+([A-Za-z][A-Za-z\s]{0,42}Academy)\s*$/i);
  if (m && m.index !== undefined && m.index > 1) {
    return { major: rest.slice(0, m.index).trim(), institute: m[1].trim() };
  }

  m = rest.match(/\s+([A-Z]{3,12})\s*$/);
  if (m && m.index !== undefined && m.index > 2) {
    const maj = rest.slice(0, m.index).trim();
    const looksLikeStream =
      /[,&]|\b(?:Mathematics|Physics|Chemistry|Biology|AI|ML|Science|Computer|Electronics|Mechanical|Civil|Commerce|Arts|MPC|BPC|CEC|CSE|ECE|EEE|IT)\b/i.test(
        maj
      );
    if (looksLikeStream || maj.includes('&')) {
      return { major: maj, institute: m[1].trim() };
    }
  }

  const inMatch = rest.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s*$/);
  if (inMatch && inMatch.index !== undefined && inMatch.index > 4) {
    return {
      major: rest.slice(0, inMatch.index).trim().replace(/\.\s*$/g, ''),
      institute: inMatch[1].trim(),
    };
  }

  return { major: '', institute: rest };
}

/** Move trailing "… Jr 2022" / "… School 2020" year out of institute into metadata for the Year column. */
function peelTrailingSchoolYear(institute: string): { name: string; year: string } {
  const u = institute.trim();
  const m = u.match(/^(.+?)\s+((?:19|20)\d{2})$/);
  if (!m || m[1].length < 4) return { name: u, year: '' };
  return { name: m[1].trim(), year: m[2] };
}

function fixPdfSoftHyphensProjects(s: string): string {
  return s.replace(/(\w)-\s+(\w)/g, '$1$2');
}

function stripProjectLineNoise(line: string): string {
  return line.replace(/^[-–•·▪\u2022\s]+/g, '').replace(/^[-–]\s*[-–•·]\s*/g, '').trim();
}

function projectLeadKey(nameOrLine: string): string {
  const head = nameOrLine.split(/[—–-]/)[0].trim();
  return head.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 28);
}

function projectKeysDistinct(a: string, b: string): boolean {
  const x = projectLeadKey(a);
  const y = projectLeadKey(b);
  if (!x || !y) return true;
  if (x === y) return false;
  return !x.includes(y) && !y.includes(x);
}

/** "Subtitle –Built" → subtitle + first bullet on same line. */
function splitProjectSubtitleAndBody(rest: string): { subtitle: string; sameLineBody: string } {
  const t = rest.trim();
  const vi = t.search(
    /\s+(?:Built|Designed|Developed|Implemented|Created|Leveraged|Engineered|Deployed|Launched|Led|Integrated|Optimized|Established|Utilizing|Using|Achieved|Demonstrated)\b/i
  );
  if (vi <= 0) return { subtitle: t, sameLineBody: '' };
  return { subtitle: t.slice(0, vi).trim(), sameLineBody: t.slice(vi).trim() };
}

/** Insert newlines before embedded "-•ProjectName –" headers (single-line PDF merges). */
function breakMergedProjectHeaders(text: string): string {
  return text.replace(
    /\s+(?:[-–•·\u2022]{1,6}\s*)+(?=[A-Z][A-Za-z0-9 &./\-]{2,50}\s+[—–-])/g,
    '\n'
  );
}

/**
 * Split one `projects[]` row when description contains multiple "Name – Subtitle" blocks
 * (e.g. RiskSense bullets then "-•CiviGuard AI – …").
 */
function splitMergedProjectEntry(p: Project): Project[] {
  const name = (p.name || 'Project').trim();
  const desc = (p.description || '').trim();
  const blob = breakMergedProjectHeaders(`${name}\n${desc}`.trim());

  let plain = fixPdfSoftHyphensProjects(
    stripNoise(
      blob
        .replace(/<\/(p|div|li|ul|ol)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
      .replace(/\*\*/g, ' ')
      .trim()
  );
  const lines = plain
    .split(/\n+/)
    .map((l) => stripProjectLineNoise(l).replace(/\s+/g, ' '))
    .filter(Boolean);

  if (lines.length < 2) return [p];

  // Allow bullets and missing spaces around dash (PDF/LLM often produce "–Built" or " -Built").
  const headerRe =
    /^[-–•·▪\u2022\s]*([A-Z][A-Za-z0-9 &./\-]{2,62}?)\s*[—–-]\s*(.+)$/;
  const primaryLead = projectLeadKey(name);

  type Seg = { displayTitle: string; lines: string[] };
  const segments: Seg[] = [];
  let cur: Seg = { displayTitle: name, lines: [] };
  let didSplit = false;

  for (const line of lines) {
    const hm = line.match(headerRe);
    if (!hm) {
      cur.lines.push(line);
      continue;
    }
    const lead = hm[1].trim();
    const rest = hm[2].trim();
    const { subtitle, sameLineBody } = splitProjectSubtitleAndBody(rest);
    const displayTitle = `${lead} – ${subtitle}`.trim();

    const dupPrimary =
      projectLeadKey(lead) === primaryLead ||
      (lead.length >= 3 && name.toLowerCase().startsWith(lead.toLowerCase()));
    if (dupPrimary && cur.lines.length === 0) {
      if (sameLineBody) cur.lines.push(sameLineBody);
      continue;
    }

    const bodySoFar = cur.lines.join(' ').trim().length;
    const canSplit = cur.lines.length >= 1 || bodySoFar >= 12;

    if (canSplit && projectKeysDistinct(cur.displayTitle, displayTitle)) {
      segments.push(cur);
      didSplit = true;
      cur = { displayTitle, lines: sameLineBody ? [sameLineBody] : [] };
    } else if (dupPrimary && sameLineBody) {
      cur.lines.push(sameLineBody);
    } else {
      cur.lines.push(sameLineBody || line);
    }
  }
  segments.push(cur);

  if (!didSplit) return [p];

  return segments.map((seg, j) => ({
    id: `${p.id}_p${j}`,
    name: seg.displayTitle || `Project ${j + 1}`,
    description: stripNoise(toPlainMultiline(seg.lines.join('\n\n'))),
    technologies: j === 0 ? p.technologies ?? [] : [],
  }));
}

/** Expand any item whose description hides multiple projects. */
function expandProjects(items: Project[]): Project[] {
  const out: Project[] = [];
  items.forEach((p) => {
    splitMergedProjectEntry(p).forEach((x) => out.push(x));
  });
  return out.length ? out : items;
}

function splitNameLine(name: string): { firstName: string; lastName: string; jobTitle: string } {
  const raw = sanitizeDisplayName(name);
  if (!raw) return { firstName: '', lastName: '', jobTitle: '' };
  const dashParts = raw.split(/\s*[—–]\s*/);
  if (dashParts.length >= 2) {
    const jobTitle = dashParts[dashParts.length - 1].trim();
    const namePart = dashParts.slice(0, -1).join(' ').trim();
    const words = namePart.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return { firstName: words[0], lastName: words.slice(1).join(' '), jobTitle };
    }
    return { firstName: namePart, lastName: '', jobTitle };
  }
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return { firstName: words[0], lastName: words.slice(1).join(' '), jobTitle: '' };
  }
  return { firstName: raw, lastName: '', jobTitle: '' };
}

/** Strip contact-ish tokens accidentally merged into headline / subtitle. */
function stripContactNoiseFromTitle(title: string): string {
  let t = (title || '').trim();
  const noise = /\b(phone|email|e-mail|mobile|cell|linkedin|github|portfolio|website)\b/gi;
  t = t.replace(noise, ' ').replace(/\s+/g, ' ').trim();
  return t.replace(/[,;]\s*$/g, '').trim();
}

function cleanJobTitleLine(title: string, phone: string): string {
  let t = (title || '').trim();
  if (phone && t.includes(phone)) t = t.replace(phone, '').trim();
  if (/^\+?\d[\d\s\-]{6,}$/.test(t)) return '';
  t = stripContactNoiseFromTitle(t);
  return t.replace(/\s+/g, ' ').trim();
}

function parseExperienceTitleLine(line: string): { title: string; companyName: string } {
  const t = (line || '').trim();
  if (!t) return { title: '', companyName: '' };
  const m = /\s+at\s+/i.exec(t);
  if (m && m.index > 0) {
    return {
      title: t.slice(0, m.index).trim(),
      companyName: t.slice(m.index + m[0].length).trim(),
    };
  }
  const dm = t.match(/^(.{2,75}?)\s+[—–-]\s+(.+)$/);
  if (dm) {
    return { title: dm[1].trim(), companyName: dm[2].trim() };
  }
  return { title: t, companyName: '' };
}

function fixPdfSoftHyphens(s: string): string {
  return s.replace(/(\w)-\s+(\w)/g, '$1$2');
}

/** Normalize "Role – Org" lines for matching (PDF bullets, markdown). */
function stripLeadingBulletNoise(line: string): string {
  return line.replace(/^[-–•·▪\u2022\s]+/g, '').trim();
}

function expRoleKey(t: string, c: string): string {
  return `${t} ${c}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** True when parsed header line is the same role as the JSON title row (skip duplicate header in body). */
function rolesApproxEqual(titleA: string, coA: string, titleB: string, coB: string): boolean {
  const a = expRoleKey(titleA, coA);
  const b = expRoleKey(titleB, coB);
  if (!a || !b) return false;
  if (a === b) return true;
  return (a.length > 12 && b.length > 12 && (a.includes(b) || b.includes(a))) || false;
}

/** Split "Org Name Contributed …" → org vs first bullet on same line. */
function splitCompanyAndRestAfterDash(rest: string): { company: string; sameLineBody: string } {
  const t = rest.trim();
  const vi = t.search(
    /\s+(?:Contributed|Co-founded|Built|Developed|Implemented|Led|Designed|Spearheaded|Created|Analyzed|Collaborated|Utilized|Engineered|Deployed|Integrated|Optimized|Delivered|Managed|Facilitated|Supported|Enhanced|Established|Drove|Streamlined)\b/i
  );
  if (vi <= 0) return { company: t, sameLineBody: '' };
  return {
    company: t.slice(0, vi).trim(),
    sameLineBody: t.slice(vi).trim(),
  };
}

/**
 * When one JSON row contains multiple roles (e.g. "- • Developer – Codex …" after Data Analyst bullets),
 * split into separate Experience entries.
 */
function expandMergedExperienceEntries(
  title: string,
  companyName: string,
  detail: string,
  idBase: string
): Experience[] {
  const plain = fixPdfSoftHyphens(
    stripNoise(
      detail
        .replace(/<\/(p|div|li|ul|ol)>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(strong|b|em|i)>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
    )
      .replace(/\*\*/g, ' ')
      .trim()
  );
  const lines = plain
    .split(/\n+/)
    .map((l) => stripLeadingBulletNoise(l).replace(/\s+/g, ' '))
    .filter(Boolean);

  const mkOne = (): Experience[] => [
    {
      id: idBase,
      title: title || 'Role',
      companyName: companyName || '',
      city: '',
      state: '',
      startDate: '',
      endDate: '',
      currentlyWorking: false,
      workSummary: textToRichHtml(detail) || '<p></p>',
    },
  ];

  if (lines.length < 1) return mkOne();

  // Allow bullets and missing spaces around dash (PDF/LLM often produce "–Built" or " -Built").
  const headerRe =
    /^[-–•·▪\u2022\s]*([A-Z][A-Za-z0-9 &./\-]{2,55}?)\s*[—–-]\s*(.+)$/;
  const pt = (title || 'Role').trim();
  const pc = (companyName || '').trim();

  type Seg = { title: string; company: string; lines: string[] };
  const segments: Seg[] = [];
  let cur: Seg = { title: pt, company: pc, lines: [] };
  let didSplit = false;

  for (const line of lines) {
    const hm = line.match(headerRe);
    if (!hm || /\bhttp\b/i.test(line)) {
      cur.lines.push(line);
      continue;
    }
    const nt = hm[1].trim();
    const { company: nc, sameLineBody } = splitCompanyAndRestAfterDash(hm[2].trim());

    if (rolesApproxEqual(nt, nc, pt, pc)) {
      if (sameLineBody) cur.lines.push(sameLineBody);
      continue;
    }

    const bodyLen = cur.lines.join(' ').trim().length;
    const canSplit = cur.lines.length >= 1 || bodyLen >= 8;

    if (canSplit && !rolesApproxEqual(nt, nc, cur.title, cur.company)) {
      segments.push(cur);
      didSplit = true;
      cur = { title: nt, company: nc, lines: sameLineBody ? [sameLineBody] : [] };
    } else if (canSplit && sameLineBody) {
      cur.lines.push(sameLineBody);
    } else if (!canSplit) {
      cur.lines.push(
        sameLineBody ? `${nt} – ${nc}${sameLineBody ? ` ${sameLineBody}` : ''}`.trim() : line
      );
    } else {
      cur.lines.push(sameLineBody || line);
    }
  }
  segments.push(cur);

  if (!didSplit) {
    return [
      {
        id: idBase,
        title: pt,
        companyName: pc,
        city: '',
        state: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        workSummary: textToRichHtml(cur.lines.join('\n\n')) || textToRichHtml(detail) || '<p></p>',
      },
    ];
  }

  return segments.map((seg, j) => ({
    id: `${idBase}_${j}`,
    title: seg.title || 'Role',
    companyName: seg.company || '',
    city: '',
    state: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    workSummary: textToRichHtml(seg.lines.join('\n\n')) || '<p></p>',
  }));
}

function mapExperience(raw: unknown): Experience[] {
  if (!Array.isArray(raw)) return [];
  const out: Experience[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    const o = item as Record<string, unknown>;
    const line = stripNoise(String(o.title ?? '').trim());
    const detail = stripNoise(String(o.detail ?? '').trim());
    const { title, companyName } = parseExperienceTitleLine(line);
    const expanded = expandMergedExperienceEntries(title, companyName, detail, `fix_exp_${i}`);
    expanded.forEach((e) => out.push(e));
  });
  return out;
}

function mapProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];
  const out: Project[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== 'object') return;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? '').trim();
    const description = String(o.description ?? '').trim();
    out.push({
      id: `fix_proj_${i}`,
      name: name || `Project ${i + 1}`,
      description: stripNoise(toPlainMultiline(description)),
      technologies: [],
    });
  });
  return expandProjects(out);
}

function mapSkills(raw: unknown): Skill[] {
  if (!Array.isArray(raw)) return [];
  const out: Skill[] = [];
  const seen = new Set<string>();
  let si = 0;
  raw.forEach((item, i) => {
    let name = toPlainResumeText(typeof item === 'string' ? item : String(item ?? ''));
    if (!name) return;
    const chunks = name.split(/\n+/).map((c) => c.trim()).filter(Boolean);
    const parts = chunks.length > 1 ? chunks : [name];
    parts.forEach((part) => {
      const k = part.toLowerCase();
      if (!part || seen.has(k)) return;
      seen.add(k);
      out.push({ id: `fix_sk_${i}_${si}_${k.slice(0, 16)}`, name: part, rating: 4 });
      si += 1;
    });
  });
  return out;
}

/**
 * Maps Fix-Resume Lambda `improvedResume` JSON into `ResumeInfo` for `ResumePreview` templates.
 */
export function mapImprovedResumeToResumeInfo(data: Record<string, unknown>): ResumeInfo {
  const nameRaw = String(data.name ?? '');
  const { firstName, lastName, jobTitle: nameJob } = splitNameLine(nameRaw);

  const summaryRaw = String(data.summary ?? '').trim();
  const extraRaw = String(data.extra ?? '').trim();
  const summaryPlain = stripNoise(toPlainMultiline(summaryRaw));
  const fixResumeExtra = extraRaw ? stripNoise(toPlainMultiline(extraRaw)) : undefined;

  let education: Education[] = [];
  if (Array.isArray((data as Record<string, unknown>).education)) {
    const rows = (data as Record<string, unknown>).education as unknown[];
    education = rows
      .map((r, i) => {
        if (!r || typeof r !== 'object') return null;
        const o = r as Record<string, unknown>;
        const degree = String(o.degree ?? '').trim();
        const major = String(o.specialization ?? '').trim();
        const institute = String(o.institute ?? '').trim();
        const year = String(o.year ?? '').trim();
        const gpa = String(o.gpa ?? '').trim();
        if (!degree && !institute && !major) return null;
        return {
          id: `fix_edu_${i}`,
          universityName: institute,
          degree,
          major,
          startDate: '',
          endDate: '',
          description: [year, gpa ? `GPA/CPI: ${gpa}` : ''].filter(Boolean).join(' · '),
        } satisfies Education;
      })
      .filter(Boolean) as Education[];
  } else {
    const educationText = String(data.education ?? '').trim();
    education = educationText ? parseEducationString(educationText) : [];
  }

  // AI parsing is expected to fill contacts; do not regex-extract from blobs.
  const phone = pickStr(data, 'phone', 'Phone', 'contactPhone');
  const email = pickStr(data, 'email', 'Email', 'contactEmail');
  let linkedIn =
    pickStr(data, 'linkedIn', 'linkedin', 'linkedinUrl', 'linkedin_url', 'linked_in') || '';
  let github = pickStr(data, 'github', 'githubUrl', 'github_url') || '';
  let portfolio =
    pickStr(data, 'portfolio', 'website', 'personalWebsite', 'personal_website', 'url') || '';

  linkedIn = normalizeHttpUrl(linkedIn);
  github = github ? normalizeGithubUrl(github) : '';
  portfolio = portfolio ? normalizeHttpUrl(portfolio) : '';

  let jobTitle = cleanJobTitleLine(nameJob, phone);
  if (!jobTitle && /undergraduate|student|engineer|developer|analyst/i.test(summaryPlain)) {
    const line = (summaryPlain.split('\n')[0] || '').replace(/\s+/g, ' ').trim();
    if (line.length < 90) jobTitle = cleanJobTitleLine(line, phone);
  }

  return {
    firstName: firstName || 'Candidate',
    lastName: lastName || '',
    jobTitle,
    address: '',
    phone,
    email,
    linkedIn,
    github,
    portfolio,
    profileImage: '',
    themeColor: FIX_PREVIEW_THEME,
    template: FIX_PREVIEW_TEMPLATE,
    summary: summaryPlain,
    fixResumeExtra,
    experience: mapExperience(data.experience),
    education,
    skills: mapSkills(data.skills),
    projects: mapProjects(data.projects),
  };
}
