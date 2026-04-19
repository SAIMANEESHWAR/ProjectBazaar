"""
Local dev HTTP wrapper for Fix-Resume Lambda.

Runs the *workspace* lambda code (fix_resume_handler.lambda_handler) so Vite can proxy
to localhost instead of API Gateway.

Usage:
  python local_fix_resume_server.py

Then set Vite proxy /dev-api/fix-resume -> http://localhost:9000
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from fix_resume_handler import lambda_handler


def _event(method: str, body_text: str | None) -> dict[str, Any]:
    return {
        "httpMethod": method.upper(),
        "isBase64Encoded": False,
        "body": body_text or "",
        "headers": {"Content-Type": "application/json"},
        "requestContext": {"http": {"method": method.upper()}},
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, status: int, body: str, headers: dict[str, str] | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.send_header("Access-Control-Allow-Methods", "POST,OPTIONS")
        if headers:
            for k, v in headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def do_OPTIONS(self) -> None:  # noqa: N802
        out = lambda_handler(_event("OPTIONS", ""), None)
        self._send(int(out.get("statusCode") or 200), out.get("body") or "{}")

    def do_POST(self) -> None:  # noqa: N802
        # Accept /default/fix_resume_handler (matches Vite rewrite) and /fix
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length > 0 else b""
        body_text = raw.decode("utf-8", errors="replace")

        out = lambda_handler(_event("POST", body_text), None)
        status = int(out.get("statusCode") or 200)
        body = out.get("body") or "{}"
        # Ensure body is JSON string
        if not isinstance(body, str):
            body = json.dumps(body, ensure_ascii=False, default=str)
        self._send(status, body, headers=out.get("headers") if isinstance(out.get("headers"), dict) else None)

    def log_message(self, fmt: str, *args) -> None:  # silence default logging
        return


def main() -> None:
    addr = ("127.0.0.1", 9000)
    httpd = ThreadingHTTPServer(addr, Handler)
    print("Local Fix Resume server listening on http://127.0.0.1:9000")
    httpd.serve_forever()


if __name__ == "__main__":
    main()

