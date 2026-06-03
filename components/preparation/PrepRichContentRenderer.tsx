import { useMemo } from "react";
import DOMPurify from "dompurify";
import PrepCodeSnippet from "./PrepCodeSnippet";
import { parseRichHtmlSegments } from "./prepCodeSnippetTypes";

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "span",
  "div",
  "hr",
];

const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "target",
  "rel",
  "class",
  "data-tabs",
  "data-active-tab",
  "data-prep-code-snippet",
];

export function isRichHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  return /^<[a-z][\s\S]*>/i.test(trimmed);
}

export function richHtmlToPlainText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  if (!isRichHtmlContent(trimmed)) return trimmed;
  return trimmed
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isRichHtmlEmpty(html: string): boolean {
  return !richHtmlToPlainText(html);
}

export function sanitizeRichHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_ATTR: ["target"],
  });
}

export interface PrepRichContentRendererProps {
  html: string;
  className?: string;
  variant?: "default" | "nocturnal";
}

export default function PrepRichContentRenderer({
  html,
  className = "",
  variant = "default",
}: PrepRichContentRendererProps) {
  const isNocturnal = variant === "nocturnal";
  const proseClass = isNocturnal
    ? "prep-rich-content prep-rich-content--nocturnal"
    : "prep-rich-content";

  const segments = useMemo(() => parseRichHtmlSegments(html), [html]);

  return (
    <div className={`${proseClass} ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === "snippet") {
          return (
            <PrepCodeSnippet
              key={`snippet-${index}`}
              tabs={segment.data.tabs}
              activeTab={segment.data.activeTab}
            />
          );
        }

        const sanitized = sanitizeRichHtml(segment.content);
        if (!sanitized) return null;

        return (
          <div
            key={`html-${index}`}
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        );
      })}
    </div>
  );
}
