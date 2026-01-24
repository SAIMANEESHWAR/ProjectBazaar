import React, { useState, useRef, useCallback } from 'react';
import { generateExperienceBullets } from '../../services/AIResumeService';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  positionTitle?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description...',
  positionTitle,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const isInternalChange = useRef(false);

  // Save cursor position
  const saveCursorPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0);
  }, []);

  // Restore cursor position
  const restoreCursorPosition = useCallback((range: Range | null) => {
    if (!range) return;
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);

  const execCommand = useCallback((command: string, value?: string) => {
    const range = saveCursorPosition();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (range) {
      restoreCursorPosition(range);
    }
    handleContentChange();
  }, [saveCursorPosition, restoreCursorPosition]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      // Only call onChange if content actually changed
      if (newContent !== value) {
        isInternalChange.current = true;
        onChange(newContent);
        // Reset flag after a brief delay to allow React to process
        setTimeout(() => {
          isInternalChange.current = false;
        }, 10);
      }
    }
  }, [onChange, value]);

  const generateWithAI = async () => {
    if (!positionTitle) {
      alert('Please add a position title first');
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateExperienceBullets(positionTitle);
      const bulletHtml = `<ul style="list-style-type: disc; padding-left: 1.25rem; margin: 0;">${result.bullets.map(b => `<li style="margin: 0.25rem 0;">${b}</li>`).join('')}</ul>`;
      if (editorRef.current) {
        isInternalChange.current = true;
        editorRef.current.innerHTML = bulletHtml;
        handleContentChange();
        setTimeout(() => {
          isInternalChange.current = false;
        }, 0);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setAiLoading(false);
    }
  };

  // Initialize content on mount
  React.useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Only update innerHTML when value changes externally (not from user input)
  React.useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const currentContent = editorRef.current.innerHTML.trim();
      const newValue = (value || '').trim();
      // Only update if the content is actually different (external change)
      if (currentContent !== newValue && newValue !== '') {
        const range = saveCursorPosition();
        editorRef.current.innerHTML = value || '';
        // Try to restore cursor, but if it fails, just place at end
        try {
          if (range && editorRef.current.contains(range.commonAncestorContainer)) {
            restoreCursorPosition(range);
          } else {
            // Place cursor at end
            const selection = window.getSelection();
            if (selection && editorRef.current) {
              const newRange = document.createRange();
              newRange.selectNodeContents(editorRef.current);
              newRange.collapse(false);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        } catch (e) {
          // If cursor restoration fails, just focus the editor
          editorRef.current.focus();
        }
      }
    }
  }, [value, saveCursorPosition, restoreCursorPosition]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, active, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        active ? 'bg-gray-100 text-orange-600' : 'text-gray-600'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <ToolbarButton onClick={() => execCommand('bold')} title="Bold (Ctrl+B)">
          <span className="font-bold text-sm">B</span>
        </ToolbarButton>
        
        <ToolbarButton onClick={() => execCommand('italic')} title="Italic (Ctrl+I)">
          <span className="italic text-sm">I</span>
        </ToolbarButton>
        
        <ToolbarButton onClick={() => execCommand('underline')} title="Underline (Ctrl+U)">
          <span className="underline text-sm">U</span>
        </ToolbarButton>
        
        <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Strikethrough">
          <span className="line-through text-sm">ab</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h14M7 12h14M7 4h14M3 20h.01M3 12h.01M3 4h.01" />
          </svg>
        </ToolbarButton>
        
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton 
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) execCommand('createLink', url);
          }} 
          title="Insert Link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>

        <ToolbarButton onClick={() => execCommand('removeFormat')} title="Clear Formatting">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </ToolbarButton>

        {/* AI Generate Button */}
        <div className="flex-1" />
        <button
          type="button"
          onClick={generateWithAI}
          disabled={aiLoading || !positionTitle}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          )}
          AI Generate
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        className="min-h-[120px] px-4 py-3 text-sm text-gray-900 focus:outline-none"
        style={{ lineHeight: '1.6' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] li {
          display: list-item;
          margin: 0.35rem 0;
        }
        [contenteditable] a {
          color: #f97316;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
