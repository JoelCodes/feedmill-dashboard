---
phase: 27-role-assignment-and-testing
plan: 03
subsystem: docs-and-config
tags: [docs, runbook, env, clerk-dashboard, e2e-credentials, gitignore]
requires:
  - 27-CONTEXT.md (D-05, D-07, D-12, D-13, D-14)
  - 27-RESEARCH.md (Pitfalls 1-4)
  - 27-PATTERNS.md (Pattern F dotenv + greenfield docs/ note)
  - existing .env.example shape
  - existing .gitignore shape
provides:
  - docs/clerk-setup.md (Clerk Dashboard reproducibility runbook)
  - Documented E2E_* credential key names (6 keys per D-14)
  - playwright/.clerk/ gitignore guard (T-27-22 mitigation)
affects:
  - Plan 27-04 (manual Dashboard configuration consumes this runbook)
  - Plan 27-05 (E2E global setup will write to playwright/.clerk/ which is now ignored)
tech-stack:
  added: []
  patterns:
    - GitHub-flavored Markdown runbook with numbered Dashboard steps
    - .env.example append-section pattern (comment header + blank-line separator)
    - .gitignore pattern: explicit directory ignore distinct from legacy /playwright/.auth/
key-files:
  created:
    - docs/clerk-setup.md (96 lines)
  modified:
    - .env.example (+9 lines)
    - .gitignore (+3 lines)
decisions:
  - "JWT template JSON {\"metadata\": {\"role\": \"{{user.public_metadata.role}}\"}} documented verbatim per D-05"
  - "Three test users documented with +clerk_test safe-mailbox suffix per RESEARCH Open Question 2 recommendation"
  - "Email placeholders pre-populated in .env.example, passwords intentionally blank (T-27-09 mitigation)"
  - "playwright/.clerk/ gitignored ahead of Plan 05 to mitigate T-27-22 before any storage-state files are generated"
metrics:
  duration_seconds: 92
  tasks_complete: 3
  files_created: 1
  files_modified: 2
  commits: 3
  completed_date: "2026-05-12"
---

# Phase 27 Plan 03: Clerk Runbook + .env.example + .gitignore Summary

Created the Clerk Dashboard reproducibility runbook (`docs/clerk-setup.md`), documented the six E2E credential keys in `.env.example`, and gitignored `playwright/.clerk/` before any downstream plan generates files in that directory.

## What Shipped

**docs/clerk-setup.md (greenfield, 96 lines).** A nine-section GitHub-flavored-Markdown runbook covering: (1) Prerequisites incl. dev-instance constraint, (2) JWT template configuration with verbatim JSON `{"metadata": {"role": "{{user.public_metadata.role}}"}}` and Dashboard path `Sessions → Customize session token`, (3) Test user creation table with three rows (`e2e-demo+clerk_test@…`, `e2e-norole+clerk_test@…`, `e2e-admin+clerk_test@…`), (4) publicMetadata.role assignment instructions with exact JSON shape, (5) Sign-out/sign-in propagation caveat per D-07, (6) `.env.local` key population guidance, (7) Three-step verification incl. jwt.io decoded-token check, (8) Order-of-operations warning cross-referencing RESEARCH Pitfall 2. The `docs/` directory was greenfield — created during this plan.

**.env.example (+9 lines).** Appended a new section after the existing Clerk page-URL block: a two-line comment header pointing at `docs/clerk-setup.md`, then six `KEY=VALUE` lines. Email placeholders are populated with the convention emails (`e2e-{role}+clerk_test@example.com`) so a developer cloning the repo can use them as-is. Password values are intentionally blank — they MUST be set in `.env.local` (gitignored) after creating users per the runbook. The five pre-existing keys are unchanged.

**.gitignore (+3 lines).** Added a `# Playwright Clerk session storage state` comment header and `playwright/.clerk/` directory ignore. Verified with `git check-ignore -q playwright/.clerk/demo.json` (exit 0). This entry is distinct from the existing `/playwright/.auth/` legacy entry (different path). Mitigation lands BEFORE Plan 05 generates any storage-state files there, satisfying threat T-27-22.

