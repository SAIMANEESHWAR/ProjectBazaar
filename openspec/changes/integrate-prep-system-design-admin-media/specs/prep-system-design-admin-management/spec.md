## ADDED Requirements

### Requirement: Admin SHALL manage system design content through the preparation admin API
The admin preparation content experience SHALL load HLD and LLD system design records from the preparation admin API instead of local static arrays. The UI SHALL use the shared preparation service layer and SHALL request `system_design` records filtered by `designType` so admin and candidate views operate on the same source of truth.

#### Scenario: Admin opens the HLD tab
- **WHEN** an admin navigates to the HLD system design tab in Preparation Mode
- **THEN** the client SHALL request `system_design` content from the admin API with `designType = hld`

#### Scenario: Admin opens the LLD tab
- **WHEN** an admin navigates to the LLD system design tab in Preparation Mode
- **THEN** the client SHALL request `system_design` content from the admin API with `designType = lld`

### Requirement: Admin SHALL be able to add and update system design questions
The admin experience SHALL provide a form workflow for creating and updating system design questions. The workflow SHALL support both HLD and LLD items and SHALL submit normalized records through the admin API so the Lambda stores explicit system design fields consistently.

#### Scenario: Admin creates an HLD question
- **WHEN** an admin submits a valid new HLD question from the add-problem modal
- **THEN** the client SHALL call the admin API to create a `system_design` record with `designType = hld`

#### Scenario: Admin updates an existing LLD question
- **WHEN** an admin edits an existing LLD question and submits the form
- **THEN** the client SHALL call the admin API to persist the updated `system_design` record

### Requirement: Admin SHALL be able to delete system design questions with confirmation
The admin experience SHALL provide a confirmation flow before deleting a system design question. Deletion SHALL call the admin API and SHALL refresh the visible list after success.

#### Scenario: Admin confirms deletion
- **WHEN** an admin confirms deletion for a system design question
- **THEN** the client SHALL call the admin API delete action for that record and remove it from the visible result set after success

#### Scenario: Admin cancels deletion
- **WHEN** an admin dismisses the deletion confirmation
- **THEN** the client SHALL leave the system design record unchanged

### Requirement: Admin SHALL expose clear operational states for system design management
The admin HLD and LLD tabs SHALL display loading, empty, success, and error states for API-driven operations so failures are visible and actionable.

#### Scenario: Admin data load fails
- **WHEN** the system design list request fails
- **THEN** the admin UI SHALL show an error state or toast and SHALL not silently fall back to static data

#### Scenario: Admin create succeeds
- **WHEN** the admin API successfully creates a system design question
- **THEN** the UI SHALL show success feedback and refresh or reconcile the visible list from API data