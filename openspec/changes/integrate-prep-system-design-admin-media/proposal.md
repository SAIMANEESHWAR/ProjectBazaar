## Why

Preparation Mode system design content is split across two inconsistent sources: the candidate HLD and LLD experience already reads from DynamoDB through the preparation APIs, while the admin HLD and LLD tabs still render static data from local TypeScript files. At the same time, the PrepSystemDesign table stores incomplete media metadata because diagram JSON is embedded into content during seeding and the `diagramUrl` field is left empty for all records, which blocks maintainable media workflows and prevents the admin UI from managing real assets.

## What Changes

- Replace the admin HLD and LLD static data flow with API-backed content loading using the existing preparation admin service and environment-driven endpoint configuration.
- Add complete admin CRUD for system design questions, including working add and delete actions, reusable confirmation and form flows, and support for both HLD and LLD content types through the existing handler contract.
- Extend the system design data model and Lambda handlers to store structured diagram metadata and additional image URLs as first-class fields instead of relying on embedded JSON inside the solution content.
- Add admin upload support for system design media using S3 presigned uploads for problem-related images and define the required AWS bucket configuration for those assets.
- Add a controlled data migration and seed/update strategy that backfills PrepSystemDesign records from the existing `systemDesignData.ts` and `systemDesignDiagrams.ts` sources while preserving content IDs and avoiding ad hoc manual fixes.
- Update the candidate HLD and LLD experience so each problem can render multiple media tabs in the same detail area, including the architecture diagram and any additional uploaded images.
- Align related scripts, services, and shared types so admin and candidate flows use the same normalized system design contract.

## Capabilities

### New Capabilities

- `prep-system-design-admin-management`: API-backed admin management for HLD and LLD preparation content, including listing, creation, update, and deletion.
- `prep-system-design-media-assets`: Structured storage, upload, migration, and retrieval of diagram and additional image assets for system design questions.
- `prep-system-design-candidate-media-viewer`: Candidate-side rendering of system design media through tabbed diagram and additional-image views.

### Modified Capabilities

- None.

## Impact

Affected areas include the admin preparation content screen, candidate Preparation Mode system design pages, shared preparation API services, the prep admin Lambda, the prep user Lambda read model, system design seed and migration scripts, DynamoDB table records for `PrepSystemDesign`, and S3 configuration for system design image uploads.
