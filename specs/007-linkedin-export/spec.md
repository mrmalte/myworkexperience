# Feature Specification: LinkedIn Export

**Feature Branch**: `007-linkedin-export`  
**Created**: 2026-09-07  
**Status**: Draft  
**Input**: Generate LinkedIn-ready profile text in English and Swedish from the CV content model, shaped to LinkedIn's fields (headline, About, one Experience entry per employment with assignments as bullets, Education, Skills) and its character limits, written to a git-ignored `linkedin/` directory. LinkedIn has no usable write API for profiles, so the output is paste-ready plain text, not an integration.

## Clarifications

### Session 2026-09-07

- Q: Can the profile be updated programmatically instead of by hand? → A: No. LinkedIn's Profile Edit API can write `headline`, `summary` and `positions`, but it requires the private `w_compliance` permission and is documented as "restricted to those developers approved by LinkedIn" — a partner-only gate. The publicly obtainable scopes (`openid`, `profile`, `w_member_social`) read the profile and post shares; they cannot edit it. Driving the web UI with a browser automation tool instead would violate LinkedIn's User Agreement. The feature therefore produces text for the maintainer to paste, and performs no network access of any kind.
- Q: Where does the generated text live? → A: A `linkedin/` directory at the repository root — outside `public/`, so it is neither part of the static export nor uploaded by the deploy tool. It is git-ignored like the other generated artifacts and removed by the clean step.
- Q: Headline text is not derivable from the CV — where does it come from? → A: A new authored source pair under `specs-input/`, one file per language, holding the headline plus an optional tail appended to the About section (a stack line and a link back to the CV site). This keeps `specs-input/` the source of truth for all authored copy, including copy that only LinkedIn uses.
- Q: Assignment descriptions are long enough that one employment's assignments can exceed LinkedIn's per-position limit on their own — truncate or warn? → A: Include only the first paragraph of each assignment description, and report the character count with a warning when a block still exceeds the limit. The maintainer trims the remainder by judgement; the tool never silently cuts text mid-sentence.

### Session 2026-09-07 (second session, after comparing with the live profile)

- Q: The live profile uses the **client** as the company (Ikea INGKA, Tetra Pak, SenseNode, Sigma Connectivity, Skatteverket) with the employer as a separate umbrella entry, while the export used the employer. Which structure wins? → A: The client-as-company structure the profile already uses. It keeps the client brands in the company field where recruiters search, and it avoids rebuilding thirteen existing positions by hand. The employer is not lost: each consultancy employment still gets an umbrella position covering its period.
- Q: Does that mean one position per assignment? → A: No. Only for consultancy work. In-house employments keep one position per employment with the assignments as bullets — one position per assignment would turn Connected Table's five assignments into five LinkedIn positions. Consecutive assignments at the same client under the same employer merge into one position spanning them.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refresh the profile from the current CV (Priority: P1)

As the CV maintainer, I want the LinkedIn text regenerated from the same source that produces the
website, PDF and DOCX, so that updating my profile is a matter of pasting current text rather than
rewriting it from memory and hoping it matches.

**Why this priority**: This is the feature. Without it the profile drifts from the CV, which is
exactly the situation that prompted the work.

**Independent Test**: Run the export after a content build and confirm both language files contain
complete, paste-ready text for every LinkedIn field, matching the CV content.

**Acceptance Scenarios**:

1. **Given** the content build has run, **When** the maintainer runs the export, **Then** one file per language is produced, each containing a Headline, an About section, an Experience section, an Education section and a Skills section.
2. **Given** the export has run, **When** the maintainer opens either file, **Then** every employment entry is represented — an in-house employment as one block, a consultancy employment as an umbrella block plus one block per client — with all blocks ordered newest first.
3. **Given** an Experience block, **When** the maintainer reads its header, **Then** it states the title, company, period, location and location type — the values LinkedIn's own form asks for.
4. **Given** a CV entry is edited and the content build re-run, **When** the export is run again, **Then** the change is reflected in both language files with no hand-editing of generated output.
5. **Given** the export has run, **When** the maintainer inspects the repository, **Then** the generated files are absent from version control and absent from the published site.

---

### User Story 2 - Know what will not fit before pasting (Priority: P1)

As the CV maintainer, I want each field measured against LinkedIn's character limits before I paste,
so that I discover an over-long section here rather than by having LinkedIn silently reject or
truncate it.

**Why this priority**: Pasting text that does not fit is the most likely way this feature fails in
practice, and it fails invisibly. The CV's assignment descriptions in full would exceed the
per-position limit several times over, so the margin the export runs on is worth seeing.

**Independent Test**: Run the export against the current CV and confirm every limited field carries
a character count; lower the per-position limit temporarily to confirm that exceeding it flags the
block rather than shortening it.

