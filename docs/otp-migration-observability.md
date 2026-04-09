# OTP Migration Observability and Test Checklist

## Metrics to track

- OTP send success rate (email, SMS)
- OTP verify success rate
- Invalid/expired OTP rate
- Resend frequency
- Fallback-to-legacy usage rate (hybrid mode)
- Authenticated API rejection rate (401/403) after JWT rollout

## Logging guidance

- Never log raw OTP codes.
- Log only:
  - channel (`email`/`sms`)
  - outcome (`sent`, `verified`, `failed`)
  - error class/code
  - anonymized user identifier hash

## Functional test matrix

1. Email OTP happy path
2. SMS OTP happy path
3. Invalid OTP handling
4. Expired OTP handling
5. Resend OTP and latest-code-only behavior
6. Role routing post-login (`admin` vs `user`)
7. Legacy fallback in `hybrid` mode
8. Authenticated API calls include `Authorization` header

## Cutover criteria

- OTP verify success >= target threshold for 7 consecutive days
- Critical auth-related errors below threshold
- No high-severity regressions in protected API access
