# Cognito OTP Setup (Email + SMS)

## 1) Environment variables (frontend)

Set these in your deployment environment:

- `VITE_AUTH_MIGRATION_MODE=hybrid` (or `otp` / `legacy`)
- `VITE_COGNITO_USER_POOL_ID=<pool-id>`
- `VITE_COGNITO_USER_POOL_CLIENT_ID=<app-client-id>`
- `VITE_LEGACY_AUTH_ENDPOINT=<optional legacy endpoint override>`
- `VITE_API_GATEWAY_URL=https://xxxx.execute-api.<region>.amazonaws.com` (no trailing slash)
  - **Dev:** Vite proxies `/api/*` → this URL and **strips the `/api` prefix** (so `/api/auth/send-otp` → `{VITE_API_GATEWAY_URL}/auth/send-otp`).
  - **Prod build:** OTP calls use `{VITE_API_GATEWAY_URL}/auth/send-otp` and `/auth/verify-otp` directly.

## 2) Cognito user pool

1. Enable choice-based sign-in.
2. Enable passwordless OTP methods:
   - Email OTP
   - SMS OTP
3. App client: if it has a **client secret**, OTP **InitiateAuth** must run in **`lambda/auth_otp_handler.py`** (SECRET_HASH is computed there). Do not put `COGNITO_CLIENT_SECRET` in any `VITE_` variable.
4. Enable app client auth flow equivalent to `ALLOW_USER_AUTH`.

## 2b) OTP Lambda (send / verify)

- Handler: `lambda/auth_otp_handler.py` — `SECRET_HASH` + `initiate_auth` / `respond_to_auth_challenge` (no secrets in the browser).
- Wire API Gateway routes **`POST /auth/send-otp`** and **`POST /auth/verify-otp`** to this Lambda (matching the Vite `/api` strip).
- Optional reference template: `aws/sam-auth-otp.yaml`
- Lambda environment: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, optional `COGNITO_REGION`, `ALLOWED_ORIGIN`.

## 3) Delivery channels

- **Email**: Configure SES for production-grade outbound email.
- **SMS**: Configure SNS and sender settings for target geographies.
  - For India: complete DLT template/entity/sender registration before production rollout.

## 4) API protection

1. Add Cognito JWT authorizer to API Gateway routes.
2. Pass claims to Lambda through `requestContext.authorizer`.
3. In Lambda, prefer claim-derived user identity (`sub`) over body-provided `userId`.

Reference template: `aws/http-api-cognito-jwt-authorizer.yaml`.

## 4b) User bootstrap (migration / DynamoDB sync)

Deploy `lambda/user_bootstrap_handler.py` (POST). Lambda environment:

- `COGNITO_USER_POOL_ID`
- `COGNITO_REGION` (e.g. `ap-south-2`)
- `COGNITO_APP_CLIENT_ID` (public SPA client — used to verify ID token `aud`)
- `USERS_TABLE` (default `Users`)
- `ALLOWED_ORIGIN` (SPA origin)

Frontend: `VITE_USER_BOOTSTRAP_ENDPOINT=<API URL>`. After OTP verify, the app calls bootstrap to link legacy users by **email** or create an OTP-only `Users` row keyed by Cognito `sub`.

**Optional (recommended with JWT authorizer):** set Cognito custom attribute `custom:userId` to the **legacy DynamoDB `userId`** after linking (Admin API or console), so tokens carry the same id your Lambdas already use. Until then, JWT `sub` is used for OTP-only accounts; linked accounts rely on bootstrap returning the legacy id to the SPA (requests without authorizer still send the legacy id in the body).

## 5) Rollout sequence

1. Start with `VITE_AUTH_MIGRATION_MODE=hybrid`.
2. Monitor OTP send/verify success and fallback usage.
3. Move to `otp` once production metrics stabilize.
4. Decommission legacy auth endpoint after migration completion.
