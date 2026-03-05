## Context

ProjectBazaar is a React + TypeScript SPA (Vite, Vitest, Tailwind) with services under `services/` and components under `components/`. Currently 172 tests exist covering bids, bid-requests, and freelancer APIs only. The admin panel (`components/admin/`) has ~15 pages but no coverage page. Vitest is already configured with `@vitest/coverage-v8` and a JSON reporter, but coverage output is not surfaced in the UI.

## Goals / Non-Goals

**Goals:**
- Expand test coverage to every service file and key component
- Write both unit tests (isolated logic) and integration tests (component + service interactions)
- Add a `CoverageReportPage` admin component that reads a static JSON artifact and renders coverage metrics and test status
- Produce `public/coverage-summary.json` from `vitest run --coverage` for the dashboard to consume
- Register the new admin route in `App.tsx` and the admin sidebar

**Non-Goals:**
- End-to-end (Playwright/Cypress) tests — out of scope for this change
- Backend Lambda test coverage — covered separately
- Real-time coverage streaming — static JSON file is sufficient
- Changing the CI/CD pipeline beyond what already runs `npm run test:coverage`

## Decisions

### D1: Static JSON artifact vs. live API for coverage data

**Decision**: Write coverage data to `public/coverage-summary.json` during the test run; the dashboard `fetch()`-es it at load time.

**Rationale**: No backend infrastructure changes needed. The file is produced by `vitest run --coverage --reporter=json --outputFile=public/coverage-summary.json`. In a Vite SPA, files in `public/` are served as-is, making this trivially accessible. A live API would require a server process and deployment complexity with no added value for a dev/admin audience.

**Alternative considered**: Express route reading the file from disk — adds complexity with the same result.

---

### D2: Coverage JSON format — use Vitest's built-in JSON summary

**Decision**: Use `coverage-summary.json` format (Istanbul-compatible): `{ total: {...}, "path/to/file.ts": { lines, branches, functions, statements } }`.

**Rationale**: `@vitest/coverage-v8` already outputs this format when `reporter: ['json-summary']` is added. No custom parsing needed. The dashboard reads this standard shape directly.

---

### D3: Test file organization

**Decision**: Mirror source structure — `tests/services/*.test.ts` for service files, `tests/components/**/*.test.tsx` for components.

**Rationale**: Consistent with the existing `tests/services/bidsService.test.ts` and `tests/components/PlaceBidModal.test.tsx` conventions already in the repo.

---

### D4: Admin dashboard page placement

**Decision**: New file `components/admin/CoverageReportPage.tsx`, route `/admin/coverage`, added to `AdminSidebar.tsx` and `App.tsx`.

**Rationale**: Follows the exact pattern of every other admin page in the project (e.g., `RevenueAnalyticsPage.tsx`). No new routing library needed.

---

### D5: Test strategy per layer

| Layer | Strategy | Tools |
|---|---|---|
| Pure service functions | Unit test with mocked `fetch` / localStorage | Vitest + `vi.fn()` |
| React components (display) | Unit test — render + assert DOM | @testing-library/react |
| Component + service integration | Integration test — mock service layer, test user flows | @testing-library/react + `userEvent` |
| Admin coverage page | Unit test — mock `fetch('/coverage-summary.json')`, assert renders | @testing-library/react |

## Risks / Trade-offs

- **Risk**: `public/coverage-summary.json` is stale if tests haven't been run recently → **Mitigation**: Show last-updated timestamp from the JSON; display a "No data" state when file is missing (404).
- **Risk**: Coverage of large components (e.g., `App.tsx` at 24 KB) inflates test effort → **Mitigation**: Focus integration tests on user-facing flows; don't target 100% line coverage on generated/boilerplate code.
- **Risk**: Snapshot/DOM tests become brittle as UI evolves → **Mitigation**: Prefer behavior assertions over snapshot tests.

## Open Questions

- Should the coverage dashboard be visible only to super-admins or all admin roles? (Assume: all admins for now.)
- Should `public/coverage-summary.json` be committed to the repo or git-ignored? (Recommend: git-ignored, generated on each CI run.)
