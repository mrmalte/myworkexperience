# Research: LinkedIn Export

**Feature**: 007-linkedin-export | **Date**: 2026-09-07

## R1: Can a LinkedIn profile be updated programmatically?

**Decision**: No. The feature produces paste-ready text and performs no network access.

**Rationale**: LinkedIn does expose a Profile Edit API able to write `headline`, `summary` and
`positions` (`POST https://api.linkedin.com/v2/people/(id:{person ID})`, with `positions` as a
sub-resource). Its documentation opens with: *"The use of this API is restricted to those developers
approved by LinkedIn and subject to applicable data restrictions in their agreements."* The
permission it needs, `w_compliance`, is described in the same table as *"a private permission and
access is granted to select developers."* The page is served `NOINDEX` — it documents a partner
integration surface, not a self-service one.

The scopes an individual can actually obtain through the developer portal are `openid` / `profile`
(read basic profile) and `w_member_social` (post shares on the member's behalf). None of them edit
profile fields.

**Alternatives considered**:

- _Apply for Profile Edit API access_ — rejected. It is granted to compliance and talent-platform
  partners, not to an individual maintaining their own profile. The application would not be
  approved, and the feature would be blocked on it.
- _Browser automation (Playwright/Puppeteer against linkedin.com)_ — rejected. LinkedIn's User
  Agreement prohibits automated access to the service; the realistic outcome is a restricted
  account. The repo already depends on Puppeteer for PDF generation, so this was technically within
  reach — it is refused on policy grounds, not capability.
- _"Import resume" style upload_ — rejected. LinkedIn's résumé upload feeds job applications; it
  does not write the profile.

**Consequence for the design**: the deliverable is a document optimised for copying out of, which is
why the output carries character counts, LinkedIn's own field names, and one fenced block per field.

## R2: How are assignments matched to the employment they belong to?

**Decision**: Match on organization, then select the employment whose start is the **latest start
not after the assignment's start**; if the assignment starts before every candidate, fall back to
the **earliest** candidate. Ties broken by greatest period overlap.

**Rationale**: LinkedIn has no level for consultancy assignments, so `cv.assignments` must be
rendered as bullets inside a `cv.roles` block. `organization` already links the two — assignments
carry the employer in `organization` and the customer in `client` — but three employers have two
employment entries whose periods touch or overlap, so organization alone maps an assignment to two
blocks at once:

| Employer       | Employment A      | Employment B      |
| -------------- | ----------------- | ----------------- |
| Teleca         | `200609-200704`   | `200702-200704`   |
| Global Gaming  | `201509-201706`   | `201706-201904`   |
| Sony Ericsson  | `200401-200608`   | `200705-200808`   |

The "latest start ≤ assignment start" rule resolves every one of them correctly against the current
data: Teleca's email-client assignment (`200702-200704`) lands on employment B while the three
earlier ones land on A; Global Gaming's `201808-201904` assignment lands on B; Sony Ericsson's
VideoShare assignment (`200502-200609`) lands on A and the GPS assignment (`200705-200808`) on B.

The earliest-candidate fallback is not hypothetical either: `201203_ConnectedTable` has
`Period: 2012`, which `parsePeriod` normalises to start `2012` — earlier than the employment's
`201202` once compared as year-months. Without the fallback that assignment would be reported
unmatched.

**Alternatives considered**:

- _Greatest-overlap only_ — rejected. For Teleca it picks employment A for the `200702-200704`
  assignment (identical overlap, A is longer), which is wrong; the assignment belongs to the module
  owner role that started in February 2007.
- _Containment (assignment period inside employment period)_ — rejected. Several assignments extend
  past their employment's end in the current data (`200208_SonyEricsson` runs to `200502` under a
  Maltetech employment ending `200401`), so a strict containment test would leave them unmatched.
- _An explicit parent key in `meta.txt`_ — rejected. It would change feature 001's on-disk format and
  require hand-maintaining a link that organization plus period already determines.

## R3: Period comparison across the two period formats

**Decision**: Normalise every `period.start` / `period.end` to a 6-character `YYYYMM` sort key
(`"2012"` → `"201201"`, and for comparison purposes a `null` end → `"999999"`), then compare as
strings.

