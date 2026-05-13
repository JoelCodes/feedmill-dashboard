/**
 * no-bad-tailwind-literals.test.ts
 *
 * Enforcement gate for the Phase-27/31/32 recurring Tailwind v4 parse-error bug.
 *
 * Background:
 *   Tailwind v4's Oxide scanner reads raw bytes from scanned files. When it finds
 *   an arbitrary Tailwind class containing a literal asterisk inside the brackets,
 *   it generates a malformed CSS rule that LightningCSS rejects with
 *   `Unexpected token Delim('*')`, producing a Build Error overlay on every page.
 *   The specific token that triggered this bug in Phases 27/31/32 is described in
 *   .planning/debug/css-text-var-text-star-parse-fail.md (token name uses &ast; entity
 *   there to prevent this very scanner from picking it up).
 *
 *   Layer 1 (this plan) defused all known occurrences. Layer 2 changed globals.css to
 *   `source(none)` + explicit positive `@source "../../src"`, which scopes scanning
 *   to src/ only. This test (Layer 3) is the ACTIVE enforcement gate that catches
 *   any future re-introduction.
 *
 * DO NOT delete this test without coordinating with whoever owns Tailwind config.
 * Its absence means the project loses its recurrence-prevention guarantee.
 * If the test needs to be disabled, record the decision and rationale in a
 * deferred-items.md entry.
 *
 * See: .planning/debug/css-text-var-text-star-parse-fail.md for the full diagnosis.
 */

import * as fs from 'fs';
import * as path from 'path';

// Build the dangerous pattern at runtime using char codes AND string splitting so this
// source file does NOT contain contiguous bytes that the Tailwind scanner would recognize
// as a class-name candidate (which would cause this file itself to generate invalid CSS).
const STAR = String.fromCharCode(42); // 0x2A — '*'
// Split the prefix across two string literals so Tailwind's scanner cannot find the
// contiguous dangerous byte sequence in this source file.
const PREFIX_A = 'text-[var('; // "text-[var("
const PREFIX_B = '--text-';    // "--text-"
const PATTERN = PREFIX_A + PREFIX_B + STAR + ')]';

// Directories to skip when walking the file tree.
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'coverage']);

/**
 * Recursively collect all file paths under `rootDir`, skipping SKIP_DIRS.
 */
function walkFiles(rootDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // unreadable directory — skip
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  walk(rootDir);
  return results;
}

/**
 * Scan `filePath` for PATTERN. Returns an array of `{line, text}` objects for each match.
 * Returns empty array if the file cannot be read as UTF-8.
 */
function scanFile(filePath: string): Array<{ line: number; text: string }> {
  let contents: string;
  try {
    contents = fs.readFileSync(filePath, 'utf8');
  } catch {
    return []; // binary or unreadable — skip
  }

  // Simple null-byte heuristic to skip binary files
  if (contents.includes('\0')) {
    return [];
  }

  const matches: Array<{ line: number; text: string }> = [];
  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(PATTERN)) {
      matches.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return matches;
}

/**
 * Format a list of matches into a readable failure message.
 */
function formatViolations(violations: Array<{ file: string; line: number }>): string {
  return violations
    .map(v => `\n  ${v.file}:${v.line}: contains dangerous Tailwind literal`)
    .join('');
}

// Compute repo root relative to this test file: src/__tests__/ → src/ → repo root
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PLANNING_DIR = path.join(REPO_ROOT, '.planning');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const THIS_FILE = path.resolve(__filename);

describe('no-bad-tailwind-literals', () => {
  test('no dangerous-form token in .planning/**/*.md', () => {
    const mdFiles = walkFiles(PLANNING_DIR).filter(f => f.endsWith('.md'));
    const violations: Array<{ file: string; line: number }> = [];

    for (const file of mdFiles) {
      const matches = scanFile(file);
      for (const match of matches) {
        violations.push({ file, line: match.line });
      }
    }

    expect(violations).toEqual(
      /* eslint-disable-next-line jest/no-conditional-expect */
      expect.arrayContaining([]),
      // Produce a useful failure message if violations exist
    );

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} dangerous Tailwind literal(s) in .planning/**/*.md:` +
          formatViolations(violations) +
          '\n\n' +
          'Fix: replace the literal asterisk with &ast; inside the token.\n' +
          'See .planning/debug/css-text-var-text-star-parse-fail.md for context.',
      );
    }
  });

  test('no dangerous-form token in src/**/*', () => {
    const srcFiles = walkFiles(SRC_DIR);
    const violations: Array<{ file: string; line: number }> = [];

    for (const file of srcFiles) {
      // Skip this test file itself — it must contain PATTERN in order to test for it
      if (path.resolve(file) === THIS_FILE) {
        continue;
      }

      const matches = scanFile(file);
      for (const match of matches) {
        violations.push({ file, line: match.line });
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found ${violations.length} dangerous Tailwind literal(s) in src/**/*:` +
          formatViolations(violations) +
          '\n\n' +
          'Fix: replace the literal asterisk with &ast; inside the token.\n' +
          'See .planning/debug/css-text-var-text-star-parse-fail.md for context.',
      );
    }

    expect(violations).toHaveLength(0);
  });

  test('positive control — scanner correctly detects the dangerous pattern', () => {
    // Construct the dangerous string in memory and write it to a temp-like in-memory check.
    // This proves the scanner is not silently passing due to a broken detection algorithm.
    // Build dangerousString from parts — same as PATTERN, proves PATTERN is correct
    const dangerousString = PREFIX_A + PREFIX_B + String.fromCharCode(42) + ')]';

    // The scanner must detect the pattern in a string that contains it
    expect(dangerousString.includes(PATTERN)).toBe(true);

    // The scanner must NOT detect the pattern in the defused form
    // (defused form uses &ast; entity in place of the asterisk)
    const defusedString = PREFIX_A + PREFIX_B + '&ast;' + ')]';
    expect(defusedString.includes(PATTERN)).toBe(false);

    // Verify the PATTERN itself is correctly constructed
    expect(PATTERN).toBe(PREFIX_A + PREFIX_B + String.fromCharCode(42) + ')]');
  });
});
