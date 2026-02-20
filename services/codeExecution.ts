/**
 * Code execution via Judge0 API.
 * Uses Judge0 CE (https://ce.judge0.com) or custom base URL.
 * Optional auth: set VITE_JUDGE0_AUTH_TOKEN for X-Auth-Token header.
 */

const JUDGE0_BASE_URL =
  (import.meta.env?.VITE_JUDGE0_BASE_URL as string | undefined) || 'https://ce.judge0.com';
const JUDGE0_AUTH_TOKEN = import.meta.env?.VITE_JUDGE0_AUTH_TOKEN as string | undefined;

/** Map our language keys (python, javascript, etc.) to Judge0 CE language_id. */
export const judge0LanguageIdMap: Record<string, number> = {
  python: 71,       // Python (3.8.1)
  javascript: 93,   // JavaScript (Node.js 18.15.0)
  java: 91,         // Java (JDK 17.0.6)
  cpp: 54,         // C++ (GCC 9.2.0)
  c: 50,            // C (GCC 9.2.0)
  typescript: 94,   // TypeScript (5.0.3)
  go: 106,          // Go (1.22.0)
  rust: 108,        // Rust (1.85.0)
  kotlin: 111,      // Kotlin (2.1.10)
  swift: 83,        // Swift (5.2.3)
  ruby: 72,         // Ruby (2.7.0)
  php: 98,          // PHP (8.3.11)
  csharp: 51,       // C# (Mono 6.6.0.161)
  scala: 112,       // Scala (3.4.2)
  r: 99,            // R (4.4.1)
  perl: 85,         // Perl (5.28.1)
  lua: 64,          // Lua (5.3.5)
  bash: 46,         // Bash (5.0.0)
  dart: 90,         // Dart (2.19.2)
  elixir: 57,       // Elixir (1.9.4)
  haskell: 61,      // Haskell (GHC 8.8.1)
  clojure: 86,      // Clojure (1.10.1)
  fsharp: 87,       // F# (.NET Core SDK 3.1.202)
  ocaml: 65,        // OCaml (4.09.0)
  erlang: 58,       // Erlang (OTP 22.2)
  cobol: 77,        // COBOL (GnuCOBOL 2.2)
  fortran: 59,      // Fortran (GFortran 9.2.0)
  pascal: 67,       // Pascal (FPC 3.0.4)
  groovy: 88,       // Groovy (3.0.3)
};

export interface ExecuteCodeParams {
  code: string;
  language: string;
  version?: string;
  input?: string;
}

export interface ExecuteCodeResult {
  output: string;
  error: string;
  success: boolean;
}

const STATUS_IN_QUEUE = 1;
const STATUS_PROCESSING = 2;
const STATUS_ACCEPTED = 3;

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (JUDGE0_AUTH_TOKEN) headers['X-Auth-Token'] = JUDGE0_AUTH_TOKEN;
  return headers;
}

async function getSubmissionResult(token: string): Promise<{ stdout: string | null; stderr: string | null; compile_output: string | null; message: string | null; status: { id: number; description: string } }> {
  const url = `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Judge0 GET failed: ${res.status}`);
  return res.json();
}

/** Submit code and poll until done; return stdout, stderr, success. */
export async function executeCodeJudge0(params: ExecuteCodeParams): Promise<ExecuteCodeResult> {
  const { code, language, input = '' } = params;
  const languageId = judge0LanguageIdMap[language];
  if (languageId == null) {
    return { output: '', error: 'Unsupported language for execution', success: false };
  }

  try {
    const createUrl = `${JUDGE0_BASE_URL}/submissions?base64_encoded=false`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input,
      }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      return { output: '', error: `Judge0 submit failed: ${createRes.status} ${errBody}`, success: false };
    }

    const { token } = await createRes.json();
    if (!token) return { output: '', error: 'No submission token from Judge0', success: false };

    const maxAttempts = 40;
    const pollMs = 500;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, pollMs));
      const result = await getSubmissionResult(token);
      const statusId = result.status?.id;
      if (statusId !== STATUS_IN_QUEUE && statusId !== STATUS_PROCESSING) {
        const stdout = (result.stdout ?? '').trim();
        const stderr = (result.stderr ?? '').trim();
        const compileOut = (result.compile_output ?? '').trim();
        const err = stderr || compileOut || result.message || '';
        const success = statusId === STATUS_ACCEPTED;
        return {
          output: stdout,
          error: err || (success ? '' : (result.status?.description ?? 'Execution failed')),
          success,
        };
      }
    }

    return { output: '', error: 'Execution timed out waiting for result', success: false };
  } catch (e) {
    return { output: '', error: 'Network error — please try again', success: false };
  }
}
