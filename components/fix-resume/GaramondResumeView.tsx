import React from 'react';
import type { GaramondResumeModel, GaramondSection } from '../../services/garamondResumeFromResumeInfo';
import { GARAMOND_RESUME_STYLES } from './garamondResumeStyles';
import { highlightAddedKeywords } from '../../utils/highlightAddedKeywords';

function hl(text: string, terms: string[]): React.ReactNode {
  if (!terms.length) return text;
  return highlightAddedKeywords(text, terms);
}

function renderSection(sec: GaramondSection, key: string, highlightTerms: string[]): React.ReactNode {
  const bar = (
    <div key={`${key}-bar`} className="section-title">
      {sec.title}
    </div>
  );

  if (sec.type === 'table') {
    return (
      <div key={key}>
        {bar}
        <table>
          <thead>
            <tr>
              {sec.headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sec.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => (
                  <td key={ci}>{hl(c, highlightTerms)}</td>
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
      <div key={key}>
        {bar}
        <ul className="skills-list">
          {sec.items.map((item, i) => (
            <li key={i}>
              {item.label ? (
                <>
                  <strong>{hl(item.label, highlightTerms)}:</strong> {hl(item.value, highlightTerms)}
                </>
              ) : (
                hl(item.value, highlightTerms)
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (sec.type === 'entries') {
    return (
      <div key={key}>
        {bar}
        <div className="garamond-entries">
          {sec.items.map((entry, ei) => (
            <div key={ei} className="entry">
              <div className="entry-title">
                {entry.org ? (
                  <>
                    {hl(entry.title, highlightTerms)} – <span className="org">{hl(entry.org, highlightTerms)}</span>
                  </>
                ) : (
                  hl(entry.title, highlightTerms)
                )}
              </div>
              <ul className="entry-bullets">
                {entry.bullets.map((b, bi) => (
                  <li key={bi}>{hl(b, highlightTerms)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sec.type === 'list') {
    const listClass =
      sec.title === 'Professional Profile'
        ? 'simple-list profile-plain'
        : sec.title === 'Achievements & other highlights'
          ? 'simple-list achievements-list'
          : 'simple-list';
    return (
      <div key={key}>
        {bar}
        <ul className={listClass}>
          {sec.items.map((item, i) =>
            typeof item === 'string' ? (
              <li key={i}>{hl(item, highlightTerms)}</li>
            ) : (
              <li key={i}>
                <strong>{hl(item.text, highlightTerms)}</strong>
                {item.meta ? (
                  <>
                    {' '}
                    – <span className="cert-meta">{hl(item.meta, highlightTerms)}</span>
                  </>
                ) : null}
                {item.desc ? (
                  <>
                    <br />
                    <span className="cert-desc">{hl(item.desc, highlightTerms)}</span>
                  </>
                ) : null}
              </li>
            )
          )}
        </ul>
      </div>
    );
  }

  return null;
}

export interface GaramondResumeViewProps {
  model: GaramondResumeModel;
  /** Injected into <style> for print window cloning */
  styleContent?: string;
  /** ATS terms merged this pass — highlighted in preview (and print when cloned). */
  highlightTerms?: string[];
}

/**
 * DOM mirrors the standalone EB Garamond template (classes + structure) for print/export.
 */
/** Ref should target `.page` so print clones the same structure as the standalone template body. */
export const GaramondResumeView = React.forwardRef<HTMLDivElement, GaramondResumeViewProps>(
  function GaramondResumeView({ model, styleContent = GARAMOND_RESUME_STYLES, highlightTerms = [] }, ref) {
    const terms = highlightTerms ?? [];
    return (
      <div className="garamond-resume-root">
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap"
        />
        <div ref={ref} className="page">
          <div className="header">
            <div className="header-left">
              <h1>{hl(model.name, terms)}</h1>
              <div className="subtitle">
                {model.subtitle.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 ? <br /> : null}
                    {hl(line, terms)}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="header-right">
              {model.contacts.map((c, i) => (
                <a key={i} href={c.href} target="_blank" rel="noreferrer">
                  {c.icon ? `${c.icon} ` : ''}
                  {hl(c.label, terms)}
                </a>
              ))}
            </div>
          </div>
          <div>{model.sections.map((sec, si) => renderSection(sec, `s-${si}`, terms))}</div>
        </div>
      </div>
    );
  }
);
