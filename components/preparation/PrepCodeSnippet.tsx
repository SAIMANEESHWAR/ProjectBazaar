import { useMemo, useState } from "react";
import { Copy, Maximize2, Plus, Trash2, X } from "lucide-react";
import { highlightPrepCode } from "./prepCodeSyntaxHighlight";
import {
  type PrepCodeLanguageId,
  type PrepCodeSnippetData,
  type PrepCodeTab,
  PREP_CODE_LANGUAGES,
  createPrepCodeTab,
} from "./prepCodeSnippetTypes";

export interface PrepCodeSnippetProps {
  tabs: PrepCodeTab[];
  activeTab?: number;
  editable?: boolean;
  onChange?: (data: PrepCodeSnippetData) => void;
  onRemove?: () => void;
  className?: string;
}

function clampActiveTab(activeTab: number, tabCount: number): number {
  if (tabCount <= 0) return 0;
  return Math.min(Math.max(activeTab, 0), tabCount - 1);
}

export default function PrepCodeSnippet({
  tabs,
  activeTab = 0,
  editable = false,
  onChange,
  onRemove,
  className = "",
}: PrepCodeSnippetProps) {
  const [internalActive, setInternalActive] = useState(activeTab);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addingLanguage, setAddingLanguage] = useState(false);

  const currentActive = editable ? activeTab : internalActive;
  const safeActive = clampActiveTab(currentActive, tabs.length);
  const currentTab = tabs[safeActive] ?? tabs[0];

  const highlighted = useMemo(
    () => (currentTab ? highlightPrepCode(currentTab.code, currentTab.language) : ""),
    [currentTab],
  );

  const emitChange = (next: PrepCodeSnippetData) => {
    onChange?.({
      tabs: next.tabs,
      activeTab: clampActiveTab(next.activeTab, next.tabs.length),
    });
  };

  const setActive = (index: number) => {
    if (editable) {
      emitChange({ tabs, activeTab: index });
    } else {
      setInternalActive(index);
    }
  };

  const updateTabCode = (index: number, code: string) => {
    const nextTabs = tabs.map((tab, i) => (i === index ? { ...tab, code } : tab));
    emitChange({ tabs: nextTabs, activeTab: safeActive });
  };

  const addLanguage = (language: PrepCodeLanguageId) => {
    const exists = tabs.some((tab) => tab.language === language);
    if (exists) {
      const index = tabs.findIndex((tab) => tab.language === language);
      setActive(index);
      setAddingLanguage(false);
      return;
    }
    const nextTabs = [...tabs, createPrepCodeTab(language)];
    emitChange({ tabs: nextTabs, activeTab: nextTabs.length - 1 });
    setAddingLanguage(false);
  };

  const removeTab = (index: number) => {
    if (tabs.length <= 1) return;
    const nextTabs = tabs.filter((_, i) => i !== index);
    emitChange({
      tabs: nextTabs,
      activeTab: Math.min(safeActive, nextTabs.length - 1),
    });
  };

  const copyCode = async () => {
    if (!currentTab) return;
    try {
      await navigator.clipboard.writeText(currentTab.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore clipboard errors */
    }
  };

  if (!currentTab) return null;

  const shell = (
    <div
      className={`prep-code-snippet-shell overflow-hidden rounded-xl border border-[#2a2d3a] bg-[#161821] shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#2a2d3a] bg-[#1b1d27] px-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
          {tabs.map((tab, index) => (
            <div key={`${tab.language}-${index}`} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setActive(index)}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  safeActive === index
                    ? "text-white after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange-500"
                    : "text-[#9aa0b5] hover:text-[#d7dbe8]"
                }`}
              >
                {tab.label}
              </button>
              {editable && tabs.length > 1 && (
                <button
                  type="button"
                  title="Remove tab"
                  onClick={() => removeTab(index)}
                  className="mr-1 rounded p-1 text-[#6b7280] hover:bg-[#2a2d3a] hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {editable && (
            <div className="relative shrink-0">
              <button
                type="button"
                title="Add language tab"
                onClick={() => setAddingLanguage((open) => !open)}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-orange-400 hover:bg-[#2a2d3a]"
              >
                <Plus className="h-3.5 w-3.5" />
                Language
              </button>
              {addingLanguage && (
                <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-[#2a2d3a] bg-[#1b1d27] py-1 shadow-lg">
                  {PREP_CODE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => addLanguage(lang.id)}
                      className="block w-full px-3 py-1.5 text-left text-sm text-[#d7dbe8] hover:bg-[#2a2d3a]"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 pr-1">
          <button
            type="button"
            title={copied ? "Copied!" : "Copy code"}
            onClick={() => void copyCode()}
            className="rounded-md p-2 text-[#9aa0b5] transition-colors hover:bg-[#2a2d3a] hover:text-white"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Expand"
            onClick={() => setExpanded(true)}
            className="rounded-md p-2 text-[#9aa0b5] transition-colors hover:bg-[#2a2d3a] hover:text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          {editable && onRemove && (
            <button
              type="button"
              title="Remove snippet"
              onClick={onRemove}
              className="rounded-md p-2 text-[#9aa0b5] transition-colors hover:bg-[#2a2d3a] hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {editable ? (
        <textarea
          value={currentTab.code}
          onChange={(e) => updateTabCode(safeActive, e.target.value)}
          spellCheck={false}
          className="block min-h-[220px] w-full resize-y border-0 bg-[#161821] px-4 py-4 font-mono text-[13px] leading-6 text-[#e5e7eb] outline-none"
        />
      ) : (
        <pre className="m-0 overflow-x-auto px-4 py-4">
          <code
            className="block font-mono text-[13px] leading-6 text-[#e5e7eb]"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      )}
    </div>
  );

  return (
    <>
      {shell}
      {expanded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#2a2d3a] bg-[#161821] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2d3a] px-4 py-3">
              <div className="flex items-center gap-2">
                {tabs.map((tab, index) => (
                  <button
                    key={`${tab.language}-modal-${index}`}
                    type="button"
                    onClick={() => setActive(index)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      safeActive === index
                        ? "bg-orange-500/15 text-orange-300"
                        : "text-[#9aa0b5] hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="rounded-md p-2 text-[#9aa0b5] hover:bg-[#2a2d3a] hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="rounded-md p-2 text-[#9aa0b5] hover:bg-[#2a2d3a] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {editable ? (
                <textarea
                  value={currentTab.code}
                  onChange={(e) => updateTabCode(safeActive, e.target.value)}
                  spellCheck={false}
                  className="block min-h-[60vh] w-full resize-none border-0 bg-[#161821] px-5 py-5 font-mono text-sm leading-6 text-[#e5e7eb] outline-none"
                />
              ) : (
                <pre className="m-0 px-5 py-5">
                  <code
                    className="block font-mono text-sm leading-6 text-[#e5e7eb]"
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
