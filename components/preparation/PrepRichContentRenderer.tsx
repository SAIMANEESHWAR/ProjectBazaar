import DOMPurify from "dompurify";

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
  "a",
  "img",
  "span",
  "div",
  "hr",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel", "class"];

export function isRichHtmlContent(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  return /^<[a-z][\s\S]*>/i.test(trimmed);
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
  const sanitized = sanitizeRichHtml(html);
  const isNocturnal = variant === "nocturnal";
  const proseClass = isNocturnal
    ? "prep-rich-content prep-rich-content--nocturnal"
    : "prep-rich-content";

  return (
    <div
      className={`${proseClass} ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
