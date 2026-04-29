<!--
Sync Impact Report

- Version change: template → 1.0.0
- Modified principles: N/A (initial fill)
- Added sections: Core Principles (filled), Technical Constraints, Workflow & Quality Gates, Governance (filled)
- Removed sections: N/A
- Templates requiring updates:
	- ✅ .specify/templates/spec-template.md
	- ✅ .specify/templates/tasks-template.md
	- ⚠ pending: .specify/templates/plan-template.md (optional: tailor examples to this repo)
	- ✅ .specify/templates/checklist-template.md (no constitution coupling)
- Follow-up TODOs:
	- TODO(CONSTITUTION_VERSIONING): If/when a public build toolchain is added, confirm version bump policy still fits.
-->

# MyWorkExperience Constitution

## Core Principles

### I. Static Output First

The product MUST ship as static assets only: plain HTML, CSS, and JavaScript.
No server-side rendering.

Rationale: The site should be able to host on any static host with minimal operational burden.

### II. Build Tools in TypeScript, Output in Web Standards

Custom build tooling MUST be implemented in TypeScript and executed during local/dev/CI builds.
The build output MUST be plain HTML/CSS/JS (plus static files like images/fonts) with no TypeScript
or framework runtime required by the browser.

Rationale: TypeScript improves correctness for tooling while keeping the delivered site maximally
portable.

### III. Data Is Source of Truth

Raw CV material under `specs-input/cv/` MUST be treated as the source of truth.
Generated artifacts (e.g., under `dist/` or equivalent) MUST NOT be hand-edited.
Any transformation rules MUST be deterministic and reproducible.

Rationale: Content changes should be traceable and repeatable without manual drift.

## Technical Constraints

- The final deployed page MUST be plain HTML/CSS/JavaScript.
- A build step is REQUIRED for generating/assembling the site.
- Custom build tools MUST be TypeScript.
- The on-disk CV source format is intentionally unspecified at this stage; it will be defined during
  the `specify` step. Tooling MUST be designed to accommodate a clearly specified format.

## Workflow & Quality Gates

- Every feature/change MUST declare whether it touches:
  - build tooling (TypeScript),
  - content source (`specs-input/`),
  - generated output (static site assets).
- Changes that affect generated output MUST include an update path (what to run, what changes).
- Avoid unnecessary complexity: prefer a single, straightforward build pipeline until a concrete
  requirement forces additional layers.

## Governance

- This constitution supersedes local conventions and feature plans.
- Amendments MUST:
  - update this document,
  - include rationale,
  - include any required migration steps.
- Compliance review expectation:
  - Every plan/spec/tasks set MUST include a brief “Constitution Check” confirming:
    1. output is static HTML/CSS/JS,
    2. custom tooling is TypeScript,
    3. `specs-input/cv/` remains the source of truth.
- Versioning policy (semantic):
  - MAJOR: breaks a core principle or changes governance in a backward-incompatible way.
  - MINOR: adds a new principle/section or materially expands constraints.
  - PATCH: clarifications, wording fixes, non-semantic refinements.

**Version**: 1.0.0 | **Ratified**: 2026-01-09 | **Last Amended**: 2026-01-09