## Tasks Executed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create docs/clerk-setup.md runbook | `6f3a336` | docs/clerk-setup.md |
| 2 | Append six E2E_* keys to .env.example | `1ee2522` | .env.example |
| 3 | Gitignore playwright/.clerk/ directory | `a93a0ff` | .gitignore |

## Verification

All seven plan-level checks from PLAN.md `<verification>` block executed and passed:

1. `test -f docs/clerk-setup.md` — file exists.
2. `grep -F '{"metadata": {"role": "{{user.public_metadata.role}}"}}' docs/clerk-setup.md` — matches once (D-05 verbatim).
3. `grep -c "^E2E_" .env.example` — returns `6` (D-14 satisfied).
4. `grep -F "docs/clerk-setup.md" .env.example` — cross-reference present.
5. `grep -F "playwright/.clerk/" .gitignore` — pattern present.
6. `git check-ignore -q playwright/.clerk/demo.json` — exits 0 (ignored).
7. `git status` — clean, only the three expected files were modified.

Task 1 acceptance also independently verified: file has 96 lines (≥40 required), 8 `##` sections (≥8 required), all three test-user emails grep-able, "sign out" present, `pk_test_` present, `publicMetadata` present, `jwt.io` present.

Task 2 acceptance also independently verified: exactly six `E2E_*` keys, all three password lines are `^E2E_..._PASSWORD=$` (no value after `=`), all three email lines match D-14 verbatim, pre-existing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE` and `CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE` unchanged.

Task 3 acceptance also independently verified: `git diff .gitignore` shows only additions; legacy `/playwright/.auth/` entry preserved.

## Deviations from Plan

None — plan executed exactly as written. No deviation rules (1-4) triggered. No auth gates encountered. No checkpoints in this plan (`autonomous: true`, type `execute`).

## Threat Surface

Plan PLAN.md `<threat_model>` listed four threats; the two `mitigate`-disposition items are addressed by the work in this plan:

- **T-27-09 (Information Disclosure, real passwords committed to .env.example):** Mitigated. `.env.example` ships with `E2E_*_PASSWORD=` lines containing no value after `=`. The runbook Step 5 explicitly instructs the developer to populate `.env.local` (gitignored) instead.
- **T-27-22 (Information Disclosure, storage state files committed):** Mitigated. `.gitignore` now contains `playwright/.clerk/` and `git check-ignore` confirms `playwright/.clerk/demo.json` is ignored. This lands before Plan 05 ever writes to that directory.
- **T-27-11 (Information Disclosure, real email delivery during sign-up):** Mitigated. All three documented test-user emails carry the `+clerk_test` safe-mailbox suffix per Clerk's documented testing mode.
- T-27-10 (Tampering, runbook drift) — `accept` disposition, no mitigation in this plan.

No new threat surface introduced — this plan is documentation and config only. No new code paths, network endpoints, auth changes, or schema changes.

## Known Stubs

None. All three deliverables are complete and functional. Password fields in `.env.example` are intentionally blank placeholders (security requirement, not stubs) — they are documented to be filled in `.env.local` by the developer.

## Requirements Addressed

- **ACCESS-02** (partial — this plan provides the documentation prerequisite; full ACCESS-02 satisfaction requires the implementation work in plans 27-01, 27-02, 27-04, 27-05 to land alongside).

## Files

- Created: `docs/clerk-setup.md`
- Modified: `.env.example`, `.gitignore`
- Commits on `worktree-agent-af0bb5ea5e3931e07`: `6f3a336`, `1ee2522`, `a93a0ff`

## Self-Check: PASSED

- `docs/clerk-setup.md` — FOUND
- `.env.example` — FOUND (modified)
- `.gitignore` — FOUND (modified)
- Commit `6f3a336` — FOUND in git log
- Commit `1ee2522` — FOUND in git log
- Commit `a93a0ff` — FOUND in git log
