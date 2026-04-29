# Quickstart: FTP Deploy

**Feature**: 003-ftp-deploy

## Prerequisites

- Node.js installed (same version as main project)
- FTP credentials for your hosting provider
- The site builds successfully with `npm run export`

## Setup

### 1. Install dependencies

```bash
npm install --save-dev basic-ftp dotenv
```

### 2. Add FTP credentials to `.env.local`

```bash
# Add these lines to your existing .env.local
FTP_HOST=your-ftp-host
FTP_USER=your-ftp-username
FTP_PASS=your-ftp-password
FTP_REMOTE_DIR=/
```

### 3. Verify the build works

```bash
npm run export
ls out/  # Should contain index.html and other static files
```

## Deploy

### Deploy only (assumes site is already built)

```bash
npm run deploy
```

### Build and deploy in one step

```bash
npm run deploy:full
```

## Troubleshooting

| Problem                                           | Solution                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Missing required environment variable: FTP_HOST" | Add `FTP_HOST` to `.env.local`                                                       |
| Connection timeout                                | Check `FTP_HOST` hostname; verify the FTP server is accessible from your network     |
| Authentication failed                             | Verify `FTP_USER` and `FTP_PASS` with your hosting provider                          |
| "Build output directory not found"                | Run `npm run export` first, or use `npm run deploy:full`                             |
| FTPS handshake fails                              | Script falls back to plain FTP automatically; check server TLS settings if concerned |

## Verify Security Headers

After deploying, verify the security headers are served by Apache:

```bash
curl -I https://your-domain.se
```

Expected headers in response:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: accelerometer=(), camera=(), ...
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

If headers are missing, verify that `mod_headers` is enabled on your hosting (contact your hosting provider's support).

Also check the browser console for CSP violation errors — if any resources are blocked, update the CSP directives in `public/.htaccess`.
