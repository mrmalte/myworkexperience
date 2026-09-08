# Feature Specification: Base Path Deploy (Subdirectory Hosting)

**Feature Branch**: `006-base-path-deploy`  
**Created**: 2026-08-14  
**Status**: Draft  
**Input**: Move the deployed CV site from the domain root to a `/cv/` subdirectory on the Apache server, and place a redirect in the domain root so visitors to the bare domain land on the CV.

## Clarifications

### Session 2026-08-14

- Q: Should the root redirect cover only the bare domain, or should the whole old tree be redirected into `/cv/`? → A: Only the exact root, via `RedirectMatch 301 ^/$ /cv/`. Deep links from the old root layout (`/en/`, `/sv/technologies`) are allowed to 404 once the files are moved. The broader `RewriteRule` variant can be added later if server logs show it is needed; the two can coexist.
- Q: How is the base path applied — framework `basePath` or Apache alias/rewrite? → A: Framework `basePath`. An Apache alias was rejected because the framework emits root-absolute asset URLs (`/_next/*`) that would 404 regardless of how the HTML is served.
- Q: What happens to the files already deployed at the old root? → A: The maintainer migrates them manually as a one-time operation. Tooling does not manage the old root content.
- Q: Which artifact owns the root redirect file, given it is not part of the static export? → A: It is version-controlled in the repository but uploaded manually, and this spec records explicitly that the deploy tool does not manage it.
- Coverage update 2026-08-14 (post `/speckit-analyze`): US1 acceptance scenarios 4-5 broadened to cover both languages explicitly (previously English-only, while SC-003 already required both); scenario 2 and new scenario 8 now assert the active nav-link indicator; new scenario 7 covers the non-prefixed `/cv/contact` and `/cv/technologies` redirect stubs, which FR-006 requires but no prior scenario tested; SC-004 broadened to also rule out an accidentally doubled `/cv/cv/` prefix, closing the gap against the edge case already listed below.

### Session 2026-08-18

