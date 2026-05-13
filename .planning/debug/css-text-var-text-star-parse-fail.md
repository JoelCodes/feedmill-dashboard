---
status: diagnosed
trigger: "CSS parse error: Unexpected token Delim('*') from .text-\\[var\\(--text-\\*\\)\\] in compiled globals.css — recurrence of Phase 27 bug despite Phase 31-05 @source not fix"
created: 2026-05-13T00:00:00Z
updated: 2026-05-13T00:00:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "The Phase 31-05 fix `@source not \"../../.planning/**/*\"` uses an unsupported glob form. Tailwind v4's `@source not` accepts ONLY a directory path (e.g. `@source not \"../../.planning\"`), not file-level glob patterns. As a result the directive is silently a no-op, Oxide's default scanner walks `.planning/**/*.md` (since .planning is NOT .gitignored), discovers the literal `text-[var(--text-&ast;)]` in five markdown files, and emits a malformed CSS rule `.text-\\[var\\(--text-\\&ast;\\)\\] { color: var(--text-&ast;); }` that LightningCSS rejects with `Unexpected token Delim('*')`."
  confirming_evidence:
    - "src/app/globals.css:4 contains `@source not \"../../.planning/**/*\";` — the disputed glob form."
    - "Tailwind v4 GitHub Discussion #18550 confirms file-level glob negations with `@source not` are not supported; users report patterns like `@source not \"../../**/*.{stories,spec}.{ts,tsx}\"` do not work."
    - "Tailwind v4 official docs canonical example is directory-based: `@source not \"../view/admin\";` — no glob suffix."
    - "Phase 27 workaround was to delete `.next/` AND scrub the literal. Phase 31-05 scrubbed only one specific file (18-UI-REVIEW.md per 31-05-SUMMARY.md:55). Five OTHER .md files in .planning/ still contain the literal."
    - ".gitignore does not exclude .planning/ — verified at /Users/joel/.../.gitignore — so Oxide auto-scanner walks it by default."
    - "No tailwind.config.js, no `source(none)` in CSS — only the @source not directive — so once the directive no-ops, nothing else blocks .planning from scanning."
    - "No .next/ cache present in the worktree, eliminating stale-cache as the cause for THIS instance."
  falsification_test: "Replace `@source not \"../../.planning/**/*\"` with `@source not \"../../.planning\"` (directory form). If the build STILL fails identically, the root cause is not the glob syntax alone (could be that even directory form doesn't recurse — per GitHub issue #15452). Independent secondary test: scrub the literal from all five .planning/**/*.md files; build should succeed regardless of @source not syntax."
  fix_rationale: "Root cause is that Tailwind v4's Oxide scanner is reading .planning/**/*.md and finding the literal. Two complementary fixes: (a) make the @source not directive actually take effect (directory form, OR `source(none)` then explicit positive sources, OR add .planning to .gitignore-like exclusion); AND (b) defuse the literal in the five .md files so it cannot be picked up in any future regression. Fix (b) is the durable one — fix (a) alone keeps the literal as a latent landmine."
  blind_spots: "Have not empirically run `npm run dev` to capture stdout — relying on UAT operator's verbatim report plus codebase evidence. Have not confirmed exact Oxide scanner behavior for the directory form (`@source not \"../../.planning\"`) — GitHub issue #15452 hints it may not recurse to subdirs in some cases. Have not inspected the minified Tailwind source to confirm parser rejection of glob-form @source not (relied on official docs + community discussion)."

next_action: Return ROOT CAUSE FOUND to caller for plan-phase --gaps to author the fix plan.

## Symptoms

expected: `/demo/mill-production` (any route loading layout.tsx) compiles globals.css cleanly with no overlay
actual: LightningCSS / PostCSS overlay: "Parsing CSS source code failed — Unexpected token Delim('*')" at line 1794 of compiled output: `.text-\[var\(--text-\*\)\] { color: var(--text-*); }`
errors: LightningCSS `Unexpected token Delim('*')` during dev compile of `src/app/globals.css` from `src/app/layout.tsx`
reproduction: `npm run dev`, load `/demo/mill-production`, observe Build Error overlay
started: Phase 32 UAT 2026-05-13 (third recurrence; previously fixed in Phase 27 and again in Phase 31-05 commit 3fb044b)

## Eliminated

- hypothesis: "Stale `.next/` build cache (Phase 27's working workaround was `rm -rf .next`)"
  evidence: "`.next/` does not exist in the worktree — `ls .next` returns no such file. UAT operator's failure is fresh-build, not cache-state."
  timestamp: 2026-05-13T00:00:00Z

- hypothesis: "The `../../` relative path from `src/app/globals.css` resolves wrong"
  evidence: "src/app/globals.css is at repo_root/src/app/globals.css. `../../` resolves to repo_root, which contains `.planning/` (verified `ls /.../.planning` shows MILESTONES.md etc.). Path is correct."
  timestamp: 2026-05-13T00:00:00Z

- hypothesis: "Postcss/Next config injecting alternate content source"
  evidence: "postcss.config.mjs is minimal (just `@tailwindcss/postcss` plugin, no options). next.config.ts is empty. No tailwind.config.js. No other CSS files override @source."
  timestamp: 2026-05-13T00:00:00Z

