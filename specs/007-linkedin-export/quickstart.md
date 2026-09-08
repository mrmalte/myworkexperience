# Quickstart: LinkedIn Export

**Feature**: 007-linkedin-export | **Date**: 2026-09-07

## Prerequisites

```bash
npm install                 # if not already installed
npm run content:check       # builds and validates public/content/site-content.json
```

`specs-input/linkedin/en.txt` and `sv.txt` must exist (created as part of this feature).

## Run

```bash
npm run linkedin:build
```

Expected: two files in `linkedin/`, a run log ending in `✓ LinkedIn build complete!`, and — with the
CV as it stands today — no over-limit warnings, since the largest block (Connected Table) sits at roughly 1 700 of 2 000 characters.

## Validation scenarios

Each maps to acceptance scenarios in [spec.md](spec.md). There is no automated test suite in this
repository; these are the manual checks.

### V1 — Both languages, complete structure (US1)

```bash
ls linkedin/
grep -c '^### ' linkedin/linkedin-en.md    # expect 23 (11 in-house + 8 client + 4 umbrella)
grep '^## ' linkedin/linkedin-sv.md         # expect Headline, About, Experience, Education, Skills, Unmatched
```

Expect `linkedin-en.md` and `linkedin-sv.md`, each with all six top-level sections and 23 numbered
position sections ordered newest first (Ikea INGKA/Fixa first, Axis last), with Visionite,
B3Skilled, Cybercom and Maltetech appearing as umbrella positions.

### V2 — Character counts and over-limit flags (US2)

```bash
grep -n ' / 2000' linkedin/linkedin-en.md   # every position description carries a count
grep -c '⚠' linkedin/linkedin-en.md         # 0 with today's content — nothing currently overflows
```

To exercise the flag itself, temporarily lower `LIMITS.position` in `tools/build-linkedin.ts` to
e.g. 900, re-run, and confirm that the affected headings gain ` ⚠ over by N`, that the closing
report lists them, that the exit code is still 0, and that no block was shortened — each must still
end in a complete sentence. Restore the limit afterwards.

### V3 — Assignment nesting, the three ambiguous employers (US3)

```bash
grep -A40 '^### .*Teleca' linkedin/linkedin-en.md
grep -A40 '^### .*Global Gaming' linkedin/linkedin-en.md
grep -A40 '^### .*Sony Ericsson' linkedin/linkedin-en.md
```

Expect, in the English file:

| Employment                                   | Must contain                                                     |
| -------------------------------------------- | ---------------------------------------------------------------- |
| Teleca `2006-09 – 2007-04`                   | SDP coder/parser, SMS Push, Windows Mobile — **not** Email Client |
| Teleca `2007-02 – 2007-04`                   | Email Client only                                                 |
| Global Gaming `2015-09 – 2017-06`            | Casino Site Web Application                                       |
| Global Gaming `2017-06 – 2019-04`            | ReactJS Casino Site                                               |
| Sony Ericsson `2004-01 – 2006-08`            | VideoShare Prototype                                              |
| Sony Ericsson `2007-05 – 2008-08`            | GPS Support in Symbian                                            |

Then confirm nothing is duplicated or lost:

```bash
grep -c '^• ' linkedin/linkedin-en.md       # expect 29 — 34 assignments minus the 5 single-assignment
                                            # client blocks, which carry their description in full
grep -A3 '^## Unmatched' linkedin/linkedin-en.md   # expect "None."
```

The Connected Table block must include the `Period: 2012` assignment (Poker Replay Client) — it is
the case that exercises the earliest-candidate fallback.

### V4 — Authored copy round-trip (US4)

```bash
# edit the headline in specs-input/linkedin/sv.txt, then:
npm run linkedin:build
head -20 linkedin/linkedin-sv.md
```

Expect the edited headline in the Headline block, with an updated character count, and the trailing
lines of `sv.txt` at the end of the About block.

Then break it deliberately:

```bash
mv specs-input/linkedin/sv.txt /tmp/ && npm run linkedin:build; mv /tmp/sv.txt specs-input/linkedin/
```

Expect exit code 1, a message naming `specs-input/linkedin/sv.txt`, and **no** files written or
modified in `linkedin/`.

### V5 — Not published, not committed (US1 scenario 5)

```bash
git status --short                  # no linkedin/ entries
ls public/ | grep -i linkedin       # expect no matches — nothing to copy into out/
ls out/ | grep -i linkedin          # expect no matches
grep -o 'rm -rf[^"]*' package.json  # clean covers linkedin/
```

`next build` copies `public/` into `out/`, so an export that never enters `public/` cannot reach the
site. Checking both listings is equivalent to a full rebuild and avoids regenerating the dated
PDF/DOCX files that the deployed `out/` currently references.

### V6 — Missing content build (edge case)

```bash
mv public/content/site-content.json /tmp/ && npm run linkedin:build; mv /tmp/site-content.json public/content/
```

Expect exit code 1 and the message pointing at `npm run content:build`, not a raw stack trace.

`npm run clean && npm run linkedin:build` exercises the same path, but clean also deletes the
generated PDFs and DOCX in `public/` and the built `out/`; regenerating them stamps today's date
into their filenames. Prefer the move above unless a full rebuild is wanted anyway.

## Using the output

Open `linkedin/linkedin-sv.md` (or `-en.md`) beside linkedin.com and copy one fenced block at a
time. Employers with two positions (Sinch, Global Gaming, Sony Ericsson, Teleca) must be added under
the *same* company on LinkedIn so it groups them; the header line above each block gives the values
for LinkedIn's own fields.
