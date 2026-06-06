/**
 * CodeXCareer UTM Signups — Google Apps Script
 *
 * Setup:
 * 1. Create a Google Sheet (e.g. "CodeXCareer UTM Signups")
 * 2. Extensions → Apps Script → paste this file
 * 3. Run setupSheet() once from the editor (authorize when prompted)
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into Lambda env GOOGLE_SHEETS_WEBAPP_URL
 */

const SHEET_NAME = 'UTM Signups';

const HEADERS = [
  'Synced At',
  'User ID',
  'Email',
  'Signup Method',
  'Status',
  'Created By',
  'Created At',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Term',
  'UTM Content',
  'GCLID',
  'FBCLID',
  'Landing Page',
  'Referrer',
  'Attribution Captured At',
];

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.clear();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    const row = [
      payload.syncedAt || new Date().toISOString(),
      payload.userId || '',
      payload.email || '',
      payload.signupMethod || '',
      payload.status || '',
      payload.createdBy || '',
      payload.createdAt || '',
      payload.utmSource || '',
      payload.utmMedium || '',
      payload.utmCampaign || '',
      payload.utmTerm || '',
      payload.utmContent || '',
      payload.gclid || '',
      payload.fbclid || '',
      payload.landingPage || '',
      payload.signupReferrer || '',
      payload.attributionCapturedAt || '',
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ success: true, message: 'CodeXCareer UTM webhook is running' })
  ).setMimeType(ContentService.MimeType.JSON);
}