**Rationale**: `parsePeriod` in `tools/build-content.ts` emits `start`/`end` as `YYYYMM`, except for
the bare-`YYYY` form where both are the 4-character year, and `end: null` for an ongoing period. Any
matching or ordering logic that compares these raw will mis-order `"2012"` against `"201202"`.
String comparison on the padded form is correct and needs no `Date` objects.

**Alternatives considered**: reusing `periodToDate()` from `build-content.ts` — rejected; it is not
exported, and exporting it to share two lines of arithmetic couples the tools for no gain.

## R4: What goes into an Experience block, given LinkedIn's 2 000-character limit?

**Decision**: Role description in full, then one bullet per assignment containing client, period,
the **opening paragraph** of the assignment description, and its technologies. Report the character
count; never truncate.

**Rationale**: The employment (`*_summary`) descriptions are one or two sentences — they cost almost
nothing. The assignment descriptions are the long ones: the current Visionite block would run past
3 000 characters if all three assignments were included in full, and Ikea's `Fixa` entry alone is
~1 500. Opening paragraphs bring every block comfortably under the limit as the CV stands — the largest,
Connected Table with five assignments, lands at roughly 1 700 characters — while keeping each bullet
a complete, readable sentence.

Truncating mid-sentence to force a fit would produce text that reads as broken on a public profile,
so the tool reports the overflow and leaves the editorial decision to the maintainer (FR-011).

**Alternatives considered**:

- _Full descriptions with a warning_ — rejected as the default; it would flag most consultancy
  blocks and make the warning meaningless.
- _First N characters_ — rejected; cuts mid-sentence, which is the failure mode above.
- _A separate short description per entry in `specs-input/`_ — rejected as scope creep; it would add
  a third text body to every CV entry for the benefit of one renderer.

## R5: Where does the headline come from?

**Decision**: A new authored pair `specs-input/linkedin/{en,sv}.txt`, first line `Headline: …`,
remaining lines appended verbatim to the About section. Parsed by ~15 lines local to the tool.

**Rationale**: A headline is editorial copy with no equivalent in the CV — it cannot be derived, and
hardcoding it in the tool would violate gate 3 (authored copy belongs in `specs-input/`). The About
tail (a stack line and a link back to the CV site) has the same character: LinkedIn-specific copy
that no other renderer wants.

`parseContent()` in `tools/content/parseSource.ts` is close to what is needed but is not exported and
requires a `Title:` first line; `parseSource()` itself only walks `specs-input/cv/`. Widening either
would pull feature 001's format definition into this feature for no benefit. A local reader keeps
the coupling at zero.

**Alternatives considered**:

- _Add a `linkedin` section to `site-content.json`_ — rejected. It would ship LinkedIn copy into the
  browser bundle and require the interface, the JSON Schema and `build-content.ts` to change
  together (per CLAUDE.md) for data that only a build tool reads.
- _Derive the headline from `person.role` + top technologies_ — rejected; produces generic text on
  the single most-read line of the profile.

## R6: Output location and format

**Decision**: `linkedin/linkedin-{lang}.md` at the repository root, git-ignored, removed by
`npm run clean`; paste blocks fenced as plain text.

**Rationale**: `public/` is copied wholesale into `out/` by `next build`, so anything placed there is
published at `malte.sarner.se/cv/` and uploaded by `tools/deploy-ftp.ts`. This artifact is a
maintainer worksheet — it contains character-count annotations, LinkedIn field names and a
diagnostics section — so it belongs outside the served tree.

Markdown is the wrapper (headings and a limits table make it readable in an editor), but every
block intended for pasting is inside a fenced code block containing plain text only: LinkedIn's
form fields render no markup, so `**bold**` or `- ` bullets would paste literally. Bullets are the
literal `•` character, which LinkedIn accepts and which is what its own users type.

**Alternatives considered**:

- _`public/linkedin-{lang}.txt`_ — rejected; publishes the worksheet, including its diagnostics.
- _Plain `.txt` output_ — rejected; loses the readable structure around the paste blocks, and the
  fenced blocks already guarantee the pasted text itself is plain.
- _Committing the output_ — rejected; it is generated, and gate 3 says generated artifacts are never
  hand-edited. Ignoring it keeps that honest.

## R7: LinkedIn's field limits

**Decision**: Treat the limits as constants in one place in the tool: headline 220, About 2 600,
position description 2 000, skills 50 (with 5 attachable per position).

