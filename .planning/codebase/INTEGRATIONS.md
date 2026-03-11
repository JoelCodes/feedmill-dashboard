# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Not Detected:**
- No external API integrations currently implemented
- No SDK/client packages for third-party services
- Application uses hardcoded mock data for all dashboard displays

## Data Storage

**Databases:**
- Not integrated
- Currently using in-memory mock data
- No ORM or database client library in dependencies

**File Storage:**
- Not integrated
- Favicon asset stored locally: `src/app/favicon.ico`
- No cloud file storage service

**Caching:**
- Not implemented
- No cache library dependencies

## Authentication & Identity

**Auth Provider:**
- Not implemented
- No authentication framework detected
- No login/session management currently in place

## Monitoring & Observability

**Error Tracking:**
- Not implemented
- No error tracking service integrated

**Logs:**
- Not implemented
- Application uses browser console (via React)
- No centralized logging service

## CI/CD & Deployment

**Hosting:**
- Recommended: Vercel (mentioned in README as easiest deployment option)
- Can deploy to any Node.js hosting provider
- Next.js optimized for Vercel but cloud-agnostic

**CI Pipeline:**
- Not detected
- No CI/CD configuration files found (`.github/workflows/`, GitLab CI, CircleCI, etc.)

## Environment Configuration

**Required env vars:**
- None currently required
- Application runs without environment configuration
- No API keys, database URLs, or secrets needed

**Secrets location:**
- Not applicable - no secrets in use

## Webhooks & Callbacks

**Incoming:**
- Not implemented

**Outgoing:**
- Not implemented

## Mock Data Structure

**Location:** Component files in `src/components/`

**Data Examples:**

**KPI Data** (`src/components/KPICard.tsx`):
- Production metrics (production volume, orders pending, tons shipped, active production lines)
- Hardcoded daily metrics with change indicators

**Order Data** (`src/components/OrdersTable.tsx`):
- Order array with fields: `id`, `destination`, `product`, `tons`, `status`, `hasAlert`
- Status types: `shipped`, `loading`, `mixing`, `pending`
- Sample orders for farm operations (Greenfield Farms TX, Valley Ranch OK, etc.)
- Status configuration with color theming

**Order Details Timeline** (`src/components/OrderDetails.tsx`):
- Timeline of order events (Order Placed → Mill Changed → Production Complete → Delivery Started → Delivery Received)
- Event metadata: icon type, title, description, date, color coding
- Order-specific stats (tons ordered, tons produced, texture/product type)

## Future Integration Patterns

**For Backend Connection:**
- Next.js API routes available at `src/app/api/` (directory not yet created)
- Can use `fetch()` or external HTTP client (axios, etc.) from components
- Server components can handle direct database queries
- Environment variables can be added to `.env.local` when needed

**For Real-Time Data:**
- Can integrate WebSocket libraries (e.g., Socket.io) as dependency
- Next.js supports streaming responses for real-time updates

**For State Management:**
- Currently using React local state via component files
- If needed, can add state management libraries (Redux, Zustand, Jotai)

---

*Integration audit: 2026-03-11*
