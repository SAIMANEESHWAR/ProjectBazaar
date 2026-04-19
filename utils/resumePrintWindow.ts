/**
 * Opens a print dialog with resume HTML (same shell as Resume Builder download).
 * Clones the first meaningful child of previewRoot so Tailwind classes used by templates render via embedded CSS.
 */
export function openResumePrintFromPreviewRoot(previewRoot: HTMLElement | null, documentTitle: string): void {
  if (!previewRoot) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  let resumeContent = '';
  const firstChild = previewRoot.firstElementChild as HTMLElement | null;
  if (firstChild && firstChild.tagName === 'DIV') {
    const cloned = firstChild.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('.resume-section-highlight').forEach((el) => {
      el.classList.remove('resume-section-highlight');
    });
    resumeContent = cloned.outerHTML;
  } else {
    const resumeDiv = previewRoot.querySelector('[id^="resume-section"]')?.closest('div');
    if (resumeDiv) {
      const cloned = resumeDiv.cloneNode(true) as HTMLElement;
      cloned.querySelectorAll('.resume-section-highlight').forEach((el) => {
        el.classList.remove('resume-section-highlight');
      });
      resumeContent = cloned.outerHTML;
    } else {
      resumeContent = previewRoot.innerHTML;
    }
  }

  const safeTitle = documentTitle.replace(/</g, '').replace(/>/g, '').slice(0, 120);

  printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${safeTitle}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: white;
              color: #1f2937;
              line-height: 1.5;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .bg-white { background-color: white; }
            .text-white { color: white; }
            .text-gray-900 { color: #111827; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-700 { color: #374151; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-400 { color: #9ca3af; }
            .text-gray-300 { color: #d1d5db; }
            .text-gray-200 { color: #e5e7eb; }
            .text-gray-100 { color: #f3f4f6; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-200 { background-color: #e5e7eb; }
            .bg-gray-800 { background-color: #1f2937; }
            .bg-gray-900 { background-color: #111827; }
            
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .text-base { font-size: 1rem; line-height: 1.5rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .font-normal { font-weight: 400; }
            .font-mono { font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace; }
            .italic { font-style: italic; }
            
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .tracking-wide { letter-spacing: 0.025em; }
            .leading-relaxed { line-height: 1.625; }
            .line-clamp-2 { overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            
            .p-8 { padding: 2rem; }
            .p-6 { padding: 1.5rem; }
            .p-4 { padding: 1rem; }
            .p-3 { padding: 0.75rem; }
            .p-2 { padding: 0.5rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
            .pl-4 { padding-left: 1rem; }
            .pl-6 { padding-left: 1.5rem; }
            
            .mb-1 { margin-bottom: 0.25rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-5 { margin-bottom: 1.25rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mt-0\\.5 { margin-top: 0.125rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-3 { margin-top: 0.75rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            .ml-1 { margin-left: 0.25rem; }
            .ml-2 { margin-left: 0.5rem; }
            .pb-1 { padding-bottom: 0.25rem; }
            .pb-2 { padding-bottom: 0.5rem; }
            .pb-4 { padding-bottom: 1rem; }
            .max-w-2xl { max-width: 42rem; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            
            .flex { display: flex; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .flex-wrap { flex-wrap: wrap; }
            .flex-1 { flex: 1 1 0%; }
            .flex-shrink-0 { flex-shrink: 0; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .items-end { align-items: flex-end; }
            .items-baseline { align-items: baseline; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            
            .gap-0\\.5 { gap: 0.125rem; }
            .gap-1 { gap: 0.25rem; }
            .gap-2 { gap: 0.5rem; }
            .gap-3 { gap: 0.75rem; }
            .gap-4 { gap: 1rem; }
            .gap-6 { gap: 1.5rem; }
            .gap-8 { gap: 2rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            
            .whitespace-nowrap { white-space: nowrap; }
            
            .rounded-full { border-radius: 9999px; }
            .rounded-lg { border-radius: 0.5rem; }
            .rounded { border-radius: 0.25rem; }
            .overflow-hidden { overflow: hidden; }
            
            .border { border-width: 1px; border-style: solid; }
            .border-l { border-left-width: 1px; border-left-style: solid; }
            .border-l-2 { border-left-width: 2px; border-left-style: solid; }
            .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
            .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
            .border-t { border-top-width: 1px; border-top-style: solid; }
            .border-gray-200 { border-color: #e5e7eb; }
            .border-gray-300 { border-color: #d1d5db; }
            
            .w-2 { width: 0.5rem; }
            .w-3 { width: 0.75rem; }
            .w-16 { width: 4rem; }
            .w-full { width: 100%; }
            .h-1 { height: 0.25rem; }
            .h-1\\.5 { height: 0.375rem; }
            .h-2 { height: 0.5rem; }
            .h-3 { height: 0.75rem; }
            .h-full { height: 100%; }
            .h-16 { height: 4rem; }
            
            .relative { position: relative; }
            .absolute { position: absolute; }
            .top-1 { top: 0.25rem; }
            .left-0 { left: 0; }
            .left-1\\.5 { left: 0.375rem; }
            .top-4 { top: 1rem; }
            
            hr {
              border: none;
              border-top-width: 1px;
              border-top-style: solid;
              margin-top: 0;
              margin-bottom: 0;
            }
            
            .rich-text-content ul {
              list-style-type: disc;
              padding-left: 1.25rem;
              margin: 0.375rem 0;
            }
            .rich-text-content ol {
              list-style-type: decimal;
              padding-left: 1.25rem;
              margin: 0.375rem 0;
            }
            .rich-text-content li {
              display: list-item;
              margin: 0.25rem 0;
              padding-left: 0.25rem;
            }
            .rich-text-content a {
              color: inherit;
              text-decoration: underline;
            }
            .rich-text-content p {
              margin: 0.25rem 0;
            }
            
            a { text-decoration: none; color: inherit; }
            .hover\\:underline:hover { text-decoration: underline; }
            
            section { page-break-inside: avoid; }
            
            [style] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0;
                padding: 0;
              }
              @page { 
                margin: 0.4in; 
                size: letter;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              [style*="color"], [style*="background"], [style*="border"] {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
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
