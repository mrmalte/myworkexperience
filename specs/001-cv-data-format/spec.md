# Feature Specification: CV Data Format (specs-input/cv)

**Feature Branch**: `001-cv-data-format`  
**Created**: 2026-01-09  
**Status**: Draft  
**Input**: Define the on-disk input format for CV content in `specs-input/cv/`.

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Maintain CV content via folders (Priority: P1)

As a CV maintainer, I want to add and update CV content by editing files under `specs-input/cv/` so that the site can be regenerated without manual edits to the generated output.

**Why this priority**: This is the foundation for all CV publishing; without a clear input contract, the build step cannot be reliable.

**Independent Test**: Create a minimal `specs-input/cv/summary/` plus one `specs-input/cv/YYYYMM_Experience/` directory that follows the rules below; validation passes and the content is discoverable.

**Acceptance Scenarios**:

1. **Given** a `specs-input/cv/` directory that follows the required structure, **When** the build/validation step runs, **Then** it reports success with zero validation errors.
2. **Given** a `specs-input/cv/` directory with an invalid folder name or invalid metadata tag, **When** the build/validation step runs, **Then** it fails and reports actionable error messages referencing the offending path(s).

---

### User Story 2 - Support English and Swedish content (Priority: P2)

As a CV maintainer, I want each CV unit (summary/experience) to have English and Swedish content files so that the site can be generated in either language.

**Why this priority**: The repository already stores `en.txt` and `sv.txt` content; the input contract must make the language requirement explicit.

**Independent Test**: Provide both `en.txt` and `sv.txt` in a directory and confirm validation passes; remove one language file and confirm validation fails.

**Acceptance Scenarios**:

1. **Given** a CV unit directory with both `en.txt` and `sv.txt`, **When** validation runs, **Then** it passes language checks for that directory.
2. **Given** a CV unit directory missing `en.txt` or missing `sv.txt`, **When** validation runs, **Then** it fails and reports which language file is missing.

---

### Edge Cases

- A directory exists under `specs-input/cv/` that does not match any supported naming pattern.
- A required file is missing: `meta.txt`, `en.txt`, or `sv.txt`.
- `meta.txt` contains an unknown tag name or a duplicate tag.
- `Type` is outside the allowed set.
- `Period` is malformed (wrong format) or has `toDate < fromDate`.
- `Client` is present when `Type` is not `assignment`, or missing when `Type` is `assignment`.
- `en.txt` or `sv.txt` is missing a `Title:` line, or has an empty title.
- A content file includes an unexpected key line (e.g., `Foo:`) where only `Title:` (required) and `Description:` (optional) are allowed.
- `LocationType` is outside `Onsite`, `Hybrid`, `Remote`.

## Requirements _(mandatory)_

**Constitution alignment (mandatory)**

- The delivered product MUST be deployable as static assets: plain HTML, CSS, and JavaScript.
- Custom build tooling MUST be implemented in TypeScript.
- CV source material under `specs-input/cv/` is the source of truth; generated output MUST NOT be edited by hand.

### Functional Requirements

#### Directory Structure

- **FR-001**: The system MUST treat `specs-input/cv/` as the single source of truth for CV content.
- **FR-002**: Under `specs-input/cv/`, the system MUST support exactly these directory patterns:
  - `summary/`
  - `YYYYMM_<ExperienceName>/`
  - `YYYYMM_<ExperienceName>_summary/`
- **FR-003**: Each supported directory under `specs-input/cv/` MUST contain the files:
  - `meta.txt`
  - `en.txt`
  - `sv.txt`

#### Directory Naming Rules

- **FR-004**: For `YYYYMM_*` directories, `YYYYMM` MUST be exactly 6 digits where `YYYY` is year and `MM` is month `01`–`12`.
- **FR-005**: The part after `YYYYMM_` (the experience name) MUST be non-empty and may contain letters, digits, `_`, and `-`.

#### Metadata File Format (`meta.txt`)

- **FR-006**: `meta.txt` MUST be UTF-8 plain text consisting of key-value pairs, one per line, in the form `Key: Value`.
- **FR-007**: The key is the substring before the first `:`; the value is the substring after the first `:` (leading/trailing whitespace trimmed).
- **FR-008**: Keys MUST be case-insensitive for matching, but MUST be preserved as written when echoed in errors.
- **FR-008a**: For enumerated value fields (`Type`, `LocationType`), values MUST be matched case-insensitively.
- **FR-009**: Empty lines MUST be ignored.
- **FR-010**: Duplicate keys within a single `meta.txt` MUST be treated as an error.
- **FR-011**: Unknown keys MUST be treated as an error.

