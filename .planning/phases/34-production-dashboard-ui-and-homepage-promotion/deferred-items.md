# Phase 34 Deferred Items

## Pre-existing issues (not introduced by plan 34-07)

### Build failure: @aws-sdk/client-s3 missing
- **File:** `src/actions/import.ts` (via `read-excel-file/node` → `unzipper` → `@aws-sdk/client-s3`)
- **Error:** `Module not found: Can't resolve '@aws-sdk/client-s3'` in Turbopack build
- **Status:** Pre-existing at base commit `85c6e3e`. Not introduced by plan 34-07.
- **Impact:** `npm run build` fails but `npm run dev` works. Tests pass.
- **Resolution needed:** Either install `@aws-sdk/client-s3` or configure Next.js to externalize the `unzipper` package from the client/edge bundle.

### Settings page test failures
- **File:** `src/app/settings/__tests__/page.test.tsx`
- **Error:** Missing ClerkProvider in test environment
- **Status:** Pre-existing. Not introduced by plan 34-07.
