---
phase: 32-schema-migrations-and-seed-data
reviewed: 2026-05-13T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/__tests__/no-bad-tailwind-literals.test.ts
  - src/app/globals.css
findings:
  critical: 0
  blocker: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 32 (plan 32-07): Code Review Report

**Reviewed:** 2026-05-13
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Plan 32-07 closes two related gaps from the Phase 27/31/32 Tailwind v4
LightningCSS parse-error regression:

1. `src/app/globals.css` replaces the broken `@source not <glob>` directive
   with `@import "tailwindcss" source(none);` + an explicit positive
   `@source "../../src";` whitelist. This is the correct Tailwind v4 idiom
   for the intent ("do not auto-scan `.planning/`; only scan `src/`").
2. `src/__tests__/no-bad-tailwind-literals.test.ts` adds a Jest enforcement
   gate that walks `.planning/**/*.md` and `src/**/*` looking for the
   recurring dangerous literal token, and fails the build on any match.

The overall direction is sound and the construction of the dangerous
pattern at runtime (so this test file itself is not flagged by Tailwind's
scanner) is well thought out. However, the enforcement test has two real
assertion-correctness defects that meaningfully weaken the "active gate"
guarantee the file comment promises, plus a handful of robustness/quality
gaps. None of the findings are security-critical, but two of the warnings
should be fixed before this is treated as the "Layer 3" gate it claims to
be.

No Critical/Blocker issues were found.

## Warnings

### WR-01: First test relies entirely on `throw` for failure; the only `expect` is a no-op

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:127-141`
**Issue:**
The first test (`'no dangerous-form token in .planning/**/*.md'`) contains
exactly one `expect`:

```ts
expect(violations).toEqual(
  /* eslint-disable-next-line jest/no-conditional-expect */
  expect.arrayContaining([]),
  // Produce a useful failure message if violations exist
);
```

`expect.arrayContaining([])` matches **every** array (empty, non-empty,
violations present, violations absent). It is a tautology — this assertion
cannot fail and contributes nothing to the gate. The failure mode is
delegated to the `throw new Error(...)` block immediately after.

In addition:
- `toEqual` accepts only one matcher argument; the trailing comma and
  comment on line 130 read as if the author intended a custom failure
  message argument, but `toEqual` has no such overload. The comment is
  silently ignored.
- The `eslint-disable-next-line jest/no-conditional-expect` is misplaced:
  the `expect` is not inside a conditional. The disable comment appears
  to be a leftover from an earlier version of the test.
- The second test (lines 144-171) uses the correct pattern
  (`expect(violations).toHaveLength(0)` *after* the `throw`), but the
  first test omits that fallback assertion entirely.

The `throw` does in practice cause Jest to fail the test, so the gate is
**functional today** — but the test as written has no real Jest assertion
for the happy path, which means:
- Mutation testers / coverage tools will report this expect as dead.
- Any future refactor that removes or reorders the `throw` block (e.g.
  someone "cleaning up" the apparently-redundant `throw` because there is
  "already an expect") will silently disable the gate with no test
  failure to catch the regression.

This contradicts the file's own header comment (lines 16-21) which
promises this is the ACTIVE enforcement gate.

**Fix:**
Replace lines 127-131 with the same idiom the second test uses:

```ts
if (violations.length > 0) {
  throw new Error(
    `Found ${violations.length} dangerous Tailwind literal(s) in .planning/**/*.md:` +
      formatViolations(violations) +
      '\n\nFix: replace the literal asterisk with &ast; inside the token.\n' +
      'See .planning/debug/css-text-var-text-star-parse-fail.md for context.',
  );
}

expect(violations).toHaveLength(0);
```

Drop the misplaced `eslint-disable-next-line jest/no-conditional-expect`
comment in the same edit.

---

### WR-02: `walkFiles` follows symlinks via `entry.isDirectory()` — recursion loop possible

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:47-71`
**Issue:**
`fs.Dirent.isDirectory()` follows symlinks (it reports the type of the
target, not the link). If anyone ever creates a symlink under `.planning/`
or `src/` that points to an ancestor directory — even unintentionally,
e.g. a developer's local workspace setup — `walkFiles` will recurse
infinitely until Node throws on stack depth or the process is killed,
hanging CI rather than producing a clean failure.

The test already skips well-known offenders (`node_modules`, `.next`,
`.git`, etc.) so the realistic risk is low, but the function is presented
as a general-purpose walker and the failure mode (CI hang) is worse than
the bug class it is supposed to catch.

**Fix:**
Use `entry.isDirectory()` only for real directories and explicitly skip
symlinks:

```ts
for (const entry of entries) {
  if (entry.isSymbolicLink()) {
    continue; // do not follow symlinks — avoids recursion loops
  }
  if (entry.isDirectory()) {
    if (!SKIP_DIRS.has(entry.name)) {
      walk(path.join(dir, entry.name));
    }
  } else if (entry.isFile()) {
    results.push(path.join(dir, entry.name));
  }
}
```

Alternatively, track visited real paths via `fs.realpathSync` and bail on
re-entry.

---

### WR-03: `@source "../../src"` is a directory path, not a glob — relies on Tailwind's path-resolution behaviour

**File:** `src/app/globals.css:7`
**Issue:**
Tailwind v4's `@source` directive accepts either a directory path or a
glob. A bare directory like `"../../src"` is interpreted by Tailwind
itself, not by a shell — so behaviour depends on the Tailwind version's
resolver. Two concerns:

