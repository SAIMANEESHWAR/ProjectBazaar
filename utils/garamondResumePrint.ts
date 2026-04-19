import { GARAMOND_RESUME_STYLES } from '../components/fix-resume/garamondResumeStyles';

/** Print / Save as PDF for the Garamond Fix résumé (standalone document with same CSS). */
export function openGaramondResumePrint(pageRoot: HTMLElement | null, documentTitle: string): void {
  if (!pageRoot) return;
  const w = window.open('', '_blank');
  if (!w) return;
  const safeTitle = documentTitle.replace(/</g, '').replace(/>/g, '').slice(0, 120);
  const clone = pageRoot.cloneNode(true) as HTMLElement;
  // Preview highlights use <mark class="garamond-injected-kw">; strip them for print/PDF.
  clone.querySelectorAll('mark.garamond-injected-kw').forEach((m) => {
    const txt = w.document.createTextNode(m.textContent ?? '');
    m.replaceWith(txt);
  });
  w.document.open();
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${safeTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>${GARAMOND_RESUME_STYLES}</style>
</head>
<body><div class="garamond-resume-root">${clone.outerHTML}</div></body>
</html>`);
  w.document.close();
  setTimeout(() => w.print(), 450);
}
