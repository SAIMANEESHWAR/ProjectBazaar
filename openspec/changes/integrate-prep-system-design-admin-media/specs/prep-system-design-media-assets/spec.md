## ADDED Requirements

### Requirement: System design records SHALL store explicit media fields
The system SHALL store system design media in explicit fields on `PrepSystemDesign` records. At minimum, the normalized record contract SHALL support structured `diagramData`, optional `diagramUrl`, and ordered `additionalImageUrls` so clients do not need to parse hidden payloads from the solution content.

#### Scenario: Lambda normalizes a system design record
- **WHEN** the prep admin Lambda receives a create or update request for `system_design`
- **THEN** it SHALL persist explicit media fields for diagram data and additional image URLs in the normalized record

#### Scenario: Candidate reads a migrated record
- **WHEN** the prep user Lambda returns a `system_design` record that has explicit media fields
- **THEN** the response SHALL include those fields without requiring the client to parse embedded diagram markers from `content`

### Requirement: Admin SHALL be able to upload system design media through presigned S3 flows
The admin API SHALL provide presigned upload support for system design media assets. The upload contract SHALL validate supported content types, SHALL return the S3 object key and upload URL, and SHALL distinguish between diagram assets and additional image assets using predictable storage prefixes.

#### Scenario: Admin requests an additional image upload URL
- **WHEN** the admin client requests an upload URL for a supported image file for a system design question
- **THEN** the admin API SHALL return a presigned S3 upload URL and a storage location under the configured system design image prefix

#### Scenario: Admin requests an unsupported media type
- **WHEN** the admin client requests an upload URL with an unsupported content type or missing filename
- **THEN** the admin API SHALL reject the request with a validation error

### Requirement: The repository SHALL track system design schema migrations through a versioned changelog
The project SHALL use a versioned migration and changelog strategy for `PrepSystemDesign` schema changes and data backfills. Each migration SHALL be represented by a committed script or manifest and SHALL document the attributes changed, the source inputs used, and rollback or remediation guidance.

#### Scenario: Team backfills diagram data from static sources
- **WHEN** a migration populates `PrepSystemDesign` media fields from `systemDesignData.ts` and `systemDesignDiagrams.ts`
- **THEN** the repository SHALL contain a versioned migration record describing that backfill and the affected columns

#### Scenario: Future schema change is introduced
- **WHEN** a new `PrepSystemDesign` attribute is added or renamed after this change
- **THEN** the change SHALL be recorded through the same migration and changelog workflow instead of an undocumented manual table update

### Requirement: System SHALL preserve compatibility during migration
The read path SHALL remain backward compatible while migrated and unmigrated system design rows coexist.

#### Scenario: Candidate reads a legacy row before migration completes
- **WHEN** a `system_design` record still contains embedded diagram payloads in `content`
- **THEN** the application SHALL continue to render the diagram correctly until the row is migrated to explicit media fields