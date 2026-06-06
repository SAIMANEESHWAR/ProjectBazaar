"""
Push signup attribution rows to Google Sheets.

Supports two integration modes (use one):

1. Google Apps Script Web App (recommended — no extra Python deps)
   Env: GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/.../exec

2. Google Sheets API v4 with service account JWT
   Env (either form):
     GOOGLE_SHEET_ID=your_spreadsheet_id
     GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # entire JSON file
   Or:
     GOOGLE_SERVICE_ACCOUNT_EMAIL=...@....iam.gserviceaccount.com
     GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

Optional:
  GOOGLE_SHEET_TAB=UTM Signups
"""
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional, Tuple

try:
    import jwt  # PyJWT — already used by login_handler
except ImportError:
    jwt = None  # type: ignore

GOOGLE_SHEETS_WEBAPP_URL = os.environ.get("GOOGLE_SHEETS_WEBAPP_URL", "").strip()
GOOGLE_SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "").strip()
GOOGLE_SHEET_TAB = os.environ.get("GOOGLE_SHEET_TAB", "UTM Signups").strip()


def _load_service_account_credentials() -> Tuple[str, str]:
    """Return (client_email, private_key) from env vars. Never log the private key."""
    raw_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if raw_json:
        try:
            parsed = json.loads(raw_json)
            email = (parsed.get("client_email") or "").strip()
            private_key = (parsed.get("private_key") or "").strip().replace("\\n", "\n")
            if email and private_key:
                return email, private_key
        except json.JSONDecodeError:
            pass

    email = os.environ.get("GOOGLE_SERVICE_ACCOUNT_EMAIL", "").strip()
    private_key = (
        os.environ.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "").strip().replace("\\n", "\n")
    )
    return email, private_key


GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = _load_service_account_credentials()

SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"


def is_google_sheets_configured() -> bool:
    if GOOGLE_SHEETS_WEBAPP_URL:
        return True
    return bool(
        GOOGLE_SHEET_ID
        and GOOGLE_SERVICE_ACCOUNT_EMAIL
        and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
        and jwt is not None
    )


def _attribution_value(user: Dict[str, Any], key: str) -> str:
    value = user.get(key)
    if value is None:
        return ""
    return str(value).strip()


def build_attribution_row(user: Dict[str, Any], signup_method: str) -> Dict[str, str]:
    """Build a flat row dict for Google Sheets."""
    return {
        "syncedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "userId": str(user.get("userId") or ""),
        "email": str(user.get("email") or ""),
        "signupMethod": signup_method,
        "status": str(user.get("status") or ""),
        "createdBy": str(user.get("createdBy") or ""),
        "createdAt": str(user.get("createdAt") or ""),
        "utmSource": _attribution_value(user, "utmSource"),
        "utmMedium": _attribution_value(user, "utmMedium"),
        "utmCampaign": _attribution_value(user, "utmCampaign"),
        "utmTerm": _attribution_value(user, "utmTerm"),
        "utmContent": _attribution_value(user, "utmContent"),
        "gclid": _attribution_value(user, "gclid"),
        "fbclid": _attribution_value(user, "fbclid"),
        "landingPage": _attribution_value(user, "landingPage"),
        "signupReferrer": _attribution_value(user, "signupReferrer"),
        "attributionCapturedAt": _attribution_value(user, "attributionCapturedAt"),
    }


def _post_json(url: str, payload: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            **(headers or {}),
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return {"success": True}
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Google Sheets HTTP {exc.code}: {detail}") from exc


def _get_service_account_token() -> str:
    if jwt is None:
        raise RuntimeError("PyJWT is required for service-account Google Sheets sync")

    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": GOOGLE_SERVICE_ACCOUNT_EMAIL,
            "scope": SHEETS_SCOPE,
            "aud": TOKEN_URL,
            "iat": now,
            "exp": now + 3600,
        },
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
        algorithm="RS256",
    )

    form = urllib.parse.urlencode(
        {
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        TOKEN_URL,
        data=form,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"Could not obtain Google access token: {data}")
    return token


def _append_via_service_account(row: Dict[str, str]) -> None:
    token = _get_service_account_token()
    range_name = urllib.parse.quote(f"{GOOGLE_SHEET_TAB}!A:Z")
    url = f"{SHEETS_API}/{GOOGLE_SHEET_ID}/values/{range_name}:append?valueInputOption=USER_ENTERED"

    ordered = [
        row["syncedAt"],
        row["userId"],
        row["email"],
        row["signupMethod"],
        row["status"],
        row["createdBy"],
        row["createdAt"],
        row["utmSource"],
        row["utmMedium"],
        row["utmCampaign"],
        row["utmTerm"],
        row["utmContent"],
        row["gclid"],
        row["fbclid"],
        row["landingPage"],
        row["signupReferrer"],
        row["attributionCapturedAt"],
    ]

    _post_json(
        url,
        {"values": [ordered]},
        headers={"Authorization": f"Bearer {token}"},
    )


def _append_via_webapp(row: Dict[str, str]) -> None:
    _post_json(GOOGLE_SHEETS_WEBAPP_URL, row)


def append_user_attribution_row(user: Dict[str, Any], signup_method: str) -> bool:
    """
    Append one attribution row to Google Sheets.
    Returns True on success, False if not configured or on non-fatal failure.
    """
    if not is_google_sheets_configured():
        print("google_sheets_sync: not configured, skipping")
        return False

    has_attribution = any(
        _attribution_value(user, key)
        for key in (
            "utmSource",
            "utmMedium",
            "utmCampaign",
            "utmTerm",
            "utmContent",
            "gclid",
            "fbclid",
            "landingPage",
            "signupReferrer",
        )
    )
    if not has_attribution:
        print("google_sheets_sync: no attribution on user, skipping")
        return False

    row = build_attribution_row(user, signup_method)

    try:
        if GOOGLE_SHEETS_WEBAPP_URL:
            _append_via_webapp(row)
        else:
            _append_via_service_account(row)
        print(f"google_sheets_sync: appended row for {row.get('email')}")
        return True
    except Exception as exc:
        print(f"google_sheets_sync failed: {exc}")
        return False
