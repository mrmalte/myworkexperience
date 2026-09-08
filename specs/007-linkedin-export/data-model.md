# Data Model: LinkedIn Export

**Feature**: 007-linkedin-export | **Date**: 2026-09-07

No persisted data and no change to `site-content.json`. The entities below are in-memory shapes
inside `tools/build-linkedin.ts`, plus one new authored file format.

## Inputs

### 1. `site-content.json` (existing, unchanged)

The tool declares a local subset of the interface, exactly as `tools/build-docx.ts` does, and reads:

| Path                        | Used for                                                    |
| --------------------------- | ----------------------------------------------------------- |
| `person.name`               | Document header                                             |
| `cv.summary[lang]`          | About section, first part                                    |
| `cv.roles[]`                | One Experience block each (already sorted newest first)      |
| `cv.assignments[]`          | Bullets nested into the matching Experience block            |
| `cv.education[]`            | Education section                                            |
| `ui.cv.present[lang]`       | "Present" / "Nu" wording in open-ended periods               |
| `ui.pdf.date`               | Generation date in the document header                       |

`CVEntry` fields consumed: `id`, `period.{start,end}`, `organization`, `client`, `role`, `location`,
`locationType`, `title[lang]`, `description[lang]`, `technologies[]`.

### 2. `specs-input/linkedin/{en,sv}.txt` (new authored format)

```text
Headline: <single line, ≤ 220 characters>

<optional free text, appended verbatim to the end of About>
```

**Rules**

- First non-empty line MUST match `/^headline\s*:\s*(.+)$/i` with a non-empty value.
- Everything after that line is the About tail, trimmed; may be empty.
- Both language files MUST exist. A missing or malformed file is a hard error naming the path and
  the expected first line (FR-007), and no output is written.
- Same spirit as `specs-input/cv/*/en.txt` (`Title: …` + body), but deliberately parsed locally —
  see [research R5](research.md#r5-where-does-the-headline-come-from).

## Derived entities

### `Block`

One LinkedIn position. Three kinds, decided per employment by whether its assignments name a client
other than the employer ([R10](research.md#r10-client-as-company-not-employer)):

| Kind | When | Company | Title | Description |
| --- | --- | --- | --- | --- |
| `in-house` | no assignment has a different client | the employer | the employment's title | employment description + one bullet per assignment |
| `client` | consultancy assignments, grouped by client | the client | `{newest assignment title} - {role}` | the assignment description in full when the group holds one; bullets when it holds several |
| `umbrella` | one per consultancy employment | the employer | the employment's title | the employment description, marked as an umbrella |

A client block spans from the earliest assignment start in its group to the latest end. Blocks are
ordered newest first by start, then by end.

### `AssignmentBullet`

| Field          | Source                                          | Notes                                              |
| -------------- | ----------------------------------------------- | -------------------------------------------------- |
| `label`        | `CVEntry.client` + `CVEntry.title[lang]`        | `{client} — {title}` when the client differs from the employer, `{title}` alone for in-house work |
| `period`       | `CVEntry.period` formatted                      | The assignment's own period, not the employment's   |
| `summary`      | first paragraph of `CVEntry.description[lang]`  | Split on `\n`, first non-empty line ([R4](research.md#r4-what-goes-into-an-experience-block-given-linkedins-2000-character-limit)) |
| `technologies` | `CVEntry.technologies`                          | Omitted entirely when empty                         |

### `PeriodKey`

Comparable form of a period boundary, used for matching and ordering only.

- `start` → `YYYYMM`; a 4-character `YYYY` becomes `YYYY01`.
- `end` → `YYYYMM`; a 4-character `YYYY` becomes `YYYY12`; `null` (ongoing) becomes `999999`.
- Comparison is plain string comparison. See [R3](research.md#r3-period-comparison-across-the-two-period-formats).

### `LimitReport`

| Field       | Notes                                                        |
| ----------- | ------------------------------------------------------------ |
| `label`     | `Headline`, `About`, or the employment's `title @ company`    |
| `count`     | Characters in the rendered paste block                        |
| `limit`     | 220 / 2 600 / 2 000                                           |
| `exceeded`  | `count > limit` — flags the block in-file and in the run log  |

## Matching rules (FR-004, FR-005)

For each assignment `a`:

1. `candidates` = employments whose `organization` matches `a.organization`, compared
   case-insensitively after trimming.
2. If `candidates` is empty → `a` goes to the **Unmatched assignments** section.
3. Otherwise let `eligible` = candidates with `start ≤ a.start` (as `PeriodKey`s).
   - `eligible` non-empty → pick the one with the **greatest** `start`.
   - `eligible` empty → pick the candidate with the **smallest** `start`.
4. Ties on `start` → greater overlap with `a`'s period wins; still tied → the later `end`.

Every assignment is placed exactly once: the rules are total (step 2 or 3 always yields one target)
and deterministic for a given input.

## Skills aggregation (FR-009)

Ordering follows the CV's own priority rather than any computed weight — see
[R8](research.md#r8-ordering-the-skills-list).

- Document-level: walk `cv.assignments` (already newest-first) then `cv.roles`, appending each
  entry's `technologies` in authored order, de-duplicated; take the first 50. The
  `technologies` map in `site-content.json` (the chart's `{ name, years }`) is deliberately **not**
  used — ranking by years surfaces SVN and ClearCase ahead of Terraform.
- Per position: the same walk restricted to that employment's assignments, capped at 5.
- A technology with no assignments (an employment entry's own empty list) contributes nothing and
  emits no `Tech:` line.

## Outputs

`linkedin/linkedin-en.md` and `linkedin/linkedin-sv.md` — structure defined in
[contracts/cli-and-output.md](contracts/cli-and-output.md).