1. The path is resolved relative to the CSS file location
   (`src/app/globals.css` → `../../src` = repo-root `src/`). That is the
   intended target, but it is fragile: if `globals.css` is ever moved
   (e.g. into `src/app/(dashboard)/`), the directive silently begins
   scanning a different tree without any test catching it. There is no
   assertion in `no-bad-tailwind-literals.test.ts` that locks down the
   `@source` target.
2. The directive does not specify file extensions. Tailwind v4 will scan
   every file Tailwind's defaults allow — which is the intent — but if a
   future contributor checks a `.md` file into `src/` containing the
   dangerous literal (which the Jest gate would catch), Tailwind's
   scanner will still process it before Jest runs. The gate is a
   post-hoc check, not a build-time block.

The plan's stated intent ("scope scanning to src/ only") is achieved, but
the configuration is more brittle than the comment on lines 3-6
suggests.

**Fix:**
Two complementary mitigations:
1. Pin the `@source` target with an absolute-from-config path or a more
   explicit glob, e.g. `@source "../../src/**/*.{ts,tsx,js,jsx}";`. This
   both narrows the scan surface and documents intent at the CSS layer.
2. Add a one-line assertion to `no-bad-tailwind-literals.test.ts` that
   reads `src/app/globals.css` and confirms it contains both
   `source(none)` and an `@source` directive pointing at the src tree.
   That locks down the contract so a future edit of `globals.css` cannot
   silently re-enable auto-detection without breaking a test.

## Info

### IN-01: `formatViolations` signature drift from call-site data

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:103-107` (and call sites 122-125, 154-157)
**Issue:**
`scanFile` returns `Array<{ line: number; text: string }>` (carrying the
trimmed source line at `match.text`), but the violations arrays built by
the two tests only forward `{ file, line }` and discard `match.text`.
`formatViolations` then prints only `file:line: contains dangerous
Tailwind literal` — a fixed string for every match. The captured `text`
is never used.

This is harmless today but it means the failure message is much less
useful than it could be: a developer who hits this test will have to open
the file to see which token was flagged.

**Fix:**
Either drop `text` from `scanFile`'s return type (it is dead data), or
include it in the violations array and have `formatViolations` print it:

```ts
violations.push({ file, line: match.line, text: match.text });
// …
return violations
  .map(v => `\n  ${v.file}:${v.line}: ${v.text}`)
  .join('');
```

---

### IN-02: `--purple-dark` token is unset in dark mode (pre-existing, not introduced by 32-07)

**File:** `src/app/globals.css:152-227`
**Issue:**
The `:root` block defines `--purple-dark: #7e22ce` (line 55) and the
`@theme inline` block exposes it as `--color-purple-dark` (line 247).
The `.dark` block defines `--purple` (line 197) and `--purple-light`
(line 198) but not `--purple-dark`, so dark mode inherits the
light-theme value `#7e22ce`. That may be intentional, but every other
status family (`--success-*`, `--warning-*`, `--error-*`, `--info-*`,
`--primary-*`) provides a dark-mode override for every variant.

This was not introduced by plan 32-07 — flagging only because it sits in
one of the two files in scope and looks like an oversight from an
earlier phase.

**Fix:**
If intentional, add a comment in the `.dark` block noting that
`--purple-dark` is inherited from `:root` deliberately. Otherwise add a
dark-mode override consistent with the other color families.

---

### IN-03: `THIS_FILE` self-exclusion only applies to the `src/**/*` test, not `.planning/**/*.md`

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:113, 117, 150-152`
**Issue:**
The self-exclusion `path.resolve(file) === THIS_FILE` runs only in the
`src/**/*` test (line 150). The `.planning/**/*.md` test does not need
it today (the test file lives in `src/` and is not a `.md` file), but
this is an implicit invariant. If anyone ever moves the test into
`.planning/` (e.g. as part of a refactor that co-locates test fixtures
with planning docs), the test would flag itself and start failing
permanently with no obvious cause.

**Fix:**
Either:
- Add the same `if (path.resolve(file) === THIS_FILE) continue;` guard to
  the `.planning/**/*.md` test loop for symmetry, or
- Add a short comment at line 117 stating the assumption explicitly:
  `// This test file lives in src/ and is .ts, so it cannot match here.`

---

### IN-04: Null-byte binary detection is best-effort and silently skips real source files containing `\0`

**File:** `src/__tests__/no-bad-tailwind-literals.test.ts:85-88`
**Issue:**
The heuristic `if (contents.includes('\0')) return [];` will skip any
file containing a literal `\0`. A `.md` or `.ts` file documenting the
parse-error bug might legitimately contain a NUL byte (e.g. base64-encoded
fixtures, or someone embedding the dangerous token in an escape-encoded
form). Such a file would silently bypass the gate.

The heuristic comment ("Simple null-byte heuristic to skip binary files")
acknowledges the limitation. Low-probability in this repo, but worth
noting.

**Fix:**
Optional. If hardening is desired, restrict the scan by extension
allow-list (e.g. only `.md`, `.ts`, `.tsx`, `.js`, `.jsx`, `.css`,
`.html`, `.txt`) and drop the null-byte check entirely. That also makes
the walk faster and the scope more auditable.

---

_Reviewed: 2026-05-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
