"""
Test Runner Lambda — Runs Vitest for a specific source file and returns results.

Deployment:
  - Runtime: Python 3.12
  - Architecture: x86_64
  - Timeout: 120 seconds (tests can take time)
  - Memory: 512 MB
  - Requires Lambda Layer with Node.js 20.x runtime + project deps
    OR deploy as a Docker-based Lambda with Node.js pre-installed.
  - Environment variable PROJECT_PATH = path to cloned/mounted project root
    (defaults to /var/task/project for Docker-based deployment)

API Gateway:
  - POST /test-runner
  - Body: { "sourceFile": "services/buyerApi.ts" }

Response:
  {
    "ok": true,
    "status": "passed" | "failed",
    "summary": { "passed": 3, "failed": 0, "skipped": 0, "total": 3 },
    "duration": 2410,
    "testFile": "tests/services/buyerApi.test.ts",
    "output": "..."
  }
"""

import json
import os
import re
import subprocess
import time

# ================= CONFIG =================
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://projectbazaar.in")
PROJECT_PATH = os.environ.get("PROJECT_PATH", "/var/task/project")
TEST_TIMEOUT = int(os.environ.get("TEST_TIMEOUT", "60"))

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Max-Age": "3600",
}


# ================= HELPERS =================
def response(status_code: int, body: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def parse_body(event: dict) -> dict:
    try:
        body = event.get("body", "{}") or "{}"
        if isinstance(body, str):
            return json.loads(body)
        return body
    except Exception:
        return {}


def validate_file_path(file_path: str) -> str | None:
    """Validate and sanitize source file path. Returns error message or None."""
    if not file_path or not isinstance(file_path, str):
        return "Missing 'sourceFile' in request body"

    # Only allow alphanumeric, slashes, dots, dashes, underscores
    if not re.match(r"^[\w\-./]+$", file_path):
        return "Invalid file path: contains disallowed characters"

    # Prevent directory traversal
    if ".." in file_path:
        return "Invalid file path: directory traversal not allowed"

    # Must look like a source file
    if not file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
        return "Invalid file path: must be a .ts, .tsx, .js, or .jsx file"

    return None


def resolve_test_file(source_file: str) -> str | None:
    """
    Map a source file to its test file.
    e.g. "services/buyerApi.ts"          → "tests/services/buyerApi.test.ts"
         "components/admin/Page.tsx"     → "tests/components/admin/Page.test.tsx"
    """
    # Split into dir + name + ext
    dir_part = os.path.dirname(source_file)   # "services" or "components/admin"
    base_name = os.path.basename(source_file)  # "buyerApi.ts"
    name, _ = os.path.splitext(base_name)      # "buyerApi"

    # Try .test.tsx first, then .test.ts
    candidates = [
        os.path.join("tests", dir_part, f"{name}.test.tsx"),
        os.path.join("tests", dir_part, f"{name}.test.ts"),
    ]

    for candidate in candidates:
        full_path = os.path.join(PROJECT_PATH, candidate)
        # Normalize path separators for the OS
        full_path = os.path.normpath(full_path)
        if os.path.isfile(full_path):
            # Return with forward slashes for vitest
            return candidate.replace("\\", "/")

    return None


def parse_vitest_output(output: str) -> dict:
    """
    Parse Vitest CLI output to extract test summary.
    Looks for lines like:
      Tests  3 passed (3)
      Tests  2 failed | 1 passed (3)
      Tests  1 skipped | 2 passed (3)
    """
    summary = {"passed": 0, "failed": 0, "skipped": 0, "total": 0}

    match = re.search(r"Tests\s+(.+?)\((\d+)\)", output)
    if match:
        detail = match.group(1)
        summary["total"] = int(match.group(2))

        passed = re.search(r"(\d+)\s+passed", detail)
        failed = re.search(r"(\d+)\s+failed", detail)
        skipped = re.search(r"(\d+)\s+skipped", detail)

        if passed:
            summary["passed"] = int(passed.group(1))
        if failed:
            summary["failed"] = int(failed.group(1))
        if skipped:
            summary["skipped"] = int(skipped.group(1))

    return summary


def run_vitest(test_file: str) -> dict:
    """
    Execute vitest for a specific test file and return structured results.
    """
    start_time = time.time()

    cmd = ["npx", "vitest", "run", "--reporter=verbose", test_file]

    try:
        result = subprocess.run(
            cmd,
            cwd=PROJECT_PATH,
            capture_output=True,
            text=True,
            timeout=TEST_TIMEOUT,
            env={
                **os.environ,
                "CI": "true",
                "NO_COLOR": "1",
                "NODE_ENV": "test",
            },
        )

        duration = int((time.time() - start_time) * 1000)
        combined_output = f"{result.stdout}\n{result.stderr}".strip()
        summary = parse_vitest_output(combined_output)

        # vitest exits 0 on success, 1 on test failure
        if result.returncode == 0:
            return {
                "ok": True,
                "status": "passed",
                "summary": summary,
                "duration": duration,
                "testFile": test_file,
                "output": combined_output[-3000:],  # last 3KB
            }
        elif result.returncode == 1 and summary["total"] > 0:
            # Tests ran but some failed — this is a valid "failed" result
            return {
                "ok": True,
                "status": "failed",
                "summary": summary,
                "duration": duration,
                "testFile": test_file,
                "output": combined_output[-3000:],
            }
        else:
            return {
                "ok": False,
                "error": f"Vitest exited with code {result.returncode}",
                "output": combined_output[-1000:],
            }

    except subprocess.TimeoutExpired:
        duration = int((time.time() - start_time) * 1000)
        return {
            "ok": False,
            "error": f"Test execution timed out after {TEST_TIMEOUT}s",
            "duration": duration,
        }
    except FileNotFoundError:
        return {
            "ok": False,
            "error": "Node.js/npx not found. Ensure Node.js runtime is available.",
        }
    except Exception as e:
        return {
            "ok": False,
            "error": f"Unexpected error: {str(e)}",
        }


# ================= HANDLER =================
def lambda_handler(event, context):
    """
    POST /test-runner
    Body: { "sourceFile": "services/buyerApi.ts" }
    """
    http_method = event.get("httpMethod", event.get("requestContext", {}).get("http", {}).get("method", ""))

    # Handle CORS preflight
    if http_method == "OPTIONS":
        return response(200, {"message": "OK"})

    if http_method != "POST":
        return response(405, {"ok": False, "error": "Method not allowed"})

    # Parse request
    body = parse_body(event)
    source_file = body.get("sourceFile", "")

    # Validate
    validation_error = validate_file_path(source_file)
    if validation_error:
        return response(400, {"ok": False, "error": validation_error})

    # Resolve test file
    test_file = resolve_test_file(source_file)
    if not test_file:
        ext_hint = ".test.ts(x)"
        return response(404, {
            "ok": False,
            "error": f'No test file found for "{source_file}". '
                     f"Expected at tests/{os.path.splitext(source_file)[0]}{ext_hint}",
        })

    print(f"[TestRunner] Running tests for: {source_file} → {test_file}")

    # Run tests
    result = run_vitest(test_file)

    status_code = 200 if result.get("ok") else 500
    print(f"[TestRunner] Result: {result.get('status', 'error')} "
          f"({result.get('duration', '?')}ms)")

    return response(status_code, result)