#### Content File Format (`en.txt`, `sv.txt`)

- **FR-011a**: `en.txt` and `sv.txt` MUST be UTF-8 plain text.
- **FR-011b**: The first non-empty line of each content file MUST be a key-value line in the form `Title: Value` where `Value` is a non-empty string after trimming whitespace.
- **FR-011c**: After the `Title:` line, there MUST be a newline; the remaining content is treated as the description body.
- **FR-011d**: The description body MAY optionally begin with a line `Description: Value`.
  - If present, `Value` (plus any following lines) is the description body.
  - If not present, the description body begins immediately after the `Title:` line.
- **FR-011e**: Apart from the allowed `Title:` (required) and optional `Description:` line, the system MUST NOT interpret any other `Key:` prefixes in the content files as metadata.

#### Summary Metadata (directory: `summary/`)

- **FR-012**: `specs-input/cv/summary/meta.txt` MUST define `Role` as a non-empty string.

#### Experience Metadata (directory: `YYYYMM_<ExperienceName>/`)

- **FR-013**: Each experience directory MUST define:
  - `Type` (one of: `education`, `employee`, `voluntary`, `national`, `assignment`)
  - `Organization` (non-empty string)
  - `Period` in one of these formats:
    - `YYYYMM-YYYYMM` (bounded period)
    - `YYYYMM-` (ongoing)
    - `YYYY` (year-only, legacy)
  - `Role` (non-empty string)
  - `Location` (non-empty string)
  - `LocationType` (one of: `Onsite`, `Hybrid`, `Remote`)
- **FR-014**: If `Type` is `assignment`, the experience MUST define `Client` as a non-empty string.
- **FR-015**: If `Type` is not `assignment`, the experience MUST NOT define `Client`.
- **FR-016**: If `Type` is `education`, the `Title:` value in each language file MUST represent the exam/degree title (localized per language).
- **FR-018**: The system MUST validate `Period` as follows:
  - For `YYYYMM-YYYYMM`, both sides MUST be valid `YYYYMM` values and `toDate >= fromDate`.
  - For `YYYYMM-`, `YYYYMM` MUST be valid and the trailing hyphen MUST be present.
  - For `YYYY`, it MUST be exactly 4 digits.

#### Experience Summary Metadata (directory: `YYYYMM_<ExperienceName>_summary/`)

- **FR-019**: Each experience summary directory MUST follow the same rules as an experience directory except:
  - `Type` MUST NOT be `assignment`
  - `Client` MUST NOT be present

#### Ordering & Uniqueness

- **FR-020**: The system MUST treat the `YYYYMM` prefix as the directory’s sort key when ordering experiences (newer entries first).
- **FR-021**: The system MUST reject ambiguous inputs where two directories resolve to the same logical identity (same `YYYYMM` + same `<ExperienceName>` + same kind).

### Assumptions

- Both `en.txt` and `sv.txt` are required for each CV unit (no automatic fallback).
- The experience name segment is restricted to a conservative character set to keep paths stable.
- Titles are localized in `en.txt` and `sv.txt` (no single shared title field).

### Key Entities _(include if feature involves data)_

- **CVSummary**: Represents the overall CV header/summary; attributes: `role`, `titleEn`, `titleSv`, `descriptionEn`, `descriptionSv`.
- **Experience**: Represents a dated experience item; attributes: `id`, `startYYYYMM`, `name`, `type`, `organization`, `period`, `role`, `location`, `locationType`, `client?`, `titleEn`, `titleSv`, `descriptionEn`, `descriptionSv`.
- **ExperienceSummary**: Represents a dated summary entry for a non-assignment experience; same attributes as `Experience` except `client` is not allowed.
- **CVDirectoryValidationError**: A validation finding; attributes: `path`, `message`, `severity`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A maintainer can add a new experience by creating exactly one new directory under `specs-input/cv/` containing `meta.txt`, `en.txt`, and `sv.txt`, with no other required changes.
- **SC-002**: Validation detects and reports 100% of violations of all requirements in this spec with path-specific error messages.
- **SC-003**: When `specs-input/cv/` is valid, the build/validation step completes successfully with zero errors.
- **SC-004**: When `specs-input/cv/` is invalid, the build/validation step fails and reports at least one actionable error message per invalid directory.
