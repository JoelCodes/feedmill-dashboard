---
status: complete
phase: 26-route-restructuring-and-migration
source: [26-VERIFICATION.md (human_needed items)]
started: 2026-05-12T00:00:00Z
updated: 2026-05-12T00:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Coming Soon Homepage Layout
expected: Navigate to `/`. Page renders Coming Soon heading + subtitle inside the full DashboardLayout (sidebar + header). Sidebar shows "PRODUCTION" label with a single "Coming Soon" link, and the Settings link is visible.
result: pass

### 2. Demo Context Sidebar Switch
expected: Navigate to `/demo/orders`. Orders page renders with table. Sidebar section label switches to "DEMO" and shows three links — Orders, Customers, Mill Production — all using `/demo/*` hrefs. Settings link still visible. Header title reads "Orders".
result: pass

### 3. Demo Navigation Flow (End-to-End)
expected: From `/demo/orders`, click each demo link in the sidebar. `/demo/orders`, `/demo/customers`, and `/demo/mill-production` all load. Header title updates per page (Orders / Customers / Mill Production). Sidebar stays in DEMO context throughout.
result: pass

### 4. Settings Cross-Context Navigation
expected: Click Settings link from `/` (production context) — `/settings` loads. Go back, navigate to `/demo/orders`, click Settings — `/settings` loads again. Settings link visible and functional in both contexts.
result: pass

### 5. Old Routes Return 404
expected: Manually navigate to `/orders`, `/customers`, and `/mill-production`. Each returns Next.js 404 (no redirect to `/demo/*` — clean break per decision D-01).
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
