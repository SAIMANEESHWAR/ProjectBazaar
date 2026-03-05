## ADDED Requirements

### Requirement: Coverage JSON artifact is produced by the test run
Running `npm run test:coverage` SHALL produce a `public/coverage-summary.json` file containing per-file and total coverage metrics in Istanbul summary format.

#### Scenario: Coverage file is generated after test run
- **WHEN** `npm run test:coverage` completes successfully
- **THEN** `public/coverage-summary.json` exists and contains a `"total"` key with `lines`, `branches`, `functions`, and `statements` objects

#### Scenario: Per-file entries are present in the coverage file
- **WHEN** `public/coverage-summary.json` is read
- **THEN** each covered source file has an entry keyed by its relative path with numeric `pct` fields for each metric

#### Scenario: Coverage file is absent when tests have not been run
- **WHEN** `public/coverage-summary.json` does not exist
- **THEN** the admin dashboard displays a "No coverage data available — run tests to generate report" message

---

### Requirement: Vitest is configured to output JSON summary
The `vitest.config.ts` coverage block SHALL include `"json-summary"` in its `reporter` array and SHALL set `reportsDirectory` to output into `public/`.

#### Scenario: json-summary reporter is active
- **WHEN** `vitest run --coverage` is executed
- **THEN** `coverage-summary.json` is written alongside other coverage artifacts

#### Scenario: Coverage includes all service and component files
- **WHEN** `public/coverage-summary.json` is read
- **THEN** entries exist for files matching `services/**/*.ts` and `components/**/*.tsx`

---

### Requirement: Coverage data is accessible to the frontend at a known URL
The file `public/coverage-summary.json` SHALL be served by Vite's static file server at `/coverage-summary.json` with no authentication required (admin page handles access control).

#### Scenario: Coverage file is fetchable from the admin page
- **WHEN** the admin coverage dashboard calls `fetch('/coverage-summary.json')`
- **THEN** it receives a 200 response with JSON content

#### Scenario: Missing coverage file returns 404
- **WHEN** the file has not been generated and the admin page fetches it
- **THEN** the fetch returns a 404 and the dashboard shows the "no data" empty state