**Acceptance Scenarios**:

1. **Given** the export has run, **When** the maintainer reads a limited field, **Then** its character count and the applicable limit are shown next to it.
2. **Given** a block exceeds its limit, **When** the maintainer reads the file, **Then** the block is visibly flagged as over-limit rather than silently truncated.
3. **Given** one or more blocks exceed their limits, **When** the export finishes, **Then** the run reports every over-limit block so the maintainer sees them without reading the whole file.

---

### User Story 3 - Assignments land under the right employment (Priority: P1)

As the CV maintainer, I want each consultancy assignment to appear as a bullet under the employment
it was performed during, so that the profile reads the way LinkedIn expects — employers as
positions, client work described inside them.

**Why this priority**: LinkedIn has no separate level for consultancy assignments; getting the
nesting wrong either duplicates work across two positions or drops it. Three employers in this CV
have two overlapping employment entries each, so a naive match by organization alone is provably
wrong.

**Independent Test**: Run the export and check the three employers with two employment entries —
each assignment appears under exactly one of the two, chosen by period.

**Acceptance Scenarios**:

1. **Given** an in-house employment with assignments, **When** the maintainer reads its Experience block, **Then** each assignment appears as one bullet naming the assignment and its own period.
1b. **Given** a consultancy employment, **When** the maintainer reads the export, **Then** each of its clients has a block of its own with the client as the company, and the employer has an umbrella block covering the employment period.
2. **Given** an employer with two consecutive or overlapping employment entries, **When** the export runs, **Then** each assignment is attributed to exactly one of them — the one whose period best contains the assignment's start — and never to both.
2b. **Given** two assignments at the same client under the same employer, **When** the export runs, **Then** they merge into one client block spanning both, with one bullet each.
3. **Given** an assignment that matches no employment entry, **When** the export runs, **Then** it is listed under an explicit "unmatched" heading rather than being dropped.
4. **Given** an employment with no assignments, **When** the export runs, **Then** its Experience block still renders, carrying its own description.
5. **Given** an assignment carries a technology list, **When** the maintainer reads its bullet, **Then** the technologies are shown with it.

---

### User Story 4 - Author the LinkedIn-only copy in the source tree (Priority: P2)

As the CV maintainer, I want the headline and the closing lines of the About section authored
alongside the CV content, so that they are versioned, bilingual and not lost the next time the
export is regenerated.

**Why this priority**: Everything else derives from existing CV content; this is the one piece of
copy that has nowhere else to live. Without it the headline would have to be re-invented on every
update, which is the drift the feature exists to remove.

**Independent Test**: Edit the authored source, re-run the export, and confirm the change appears in
the generated Headline and at the end of the About section for that language.

**Acceptance Scenarios**:

1. **Given** the authored source exists for both languages, **When** the export runs, **Then** each language file's Headline comes from that language's source.
2. **Given** the authored source contains lines after the headline, **When** the export runs, **Then** those lines are appended verbatim to the end of the About section for that language.
3. **Given** the authored source is missing or malformed, **When** the export runs, **Then** it fails with a message naming the expected file and the expected format, and writes no partial output.

---

### Edge Cases

