---
phase: 34-production-dashboard-ui-and-homepage-promotion
reviewed: 2026-05-14T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/components/Header.tsx
  - src/components/Header.test.tsx
  - src/components/DashboardLayout.test.tsx
  - src/components/ImportFlow.tsx
  - src/components/ImportFlow.test.tsx
  - src/components/ImportHistoryTable.test.tsx
  - src/components/TransitionButtons.tsx
  - src/components/TransitionButtons.test.tsx
  - src/components/ProductionDashboard.tsx
  - src/components/ProductionDashboard.test.tsx
  - src/components/BlockedAlertBand.tsx
  - src/components/BlockedAlertBand.test.tsx
  - src/components/ProductionDrawer.tsx
  - src/components/ProductionDrawer.test.tsx
  - src/components/BlockReasonModal.tsx
  - src/components/BlockReasonModal.test.tsx
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 34 Gap-Closure: Code Review Report

**Reviewed:** 2026-05-14
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

This is the gap-closure cycle review (plans 34-08 through 34-12) covering the production dashboard UI and homepage promotion. The implementation correctly addresses the key UAT gaps: `router.refresh()` is now wired on every success/conflict path in `TransitionButtons`, `BlockReasonModal`, and `ImportFlow`; nuqs `shallow: false` + `history: 'push'` is consistently applied to the `order` URL key in `ProductionDrawer`, `BlockedAlertBand`, and `ProductionDashboard`; and `ImportFlow` hydrates `importedAt` at the prop boundary via `useMemo`.

Two blockers were found: an unhandled-rejection path in `ImportFlow` that leaves the UI in a stuck spinner state on network failure, and a stale-closure bug in `BlockReasonModal`'s `useActionState` action function that silently reads a stale `reason` value after a validation-failure retry. Four warnings cover a suppressed exhaustive-deps lint rule hiding a real missing dependency, an inconsistently un-memoized `toggleDropdown`, a missing `React` namespace import in a server component, and a sequencing issue with `router.refresh()` / `onClose()` ordering. Three info items note dead code, a hardcoded string that diverges from its constant, and redundant tests.

---

## Critical Issues

### CR-01: `ImportFlow` — unhandled rejection leaves `isPending=true` (stuck spinner, no error message)

**File:** `src/components/ImportFlow.tsx:87,147`

**Issue:** Both `onFileSelect` and `handleCommit` `await` server actions without a `try/catch`. If either `previewImportAction` or `commitImportAction` throws (network error, server 500, Next.js serialisation failure), the `await` rejects, the unhandled-exception propagates up through the async function, and the `setIsPending(false)` call immediately after the `await` is never reached. The UI is left with the button showing "Processing..." or "Committing..." indefinitely. The user cannot re-submit without a full page refresh. This is reproducible by temporarily blocking the network or by having the server action throw an unhandled exception.

The test suite does not cover the throw-path: `mockPreviewImportAction` and `mockCommitImportAction` are always resolved (success or `{ ok: false }`), never rejected, so this failure mode has no test coverage.

**Fix:** Wrap each `await` in `try/finally` (or `try/catch`) to guarantee `isPending` is cleared:

```ts
// onFileSelect
setIsPending(true);
try {
  const result: PreviewResult = await previewImportAction(formData);
  if (!result.ok) {
    setError(result.message);
    return;
  }
  // ... success path
} catch {
  setError('An unexpected error occurred. Please try again.');
} finally {
  setIsPending(false);
}

// handleCommit (same pattern)
setIsPending(true);
try {
  const result = await commitImportAction(formData, decisions);
  if (!result.ok) {
    setError(result.message);
    return;
  }
  router.refresh();
  setPhase('committed');
} catch {
  setError('An unexpected error occurred. Please try again.');
} finally {
  setIsPending(false);
}
```

Add a test that mocks `previewImportAction` to reject and asserts the button is re-enabled and an error message appears.

---

### CR-02: `BlockReasonModal` — stale closure in `useActionState` action reads outdated `reason` on retry after validation failure

**File:** `src/components/BlockReasonModal.tsx:53-66`

**Issue:** The action function passed to `useActionState` is an inline arrow function that closes over the `reason` state variable at the time the component first renders:

```ts
const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
  async () => {
    const result = await blockOrder(orderId, version, reason); // 'reason' is stale
    ...
  },
  null
);
```

