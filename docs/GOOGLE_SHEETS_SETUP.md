# Google Sheets — UTM Signup Sync

CodeXCareer pushes attributed signups to Google Sheets automatically from `login_handler.py`.

## Option A — Google Apps Script (recommended)

### 1. Use the team sheet

Spreadsheet: [UTM TRACKING MEM](https://docs.google.com/spreadsheets/d/1mEFA3vltqYBoWZkqR4L1q_wpCXIECDM8L-nGB1awZ8Y/edit)

Default tab name: **Sheet1** (`GOOGLE_SHEET_TAB=Sheet1` on `User_login_signup` Lambda).

**Important:** A public “view” link is not enough for the service account. Share the sheet with:

`google-sheets-access@neon-framing-485219-i4.iam.gserviceaccount.com`

as **Editor**.

### 2. Create the sheet (if starting fresh)

1. Open [Google Sheets](https://sheets.google.com)
2. Create a spreadsheet named **CodeXCareer UTM Signups** (or use the team sheet above)

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

1. In Google Cloud Console, enable **Google Sheets API** for your project
2. Create a service account and download the JSON key (keep it secret — never commit to git)
3. Create your spreadsheet and **Share** it with the service account email as **Editor**
   - Example: `google-sheets-access@YOUR-PROJECT.iam.gserviceaccount.com`
4. Copy the spreadsheet ID from the URL:
   - `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
5. In AWS Lambda (`login_handler`), set environment variables:

**Easiest — paste the whole JSON file as one variable:**

```
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_TAB=UTM Signups
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com",...}
```

**Or split into separate variables:**

```
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_SHEET_TAB=UTM Signups
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

6. Package `google_sheets_sync.py` with `login_handler.py` and redeploy

Requires PyJWT in the Lambda package (already used by `login_handler.py`).

**Security:** Store credentials only in AWS Lambda env vars or Secrets Manager. Never commit JSON key files to the repository.

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
