/**
 * Opens a print dialog with resume HTML (same shell as Resume Builder download).
 * Clones the resume template node and reuses the app's stylesheets so layout matches live preview.
 */

function collectDocumentStyles(): string {
  const parts: string[] = [];
  document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
    parts.push(link.outerHTML);
  });
  document.querySelectorAll('head style').forEach((style) => {
    parts.push(style.outerHTML);
  });
  return parts.join('\n');
}

function cloneResumeNode(previewRoot: HTMLElement): HTMLElement | null {
  const resumeEl = previewRoot.querySelector('[data-resume-root]') as HTMLElement | null;
  if (resumeEl) {
    return resumeEl.cloneNode(true) as HTMLElement;
  }

  const firstDiv = previewRoot.querySelector(':scope > div') as HTMLElement | null;
  if (firstDiv) {
    return firstDiv.cloneNode(true) as HTMLElement;
  }

  const sectionDiv = previewRoot.querySelector('[id^="resume-section"]')?.closest('div');
  if (sectionDiv) {
    return sectionDiv.cloneNode(true) as HTMLElement;
  }

  return null;
}

const printOverrides = `
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: white;
    width: 100%;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    display: flex;
    justify-content: center;
  }
  [data-resume-root] {
    width: 100%;
    max-width: 7.5in;
    flex-shrink: 0;
  }
  [data-resume-root] > div {
    width: 100%;
    max-width: 100%;
  }
  .resume-section-highlight {
    animation: none !important;
    background-color: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .resume-section-highlight::before {
    display: none !important;
  }
  section {
    page-break-inside: avoid;
  }
  @media print {
    @page {
      margin: 0.4in;
      size: letter;
    }
  }
`;

export function openResumePrintFromPreviewRoot(previewRoot: HTMLElement | null, documentTitle: string): void {
  if (!previewRoot) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const cloned = cloneResumeNode(previewRoot);
  if (!cloned) return;

  cloned.querySelectorAll('.resume-section-highlight').forEach((el) => {
    el.classList.remove('resume-section-highlight');
  });

  const resumeContent = cloned.outerHTML;
  const documentStyles = collectDocumentStyles();
  const safeTitle = documentTitle.replace(/</g, '').replace(/>/g, '').slice(0, 120);

  printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${safeTitle}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
          ${documentStyles}
          <style>${printOverrides}</style>
        </head>
        <body>
          ${resumeContent}
        </body>
      </html>
    `);

  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