## Evidence

- timestamp: 2026-05-13T00:00:00Z
  checked: src/app/globals.css line 4
  found: "Directive is literally `@source not \"../../.planning/**/*\";` — the recursive-glob form from Phase 31-05 commit 3fb044b."
  implication: "This is the form under suspicion."

- timestamp: 2026-05-13T00:00:00Z
  checked: package.json + node_modules/tailwindcss/package.json
  found: "tailwindcss ^4 resolves to 4.2.1; @tailwindcss/postcss ^4; @tailwindcss/oxide 4.2.1. Next.js 16.1.6."
  implication: "Modern Tailwind v4.2.1 with Oxide scanner. v4.1+ supports @source not directive."

- timestamp: 2026-05-13T00:00:00Z
  checked: grep -rn 'text-\\[var(--text-\\*)\\]' .planning/
  found: "5 files contain the literal: 27/deferred-items.md (lines 58, 61), 27/27-05-SUMMARY.md (line 89), 27/27-VERIFICATION.md (line 137), 31/31-05-SUMMARY.md (line 77), 32/32-UAT.md (line 70). Phase 27 fix scrubbed only 18-UI-REVIEW.md."
  implication: "The literal exists in multiple .md files within the supposedly-excluded .planning directory. If @source not actually worked, none of these would matter."

- timestamp: 2026-05-13T00:00:00Z
  checked: Tailwind v4 GitHub Discussion #18550 + official docs
  found: "Community-confirmed: `@source not` with file-level glob patterns (e.g., `@source not \"../../**/*.stories.tsx\"`) does not work in Tailwind v4. Official docs example uses directory-only form: `@source not \"../view/admin\";`. Docs describe @source not as ignoring 'specific paths' / 'large directories', not glob negations."
  implication: "Phase 31-05's glob form `@source not \"../../.planning/**/*\"` is unsupported syntax — silently no-op. The directive Phase 27 originally had (`@source not \"../../.planning\"`) was the correct form; Phase 31-05 'fixed' it into a broken form."

- timestamp: 2026-05-13T00:00:00Z
  checked: /Users/joel/.../.gitignore
  found: "No .planning entry. /node_modules, /.pnp, /coverage, playwright/.clerk/, .yarn/* etc. — but .planning is NOT gitignored."
  implication: "Tailwind v4 Oxide auto-scanner walks .planning/**/*.md by default (since it only auto-skips .gitignore entries + binary files). With @source not directive no-op, nothing stops scanning."

- timestamp: 2026-05-13T00:00:00Z
  checked: .planning/milestones/v1.5-phases/27-role-assignment-and-testing/deferred-items.md item 4
  found: "Phase 27 original observation: '@source not \"../../.planning\" — directive does not appear to recursively exclude .planning/**/*.md.' Workaround was rm -rf .next + scrub the literal. Suggested permanent fix at the time: glob form. That glob form was applied in 31-05 but is the unsupported syntax."
  implication: "Phase 27 already empirically observed that directory-form @source not did not recurse into .planning subfolders for this codebase + Tailwind v4 version. Phase 31-05's glob 'fix' didn't actually solve it — it just happened to coincide with the OTHER half of the fix (scrubbing 18-UI-REVIEW.md), which is what really made the build green at the time."

## Resolution

root_cause: "Tailwind v4's `@source not` directive at src/app/globals.css:4 uses an unsupported file-level glob form (`@source not \"../../.planning/**/*\"`). The directive accepts only directory paths (per official docs and Discussion #18550). As written, the directive is a silent no-op, so Oxide's default auto-scanner — which scans every non-gitignored, non-binary file in the project — walks .planning/**/*.md, discovers the literal `text-[var(--text-&ast;)]` in five tracked markdown files (27/deferred-items.md, 27/27-05-SUMMARY.md, 27/27-VERIFICATION.md, 31/31-05-SUMMARY.md, 32/32-UAT.md), and generates the malformed Tailwind utility `.text-\\[var\\(--text-\\&ast;\\)\\] { color: var(--text-&ast;); }` that LightningCSS rejects with `Unexpected token Delim('*')`. Phase 31-05 commit 3fb044b made this regression possible: it changed the directive from the original (directory) form to the unsupported glob form AND scrubbed the previously-offending file 18-UI-REVIEW.md, so the build went green by coincidence (the scrub did the work, the glob change broke the directive)."
fix:
verification:
files_changed: []


## Symptoms

expected: `/demo/mill-production` (any route loading layout.tsx) compiles globals.css cleanly with no overlay
actual: LightningCSS / PostCSS overlay: "Parsing CSS source code failed — Unexpected token Delim('*')" at line 1794 of compiled output: `.text-\[var\(--text-\*\)\] { color: var(--text-*); }`
errors: LightningCSS `Unexpected token Delim('*')` during dev compile of `src/app/globals.css` from `src/app/layout.tsx`
reproduction: `npm run dev`, load `/demo/mill-production`, observe Build Error overlay
started: Phase 32 UAT 2026-05-13 (third recurrence; previously fixed in Phase 27 and again in Phase 31-05 commit 3fb044b)

## Eliminated

(none yet)

## Evidence

(to be appended)

## Resolution

root_cause:
fix:
verification:
files_changed: []
