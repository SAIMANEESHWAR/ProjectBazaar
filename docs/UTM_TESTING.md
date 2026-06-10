# UTM Attribution & Analytics Testing Guide

This guide covers local validation of UTM capture, signup attribution, purchase events, and job application tracking for CodeXCareer.

## Prerequisites

1. Run the dev server: `npm run dev` from `ProjectBazaar/`.
2. Open the site in Chrome (or another browser with DevTools).
3. Accept analytics cookies when the consent banner appears (required for `dataLayer` events).
4. For GA4 validation, use [GA4 DebugView](https://analytics.google.com/) with the Chrome [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) extension, or Tag Assistant.

## 1. Local Testing — UTM Capture

### Step 1: Clear prior state

Open DevTools → Application → Local Storage → remove `cxc_attribution` (if present).

### Step 2: Visit with campaign parameters

**LinkedIn / Java jobs campaign:**

```
http://localhost:5173/?utm_source=linkedin&utm_medium=social&utm_campaign=java_jobs
```

**Instagram / course launch campaign:**

```
http://localhost:5173/?utm_source=instagram&utm_medium=social&utm_campaign=course_launch
```

### Step 3: Verify localStorage

In the browser console:

```js
JSON.parse(localStorage.getItem('cxc_attribution'))
```

Expected shape:

```json
{
  "utm_source": "linkedin",
  "utm_medium": "social",
  "utm_campaign": "java_jobs",
  "landing_page": "/?utm_source=linkedin&utm_medium=social&utm_campaign=java_jobs",
  "referrer": "",
  "captured_at": "2026-06-06T...",
  "last_touch_at": "2026-06-06T..."
}
```

### Step 4: First-touch preservation

1. With attribution already stored, visit:

```
http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=override_test
```

2. Confirm `utm_source` remains `linkedin` (first touch preserved).
3. Confirm `last_touch_at` updated to a newer timestamp.

### Step 5: TTL (optional)

Attribution expires after 90 days (configurable via `VITE_ATTRIBUTION_TTL_DAYS`). To test expiry logic, temporarily set `VITE_ATTRIBUTION_TTL_DAYS=0` in `.env.local`, restart the dev server, and confirm `cxc_attribution` is cleared on reload.

---

## 2. Signup Attribution

### Email signup

1. Visit with UTM params (see URLs above).
2. Accept cookies.
3. Sign up with a new email.
4. Complete OTP verification.
5. Verify:
   - Console / DebugView: `sign_up` event with `method: email` and UTM fields.
   - DynamoDB `Users` record contains `utmSource`, `utmMedium`, `utmCampaign`, etc.

### Google signup

1. Visit with UTM params.
2. Sign in with Google (new account).
3. Verify:
   - `sign_up` event with `method: google`.
   - API response includes `isNewUser: true`.
   - DynamoDB user record has attribution fields.

### Returning Google login

Existing users should receive `isNewUser: false` and must **not** get a second `sign_up` event or overwritten attribution.

---

## 3. Purchase Attribution

Analytics events include UTM context from `cxc_attribution` when consent is granted.

### Cart (projects)

1. Add projects to cart.
2. Start checkout → verify `begin_checkout` with `item_type: project`.
3. Complete Razorpay test payment → verify `purchase` with `transaction_id`, `value`, `currency`, and UTM fields.

### Course purchase

1. Open a paid course.
2. Click purchase → `begin_checkout` with `item_type: course`.
3. Complete payment → `purchase` after server verification.

### Subscription

1. Navigate to subscription checkout.
2. Verify `view_subscription_checkout` custom event.
3. Start payment → `begin_checkout` with `item_type: subscription`.
4. Complete payment → `purchase` after verification.

---

## 4. Job Application Attribution

1. Visit Job Hunt with UTM params stored.
2. Click **Apply** on a job listing.
3. Verify `job_apply_click` event with:
   - `job_id`
   - `company`
   - `platform` (source platform)
   - `destination_url`
   - UTM attribution fields

---

## 5. GA4 DebugView Validation

1. Open GA4 → Admin → DebugView.
2. Enable debug mode (Analytics Debugger extension or `debug_mode: true` in gtag config).
3. Perform actions above.
4. Confirm events appear:

| Event | Key parameters |
|-------|----------------|
| `page_view` | `page_path`, `utm_source`, `utm_medium`, `utm_campaign` |
| `sign_up` | `method` (email \| google) |
| `begin_checkout` | `item_type`, `value`, `currency` |
| `purchase` | `transaction_id`, `value`, `currency`, `item_type` |
| `job_apply_click` | `job_id`, `company`, `platform`, `destination_url` |

---

## 6. GTM dataLayer Inspection

With cookies accepted, in the browser console:

```js
window.dataLayer.filter(e => e.event)
```

Look for recent events and confirm UTM keys are attached (`utm_source`, `utm_medium`, `utm_campaign`, etc.).

---

## 7. Production URLs

Replace `localhost:5173` with `https://codexcareer.com`:

```
https://codexcareer.com?utm_source=linkedin&utm_medium=social&utm_campaign=java_jobs

https://codexcareer.com?utm_source=instagram&utm_medium=social&utm_campaign=course_launch
```

---

## 8. Admin Dashboard

UTM data is visible in the admin panel:

| Location | What you see |
|----------|----------------|
| **User Management** | Campaign column, UTM filters, attributed signup count |
| **User Profile** (View Details) | Full Marketing Attribution panel per user |
| **Revenue Analytics** | Campaign breakdown + recent attributed signups |
| **Google Sheet** | All attributed signups (after Sheets setup) |

---

## 9. Backend Deployment Checklist

After frontend changes, redeploy `lambda/login_handler.py` to AWS Lambda so signup/OAuth attribution is persisted to DynamoDB.

Verify a new user item in the `Users` table includes:

- `utmSource`
- `utmMedium`
- `utmCampaign`
- `utmTerm` (if provided)
- `utmContent` (if provided)
- `gclid` / `fbclid` (if provided)
- `landingPage`
- `signupReferrer`
- `attributionCapturedAt`
