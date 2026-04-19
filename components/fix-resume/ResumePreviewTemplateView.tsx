import React from 'react';
import { highlightAddedKeywords } from '../../utils/highlightAddedKeywords';
import { normalizeHighlightTerms } from '../../utils/highlightAddedKeywords';

export type ResumePreviewContact = { icon?: string; label: string; href: string };

export type ResumePreviewSection =
  | { type: 'table'; title: string; headers: string[]; rows: string[][] }
  | { type: 'skills'; title: string; items: { label: string; value: string }[] }
  | { type: 'entries'; title: string; items: { title: string; org?: string; bullets: string[] }[] }
  | { type: 'list'; title: string; items: (string | { text: string; meta?: string; desc?: string })[] };

export type ResumePreviewData = {
  name: string;
  subtitle: string[];
  contacts: ResumePreviewContact[];
  sections: ResumePreviewSection[];
};

const TEMPLATE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --black: #111; --gray: #555; --light-gray: #e8e8e8;
  --section-bg: #d0d0d0; --link: #1a4fa0;
  --body-font: 'EB Garamond', Georgia, serif;
  --head-font: 'EB Garamond', Georgia, serif;
}
body {
  background: #fff;
  font-family: var(--body-font);
  font-size: 14px; color: var(--black); line-height: 1.55;
}
.page {
  background: #fff; max-width: 780px;
  margin: 36px auto; padding: 36px;
}

/* HEADER */
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.header-left h1 { font-family: var(--head-font); font-size: 28px; font-weight: 700; line-height: 1.15; }
.header-left .subtitle { font-size: 13px; color: var(--gray); margin-top: 2px; }
.header-right { text-align: right; font-size: 12.5px; line-height: 1.9; }
.header-right a { color: var(--link); text-decoration: none; display: block; }
.header-right a:hover { text-decoration: underline; }

/* SECTION TITLE */
.section-title {
  background: var(--section-bg); font-size: 11px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 3px 6px; margin: 14px 0 8px 0; color: var(--black);
}

/* TABLE */
table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead tr { border-bottom: 1px solid var(--light-gray); }
th { text-align: left; font-weight: 600; padding: 4px 6px 4px 0; font-size: 12.5px; }
td { padding: 3px 6px 3px 0; vertical-align: top; }
tr:not(:last-child) td { border-bottom: 1px solid #f0f0f0; }

/* SKILLS */
.skills-list { list-style: disc; padding-left: 18px; font-size: 13px; }
.skills-list li { margin-bottom: 3px; }
.skills-list li strong { font-weight: 600; }

/* ENTRIES */
.entry { margin-bottom: 10px; }
.entry-title { font-weight: 700; font-size: 13.5px; margin-bottom: 2px; }
.entry-title .org { font-weight: 400; color: var(--gray); }
.entry-bullets { list-style: none; padding-left: 10px; margin-top: 2px; }
.entry-bullets li { position: relative; padding-left: 14px; margin-bottom: 2px; font-size: 13px; color: #222; }
.entry-bullets li::before { content: '–'; position: absolute; left: 0; color: var(--gray); }

/* PLAIN LIST */
.simple-list { list-style: disc; padding-left: 18px; font-size: 13px; }
.simple-list li { margin-bottom: 3px; }
.cert-meta { font-size: 11.5px; color: var(--gray); }
.cert-desc { font-size: 12px; color: #444; }

mark.garamond-injected-kw {
  background: rgba(251, 191, 36, 0.42);
  color: inherit;
  border-radius: 2px;
  padding: 0 2px;
  font-weight: 600;
}

@media print {
  body { background: #fff; }
  .page { box-shadow: none; margin: 0; max-width: 100%; }
  mark.garamond-injected-kw { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

function hl(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  return highlightAddedKeywords(text, terms);
}

function renderSection(sec: ResumePreviewSection, i: number, terms: string[]): React.ReactNode {
  const bar = (
    <div key={`bar-${i}`} className="section-title">
      {sec.title}
    </div>
  );

  if (sec.type === 'table') {
    return (
      <div key={i}>
        {bar}
        <table>
          <thead>
            <tr>
              {sec.headers.map((h) => (
                <th key={h}>{hl(h, terms)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sec.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => (
                  <td key={ci}>{hl(c, terms)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sec.type === 'skills') {
    return (
      <div key={i}>
        {bar}
        <ul className="skills-list">
          {sec.items.map((it, si) => (
            <li key={si}>
              {it.label ? (
                <>
                  <strong>{hl(it.label, terms)}:</strong> {hl(it.value, terms)}
                </>
              ) : (
                hl(it.value, terms)
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (sec.type === 'entries') {
    return (
      <div key={i}>
        {bar}
        {sec.items.map((entry, ei) => (
          <div key={ei} className="entry">
            <div className="entry-title">
              {entry.org ? (
                <>
                  {hl(entry.title, terms)} – <span className="org">{hl(entry.org, terms)}</span>
                </>
              ) : (
                hl(entry.title, terms)
              )}
            </div>
            <ul className="entry-bullets">
              {entry.bullets.map((b, bi) => (
                <li key={bi}>{hl(b, terms)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // list
  return (
    <div key={i}>
      {bar}
      <ul className="simple-list">
        {sec.items.map((it, li) =>
          typeof it === 'string' ? (
            <li key={li}>{hl(it, terms)}</li>
          ) : (
            <li key={li}>
              <strong>{hl(it.text, terms)}</strong>
              {it.meta ? (
                <>
                  {' '}
                  – <span className="cert-meta">{hl(it.meta, terms)}</span>
                </>
              ) : null}
              {it.desc ? (
                <>
                  <br />
                  <span className="cert-desc">{hl(it.desc, terms)}</span>
                </>
              ) : null}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

export interface ResumePreviewTemplateViewProps {
  data: ResumePreviewData;
  highlightTerms?: string[];
}

export const ResumePreviewTemplateView = React.forwardRef<HTMLDivElement, ResumePreviewTemplateViewProps>(
  function ResumePreviewTemplateView({ data, highlightTerms = [] }, ref) {
    const terms = normalizeHighlightTerms(highlightTerms);
    return (
      <div ref={ref}>
        <style dangerouslySetInnerHTML={{ __html: TEMPLATE_CSS }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap"
        />
        <div className="page">
          <div className="header">
            <div className="header-left">
              <h1>{hl(data.name || '', terms)}</h1>
              <div className="subtitle">
                {(data.subtitle ?? []).map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 ? <br /> : null}
                    {hl(line, terms)}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="header-right">
              {(data.contacts ?? []).map((c, i) => (
                <a key={i} href={c.href} target="_blank" rel="noreferrer">
                  {c.icon ? `${c.icon} ` : ''}
                  {hl(c.label, terms)}
                </a>
              ))}
            </div>
          </div>
          <div>{(data.sections ?? []).map((sec, i) => renderSection(sec, i, terms))}</div>
        </div>
      </div>
    );
  }
);

