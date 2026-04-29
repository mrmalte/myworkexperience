# Feature Specification: FTP Deploy

**Feature Branch**: `003-ftp-deploy`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: Deploy the static Next.js site via FTP. Add a deploy script that uploads the built static output to an FTP server, with credentials managed via environment variables.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Deploy site with a single command (Priority: P1)

As a site maintainer, I want to deploy the built static site to my FTP hosting by running a single command so that the live site is updated without manual FTP file transfers.

**Why this priority**: This is the core value of the feature — without a working deploy command, no other deployment stories matter.

**Independent Test**: Build the site, run the deploy command with valid FTP credentials, and verify that the live site reflects the latest build.

**Acceptance Scenarios**:

1. **Given** the static site has been built (output directory exists), **When** the maintainer runs the deploy command, **Then** all files from the build output are uploaded to the configured FTP server and the site is accessible.
2. **Given** the static site has been built, **When** the maintainer runs the deploy command, **Then** the command outputs progress information showing which files are being uploaded.
3. **Given** the deploy completes successfully, **When** the maintainer visits the live site, **Then** the content matches the local build.

---

### User Story 2 - Credentials managed via environment variables (Priority: P1)

As a site maintainer, I want FTP credentials stored in environment variables (not hardcoded) so that sensitive information is kept out of version control and can be configured per environment.

**Why this priority**: Security is non-negotiable — credentials must never be committed to the repository.

**Independent Test**: Remove or alter the FTP credential environment variables and confirm the deploy command refuses to run, displaying a clear error about missing credentials.

**Acceptance Scenarios**:

1. **Given** all required FTP environment variables are set, **When** the deploy command runs, **Then** it connects to the FTP server using those credentials.
2. **Given** one or more required FTP environment variables are missing, **When** the deploy command runs, **Then** it exits immediately with a clear error message naming the missing variable(s).
3. **Given** FTP credentials are set in `.env.local`, **When** the deploy command runs, **Then** it reads credentials from that file.

---

### User Story 3 - Build-and-deploy in one step (Priority: P2)

As a site maintainer, I want a combined command that builds the site and then deploys it so that I don't have to remember to run two separate commands.

**Why this priority**: Convenience and reduced risk of deploying stale content.

**Independent Test**: Run the combined build-and-deploy command and verify the site is rebuilt and uploaded in a single invocation.

**Acceptance Scenarios**:

1. **Given** site content has changed, **When** the maintainer runs the combined build-and-deploy command, **Then** the site is rebuilt and the fresh output is uploaded to the FTP server.
2. **Given** the build step fails, **When** the combined command runs, **Then** the deploy step is skipped and the error is reported.

---

### User Story 4 - Clear upload to a specific remote directory (Priority: P2)

As a site maintainer, I want to configure which remote directory on the FTP server receives the uploaded files so that the site is deployed to the correct web root.

**Why this priority**: FTP accounts may host multiple domains or subdirectories; deploying to the wrong path would break the site.

**Independent Test**: Set the remote directory environment variable to a specific path, run deploy, and verify files appear in that directory on the server.

**Acceptance Scenarios**:

1. **Given** a remote directory is configured via environment variable, **When** the deploy runs, **Then** files are uploaded to that specific directory.
2. **Given** no remote directory is configured, **When** the deploy runs, **Then** files are uploaded to a sensible default (root `/`).

---

### Edge Cases

- What happens when the FTP connection is interrupted mid-upload? The deploy should report the error clearly and exit with a non-zero status code.
- What happens when the build output directory does not exist? The deploy should exit with a clear error before attempting FTP connection.
- What happens when the FTP server rejects the credentials? The deploy should report an authentication failure and exit with a non-zero status code.
- What happens when the remote directory does not exist? The deploy should create it automatically or report a clear error.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The project MUST provide a deploy command (npm script) that uploads the contents of the static build output directory to a remote FTP server.
- **FR-002**: The deploy command MUST read FTP connection details from environment variables: host, username, password, and optionally a remote directory path.
- **FR-003**: The deploy command MUST load environment variables from `.env.local` when present, consistent with the existing project convention.
- **FR-004**: The deploy command MUST validate that all required FTP environment variables are present before attempting a connection, and exit with a descriptive error if any are missing.
- **FR-005**: The deploy command MUST display progress output during upload so the maintainer knows the deploy is running and which files are being transferred.
- **FR-006**: The deploy command MUST exit with a non-zero status code on any failure (missing credentials, connection error, upload error).
- **FR-007**: The project MUST provide a combined build-and-deploy command that first builds the static site and then deploys, stopping if the build fails.
- **FR-008**: The deploy command MUST upload the entire contents of the build output directory, preserving the directory structure on the remote server.
- **FR-009**: The deploy command MUST use a secure connection (FTPS/TLS) when supported by the server, falling back to plain FTP only if FTPS is unavailable.
- **FR-010**: FTP credentials MUST NOT be hardcoded in any source file or committed to version control.
- **FR-011**: The project MUST include a `.htaccess` file in the `public/` directory that sets the following security response headers on the Apache 2.4 server:
  - `X-Frame-Options: DENY` — prevent clickjacking.
  - `X-Content-Type-Options: nosniff` — prevent MIME type sniffing.
  - `Strict-Transport-Security` with `max-age=31536000; includeSubDomains` — enforce HTTPS.
  - `Referrer-Policy: strict-origin-when-cross-origin` — control referrer leakage.
  - `Permissions-Policy` disabling unused device APIs (camera, microphone, etc.).
  - `Content-Security-Policy` with the following directives: `default-src 'self'`; `script-src 'self'`; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `font-src 'self' https://fonts.gstatic.com`; `img-src 'self' data:`; `connect-src 'self' https://api.emailjs.com`; `object-src 'none'`; `base-uri 'self'`; `frame-src 'none'`; `frame-ancestors 'none'`; `upgrade-insecure-requests`. See [research.md R7](research.md) for rationale.
- **FR-012**: The `.htaccess` file MUST be included in the static export output (placed in `public/` so Next.js copies it to `out/` during build).

### Key Entities

- **Build Output**: The static site files generated by the build step (HTML, CSS, JS, assets). Located in the project's configured output directory.
- **FTP Credentials**: Host, username, password, and remote path. Stored exclusively in environment variables / `.env.local`.
- **Deploy Script**: The automation that connects to the FTP server and transfers the build output.

## Assumptions

- The hosting account supports FTP or FTPS connections.
- The static site build step (`npm run export`) produces a complete, self-contained output directory (currently `out/`).
- The maintainer has an FTP account with write access to the target web root.
- The `.env.local` file is already listed in `.gitignore` (established project convention from EmailJS credentials).
- Plain FTP is acceptable as a fallback since some shared hosting may have limited FTPS support, but FTPS should be attempted first.
- The Apache 2.4 hosting has `mod_headers` enabled and allows `AllowOverride FileInfo` in `.htaccess`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A site maintainer can deploy the full site via FTP in under 5 minutes using a single command.
- **SC-002**: The deploy command correctly reports success or failure with clear, actionable output messages.
- **SC-003**: No credentials are present in any committed file in the repository.
- **SC-004**: The live site content matches the local build output after a successful deploy.
- **SC-005**: A fresh contributor can configure and run their first deploy by following the project README instructions alone.
- **SC-006**: After deployment, HTTP response headers include `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, and `Permissions-Policy` as configured in `.htaccess`.
