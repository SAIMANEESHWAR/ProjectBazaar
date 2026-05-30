import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PrepRichContentRenderer, {
  isRichHtmlContent,
  isRichHtmlEmpty,
  richHtmlToPlainText,
  sanitizeRichHtml,
} from "../../components/preparation/PrepRichContentRenderer";
import PrepCodeSnippet from "../../components/preparation/PrepCodeSnippet";
import { createDefaultPrepCodeSnippet } from "../../components/preparation/prepCodeSnippetTypes";
import { highlightPrepCode } from "../../components/preparation/prepCodeSyntaxHighlight";

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

  it("preserves code blocks", () => {
    const html = "<pre><code>public class A {}</code></pre>";
    const sanitized = sanitizeRichHtml(html);
    expect(sanitized).toContain("<pre>");
    expect(sanitized).toContain("public class A {}");
  });

  it("preserves image tags", () => {
    const html = '<p>See diagram:</p><img src="https://cdn.example.com/a.png" alt="diagram" />';
    const sanitized = sanitizeRichHtml(html);
    expect(sanitized).toContain('src="https://cdn.example.com/a.png"');
  });

  it("strips HTML to plain text for previews", () => {
    expect(richHtmlToPlainText("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
    expect(isRichHtmlEmpty("<p></p>")).toBe(true);
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

  it("renders tabbed code snippets from stored HTML", () => {
    const snippet = createDefaultPrepCodeSnippet();
    const html = `<p>Example:</p><div class="prep-code-snippet" data-prep-code-snippet data-tabs='${JSON.stringify(snippet.tabs)}' data-active-tab="0"></div>`;
    render(<PrepRichContentRenderer html={html} />);
    expect(screen.getByText("Example:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Java" })).toBeInTheDocument();
    expect(screen.getByText(/Area1:/)).toBeInTheDocument();
  });
});

describe("PrepCodeSnippet", () => {
  it("allows adding another language tab in edit mode", async () => {
    const user = userEvent.setup();
    const defaults = createDefaultPrepCodeSnippet();
    const onChange = vi.fn();

    render(
      <PrepCodeSnippet
        tabs={defaults.tabs}
        activeTab={0}
        editable
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Language/i }));
    await user.click(screen.getByRole("button", { name: "Python" }));

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(lastCall.tabs.some((tab: { language: string }) => tab.language === "python")).toBe(true);
  });
});

describe("prepCodeSyntaxHighlight", () => {
  it("highlights Java keywords", () => {
    const html = highlightPrepCode("public class Main {}", "java");
    expect(html).toContain('class="prep-code-kw">public</span>');
    expect(html).toContain('class="prep-code-kw">class</span>');
  });
});
