# Google Sheets — UTM Signup Sync

CodeXCareer pushes attributed signups to Google Sheets automatically from `login_handler.py`.

## Option A — Google Apps Script (recommended)

### 1. Create the sheet

1. Open [Google Sheets](https://sheets.google.com)
2. Create a spreadsheet named **CodeXCareer UTM Signups**

### 2. Add the script

1. **Extensions → Apps Script**
2. Paste the contents of `scripts/google_sheets_apps_script.gs`
3. Save the project
4. Run `setupSheet()` once (authorize when prompted)

### 3. Deploy as web app

1. **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Copy the Web App URL

### 4. Configure Lambda

In AWS Lambda (`login_handler`), add environment variable:

```
GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/XXXXXXXX/exec
```

Package `google_sheets_sync.py` in the same Lambda zip as `login_handler.py`.

### 5. Redeploy login Lambda

After deploy, new signups with UTM data append a row to the **UTM Signups** tab.

---

## Option B — Service account (Sheets API)

1. Create a Google Cloud service account with Sheets API enabled
2. Share the spreadsheet with the service account email (Editor)
3. Set Lambda environment variables:

```
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_TAB=UTM Signups
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Requires PyJWT in the Lambda package (already used by `login_handler.py`).

---

## Sheet columns

| Column | Field |
|--------|-------|
| Synced At | Server timestamp |
| User ID | DynamoDB userId |
| Email | User email |
| Signup Method | `email` or `google` |
| Status | User status |
| Created By | `self`, `google_oauth`, etc. |
| Created At | ISO timestamp |
| UTM Source | `utmSource` |
| UTM Medium | `utmMedium` |
| UTM Campaign | `utmCampaign` |
| UTM Term | `utmTerm` |
| UTM Content | `utmContent` |
| GCLID | Google click ID |
| FBCLID | Facebook click ID |
| Landing Page | First landing URL |
| Referrer | document.referrer |
| Attribution Captured At | First-touch timestamp |

---

## When rows are pushed

- **Email signup:** when a new user record is created (`handle_signup`)
- **Google signup:** when a new Google OAuth user is created
- Rows are skipped if the user has no attribution fields
- Sync failures are logged but do not block signup

---

## Verify

1. Visit `https://codexcareer.com?utm_source=test&utm_medium=email&utm_campaign=sheets_test`
2. Sign up with a new account
3. Check the Google Sheet for a new row
4. Check admin dashboard → **Revenue Analytics** → Marketing Attribution section
