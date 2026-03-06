/**
 * Test Runner API — calls POST /api/run-test to execute Vitest
 * for a specific source file and returns structured results.
 */

export interface TestRunResult {
  ok: boolean;
  status?: "passed" | "failed";
  summary?: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  duration?: number;
  testFile?: string;
  output?: string;
  error?: string;
}

export async function runTestForFile(
  sourceFile: string,
): Promise<TestRunResult> {
  const res = await fetch("/api/run-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceFile }),
  });

  const data: TestRunResult = await res.json();
  return data;
}
