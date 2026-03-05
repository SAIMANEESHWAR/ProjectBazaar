## ADDED Requirements

### Requirement: Admin coverage dashboard page exists at /admin/coverage
The admin panel SHALL include a page at route `/admin/coverage` that is accessible from the admin sidebar and displays test coverage data.

#### Scenario: Route is registered
- **WHEN** an admin navigates to `/admin/coverage`
- **THEN** the `CoverageReportPage` component is rendered without errors

#### Scenario: Page is linked in admin sidebar
- **WHEN** the admin sidebar is rendered
- **THEN** a "Test Coverage" link is visible that navigates to `/admin/coverage`

---

### Requirement: Dashboard displays overall coverage summary
The coverage dashboard SHALL show aggregate totals for lines, branches, functions, and statements coverage percentages derived from `coverage-summary.json`.

#### Scenario: Summary cards are shown
- **WHEN** coverage data is loaded successfully
- **THEN** four metric cards are displayed: Lines, Branches, Functions, Statements — each showing a percentage

#### Scenario: Color coding reflects coverage health
- **WHEN** a coverage metric is >= 80%
- **THEN** it is displayed in green

#### Scenario: Low coverage is highlighted
- **WHEN** a coverage metric is < 50%
- **THEN** it is displayed in red

#### Scenario: Medium coverage is shown in yellow
- **WHEN** a coverage metric is between 50% and 79%
- **THEN** it is displayed in yellow/amber

---

### Requirement: Dashboard displays per-file coverage breakdown
The page SHALL show a table listing each covered file with its individual line, branch, function, and statement coverage percentages.

#### Scenario: File table is rendered
- **WHEN** coverage data is loaded
- **THEN** a table with columns: File, Lines %, Branches %, Functions %, Statements % is visible

#### Scenario: Files are sorted by lowest coverage first
- **WHEN** the file table is first displayed
- **THEN** files with the lowest line coverage percentage appear at the top

#### Scenario: File names are truncated for long paths
- **WHEN** a file path exceeds 60 characters
- **THEN** the path is shortened with an ellipsis (…) while the full path is shown on hover

---

### Requirement: Dashboard displays test run status summary
The page SHALL show the count of passed, failed, and skipped tests from the most recent test run.

#### Scenario: Pass/fail/skip counts are displayed
- **WHEN** coverage data includes test result metadata
- **THEN** counts for "Passed", "Failed", and "Skipped" tests are shown with icons

#### Scenario: Last-run timestamp is shown
- **WHEN** coverage data is loaded
- **THEN** a "Last updated: <date/time>" label is visible near the top of the page

---

### Requirement: Dashboard handles missing or stale coverage data gracefully
The page SHALL display a clear empty state when `coverage-summary.json` cannot be loaded.

#### Scenario: No data empty state is shown
- **WHEN** `fetch('/coverage-summary.json')` returns a 404 or network error
- **THEN** the page shows "No coverage data available. Run `npm run test:coverage` to generate a report."

#### Scenario: Loading state is shown while fetching
- **WHEN** the page mounts and the fetch is in progress
- **THEN** a loading spinner or skeleton is displayed

---

### Requirement: Dashboard refresh button re-fetches coverage data
The page SHALL provide a "Refresh" button that re-fetches the coverage JSON without a full page reload.

#### Scenario: Refresh triggers re-fetch
- **WHEN** the admin clicks the "Refresh" button
- **THEN** `fetch('/coverage-summary.json')` is called again and the displayed data updates
