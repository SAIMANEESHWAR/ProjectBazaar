## Context

Preparation Mode system design content currently has a split architecture. The candidate HLD and LLD pages already read `system_design` items from the prep user API backed by `PrepSystemDesign`, but the admin content management page still imports `hldQuestions` and `lldQuestions` from static TypeScript data. The seed workflow flattens those same static sources into DynamoDB and appends interactive diagram JSON into the freeform `content` field between sentinel markers, which makes the database hard to inspect, hard to update incrementally, and impossible to manage through the admin UI. The current admin Lambda also only exposes a note-specific presigned upload endpoint, so there is no supported path for uploading system-design-specific media.

This change spans frontend admin UI, candidate UI, shared service types, Lambda contracts, DynamoDB record shape, S3 upload flows, and operational migration scripts. It therefore needs an explicit design before implementation.

## Goals / Non-Goals

**Goals:**
- Make admin HLD and LLD management fully API-backed using the existing preparation service layer and environment-driven endpoints.
- Normalize system design records so diagram metadata and additional image URLs are stored as explicit fields rather than embedded inside `content`.
- Add enterprise-grade admin actions for add, edit, and delete with reusable modal and confirmation patterns.
- Introduce presigned S3 uploads for system design media with predictable key structure and validation.
- Define a repeatable migration and changelog strategy for `PrepSystemDesign` so backfills and future schema changes are traceable.
- Preserve candidate functionality during rollout and upgrade the candidate view to support multiple media tabs in one location.

**Non-Goals:**
- Reworking unrelated preparation content types outside `system_design`.
- Replacing the existing prep user progress model.
- Building a full asset library or image editor for admin users.
- Changing public URLs or route structure for candidate Preparation Mode.

## Decisions

### 1. Reuse the existing preparation API service instead of creating a new system-design-only client
The admin page will use `prepAdminApi` and shared system-design types instead of bespoke fetch logic. This keeps endpoint selection in one place, preserves existing cache invalidation behavior, and aligns admin and candidate flows on the same content contract.

Alternatives considered:
- Add inline fetches inside the admin component: rejected because it duplicates endpoint handling and drifts from the existing preparation service pattern.
- Create a separate system-design service file: rejected because the generic prep service already owns the required CRUD behavior.

### 2. Promote system design media to first-class fields in `PrepSystemDesign`
System design records will store media in explicit attributes, with the admin and candidate clients consuming those fields directly. The target shape is:
- `diagramData`: structured JSON for interactive diagram rendering.
- `diagramUrl`: optional URL for a single canonical diagram asset when image-based rendering is needed.
- `additionalImageUrls`: ordered list of supplementary image URLs for the question.
- Existing fields such as `content`, `topics`, `designType`, and `section` remain intact.

The admin and user Lambdas will normalize and return these fields without requiring clients to parse sentinel markers from `content`. During rollout, read logic may preserve a temporary legacy fallback for embedded diagram payloads so existing rows do not break before migration completes.

Alternatives considered:
- Continue embedding diagram JSON in `content`: rejected because it is opaque, brittle, and unsuitable for admin editing.
- Store only image URLs and drop structured diagram JSON: rejected because the current candidate renderer already supports an interactive diagram experience that would be lost.

### 3. Generalize presigned uploads for system design media rather than overloading the notes-only flow
The admin Lambda will expose a media upload action for system design assets that validates media type, content type, and file naming, and returns a presigned S3 URL plus the final public object URL or key. The bucket name should be environment-driven, with separate key prefixes such as `system-design/diagrams/` and `system-design/additional-images/`.

Alternatives considered:
- Reuse the handwritten notes bucket and endpoint without media typing: rejected because it couples unrelated content lifecycles and makes policy enforcement harder.
- Upload images through the frontend application server: rejected because presigned S3 upload is simpler, cheaper, and already consistent with the project’s serverless pattern.

### 4. Introduce a versioned migration and changelog workflow for `PrepSystemDesign`
Schema and data backfills will be handled by numbered migration scripts and a committed migration log in the repository. Each migration entry will capture:
- migration identifier and date,
- schema or attribute changes,
- source of truth inputs,
- forward execution steps,
- rollback or remediation notes.

The first migration will backfill `diagramData`, `diagramUrl`, and `additionalImageUrls` from `systemDesignData.ts` and `systemDesignDiagrams.ts`, while stripping embedded diagram payloads from `content` for updated rows. This makes future column changes auditable and repeatable instead of one-off table edits.

Alternatives considered:
- Run manual one-time table edits: rejected because they are not reproducible and cannot be safely repeated across environments.
- Rely only on seed scripts: rejected because seeds do not express in-place schema evolution or rollback intent.

### 5. Use tabbed media rendering in candidate detail views
The candidate HLD and LLD detail area will present media tabs in a single location. When available, tabs can include `Solution`, `Diagram`, and one or more `Additional Images`. This keeps the layout stable, avoids stacking multiple large media blocks vertically, and allows the UI to scale as questions gain richer assets.

Alternatives considered:
- Keep a single long expanded section with all media stacked: rejected because it becomes noisy and difficult to navigate on mobile.
- Open additional images in a separate modal only: rejected because the user asked for tabs at the same location as the current diagram view.

## Risks / Trade-offs

- [Migration inconsistency between static files and DynamoDB] → Use deterministic IDs from existing records, perform dry-run output generation, and record migration results in a versioned changelog.
- [Mixed legacy and new rows during rollout] → Keep temporary backward-compatible read parsing for embedded diagram payloads until migration has completed and been verified.
- [S3 asset sprawl or policy drift] → Use environment variables, scoped key prefixes, content-type validation, and documented bucket/IAM requirements.
- [Admin modal complexity in a large component] → Extract system-design-specific form and delete-confirmation UI into reusable subcomponents or hooks instead of growing `PrepContentManagementPage` inline.
- [Candidate rendering regressions] → Preserve current diagram rendering behavior as the default tab and add tests for rows with only solution text, only diagram data, only image URLs, and combined media.

## Migration Plan

1. Add schema support in frontend types and Lambda normalizers for `diagramData` and `additionalImageUrls`, while keeping legacy embedded-diagram parsing on user reads.
2. Add presigned upload support and environment variables for the system design media bucket.
3. Refactor the admin HLD and LLD tabs to fetch from the prep admin API and use create/update/delete actions against `system_design`.
4. Introduce a numbered migration script and changelog entry that backfills `PrepSystemDesign` from `systemDesignData.ts` and `systemDesignDiagrams.ts`, fills explicit media fields, and removes embedded diagram payloads from `content` for migrated rows.
5. Update the candidate renderer to read explicit media fields and show tabbed media views.
6. Verify admin CRUD, upload flows, migrated row rendering, and candidate read behavior before removing any temporary legacy parsing paths.

Rollback strategy:
- Frontend changes can be rolled back independently because the migration preserves core content fields.
- If media migration causes issues, candidate reads can continue using legacy parsing until data is corrected.
- S3 uploads can be disabled by configuration without losing existing content records.

## Open Questions

- Should system design media use a new dedicated bucket or a new prefix within an existing prep bucket in each environment? The implementation can support either, but infrastructure naming and IAM ownership should be confirmed.
- Is edit-in-place required in the first implementation for HLD/LLD items, or is add plus delete plus refresh sufficient while the modal form pattern is established? The user explicitly requested add and delete; edit appears desirable but is not separately called out as mandatory.