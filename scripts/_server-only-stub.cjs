// scripts/_server-only-stub.cjs
//
// No-op replacement for the `server-only` npm package, used only by dev-only
// harness scripts (see scripts/_server-only-shim.mjs). The real `server-only`
// package throws by design — this stub is a CJS no-op so it has no effect on
// the harness's module graph.
module.exports = {};
