/**
 * Test Runner API — calls the test_runner_handler Lambda
 * to execute Vitest for a specific source file.
 */

const TEST_RUNNER_ENDPOINT =
  "https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/test_runner_handler";

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
  try {
    const res = await fetch(TEST_RUNNER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceFile }),
    });

    const data: TestRunResult = await res.json();
    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