**Rationale**: These are LinkedIn product limits, not derived from anything in this repo, and
LinkedIn has changed them before (the headline was 120 characters until 2020). Keeping them in a
single object means a future change is a one-line edit rather than a hunt through format strings.

The five-per-position skill suggestion exists because LinkedIn weights skills attached to a position
far above skills that only appear in the standalone list — the standalone list alone is the common
way a profile ends up under-matched in recruiter search.

## R10: Client as company, not employer

**Decision**: Consultancy work is emitted with the **client** as the LinkedIn company, plus an
umbrella position for the employer. In-house employment keeps the employer as the company with its
assignments as bullets.

**Rationale**: The live profile (read from a Save-to-PDF export) already works this way, and has for
years: Ikea INGKA, Tetra Pak, SenseNode, Sigma Connectivity and Skatteverket appear as companies,
with `Visionite AB` as a separate entry. Two things follow. The client brands sit in the company
field, which is where recruiter search and the company logo come from; and switching to
employer-as-company would mean rebuilding thirteen existing positions by hand, losing whatever
endorsements and recommendations hang off them.

The employer is not lost. Each consultancy employment gets an umbrella block covering its period, so
the employment history remains readable — that is what the profile's own empty `Visionite AB` entry
was reaching for, and the export now fills it with text.

**Why in-house work is treated differently**: one position per assignment is right for consultancy
work, where each assignment really was a separate engagement at a separate company, and wrong for
in-house work, where the assignments are projects inside one job. Connected Table's five assignments
would become five LinkedIn positions at the same company for the same period.

**Why same-client assignments merge**: Cybercom's two Skatteverket prototypes and Maltetech's two
Sony Ericsson assignments are consecutive work at one client. The profile shows each as a single
position, and splitting them would imply two separate engagements.

**Alternatives considered**:

- _Employer as company (the original 007 design)_ — factually the cleanest employment record, and
  what the CV itself models. Rejected because it contradicts the live profile's structure and would
  cost a full manual rebuild.
- _Employer as company with the client in the title_ ("Software Developer — Ikea INGKA") — keeps
  both facts, but loses the client logo and still requires the rebuild.

## R8: Ordering the skills list

**Decision**: Order skills by the CV's own implied priority — newest entry first, and within an
entry the order the technologies were authored in — rather than by `technologies[].years`.

**Rationale**: The first implementation ranked by `years`, the value `build-content.ts` already
computes for the technology chart. Applied to a skills list it produces:
`Linux, SVN, C, Javascript, NodeJS, Git, BackboneJS, C++, ClearCase, …` — the longest-lived tooling,
which for a 25-year career means version-control systems retired a decade ago. Worse, the 50-item cap
then excluded Terraform, NestJS, Next.js, TanStack Query and Kubernetes entirely.

Walking entries newest-first and taking technologies in authored order yields
`TypeScript, React, Styled Components, CSS Modules, REST, React Query (TanStack Query), Fastify, …`
— current work first, in the order Malte himself listed it. The same ordering drives the five
skills suggested per position. No weighting, no lookup table, and the CV's own authoring decides.

**Alternatives considered**:

- _Rank by most recent use, tie-broken by years_ — rejected. Within one entry's technologies it
  reintroduces the years ranking, putting Git and PostgreSQL above TypeScript in the same group.
- _A curated LinkedIn skill vocabulary mapping `ReactJS` → `React`, `NodeJS` → `Node.js`_ — rejected
  as a maintenance burden for no gain: LinkedIn's own skill picker suggests the canonical name as
  you type. The output says so rather than duplicating LinkedIn's taxonomy.

## R9: Which field becomes LinkedIn's position title

**Decision**: The entry's per-language `title`, with `meta.txt`'s `Role` appended as `(CV role: …)`
when the two differ.

**Rationale**: `Role` exists only in English and is a coarse classification, so a Swedish profile
built from it reads `Title: Consultant`. `title[lang]` is authored per language and is frequently
the better job title too — Teleca's `Module Owner` against Role `Software Developer`. But not
always: MultiQ's Role is `Software Architect` while its title is `Software Developer`. Showing the
title and naming the alternative costs one short parenthetical and leaves the choice where it
belongs, with the maintainer at paste time.
