/**
 * Constants for the bulk XLSX import flow.
 *
 * IMPORTANT: this file is NOT a `'use server'` module. Next.js 16's
 * server-boundary TypeScript rule forbids non-async-function exports from
 * `'use server'` files (only async function exports are permitted in
 * server-action files). Constants like `MAX_IMPORT_BYTES` that need to be
 * shared between client and server code must live in a regular module so
 * that:
 *   - Phase 34's client-side <input> upload form can import the constant
 *     and enforce the layer-1 (browser) DoS guard against >2MB files.
 *   - The server action in `src/actions/import.ts` can re-use the same
 *     constant for the layer-2 (server-side) DoS guard.
 *
 * Together with `experimental.serverActions.bodySizeLimit: '2mb'` in
 * `next.config.ts` (layer 3 / framework body-size limit), this provides
 * the 3-layer DoS mitigation documented in plan 33-01 / T-33-DoS.
 *
 * Do NOT re-export this constant from `src/actions/import.ts`. The same
 * TypeScript rule applies to re-exports of non-async-function values from
 * a `'use server'` module — import the constant directly from this file
 * everywhere it is used.
 */

/**
 * Maximum accepted XLSX upload size in bytes (2 MB).
 *
 * - Layer 1 (client-side): Phase 34 upload form imports this constant and
 *   rejects files exceeding it on the `<input onChange>` handler.
 * - Layer 2 (server-side): `previewImportAction` and `commitImportAction`
 *   check `file.size > MAX_IMPORT_BYTES` after extracting the file from
 *   FormData and return `{ ok: false, code: 'validation' }` if exceeded.
 * - Layer 3 (framework): `next.config.ts` has
 *   `experimental.serverActions.bodySizeLimit: '2mb'` so Next.js rejects
 *   oversize bodies with a 413 before the action body even runs.
 */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