- Discovery from first production deploy: `FTP_REMOTE_DIR=/cv` (as documented in the original FR-011) uploaded successfully but to the wrong location — the FTP session's root on this hosting account is the shared account root (domains as sibling directories), not the domain's `public_html/`, so the upload landed outside the tree Apache serves and the live site kept showing stale pre-migration content. FR-011 corrected to state the requirement in terms of what it must resolve to (the filesystem location Apache serves as `/cv`) rather than asserting the literal string `/cv`, since that string is only correct by coincidence on hosts where the FTP root already is `public_html/`. See [research R7](research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse the site at its new location (Priority: P1)

As a site visitor, I want `https://malte.sarner.se/cv/` to load the CV with working navigation, styling and downloads, so that the move to a subdirectory is invisible to me.

**Why this priority**: If the site does not work at the new location there is nothing to redirect to. Everything else depends on this.

**Independent Test**: Deploy the built site into a `/cv/` subdirectory, open `/cv/` in a browser, and verify the page renders styled, navigation works in both languages (including the non-prefixed redirect stubs and the active nav-link indicator), and both download formats deliver a file in both languages.

**Acceptance Scenarios**:

1. **Given** the site is deployed under `/cv/`, **When** a visitor opens `/cv/`, **Then** they are taken to `/cv/en/` and the CV page renders with its stylesheet and scripts loaded successfully from under `/cv/`.
2. **Given** a visitor is on `/cv/en/`, **When** they click the Technologies link, **Then** they navigate to `/cv/en/technologies`, the page renders, and the Technologies nav link is shown active.
3. **Given** a visitor is on `/cv/en/`, **When** they switch to Swedish, **Then** they navigate to `/cv/sv/` and see Swedish content.
4. **Given** a visitor opens the download dropdown on `/cv/en/` or `/cv/sv/`, **When** they choose PDF, **Then** the browser downloads the PDF matching the active language rather than receiving a 404.
5. **Given** a visitor opens the download dropdown on `/cv/en/` or `/cv/sv/`, **When** they choose Word, **Then** the browser downloads the DOCX matching the active language rather than receiving a 404.
6. **Given** a visitor opens `/cv/en/does-not-exist`, **When** the page loads, **Then** the not-found page renders and its "go to home page" link points under `/cv/`.
7. **Given** a visitor opens `/cv/contact` or `/cv/technologies` (no language prefix), **When** the page loads, **Then** they are redirected to `/cv/en/contact` or `/cv/en/technologies` respectively — the non-prefixed redirect stubs continue to resolve under the base path (FR-006).
8. **Given** a visitor is on `/cv/sv/`, **When** they click the Technologies or Contact links, **Then** they navigate to `/cv/sv/technologies` and `/cv/sv/contact` respectively, with the correct nav link shown active in each case.

---

### User Story 2 - Reach the site from the bare domain (Priority: P1)

As a site visitor who types the domain without a path, I want to be taken to the CV automatically, so that the bare domain is not a dead end.

**Why this priority**: The bare domain is the address people type, share and remember. Without this, moving the site makes it unreachable by its best-known URL.

**Independent Test**: Request the bare domain with redirects disabled and confirm a single 301 to `/cv/`; then request `/cv/` and confirm it does not redirect again.

**Acceptance Scenarios**:

1. **Given** the root redirect is in place, **When** a client requests `https://malte.sarner.se/`, **Then** the server responds `301` with `Location: /cv/`.
2. **Given** the root redirect is in place, **When** a client requests `https://malte.sarner.se/cv/`, **Then** the server responds `200` and does **not** issue a further redirect.
3. **Given** a client follows the redirect chain from the bare domain, **When** the chain completes, **Then** it terminates after a single hop — no redirect loop occurs.

---

### User Story 3 - Deploy to the subdirectory (Priority: P2)

As a site maintainer, I want the deploy command to upload into the subdirectory and maintain stale files there, so that deploying does not require manual steps beyond the one-time migration.

**Why this priority**: Deployment already supports a configurable remote directory, so this is largely configuration — but it must be verified, since the stale-file cleanup has to operate in the new location too.

**Independent Test**: Run the deploy with the remote directory set to the subdirectory and confirm files appear under `/cv` on the server and that stale PDF/DOCX files in `/cv` are removed.

**Acceptance Scenarios**:

1. **Given** the remote directory is configured as `/cv`, **When** the deploy runs, **Then** the build output is uploaded into `/cv` preserving directory structure.
2. **Given** stale `cv-*.pdf` or `cv-*.docx` files exist in `/cv`, **When** the deploy runs, **Then** those stale files are removed from `/cv` and current ones are kept.
3. **Given** the deploy completes, **When** the maintainer inspects the domain root, **Then** the root redirect file is untouched by the deploy.

### Edge Cases

- A visitor follows an old deep link (`/en/`, `/sv/technologies`) after the files have been migrated. The request 404s. This is accepted per the clarification above; it is not a defect.
- The root redirect file lives outside the static export, so a deploy can never create, update or delete it. It must be uploaded manually.
- The security-headers `.htaccess` shipped in `public/` lands at `/cv/.htaccess` and governs the `/cv/` subtree only. The domain root is not covered by it.
- The base path is applied twice (e.g. a link already carrying `/cv` is prefixed again), producing `/cv/cv/…`.
- The site is later moved to a different subdirectory or back to the root, requiring the base path to change in exactly one place.

## Requirements _(mandatory)_

**Constitution alignment (mandatory)**

- The delivered product MUST remain deployable as static assets: plain HTML, CSS and JavaScript. The base path is build-time configuration and introduces no server runtime.
- Custom build tooling MUST remain TypeScript.
- CV source material under `specs-input/cv/` remains the source of truth and is unaffected by this feature.

### Functional Requirements

#### Base Path in the Build

- **FR-001**: The static export MUST be built with a deployment base path, so that all framework-generated URLs — routes, `_next/*` assets, stylesheets and scripts — resolve under that path.
- **FR-002**: The deployment base path for this site MUST be `/cv`.
- **FR-003**: Anchor elements that are deliberately **not** client-side navigation components MUST include the base path explicitly. This applies to the PDF and Word download links, which [004 FR-013](../004-pdf-download/spec.md) and [005 FR-013](../005-docx-download/spec.md) require to be standard anchors with a `download` attribute. Framework base path handling does not apply to raw anchors, so without an explicit prefix these links resolve against the domain root and 404 while the rest of the site works.
- **FR-004**: The base path MUST be defined in a single place and referenced from every usage site. It MUST NOT be repeated as a literal at each link.
- **FR-005**: Active-page detection in the navigation MUST continue to work unchanged. It compares the current pathname, which excludes the base path, so no base-path handling belongs in that comparison.
- **FR-006**: The language-prefixed routes and the non-prefixed redirect routes defined in [002 FR-007/FR-008](../002-cv-website-pages/spec.md) MUST continue to function, resolving relative to the base path rather than the domain root.

#### Root Redirect

- **FR-007**: The domain root MUST issue a permanent (`301`) redirect to the base path.
- **FR-008**: The root redirect MUST match **only** the exact root URL. A prefix-matching redirect MUST NOT be used, because the base path itself begins with the root prefix and would match its own redirect target, producing an infinite loop. The required directive is:

  ```apache
  RedirectMatch 301 ^/$ /cv/
  ```

- **FR-009**: The root redirect configuration MUST be version-controlled in the repository, even though it is uploaded to the server manually.
- **FR-010**: The root redirect file MUST NOT be part of the static export (`out/`). This spec records that the deploy tool neither creates, updates nor deletes it — placing and maintaining it is a manual operation.

#### Deployment

- **FR-011**: The deploy remote directory MUST resolve, on the FTP server, to the filesystem location Apache serves as `/cv` under the domain. This is **not** necessarily the literal string `/cv` — `FTP_REMOTE_DIR` (the existing environment variable defined in [003 FR-002](../003-ftp-deploy/spec.md)) is a filesystem path relative to the FTP session's own root, which is a separate namespace from the site's URL base path (FR-002). On this account, the FTP session's root is the shared hosting account root rather than the domain's `public_html/`, so the correct value is `/malte.sarner.se/public_html/cv`. See [research R7](research.md#r7-ftp_remote_dir-is-a-filesystem-path-not-the-sites-url-path).
- **FR-012**: The stale PDF and DOCX cleanup performed during deploy MUST operate in the configured remote directory, so that it maintains the correct server-side `/cv` location rather than the domain root.
- **FR-013**: Migration of files already deployed at the old domain root is a one-time manual operation and is explicitly out of scope for tooling.
- **FR-014**: Documentation (README and the deploy quickstart) MUST state the configured remote directory value, so the subdirectory layout is discoverable without reading the server.

### Key Entities _(include if feature involves data)_

- **Base path**: The URL path prefix under which the whole site is served (`/cv`). Applied at build time; excluded from the pathname the application observes at runtime.
- **Root redirect**: An Apache directive at the domain root that sends the bare domain to the base path. Lives outside the build output and outside the deploy tool's control.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Opening `/cv/` loads the CV page with every stylesheet, script and font request returning a success status — no asset requests 404.
- **SC-002**: Requesting the bare domain returns a single `301` to `/cv/`, and requesting `/cv/` returns `200` without a further redirect. The chain never loops.
- **SC-003**: In both languages, the PDF and the Word download links deliver the file rather than a 404.
- **SC-004**: The built output contains no root-absolute URL that lacks the base path prefix, and no URL where the prefix is accidentally duplicated — verified by inspecting `out/` for `"/_next/` and `"/cv-` occurrences without the prefix, and for any `"/cv/cv/` occurrence.
- **SC-005**: Running the deploy places files under `/cv` on the server and performs stale-file cleanup in `/cv`, leaving the domain root untouched.
- **SC-006**: Navigating between all three pages and both languages produces only URLs beginning with `/cv/`.
