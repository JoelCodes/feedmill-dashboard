# Phase 5: Header - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-28
**Phase:** 05-header
**Areas discussed:** Notifications system, Settings navigation, Header layout changes

---

## Notifications System

### Notification Source

| Option | Description | Selected |
|--------|-------------|----------|
| Order status changes | Notify when orders move to Ready, In Transit, or Complete. Most relevant for operations. | |
| Mock/placeholder only | Just show the bell icon with no real notifications. Defer notification logic to later. | |
| Multiple event types | Order changes + alerts + system messages. More complex notification categorization. | ✓ |

**User's choice:** Multiple event types
**Notes:** User wants a full notification system supporting multiple types of events

### Notification UI

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown panel | Click bell → shows notification list in a dropdown. Badge shows unread count. Standard pattern. | ✓ |
| Separate notifications page | Click bell → navigates to /notifications page with full list. More room for detail. | |
| Toast/popup only | Show notifications as temporary toasts. No persistent list. | |

**User's choice:** Dropdown panel (Recommended)
**Notes:** Standard pattern, badge shows unread count

### Data Source

| Option | Description | Selected |
|--------|-------------|----------|
| Mock notification service | Create a mock service like orders. Returns sample notifications. Can be replaced with real API later. | |
| Static hardcoded list | Just render a fixed list of example notifications. Simpler but less realistic. | |
| Real persistence | Use localStorage or similar to track read/unread state. More work but functional demo. | ✓ |

**User's choice:** Real persistence
**Notes:** User wants functional read/unread tracking that persists across sessions

---

## Settings Navigation

### Settings Content

| Option | Description | Selected |
|--------|-------------|----------|
| Stub page only | Empty settings page with title. Consistent with Phase 4 stub pages approach. | |
| User preferences | Theme, notification preferences, display options. Functional but more work. | ✓ |
| App configuration | Mill settings, system config. Would need more scope definition. | |

**User's choice:** User preferences
**Notes:** Functional preferences page, not just a stub

### Preference Types

| Option | Description | Selected |
|--------|-------------|----------|
| Notification preferences | Toggle which notification types to show. Pairs well with notification system choice. | |
| Display/theme options | Light/dark mode, density, font size. Visual customization. | |
| Both notification + display | Full preferences panel with multiple sections. | ✓ |

**User's choice:** Both notification + display
**Notes:** Full preferences covering notifications and display settings

### Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | Persist to browser. Works offline. Consistent with notification persistence choice. | ✓ |
| Session only | Preferences reset on page refresh. Simpler but less useful. | |
| You decide | Claude chooses the implementation approach. | |

**User's choice:** localStorage (Recommended)
**Notes:** Consistent with notification persistence approach

---

## Header Layout Changes

### Dynamic Title

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamic per route | Show 'Orders' on /orders, 'Settings' on /settings, etc. More contextual. | ✓ |
| Static 'Dashboard' | Keep current behavior. Header always shows 'Dashboard'. | |
| You decide | Claude chooses based on navigation patterns. | |

**User's choice:** Dynamic per route (Recommended)
**Notes:** Title reflects current page for better context

### Visual Changes

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current design | Existing layout works. Just add functionality to search, bell, settings. | |
| Add notification badge | Show unread count badge on the bell icon. Visual indicator. | |
| Both badge + keep design | Keep layout but add notification badge indicator. | ✓ |

**User's choice:** Both badge + keep design
**Notes:** Keep layout, add badge indicator

---

## Claude's Discretion

- Notification dropdown positioning and styling
- Settings page layout and section organization
- Specific preference controls (toggles, selects, etc.)
- Route-to-title mapping implementation

## Deferred Ideas

- Global search functionality — not discussed but in requirements (HEADER-01)
- Real notification backend — mock service for now
