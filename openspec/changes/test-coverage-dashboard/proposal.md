## Why

ProjectBazaar currently has partial test coverage (172 tests for bid/freelancer features only) with no visibility into overall code health. Expanding tests to cover every feature and surfacing coverage metrics in the admin panel will allow the team to catch regressions early, maintain confidence during deploys, and continuously track code quality.

## What Changes

- Add unit and integration tests for all major feature areas: auth, projects, cart/purchases, wishlist, courses, career guidance, mock assessments, analytics, admin management pages, chat/socket, payments, and settings
- Configure Vitest coverage to collect metrics across all components and services
- Add a **Test Coverage Dashboard** page inside the existing admin panel (`/admin/test-coverage`) that shows:
  - Overall coverage percentage (lines, branches, functions, statements)
  - Per-file/per-module breakdown table
  - Test suite status (pass / fail / skip counts)
  - Last-run timestamp and trend indicators
- Expose a `/api/coverage` endpoint (or static JSON artifact) that the dashboard reads to display live data
- Wire `vitest run --coverage` output (JSON reporter) into a build artifact consumed by the dashboard

## Capabilities

### New Capabilities

- `test-suite-expansion`: Comprehensive unit and integration tests for all feature modules (components + services)
- `coverage-api`: A mechanism to expose Vitest JSON coverage report data to the frontend (static file or lightweight API route)
- `admin-coverage-dashboard`: New admin panel page at `/admin/test-coverage` showing coverage metrics, test status, and pass/fail results

### Modified Capabilities

- (none — no existing spec-level behavior changes)

## Impact

- **Tests**: New test files under `tests/components/` and `tests/services/` for every untested module
- **Admin panel**: New route and page component added to `components/admin/`
- **Vitest config**: Coverage include paths expanded; JSON reporter enabled
- **App router**: New `/admin/test-coverage` route registered in `App.tsx`
- **API / static**: Coverage JSON artifact written to `public/coverage-summary.json` after each test run, read by the dashboard at runtime
- **CI**: `npm run test:coverage` already exists; dashboard reads the output artifact
