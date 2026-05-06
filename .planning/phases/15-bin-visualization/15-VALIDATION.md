---
phase: 15
slug: bin-visualization
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-05
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | jest.config.ts |
| **Quick run command** | `npm test -- --testPathPatterns="BinGauge" --watchAll=false` |
| **Full suite command** | `npm test -- --watchAll=false` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPatterns="BinGauge" --watchAll=false`
- **After every plan wave:** Run `npm test -- --watchAll=false`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 3 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | BIN-01 | T-15-02 | Percentage clamped to 0-100 | unit | `npm test -- --testPathPatterns="BinGauge" --watchAll=false` | ✅ | ✅ green |
| 15-01-01 | 01 | 1 | BIN-02 | — | N/A | unit | `npm test -- --testPathPatterns="BinGauge" --watchAll=false` | ✅ | ✅ green |
| 15-02-01 | 02 | 2 | BIN-03 | — | N/A | unit | `npm test -- --testPathPatterns="BinGaugeRow" --watchAll=false` | ✅ | ✅ green |
| 15-02-02 | 02 | 2 | BIN-03 | T-15-04 | N/A (mock service) | integration | `npm run build && npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Requirement Coverage

| Requirement | Description | Test File | Test Count | Coverage |
|-------------|-------------|-----------|------------|----------|
| BIN-01 | Bin shows fill level as percentage bar | BinGauge.test.tsx | 14 | COVERED |
| BIN-02 | Bar uses color thresholds (green/yellow/red) | BinGauge.test.tsx | 5 | COVERED |
| BIN-03 | Bins displayed in horizontal row on customer detail | BinGaugeRow.test.tsx | 4 | COVERED |

### BIN-01 Test Coverage

- Test 1: Fill bar height based on fillPercentage
- Test 5: Percentage text displayed inside gauge
- Test 13: Clamps negative percentage to 0 (T-15-02)
- Test 14: Clamps percentage >100 to 100 (T-15-02)

### BIN-02 Test Coverage

- Test 2: Green fill color when >25%
- Test 3: Yellow fill color when 10-25%
- Test 4: Red fill color when <10%
- Test 11: Boundary - exactly 25% renders yellow
- Test 12: Boundary - exactly 10% renders yellow

### BIN-03 Test Coverage

- Test 1: Renders nothing when bins array is empty (D-01)
- Test 2: Renders BinGauge for each bin in array
- Test 3: Horizontal flex row with gap-6 (24px)
- Test 4: Flex-end alignment (bottom-aligned)

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-05-05

---

## Validation Audit 2026-05-05

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All requirements have automated test coverage. Phase 15 is Nyquist-compliant.
