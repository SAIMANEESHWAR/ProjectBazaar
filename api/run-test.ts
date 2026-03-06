/**
 * Vercel Serverless Function – POST /api/run-test
 *
 * Runs Vitest for a specific source file and returns the results.
 *
 * Request body:
 *   { "sourceFile": "services/buyerApi.ts" }
 *
 * Response:
 *   {
 *     "ok": true,
 *     "status": "passed" | "failed",
 *     "summary": { "passed": 3, "failed": 0, "skipped": 0, "total": 3 },
 *     "duration": 2410,
 *     "testFile": "tests/services/buyerApi.test.ts",
 *     "output": "..."
 *   }
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface RunTestRequest {
  sourceFile?: string;
}

interface TestSummary {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
}

interface RunTestResponse {
  ok: boolean;
  status?: 'passed' | 'failed';
  summary?: TestSummary;
  duration?: number;
  testFile?: string;
  output?: string;
  error?: string;
}

// Map a source file path to its test file path(s)
function resolveTestFile(sourceFile: string, projectRoot: string): string | null {
  // e.g. "services/buyerApi.ts" → "tests/services/buyerApi.test.ts"
  // e.g. "components/admin/CoverageReportPage.tsx" → "tests/components/admin/CoverageReportPage.test.tsx"
  const parsed = path.parse(sourceFile);
  const dir = parsed.dir; // "services" or "components/admin"
  const name = parsed.name; // "buyerApi" or "CoverageReportPage"

  // Try .test.tsx first, then .test.ts
  const candidates = [
    path.join('tests', dir, `${name}.test.tsx`),
    path.join('tests', dir, `${name}.test.ts`),
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(projectRoot, candidate))) {
      return candidate;
    }
  }

  return null;
}

// Parse Vitest output to extract summary
function parseVitestOutput(output: string): TestSummary {
  const summary: TestSummary = { passed: 0, failed: 0, skipped: 0, total: 0 };

  // Match patterns like "Tests  3 passed (3)"  or "Tests  2 failed | 1 passed (3)"
  const testsLine = output.match(/Tests\s+(.+)\((\d+)\)/);
  if (testsLine) {
    const detail = testsLine[1];
    const passedMatch = detail.match(/(\d+)\s+passed/);
    const failedMatch = detail.match(/(\d+)\s+failed/);
    const skippedMatch = detail.match(/(\d+)\s+skipped/);
    summary.passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    summary.failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    summary.skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
    summary.total = parseInt(testsLine[2], 10);
  }

  return summary;
}

export default async function handler(
  req: { method?: string; body?: RunTestRequest },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (n: number) => { json: (body: RunTestResponse) => void };
  }
) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { sourceFile } = req.body ?? {};

  if (!sourceFile || typeof sourceFile !== 'string') {
    return res.status(400).json({ ok: false, error: 'Missing "sourceFile" in request body' });
  }

  // Sanitize: only allow alphanumeric, slashes, dots, dashes, underscores
  if (!/^[\w\-./]+$/.test(sourceFile)) {
    return res.status(400).json({ ok: false, error: 'Invalid file path' });
  }

  // Prevent directory traversal
  if (sourceFile.includes('..')) {
    return res.status(400).json({ ok: false, error: 'Invalid file path' });
  }

  const projectRoot = path.resolve(process.cwd());
  const testFile = resolveTestFile(sourceFile, projectRoot);

  if (!testFile) {
    return res.status(404).json({
      ok: false,
      error: `No test file found for "${sourceFile}". Expected at tests/${sourceFile.replace(/\.\w+$/, '.test.ts(x)')}`,
    });
  }

  const startTime = Date.now();

  try {
    const output = execSync(
      `npx vitest run --reporter=verbose "${testFile}"`,
      {
        cwd: projectRoot,
        timeout: 60_000, // 60 second timeout
        encoding: 'utf-8',
        env: { ...process.env, CI: 'true', NO_COLOR: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    const duration = Date.now() - startTime;
    const summary = parseVitestOutput(output);

    return res.status(200).json({
      ok: true,
      status: summary.failed === 0 ? 'passed' : 'failed',
      summary,
      duration,
      testFile,
      output: output.slice(-3000), // last 3KB of output
    });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const execErr = err as { stdout?: string; stderr?: string; status?: number };
    const combinedOutput = `${execErr.stdout ?? ''}\n${execErr.stderr ?? ''}`.trim();
    const summary = parseVitestOutput(combinedOutput);

    // Vitest exits with code 1 when tests fail — that's not an error, it's a "failed" result
    if (execErr.status === 1 && summary.total > 0) {
      return res.status(200).json({
        ok: true,
        status: 'failed',
        summary,
        duration,
        testFile,
        output: combinedOutput.slice(-3000),
      });
    }

    return res.status(500).json({
      ok: false,
      error: `Test execution error: ${combinedOutput.slice(-500)}`,
    });
  }
}
