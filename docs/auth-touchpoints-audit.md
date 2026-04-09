# Auth touchpoints audit (ProjectBazaar)

## Frontend

- `components/AuthPage.tsx` — OTP (email/SMS) + legacy password flows; calls `bootstrapCognitoUser` when `VITE_USER_BOOTSTRAP_ENDPOINT` is set.
- `App.tsx` — Session restore, Cognito logout, `authProvider`.
- `lib/authSession.ts`, `lib/cognitoOtpAuth.ts`, `lib/jwt.ts` — Tokens; OTP calls `/api/auth/*` in dev (proxied to `VITE_API_GATEWAY_URL`) or `${VITE_API_GATEWAY_URL}/auth/*` in production builds.
- `services/*.ts` — `buyerApi`, `preparationApi`, `atsService`, `freelancersApi`, `bidsService`, `bidRequestProjectsApi`, `freelancerInteractionsApi` attach `Authorization` when a token exists.
- `services/userBootstrap.ts` — POST to user bootstrap Lambda after OTP.

## Backend (Lambda)

- `lambda/auth_context.py` — Read JWT claims (HTTP API v2 + REST); `merge_body_with_cognito_identity`, `enforce_body_field`, `get_canonical_app_user_id` (prefers `custom:userId`, else `sub`).
- `lambda/auth_otp_handler.py` — Cognito **USER_AUTH** OTP (SECRET_HASH + `InitiateAuth` / `RespondToAuthChallenge`); env: `COGNITO_CLIENT_SECRET`, etc.
- `lambda/user_bootstrap_handler.py` — Verifies Cognito **ID token**, links by email or creates OTP user; optional deps: `PyJWT`, `cryptography` in `lambda/requirements.txt`.
- Identity enforcement merged into: `bids_handler`, `bid_request_projects_handler`, `freelancer_interactions_handler`, `freelancers_handler`, `course_purchase_handler`, `company_posts_handler` (viewer id).

## AWS (operator)

- Deploy HTTP API JWT authorizer (see `aws/http-api-cognito-jwt-authorizer.yaml`).
- OTP Lambda + HTTP API routes `/api/auth/send-otp`, `/api/auth/verify-otp` (`aws/sam-auth-otp.yaml`); client secret only on Lambda. Passwordless flows, SES/SMS.
- Wire `user_bootstrap` + set Lambda env: `COGNITO_USER_POOL_ID`, `COGNITO_REGION`, `COGNITO_APP_CLIENT_ID`, etc.

## Migration notes

- `VITE_AUTH_MIGRATION_MODE`: `legacy` | `hybrid` | `otp`.
- Linked legacy users: bootstrap updates `cognitoSub`; set `custom:userId` in Cognito for JWT-only APIs to resolve the legacy `userId` automatically.
