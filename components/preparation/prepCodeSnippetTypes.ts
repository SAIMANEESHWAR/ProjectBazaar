export interface PrepCodeTab {
  label: string;
  language: string;
  code: string;
}

export interface PrepCodeSnippetData {
  tabs: PrepCodeTab[];
  activeTab: number;
}

export const PREP_CODE_LANGUAGES = [
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "cpp", label: "C++" },
  { id: "sql", label: "SQL" },
] as const;

export type PrepCodeLanguageId = (typeof PREP_CODE_LANGUAGES)[number]["id"];

const JAVA_DRY_EXAMPLE = `import java.util.*;
class Main {
    public static void main(String[] args) {
        int length1 = 10, width1 = 5;
        int area1 = length1 * width1;
        System.out.println("Area1: " + area1);

        int length2 = 8, width2 = 4;
        int area2 = length2 * width2;
        System.out.println("Area2: " + area2);
    }
}`;

const LANGUAGE_TEMPLATES: Record<PrepCodeLanguageId, string> = {
  java: JAVA_DRY_EXAMPLE,
  python: `# Write your Python code here
def calculate_area(length, width):
    return length * width

print(calculate_area(10, 5))
print(calculate_area(8, 4))`,
  javascript: `// Write your JavaScript code here
function calculateArea(length, width) {
  return length * width;
}

console.log(calculateArea(10, 5));
console.log(calculateArea(8, 4));`,
  typescript: `// Write your TypeScript code here
function calculateArea(length: number, width: number): number {
  return length * width;
}

console.log(calculateArea(10, 5));`,
  cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    int length1 = 10, width1 = 5;
    int area1 = length1 * width1;
    cout << "Area1: " << area1 << endl;
    return 0;
}`,
  sql: `-- Write your SQL here
SELECT e.employee_id,
       e.name,
       d.department_name,
       e.salary
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id
WHERE e.salary > 50000
ORDER BY e.salary DESC;`,
};

export function getDefaultCodeTemplate(language: PrepCodeLanguageId): string {
  return LANGUAGE_TEMPLATES[language];
}

export function createDefaultPrepCodeSnippet(): PrepCodeSnippetData {
  return {
    tabs: [{ label: "Java", language: "java", code: JAVA_DRY_EXAMPLE }],
    activeTab: 0,
  };
}

export function createPrepCodeTab(language: PrepCodeLanguageId): PrepCodeTab {
  const meta = PREP_CODE_LANGUAGES.find((l) => l.id === language);
  return {
    label: meta?.label ?? language,
    language,
    code: getDefaultCodeTemplate(language),
  };
}

export function parsePrepCodeSnippetElement(el: HTMLElement): PrepCodeSnippetData | null {
  try {
    const raw = el.getAttribute("data-tabs");
    if (!raw) return null;
    const tabs = JSON.parse(raw) as PrepCodeTab[];
    if (!Array.isArray(tabs) || tabs.length === 0) return null;
    const activeTab = Number.parseInt(el.getAttribute("data-active-tab") ?? "0", 10);
    return {
      tabs,
      activeTab: Number.isFinite(activeTab) ? activeTab : 0,
    };
  } catch {
    return null;
  }
}

export const PREP_CODE_SNIPPET_SELECTOR = "div[data-prep-code-snippet]";

export type RichContentSegment =
  | { type: "html"; content: string }
  | { type: "snippet"; data: PrepCodeSnippetData };

export function parseRichHtmlSegments(html: string): RichContentSegment[] {
  const trimmed = html.trim();
  if (!trimmed) return [{ type: "html", content: "" }];

  if (typeof document === "undefined") {
    return [{ type: "html", content: trimmed }];
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = trimmed;
  const segments: RichContentSegment[] = [];

  wrapper.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.hasAttribute("data-prep-code-snippet")) {
        const data = parsePrepCodeSnippetElement(el);
        if (data) {
          segments.push({ type: "snippet", data });
          return;
        }
      }
    }

    const holder = document.createElement("div");
    holder.appendChild(node.cloneNode(true));
    const chunk = holder.innerHTML;
    if (chunk) {
      segments.push({ type: "html", content: chunk });
    }
  });

  return segments.length > 0 ? segments : [{ type: "html", content: trimmed }];
}