React's `useActionState` (backed by `useReducer` internally) memoizes the action function reference: it does not re-create the action when component state changes. On the first render `reason` is `''`, and that closure is pinned. When the user types into the textarea, `reason` state updates and the component re-renders, but `useActionState` keeps using the original action with the original (empty string) closure.

**Reproduction path:** Server returns `{ ok: false, code: 'validation', message: '...' }`. User reads the error, updates their textarea text, clicks Confirm again. The action is called with `reason = ''` (the initial stale value), not with the updated textarea content. The server always receives an empty reason on the second attempt.

Note: this bug does not manifest on the first submit attempt (the textarea contains the user's typed reason at first render only if they type before the first submission — in practice the component mounts with `reason=''` and users type then submit, so the memoized `''` IS stale on first submit too unless the component re-mounted). Actually since `useState('')` sets `reason` to `''` on mount and the action closes over that initial `''`, the action always calls `blockOrder(orderId, version, '')` regardless of what the user typed. This is a BLOCKER.

**Fix:** Pass `reason` through `FormData` (the canonical `useActionState` pattern) instead of closing over state:

```ts
// In the form, add a hidden input that always reflects current reason:
<input type="hidden" name="reason" value={reason} />

// In the action, read from the formData argument:
const [state, formAction, isPending] = useActionState<TransitionResult | null, FormData>(
  async (_prev, formData) => {
    const currentReason = formData.get('reason') as string;
    const result = await blockOrder(orderId, version, currentReason);
    if (result.ok) {
      router.refresh();
      setReason('');
      onClose();
    }
    return result;
  },
  null
);
```

The existing tests in `BlockReasonModal.test.tsx` would have caught this because `userEvent.type` updates the textarea value — but note they mock `blockOrder` directly and only check that `blockOrder` was called with the typed string (Test 6). The bug would only surface if the mock captured the actual argument value passed at call time with the stale closure — which it does. Test 6 (`expect(blockOrder).toHaveBeenCalledWith('ord-001', 1, 'missing premix corn')`) should be failing. This means either (a) the test is wrong / incomplete, or (b) jsdom's event simulation causes React to re-render synchronously before `formAction` is invoked, coincidentally passing the correct value. Either way the production behavior under React's concurrent scheduler is unreliable.

---

## Warnings

### WR-01: `ProductionDashboard` — suppressed `react-hooks/exhaustive-deps` hides missing `setQuery` dependency

**File:** `src/components/ProductionDashboard.tsx:165-168`

**Issue:** The debounce `useEffect` suppresses the exhaustive-deps rule:

```ts
useEffect(() => {
  setQuery({ q: debouncedSearch });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [debouncedSearch]);
```

`setQuery` from `useQueryStates` is stable (nuqs guarantees this), so omitting it from the dep array is safe in practice. However, the bare suppression comment with no justification is a maintenance hazard: it will suppress any future dep violations in this same effect, and reviewers cannot distinguish "safe intentional omission" from "accidental missing dep". 

**Fix:** Either include `setQuery` in the dep array (nuqs stability means no extra renders) or document the intentional omission explicitly:

```ts
// setQuery from nuqs is stable across renders (memoized by nuqs internals) — safe to omit.
// eslint-disable-next-line react-hooks/exhaustive-deps -- setQuery is stable per nuqs contract
}, [debouncedSearch]);
```

---

### WR-02: `Header.tsx` — `toggleDropdown` is missing `useCallback` (inconsistent with sibling handlers)

**File:** `src/components/Header.tsx:72-74`

**Issue:** `handleMarkAsRead` (line 59) and `handleClearAll` (line 66) are correctly wrapped in `useCallback`. `toggleDropdown` is not:

```ts
const toggleDropdown = () => {
  setIsDropdownOpen(!isDropdownOpen);
};
```

In addition to the missing memoization, it reads `isDropdownOpen` directly rather than using the functional updater, creating a potential stale-closure problem under batched renders: if React batches a state update that changes `isDropdownOpen` before `toggleDropdown` runs, the closure reads the pre-batch value and toggles to the wrong state.

**Fix:**

```ts
const toggleDropdown = useCallback(() => {
  setIsDropdownOpen((prev) => !prev);
}, []);
```

---

### WR-03: `ImportHistoryTable.tsx` — `React` namespace referenced without import

**File:** `src/components/ImportHistoryTable.tsx:36`

**Issue:** The function signature is `): React.JSX.Element {`, but the file has no `import React from 'react'`. The project's `tsconfig.json` uses `"jsx": "react-jsx"`, which eliminates the need for a React import for JSX syntax — but explicitly referencing the `React` namespace in a type position requires the namespace to be in scope. This currently compiles because TypeScript's `react-jsx` mode injects a global `React` namespace into the JSX scope, but this is a global augmentation side-effect, not an explicit import. The pattern is inconsistent with every other component file in this review that uses `React.JSX.Element` and also has `import React from 'react'`.

**Fix:** Add the import or change the return type to `JSX.Element`:

```ts
// Option A
import React from 'react';

// Option B — uses the globally-augmented JSX namespace without the React prefix
export default function ImportHistoryTable({ batches }: Props): JSX.Element {
```

---

### WR-04: `BlockReasonModal` — `router.refresh()` called before `onClose()` creates a race between RSC fetch and modal unmount

**File:** `src/components/BlockReasonModal.tsx:60-62`

**Issue:** On success the action runs:

```ts
router.refresh();  // 1. kicks off async RSC fetch
setReason('');     // 2. updates local state (scheduled)
onClose();         // 3. tells parent to set modalOpen=false → modal unmounts
```

`router.refresh()` starts an async RSC fetch but returns synchronously. The immediately-following `onClose()` triggers parent state changes that may unmount `BlockReasonModal` while `setReason('')` (step 2) is still pending in React's scheduler. React 18 suppresses the "state update on unmounted component" warning, so this won't surface as a console error — but the state update is a no-op that the scheduler has to process and then discard.

More importantly, `onClose` is captured in the action closure at mount time (stale closure, same root cause as CR-02). If the parent re-renders and passes a new `onClose` reference before the user submits, the action calls the old `onClose`.

**Fix:** Reverse the order to close first, then refresh:

```ts
if (result.ok) {
  setReason('');
  onClose();         // close modal first
  router.refresh();  // then kick RSC refresh
}
```

---

## Info

### IN-01: `ProductionDashboard` — `STATE_COLORS` is dead code kept via `void` suppressor

**File:** `src/components/ProductionDashboard.tsx:53-73`

**Issue:** `STATE_COLORS` (a 10-line record) is declared and then immediately voided with `void STATE_COLORS` to suppress the unused-variable lint error. The comment says it is kept for "plan 06 reference (D-01)". Dead code that serves only as a forward reference should live in a comment or design document, not compiled source.

**Fix:** Remove `STATE_COLORS` and the `void STATE_COLORS` line. The values can be restored from version control or copied from `MillProductionUI.tsx` when plan 06 needs them.

---

### IN-02: `ImportFlow` — hardcoded `"2 MB"` string in UI copy may diverge from `MAX_IMPORT_BYTES` constant

**File:** `src/components/ImportFlow.tsx:77,210`

**Issue:** The error message `"File exceeds 2 MB limit. Please upload a smaller file."` (line 77) and the hint text `".xlsx only, max 2 MB"` (line 210) hardcode `"2 MB"` as literal strings. If `MAX_IMPORT_BYTES` were changed, these strings would silently become incorrect. The constant is already imported.

**Fix:** Derive the display value from the constant, or add a co-located assertion comment documenting the intentional lock:

```ts
// At module level:
const MAX_IMPORT_MB = MAX_IMPORT_BYTES / (1024 * 1024); // 2

// In JSX:
setError(`File exceeds ${MAX_IMPORT_MB} MB limit. Please upload a smaller file.`);
// and: `.xlsx only, max ${MAX_IMPORT_MB} MB`
```

---

### IN-03: `Header.test.tsx` — Tests 10 and 11 duplicate existing `it.each` coverage

**File:** `src/components/Header.test.tsx:71-88`

**Issue:** Test 10 (lines 71-79) asserts `'/import'` → `'Import'`, which is identical to Test 9 (lines 63-69) with only a comment difference. Test 11 (lines 81-88) asserts `'/demo/orders'` → `'Orders'`, which is already a row in the `it.each` cases array at line 31. These tests add no additional coverage and create maintenance burden (two places to update if the title logic changes).

**Fix:** Remove Test 10 and Test 11. The query-string note from Test 10's comment can be preserved as an inline comment in Test 9.

---

_Reviewed: 2026-05-14_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