- **Two employments at the same organization with overlapping periods** — Teleca, Global Gaming and Sony Ericsson each have two. Assignment placement must be decided by period, not organization alone, and must be stable across runs.
- **An assignment whose period extends beyond its employment's end** — occurs in the current CV. The assignment must still be placed, and its own period reported as authored.
- **An ongoing employment with no end date** — the current Visionite entry. The period must render with the same "present" wording the other renderers use, in the right language.
- **An entry with an empty technology list** — the employment summary entries have none. No empty "Tech:" line may be emitted.
- **A block that exceeds its limit even after only first paragraphs are used** — no block does with the CV as it stands (the largest, Connected Table, sits at ~1 700 of 2 000), but the CV grows. When it happens the block must be flagged, not truncated.
- **The content build has not been run** — the export must fail with the same "run the content build first" guidance the other renderers give, not with a missing-file stack trace.
- **A stale export left from a previous run** — re-running must leave no output from a prior run that no longer corresponds to current content.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST generate LinkedIn-ready profile text in both English and Swedish from the same compiled CV content that produces the website, PDF and DOCX.
- **FR-002**: The system MUST emit, per language, a Headline, an About section, an Experience section, an Education section and a Skills section.
- **FR-003**: The system MUST emit Experience blocks ordered newest first, each headed by the title, company, period, location and location type, using the client as the company for consultancy work and the employer as the company for in-house work.
- **FR-004**: The system MUST place each assignment in exactly one Experience block and MUST NOT emit any assignment more than once. In-house assignments become bullets in their employment's block; consultancy assignments group by client into a client block, with several assignments at the same client merged into one block spanning them.
- **FR-005**: The system MUST list any assignment that matches no employment under an explicit "unmatched" heading.
- **FR-006**: Each assignment bullet MUST name the assignment, its own period, the opening paragraph of its description, and its technologies when it has any. It MUST name the client too when the client differs from the employer, and MUST NOT repeat the employer as a client for in-house work.
- **FR-007**: The system MUST read the headline and the About tail for each language from an authored source under `specs-input/`, and MUST fail with a clear, path-naming message when that source is missing or malformed.
- **FR-008**: The About section MUST consist of the CV summary for that language followed by that language's authored tail.
- **FR-009**: The system MUST emit a skills list capped at LinkedIn's maximum of 50, ordered so that the most recent work leads and the CV's own ordering within an entry is preserved, and MUST additionally suggest up to five skills per Experience block drawn from that employment's own work.
- **FR-010**: The system MUST report the character count and the applicable limit for every field LinkedIn limits — headline, About, and each Experience description — and MUST flag any that exceeds its limit.
- **FR-011**: The system MUST NOT truncate content to fit a limit.
- **FR-012**: The pasteable text MUST be plain text using only characters LinkedIn's fields accept, with no markup that would paste literally.
- **FR-013**: The system MUST write its output outside the published site, MUST NOT include it in version control, and the clean step MUST remove it.
- **FR-014**: Re-running the export MUST be deterministic for unchanged input and MUST leave no stale output from a previous run.
- **FR-015**: The system MUST fail with actionable guidance when the compiled CV content is absent.
- **FR-016**: The system MUST NOT perform any network access, and MUST NOT attempt to write to LinkedIn.
- **FR-017**: The system MUST emit an umbrella Experience block for every consultancy employment, covering the employment period and marked as such, so that the employment history stays complete alongside the client blocks.

### Key Entities

- **Experience block**: One employment, as LinkedIn models a position — title, company, period, location, location type, description, and the assignments performed during it.
- **Assignment bullet**: One engagement rendered inside an Experience block — assignment name, client where it differs from the employer, period, opening description paragraph, technologies.
- **Authored LinkedIn copy**: Per language, the headline and the lines appended to About; the only copy in this feature not derived from existing CV content.
- **Limit report**: Per limited field, its character count, its limit, and whether it exceeds it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The maintainer can produce complete paste-ready text for both profile languages with a single command, in under a minute, without editing generated output.
- **SC-002**: 100% of employment entries are represented among the Experience blocks, and 100% of assignments appear in exactly one block — as a bullet, as a client block's own description, or under the unmatched heading.
- **SC-003**: Every field LinkedIn limits carries a character count in the output, and every over-limit block is flagged both in the file and in the run's closing report.
- **SC-004**: A change to CV content is reflected in both language files after re-running the content build and the export, with no other manual step.
- **SC-005**: Generated LinkedIn output never appears in version control and is never reachable on the published site.
- **SC-006**: The export completes without network access, so it works offline and cannot affect the live profile.

## Assumptions

- LinkedIn profiles cannot be updated programmatically with the access an individual can obtain; pasting into LinkedIn's own forms is the only supported path, and this feature stops at producing the text.
- LinkedIn's current field limits are 220 characters for the headline, 2 600 for About, 2 000 for a position description, and 50 skills. These are treated as configuration in one place, since LinkedIn changes them from time to time.
- Using only the opening paragraph of each assignment description keeps most blocks within the per-position limit; where it does not, the maintainer trims by judgement.
- The two languages map to LinkedIn's primary profile plus one secondary-language profile. LinkedIn shares dates, skills and education across both, so only the text fields differ — which is why both files carry the same structure.
- The CV's `Type: Employee` entries correspond to LinkedIn positions and `Type: Assignment` entries do not; this mapping is stable and is what makes generation possible.
- No automated test suite exists in this repository; verification is the manual acceptance scenarios above, in line with the existing features.

## Post-implementation notes (2026-09-07)

- FR-006 and FR-009 were corrected after implementation to match decisions
  [R8](research.md#r8-ordering-the-skills-list) and
  [R9](research.md#r9-which-field-becomes-linkedins-position-title): skills follow the CV's own
  ordering rather than a computed weight, and an assignment bullet names the client only when it
  differs from the employer.
- The CV holds 16 employment entries and 34 assignments, which the client-as-company structure
  renders as 23 LinkedIn positions: 11 in-house, 8 client and 4 umbrella. No block currently exceeds
  a LinkedIn limit; the over-limit path in US2 is exercised by temporarily lowering the per-position limit, as
  described in [quickstart.md](quickstart.md).
