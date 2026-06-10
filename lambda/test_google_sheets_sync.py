#!/usr/bin/env python3
"""Local test for direct Google Sheets sync (file-based config)."""
import sys

from google_sheets_sync import append_user_attribution_row, is_google_sheets_configured


def main() -> int:
    if not is_google_sheets_configured():
        print("Not configured. Add:")
        print("  lambda/google_sheets_config.json")
        print("  lambda/google_service_account.json")
        return 1

    sample_user = {
        "userId": "test-user-utm-sync",
        "email": "utm-test@codexcareer.com",
        "status": "active",
        "createdBy": "self",
        "createdAt": "2026-06-06T12:00:00Z",
        "utmSource": "test",
        "utmMedium": "manual",
        "utmCampaign": "direct_api_check",
        "landingPage": "/?utm_source=test&utm_medium=manual&utm_campaign=direct_api_check",
        "signupReferrer": "https://google.com",
        "attributionCapturedAt": "2026-06-06T12:00:00Z",
    }

    ok = append_user_attribution_row(sample_user, "email")
    if ok:
        print("Success: test row appended to Google Sheet.")
        return 0

    print("Failed — see logs above.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
