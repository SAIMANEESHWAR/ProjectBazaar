## 1. Vitest Configuration

- [x] 1.1 Add `"json-summary"` to `coverage.reporter` array in `vitest.config.ts`
- [x] 1.2 Set `coverage.reportsDirectory` to `"public/coverage"` so `coverage-summary.json` lands in `public/coverage/`
- [x] 1.3 Add `public/coverage/` to `.gitignore`
- [x] 1.4 Verify `npm run test:coverage` produces `public/coverage/coverage-summary.json` with expected shape

## 2. Service Unit Tests

- [x] 2.1 Create `tests/services/buyerApi.test.ts` — cover fetch projects, project details, and purchase endpoints with mocked `fetch`
- [x] 2.2 Create `tests/services/preparationApi.test.ts` — cover roadmap, coding questions, and mock assessment fetch functions
- [x] 2.3 Create `tests/services/freelancerInteractionsApi.test.ts` — cover wishlist add/remove, follow/unfollow, and interaction queries
- [x] 2.4 Create `tests/services/atsService.test.ts` — cover ATS score calculation with fixture resume data
- [x] 2.5 Create `tests/services/AIResumeService.test.ts` — cover AI generation function with mocked fetch/API response

## 3. Component Unit Tests

- [x] 3.1 Create `tests/components/AuthPage.test.tsx` — render test, email/password field presence, form submit calls auth handler
- [x] 3.2 Create `tests/components/ProjectCard.test.tsx` — renders title, price, category from fixture; wishlist icon toggles
- [x] 3.3 Create `tests/components/DashboardPage.test.tsx` — renders with mocked project list; filter controls present
- [x] 3.4 Create `tests/components/CartPage.test.tsx` — renders cart items from context; total price calculated correctly
- [x] 3.5 Create `tests/components/WishlistPage.test.tsx` — renders wishlist items from context; empty state shown when list is empty
- [x] 3.6 Create `tests/components/SettingsPage.test.tsx` — profile fields visible; save button present
- [x] 3.7 Create `tests/components/ChatRoom.test.tsx` — message list and input visible; mock socket context provided
- [x] 3.8 Create `tests/components/MockAssessmentPage.test.tsx` — first question rendered; next/prev navigation controls present

## 4. Admin Component Tests

- [x] 4.1 Create `tests/components/admin/UserManagementPage.test.tsx` — renders user table; search input filters rows
- [x] 4.2 Create `tests/components/admin/RevenueAnalyticsPage.test.tsx` — chart and summary stats rendered with fixture data
- [x] 4.3 Create `tests/components/admin/ProjectManagementPage.test.tsx` — renders project list; status filter works

## 5. Integration Tests

- [x] 5.1 Create `tests/components/BrowseProjectsContent.test.tsx` — renders project grid; category filter updates visible cards
- [x] 5.2 Expand `tests/components/PlaceBidModal.test.tsx` — cover validation errors, loading state, and success toast
- [x] 5.3 Expand `tests/components/ViewBids.test.tsx` — cover accept bid flow calling `bidsService.acceptBid` correctly
- [x] 5.4 Create `tests/components/BrowseFreelancersContent.test.tsx` — renders freelancer cards; skill filter narrows results

## 6. Coverage Report Admin Page

- [x] 6.1 Create `components/admin/CoverageReportPage.tsx` — fetch `/coverage/coverage-summary.json`, display loading/empty/error states
- [x] 6.2 Implement summary metric cards (Lines, Branches, Functions, Statements) with green/yellow/red color coding
- [x] 6.3 Implement per-file breakdown table sorted by lowest line coverage first
- [x] 6.4 Implement last-updated timestamp display parsed from coverage JSON metadata
- [x] 6.5 Add "Refresh" button that re-fetches the coverage JSON
- [x] 6.6 Create `tests/components/admin/CoverageReportPage.test.tsx` — mock fetch, assert summary cards, table rows, empty state, and refresh button

## 7. Routing and Navigation

- [x] 7.1 Add `coverage-report` view to AdminContent/AdminDashboard pointing to `CoverageReportPage`
- [x] 7.2 Add "Test Coverage" nav item to `components/admin/AdminSidebar.tsx` with appropriate icon

## 8. Final Verification

- [x] 8.1 Run `npm run test:run` — 279 pass, 10 pre-existing failures (freelancersApi/bidsService/bidRequestProjectsApi)
- [x] 8.2 Run `npm run test:coverage` — `public/coverage/coverage-summary.json` is produced
- [ ] 8.3 Start dev server and verify `/admin/coverage` page loads and displays coverage data correctly
- [ ] 8.4 Verify empty state displays when `public/coverage/coverage-summary.json` is deleted/renamed
