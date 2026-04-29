# Data Model: FTP Deploy

**Feature**: 003-ftp-deploy
**Date**: 2026-04-22

## Entities

### FTP Configuration

Represents the connection parameters for the deploy target.

| Field     | Type    | Required | Source                   | Description                                   |
| --------- | ------- | -------- | ------------------------ | --------------------------------------------- |
| host      | string  | Yes      | `FTP_HOST` env var       | FTP server hostname                           |
| user      | string  | Yes      | `FTP_USER` env var       | FTP username                                  |
| password  | string  | Yes      | `FTP_PASS` env var       | FTP password                                  |
| remoteDir | string  | No       | `FTP_REMOTE_DIR` env var | Remote directory (default: `/`)               |
| secure    | boolean | Implicit | Derived                  | Use FTPS (true by default, fallback to false) |

**Validation rules**:

- `host`, `user`, `password` must be non-empty strings
- `remoteDir` must start with `/` if provided
- Validation happens before any FTP connection is attempted

### Build Output

Represents the local directory to be uploaded.

| Field | Type   | Required | Source    | Description                              |
| ----- | ------ | -------- | --------- | ---------------------------------------- |
| path  | string | Yes      | Hardcoded | Path to static output directory (`out/`) |

**Validation rules**:

- Directory must exist on disk
- Directory must not be empty
- Validated before FTP connection is attempted

### Deploy Result

Represents the outcome of a deploy operation (not persisted — logged to stdout).

| Field         | Type           | Description                                 |
| ------------- | -------------- | ------------------------------------------- |
| filesUploaded | number         | Count of files successfully transferred     |
| duration      | number         | Total deploy time in seconds                |
| success       | boolean        | Whether the deploy completed without errors |
| error         | string \| null | Error message if deploy failed              |

## State Transitions

```
[idle] → validate config → [config valid]
                         → [config invalid] → EXIT(1)

[config valid] → validate build output → [output valid]
                                       → [output missing] → EXIT(1)

[output valid] → connect FTPS → [connected]
                              → fallback plain FTP → [connected]
                                                   → [connection failed] → EXIT(1)

[connected] → upload files → [deploy complete] → close → EXIT(0)
                           → [upload error] → close → EXIT(1)
```

## Relationships

- FTP Configuration is read once at script startup from environment
- Build Output is validated once before connection
- Deploy Result is computed during upload and reported at exit
- Security Headers Configuration is a static file deployed alongside the build output
- No persistent storage; all state is ephemeral within a single script run

### Security Headers Configuration

Represents the Apache `.htaccess` file that configures HTTP response headers on the server.

| Directive                 | Value                                 | Purpose                     |
| ------------------------- | ------------------------------------- | --------------------------- |
| X-Frame-Options           | `DENY`                                | Prevent clickjacking        |
| X-Content-Type-Options    | `nosniff`                             | Prevent MIME sniffing       |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | Enforce HTTPS for 1 year    |
| Referrer-Policy           | `strict-origin-when-cross-origin`     | Control referrer leakage    |
| Permissions-Policy        | `accelerometer=(), camera=(), ...`    | Disable unused browser APIs |
| Content-Security-Policy   | See CSP breakdown below               | Restrict resource loading   |

**CSP directive breakdown**:

| CSP Directive   | Value                                                 | Reason                           |
| --------------- | ----------------------------------------------------- | -------------------------------- |
| default-src     | `'self'`                                              | Baseline: only same-origin       |
| script-src      | `'self'`                                              | All JS bundled by Next.js        |
| style-src       | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Tailwind CSS + Google Fonts CSS  |
| font-src        | `'self' https://fonts.gstatic.com`                    | Google Fonts files               |
| img-src         | `'self' data:`                                        | Local images + data URIs         |
| connect-src     | `'self' https://api.emailjs.com`                      | EmailJS runtime API calls        |
| object-src      | `'none'`                                              | Block plugins                    |
| base-uri        | `'self'`                                              | Prevent base tag injection       |
| frame-src       | `'none'`                                              | No iframes used                  |
| frame-ancestors | `'none'`                                              | Prevent embedding (clickjacking) |

**Location**: `public/.htaccess` → copied to `out/.htaccess` during `next build`  
**Dependencies**: Requires Apache `mod_headers` module (wrapped in `<IfModule>` for graceful degradation)
