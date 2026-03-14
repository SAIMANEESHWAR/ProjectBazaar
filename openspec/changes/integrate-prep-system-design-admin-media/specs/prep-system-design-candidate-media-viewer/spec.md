## ADDED Requirements

### Requirement: Candidate SHALL view system design media through tabs in the expanded problem view
The candidate HLD and LLD expanded problem view SHALL render available media in a tabbed area at the current diagram location. The tab set SHALL be driven by available content and SHALL support at least solution text, the architecture diagram, and additional uploaded images.

#### Scenario: Problem has solution, interactive diagram, and additional images
- **WHEN** a candidate expands a system design problem that includes all media types
- **THEN** the detail view SHALL show tabs for the available media and SHALL allow switching between them without leaving the page

#### Scenario: Problem has no additional images
- **WHEN** a candidate expands a system design problem that only has solution content and a diagram
- **THEN** the detail view SHALL omit the additional-images tab and SHALL still render the remaining tabs correctly

### Requirement: Candidate SHALL render both structured and URL-based diagram assets
The candidate experience SHALL support interactive diagrams from `diagramData` and image or link-based diagram assets from `diagramUrl` so migrated and non-interactive records remain viewable.

#### Scenario: Structured diagram data is available
- **WHEN** a system design record includes `diagramData`
- **THEN** the candidate SHALL render the interactive diagram experience in the diagram tab

#### Scenario: Only diagram URL is available
- **WHEN** a system design record does not include `diagramData` but does include `diagramUrl`
- **THEN** the candidate SHALL render the image or external-link fallback in the diagram tab

### Requirement: Candidate media tabs SHALL degrade gracefully on missing assets
The system SHALL avoid rendering broken tabs or empty media containers when media is unavailable or partially configured.

#### Scenario: Additional image URL fails to load
- **WHEN** an additional image URL is invalid or unavailable
- **THEN** the UI SHALL present a recoverable fallback for that asset without breaking the rest of the expanded problem view

#### Scenario: No media assets exist
- **WHEN** a system design problem has solution content only
- **THEN** the expanded detail view SHALL continue to render the solution content without showing empty media tabs