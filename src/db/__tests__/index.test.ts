/**
 * Source-string contract test for src/db/index.ts.
 *
 * Per Phase 31 CONTEXT.md D-10: `import 'server-only';` MUST be line 1 of
 * src/db/index.ts. This is a readability discipline (not a correctness
 * requirement — Webpack/Turbopack resolve the directive regardless of
 * position) so future static-analysis tooling and human reviewers can
 * detect server-only scope at a glance.
 *
 * Mirrors the source-string assertion pattern from src/middleware.test.ts
 * lines 140-186 (fs.readFile + structural expect(content).toContain(...)).
 *
 * Threat reference: T-31-02-01 (info disclosure if DB creds leak into Edge
 * bundle) + T-31-02-05 (line-1 placement enforces future static analysis).
 */
import { promises as fs } from 'fs';
import path from 'path';

describe("src/db/index.ts source-string contract (D-10 line-1 enforcement)", () => {
  let content: string;
  let lines: string[];

  beforeAll(async () => {
    const filePath = path.resolve(__dirname, "..", "index.ts");
    content = await fs.readFile(filePath, "utf-8");
    lines = content.split("\n");
  });

  it("line 1 is exactly `import 'server-only';` (D-10)", () => {
    expect(lines[0]).toBe("import 'server-only';");
  });

  it("exports the Drizzle `db` singleton", () => {
    expect(content).toContain("export const db");
  });

  it("imports `drizzle` from drizzle-orm/neon-http (Edge-compatible HTTP driver)", () => {
    expect(content).toContain("from 'drizzle-orm/neon-http'");
  });

  it("imports `neon` from @neondatabase/serverless (HTTP driver factory)", () => {
    expect(content).toContain("from '@neondatabase/serverless'");
  });

  it("contains no client-side directives or imports (negative — must remain server-only)", () => {
    // No 'use client' pragma anywhere.
    expect(content).not.toContain("'use client'");
    // No imports from next/navigation (browser routing) or react (client hooks).
    expect(content).not.toContain("from 'next/navigation'");
    expect(content).not.toContain("from 'react'");
  });
});
