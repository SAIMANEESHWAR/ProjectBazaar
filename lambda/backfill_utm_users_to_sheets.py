#!/usr/bin/env python3
"""
Backfill / refresh DynamoDB UTM campaign users in Google Sheets.

Usage (from lambda/ with AWS + Google env configured):
  python backfill_utm_users_to_sheets.py          # append missing users only
  python backfill_utm_users_to_sheets.py --refresh # replace sheet rows (UTM campaigns only)
"""
from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from decimal import Decimal
from typing import Any, Dict, List, Set

import boto3

from google_sheets_sync import (
    GOOGLE_SHEET_ID,
    GOOGLE_SHEET_TAB,
    SHEET_HEADER_ROW,
    SHEETS_API,
    _ensure_header_row,
    _get_service_account_token,
    _ordered_row_values,
    _put_json,
    append_user_attribution_row,
    build_attribution_row,
    is_google_sheets_configured,
)

USERS_TABLE = os.environ.get("USERS_TABLE", "Users")
REGION = os.environ.get("REGION", "ap-south-2")

ATTRIBUTION_KEYS = (
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmTerm",
    "utmContent",
    "gclid",
    "fbclid",
    "landingPage",
    "signupReferrer",
    "attributionCapturedAt",
)


def decimal_to_native(obj: Any) -> Any:
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def has_attribution(user: Dict[str, Any]) -> bool:
    """Match admin UI: only real UTM / click-id params."""
    return any(str(user.get(k) or "").strip() for k in (
        "utmSource",
        "utmMedium",
        "utmCampaign",
        "utmTerm",
        "utmContent",
        "gclid",
        "fbclid",
    ))


def signup_method_for(user: Dict[str, Any]) -> str:
    created_by = str(user.get("createdBy") or "").lower()
    if "google" in created_by:
        return "google"
    return "email"


def fetch_existing_user_ids() -> Set[str]:
    token = _get_service_account_token()
    _ensure_header_row(token)
    rng = urllib.parse.quote(f"{GOOGLE_SHEET_TAB}!B:B")
    url = f"{SHEETS_API}/{GOOGLE_SHEET_ID}/values/{rng}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    values = data.get("values") or []
    ids: Set[str] = set()
    for row in values[1:]:  # skip header
        if row and row[0]:
            ids.add(str(row[0]).strip())
    return ids


def scan_attributed_users() -> List[Dict[str, Any]]:
    table = boto3.resource("dynamodb", region_name=REGION).Table(USERS_TABLE)
    users: List[Dict[str, Any]] = []
    kwargs: Dict[str, Any] = {}
    while True:
        result = table.scan(**kwargs)
        for item in result.get("Items") or []:
            native = decimal_to_native(item)
            if has_attribution(native):
                users.append(native)
        last_key = result.get("LastEvaluatedKey")
        if not last_key:
            break
        kwargs["ExclusiveStartKey"] = last_key
    users.sort(key=lambda u: u.get("createdAt") or "")
    return users


def dedupe_users(users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    by_id: Dict[str, Dict[str, Any]] = {}
    for user in users:
        user_id = str(user.get("userId") or "")
        if not user_id:
            continue
        existing = by_id.get(user_id)
        if not existing or (user.get("createdAt") or "") >= (existing.get("createdAt") or ""):
            by_id[user_id] = user
    return sorted(by_id.values(), key=lambda u: u.get("createdAt") or "")


def refresh_sheet(users: List[Dict[str, Any]]) -> None:
    """Replace all data rows with current UTM campaign users (clears stale rows)."""
    token = _get_service_account_token()
    # Clear old rows — PUT alone leaves trailing rows when the sheet shrinks.
    clear_range = urllib.parse.quote(f"{GOOGLE_SHEET_TAB}!A2:Q")
    clear_url = f"{SHEETS_API}/{GOOGLE_SHEET_ID}/values/{clear_range}:clear"
    clear_req = urllib.request.Request(
        clear_url,
        data=b"{}",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(clear_req, timeout=30) as resp:
        resp.read()

    values = [SHEET_HEADER_ROW]
    for user in users:
        row = build_attribution_row(user, signup_method_for(user))
        values.append(_ordered_row_values(row))
    range_name = urllib.parse.quote(f"{GOOGLE_SHEET_TAB}!A1")
    url = f"{SHEETS_API}/{GOOGLE_SHEET_ID}/values/{range_name}?valueInputOption=USER_ENTERED"
    _put_json(
        url,
        {"values": values},
        headers={"Authorization": f"Bearer {token}"},
    )


def main() -> int:
    refresh = "--refresh" in sys.argv
    if not is_google_sheets_configured():
        print("Google Sheets not configured (GOOGLE_SHEET_ID + service account).")
        return 1

    users = dedupe_users(scan_attributed_users())

    if refresh:
        print(f"Refreshing sheet with {len(users)} UTM campaign users...")
        try:
            refresh_sheet(users)
        except Exception as exc:
            print(f"Refresh failed: {exc}")
            return 1
        for user in users:
            print(f"  · {user.get('email')} ({user.get('utmSource')})")
        print(f"Done: sheet updated with {len(users)} rows (+ header).")
        return 0

    existing_ids = fetch_existing_user_ids()
    print(f"Found {len(users)} attributed users in DynamoDB; {len(existing_ids)} already in sheet.")

    appended = 0
    skipped = 0
    failed = 0

    for user in users:
        user_id = str(user.get("userId") or "")
        if not user_id:
            continue
        if user_id in existing_ids:
            skipped += 1
            continue
        ok = append_user_attribution_row(user, signup_method_for(user))
        if ok:
            appended += 1
            existing_ids.add(user_id)
            print(f"  + {user.get('email')} ({user.get('utmSource')})")
        else:
            failed += 1
            print(f"  ! failed {user.get('email')}")

    print(f"Done: appended={appended}, skipped={skipped}, failed={failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
