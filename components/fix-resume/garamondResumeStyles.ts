/**
 * Scoped under .garamond-resume-root for in-app preview and print window
 * (clone is wrapped with that class in openGaramondResumePrint).
 */
export const GARAMOND_RESUME_STYLES = `
    .garamond-resume-root {
      --black: #111; --gray: #555; --light-gray: #e8e8e8;
      --section-bg: #d0d0d0; --link: #1a4fa0;
      --body-font: 'EB Garamond', Georgia, serif;
      --head-font: 'EB Garamond', Georgia, serif;
      background: #fff;
      font-family: var(--body-font);
      font-size: 14px;
      color: var(--black);
      line-height: 1.55;
    }
    .garamond-resume-root *,
    .garamond-resume-root *::before,
    .garamond-resume-root *::after { box-sizing: border-box; }
    .garamond-resume-root .page {
      background: #fff; max-width: 780px;
      margin: 36px auto; padding: 36px;
    }
    .garamond-resume-root .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .garamond-resume-root .header-left h1 { font-family: var(--head-font); font-size: 28px; font-weight: 700; line-height: 1.15; margin: 0; }
    .garamond-resume-root .header-left .subtitle { font-size: 13px; color: var(--gray); margin-top: 2px; }
    .garamond-resume-root .header-right { text-align: right; font-size: 12.5px; line-height: 1.9; }
    .garamond-resume-root .header-right a { color: var(--link); text-decoration: none; display: block; }
    .garamond-resume-root .header-right a:hover { text-decoration: underline; }
    .garamond-resume-root .section-title {
      background: var(--section-bg); font-size: 11px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 3px 6px; margin: 14px 0 8px 0; color: var(--black);
    }
    .garamond-resume-root table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
    .garamond-resume-root thead tr { border-bottom: 1px solid var(--light-gray); }
    .garamond-resume-root th { text-align: left; font-weight: 600; padding: 4px 6px 4px 0; font-size: 12.5px; }
    .garamond-resume-root td { padding: 5px 8px 5px 0; vertical-align: top; word-wrap: break-word; hyphens: auto; }
    .garamond-resume-root table td:nth-child(4),
    .garamond-resume-root table th:nth-child(4) { width: 11em; white-space: normal; font-size: 12.5px; }
    .garamond-resume-root tbody tr:not(:last-child) td { border-bottom: 1px solid #f0f0f0; }
    .garamond-resume-root .skills-list { list-style: disc; padding-left: 18px; font-size: 13px; margin: 0; }
    .garamond-resume-root .skills-list li { margin-bottom: 10px; line-height: 1.45; }
    .garamond-resume-root .skills-list li strong { font-weight: 600; }
    .garamond-resume-root .garamond-entries .entry {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ececec;
    }
    .garamond-resume-root .garamond-entries .entry:last-child {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }
    .garamond-resume-root .entry-title { font-weight: 700; font-size: 13.5px; margin-bottom: 2px; }
    .garamond-resume-root .entry-title .org { font-weight: 400; color: var(--gray); }
    .garamond-resume-root .entry-bullets { list-style: none; padding-left: 10px; margin-top: 2px; margin-bottom: 0; }
    .garamond-resume-root .entry-bullets li { position: relative; padding-left: 14px; margin-bottom: 2px; font-size: 13px; color: #222; }
    .garamond-resume-root .entry-bullets li::before { content: '–'; position: absolute; left: 0; color: var(--gray); }
    .garamond-resume-root .simple-list { list-style: disc; padding-left: 18px; font-size: 13px; margin: 0; }
    .garamond-resume-root .simple-list.profile-plain { list-style: none; padding-left: 0; }
    .garamond-resume-root .simple-list.profile-plain li { margin-bottom: 8px; line-height: 1.5; }
    .garamond-resume-root .simple-list.achievements-list li { margin-bottom: 7px; line-height: 1.48; }
    .garamond-resume-root .simple-list li { margin-bottom: 3px; }
    .garamond-resume-root .cert-meta { font-size: 11.5px; color: var(--gray); }
    .garamond-resume-root .cert-desc { font-size: 12px; color: #444; }
    .garamond-resume-root mark.garamond-injected-kw {
      background: rgba(251, 191, 36, 0.42);
      color: inherit;
      border-radius: 2px;
      padding: 0 2px;
      font-weight: 600;
    }
    @media print {
      .garamond-resume-root { background: #fff; }
      .garamond-resume-root .page { box-shadow: none; margin: 0; max-width: 100%; }
      .garamond-resume-root mark.garamond-injected-kw {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
`;
