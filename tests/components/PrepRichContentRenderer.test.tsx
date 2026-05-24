import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PrepRichContentRenderer, {
  isRichHtmlContent,
  sanitizeRichHtml,
} from "../../components/preparation/PrepRichContentRenderer";

describe("PrepRichContentRenderer helpers", () => {
  it("detects HTML content", () => {
    expect(isRichHtmlContent("<p>Hello</p>")).toBe(true);
    expect(isRichHtmlContent("Plain text solution")).toBe(false);
  });

  it("sanitizes script tags but keeps safe HTML", () => {
    const html = "<h2>Title</h2><p>Body</p><script>alert(1)</script>";
    const sanitized = sanitizeRichHtml(html);
    expect(sanitized).toContain("<h2>Title</h2>");
    expect(sanitized).not.toContain("script");
  });

  it("preserves image tags", () => {
    const html = '<p>See diagram:</p><img src="https://cdn.example.com/a.png" alt="diagram" />';
    const sanitized = sanitizeRichHtml(html);
    expect(sanitized).toContain('src="https://cdn.example.com/a.png"');
  });
});

describe("PrepRichContentRenderer", () => {
  it("renders headings and lists", () => {
    render(
      <PrepRichContentRenderer html="<h2>CAP Theorem</h2><ul><li>Consistency</li></ul>" />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "CAP Theorem" })).toBeInTheDocument();
    expect(screen.getByText("Consistency")).toBeInTheDocument();
  });
});
