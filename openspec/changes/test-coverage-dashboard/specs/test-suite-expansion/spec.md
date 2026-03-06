## ADDED Requirements

### Requirement: Service unit tests exist for every service file
The test suite SHALL include unit tests for all files in `services/`. Each test file MUST cover the primary exported functions with mocked network/storage dependencies.

#### Scenario: bidsService covered
- **WHEN** `vitest run tests/services/bidsService.test.ts` is executed
- **THEN** all exported functions (`saveBidAsync`, `getBidsByProjectIdAsync`, `updateBidAsync`, `deleteBidAsync`, `acceptBid`, `rejectBid`) have at least one passing test

#### Scenario: bidRequestProjectsApi covered
- **WHEN** `vitest run tests/services/bidRequestProjectsApi.test.ts` is executed
- **THEN** CRUD operations for bid-request projects have passing tests

#### Scenario: freelancersApi covered
- **WHEN** `vitest run tests/services/freelancersApi.test.ts` is executed
- **THEN** freelancer fetch, filter, and profile operations have passing tests

#### Scenario: buyerApi covered
- **WHEN** `vitest run tests/services/buyerApi.test.ts` is executed
- **THEN** buyer-specific API calls have passing tests

#### Scenario: preparationApi covered
- **WHEN** `vitest run tests/services/preparationApi.test.ts` is executed
- **THEN** placement prep API functions have passing tests

#### Scenario: freelancerInteractionsApi covered
- **WHEN** `vitest run tests/services/freelancerInteractionsApi.test.ts` is executed
- **THEN** wishlist, follow, and interaction operations have passing tests

#### Scenario: atsService covered
- **WHEN** `vitest run tests/services/atsService.test.ts` is executed
- **THEN** ATS resume scoring functions have passing tests

#### Scenario: AIResumeService covered
- **WHEN** `vitest run tests/services/AIResumeService.test.ts` is executed
- **THEN** AI resume generation functions have passing tests

---

### Requirement: Component unit tests exist for core UI components
The test suite SHALL include unit tests for key components in `components/`. Each test MUST verify rendering and primary user interactions.

#### Scenario: AuthPage renders and handles login
- **WHEN** `<AuthPage />` is rendered in test environment
- **THEN** email and password fields are present and form submission triggers the auth service

#### Scenario: DashboardPage renders with mocked data
- **WHEN** `<DashboardPage />` is rendered with mocked project data
- **THEN** project cards are displayed and filter controls are present

#### Scenario: ProjectCard displays project details
- **WHEN** `<ProjectCard />` is rendered with a project fixture
- **THEN** title, price, and category are visible in the DOM

#### Scenario: CartPage renders cart items
- **WHEN** `<CartPage />` is rendered with items in cart context
- **THEN** line items and total price are visible

#### Scenario: WishlistPage renders wishlist items
- **WHEN** `<WishlistPage />` is rendered with wishlist context data
- **THEN** saved project cards are displayed

#### Scenario: SettingsPage renders user settings form
- **WHEN** `<SettingsPage />` is rendered
- **THEN** profile fields are visible and save button is present

#### Scenario: ChatRoom renders messages
- **WHEN** `<ChatRoom />` is rendered with mock socket context
- **THEN** message list and input field are present

#### Scenario: MockAssessmentPage renders question flow
- **WHEN** `<MockAssessmentPage />` is rendered
- **THEN** first question is displayed and navigation controls are present

---

### Requirement: Integration tests cover key user flows
The test suite SHALL include integration tests that exercise component + service together through user interactions.

#### Scenario: User can place a bid end-to-end
- **WHEN** user opens `<PlaceBidModal />`, fills in amount and message, and clicks Submit
- **THEN** `bidsService.saveBidAsync` is called with correct parameters and success feedback is shown

#### Scenario: User can browse and filter projects
- **WHEN** user interacts with filter controls on `<BrowseProjectsContent />`
- **THEN** visible project cards update to match selected filters

#### Scenario: User can add project to wishlist
- **WHEN** user clicks the wishlist icon on a `<ProjectCard />`
- **THEN** `freelancerInteractionsApi` save function is called and icon state toggles

#### Scenario: Admin can view user list
- **WHEN** admin navigates to `<UserManagementPage />`
- **THEN** user table is rendered and search input filters the displayed rows

#### Scenario: Admin can view revenue analytics
- **WHEN** admin navigates to `<RevenueAnalyticsPage />`
- **THEN** chart and summary statistics are rendered

---

### Requirement: Tests use proper isolation and cleanup
All tests SHALL use `vi.fn()` or `vi.mock()` for external dependencies and SHALL clean up side effects after each test.

#### Scenario: Mocks reset between tests
- **WHEN** a test in any test file completes
- **THEN** `vi.clearAllMocks()` or `afterEach` cleanup ensures no state leaks to the next test

#### Scenario: localStorage is cleared between tests
- **WHEN** a service test uses localStorage
- **THEN** `localStorage.clear()` is called in `beforeEach` or `afterEach`
