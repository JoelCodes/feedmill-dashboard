---
phase: 05
slug: header
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (if present) / manual browser verification |
| **Config file** | vitest.config.ts or none |
| **Quick run command** | `npm run lint && npm run build` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint && npm run build`
- **After every plan wave:** Run full suite
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | HEADER-01 | — | N/A | integration | `npm run build` | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | HEADER-02 | — | N/A | integration | `npm run build` | ✅ | ⬜ pending |
| 05-01-03 | 01 | 1 | HEADER-03 | — | N/A | integration | `npm run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search filters orders correctly | HEADER-01 | Visual/interactive behavior | Type in search box, verify table filters |
| Notification dropdown opens/closes | HEADER-02 | UI interaction | Click bell, verify dropdown appears/disappears |
| Settings page loads | HEADER-03 | Navigation behavior | Click settings, verify /settings page |
| Badge shows unread count | HEADER-02 | Visual indicator | Check bell icon shows notification count |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
