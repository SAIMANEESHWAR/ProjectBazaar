## 1. Shared contract and service preparation

- [ ] 1.1 Add shared frontend system design types for explicit media fields, including `diagramData`, `diagramUrl`, and `additionalImageUrls`
- [ ] 1.2 Update the preparation API service to expose any missing admin upload helpers and normalized system design request helpers
- [ ] 1.3 Add environment-driven configuration for the system design media bucket and related upload prefixes

## 2. Admin system design management

- [ ] 2.1 Refactor the admin HLD and LLD tabs to load `system_design` content from the prep admin API instead of static arrays
- [ ] 2.2 Implement reusable add and edit modal flows for HLD and LLD questions with normalized payload submission
- [ ] 2.3 Implement a reusable delete confirmation flow that calls the admin delete action and refreshes the system design list
- [ ] 2.4 Add loading, empty, success, and error states for admin system design API operations

## 3. Lambda and storage changes

- [ ] 3.1 Extend `prep_admin_handler.py` system design normalization and filtering to support explicit diagram and additional-image fields
- [ ] 3.2 Extend `prep_user_handler.py` read responses to return explicit media fields while preserving legacy embedded-diagram compatibility during migration
- [ ] 3.3 Add a presigned upload action for system design media with validation for supported image content types and storage prefixes
- [ ] 3.4 Document or provision the required S3 bucket and IAM configuration for system design media uploads

## 4. Data migration and changelog workflow

- [ ] 4.1 Create a versioned migration/changelog location for `PrepSystemDesign` schema and data backfills
- [ ] 4.2 Implement a migration script that backfills `diagramData`, `diagramUrl`, and `additionalImageUrls` from `systemDesignData.ts` and `systemDesignDiagrams.ts`
- [ ] 4.3 Update the existing seed or upload workflow so future syncs write explicit media fields instead of embedding diagram JSON inside `content`
- [ ] 4.4 Add rollback or remediation guidance for partially migrated `PrepSystemDesign` rows

## 5. Candidate media experience

- [ ] 5.1 Update the candidate HLD and LLD expanded detail view to build a tab set from available solution, diagram, and additional-image content
- [ ] 5.2 Render interactive diagrams from `diagramData` and URL-based fallbacks from `diagramUrl` within the diagram tab
- [ ] 5.3 Render additional uploaded images in their own tabbed view with graceful handling for missing or broken assets

## 6. Verification and rollout readiness

- [ ] 6.1 Add or update tests for admin system design CRUD flows, Lambda normalization, and candidate media rendering states
- [ ] 6.2 Verify end-to-end behavior against migrated `PrepSystemDesign` records for both HLD and LLD
- [ ] 6.3 Update developer-facing documentation for the migration workflow, required environment variables, and media upload process