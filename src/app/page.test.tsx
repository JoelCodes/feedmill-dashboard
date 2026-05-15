/**
 * Unit tests for the Phase 34/35 production homepage (`src/app/page.tsx`).
 *
 * Plan 34-07 (8 tests) + Plan 35-07 (5 new tests):
 *   Plan 34-07:
 *   - Test 1: unauthenticated → redirect('/sign-in')
 *   - Test 2: authenticated mill_operator → ProductionDashboard with canEdit=true
 *   - Test 3: authenticated non-operator → ProductionDashboard with canEdit=false (no redirect)
 *   - Test 4: no ?order= param → getOrderById/getOrderEvents NOT called
 *   - Test 5: ?order=ord_1 → getOrderById + getOrderEvents called; passed to ProductionDashboard
 *   - Test 6: getOrderById returns null (stale id) → drawerOrder=null, drawerEvents=[] (Pitfall 7)
 *   - Test 7 (Pitfall 2): await searchParamsCache.parse(searchParams) in source
 *   - Test 8: export const dynamic = 'force-dynamic' present
 *
 *   Plan 35-07 (KPI integration):
 *   - Test 9 (cookie read): getKpiStrip called with tz cookie value
 *   - Test 10 (cookie absent → fallback): getKpiStrip called with DEFAULT_TIMEZONE
 *   - Test 11 (cookie empty string → fallback): same as Test 10 for empty value
 *   - Test 12 (parallel fan-out): all 6 queries dispatched
 *   - Test 13 (props pass-through): KPI props reach ProductionDashboard
 *   - Test 14 (regression): existing tests still pass (implicit)
 *
 * Uses canonical clerkAuth fixture consumer pattern.
 * ProductionDashboard is mocked to capture props without pulling in client deps.
 */
import {
  clerkAuthMockFactory,
  nextNavigationMockFactory,
} from "@/test/fixtures/clerkAuth";

jest.mock("@clerk/nextjs/server", () => clerkAuthMockFactory());
jest.mock("next/navigation", () => nextNavigationMockFactory());

// Mock @/lib/auth so checkRole is controllable per test
const mockCheckRole = jest.fn();
jest.mock("@/lib/auth", () => ({
  checkRole: (...args: unknown[]) => mockCheckRole(...args),
}));

// Mock DB queries to prevent real DB connections
const mockGetProductionOrders = jest.fn();
const mockGetOrderById = jest.fn();
const mockGetOrderEvents = jest.fn();
jest.mock("@/db/queries/orders", () => ({
  getProductionOrders: (...args: unknown[]) => mockGetProductionOrders(...args),
  getOrderById: (...args: unknown[]) => mockGetOrderById(...args),
}));
jest.mock("@/db/queries/events", () => ({
  getOrderEvents: (...args: unknown[]) => mockGetOrderEvents(...args),
}));

// Mock KPI queries — Plan 35-07
const mockGetKpiStrip = jest.fn();
const mockGetSevenDayTrend = jest.fn();
const mockGetBlockedWithDwell = jest.fn();
jest.mock("@/db/queries/kpis", () => ({
  getKpiStrip: (...args: unknown[]) => mockGetKpiStrip(...args),
  getSevenDayTrend: (...args: unknown[]) => mockGetSevenDayTrend(...args),
  getBlockedWithDwell: (...args: unknown[]) => mockGetBlockedWithDwell(...args),
}));

// Mock next/headers cookies() — Plan 35-07 D-02
const mockCookiesGet = jest.fn();
jest.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockCookiesGet }),
}));

// Mock @/lib/search-params — searchParamsCache.parse is what the page awaits
const mockParse = jest.fn();
jest.mock("@/lib/search-params", () => ({
  searchParamsCache: {
    parse: (...args: unknown[]) => mockParse(...args),
  },
  STATE_ORDER: ['Pending', 'Mixing', 'Completed', 'Blocked'],
}));

// Mock DashboardLayout to avoid pulling in DashboardLayout deps (Sidebar, Header, Clerk UI)
jest.mock("@/components/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock ProductionDashboard — capture the props passed to it
const capturedProductionDashboardProps: Record<string, unknown>[] = [];
jest.mock("@/components/ProductionDashboard", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedProductionDashboardProps.push({ ...props });
    return <div data-testid="production-dashboard" data-can-edit={String(props.canEdit)} />;
  },
}));

import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import HomePage from "./page";
import {
  mockAuth,
  mockUnauthenticatedSession,
  mockNonDemoSession,
  mockMillOperatorSession,
} from "@/test/fixtures/clerkAuth";

const FIXTURE_ORDERS = [
  {
    id: 'ord_1',
    orderNumber: 'ORD-001',
    customer: 'Acme Corp',
    product: 'Widget A',
    weightLbs: '1200.00',
    deliveryTime: '2026-05-20',
    state: 'Pending' as const,
    millLine: 'Premix' as const,
    textureType: null,
    lineCode: null,
    version: 1,
    createdBy: 'user_1',
    updatedAt: new Date(),
  },
];
const FIXTURE_ORDER = FIXTURE_ORDERS[0];
const FIXTURE_EVENTS = [
  {
    id: 'evt_1',
    orderId: 'ord_1',
    fromState: null,
    toState: 'Pending' as const,
    changedBy: 'user_1',
    changedAt: new Date(),
    note: 'Imported from XLSX',
  },
];

// KPI fixtures
const FIXTURE_KPI_STRIP = {
  completedTodayLbs: '18400',
  premixLbs: '6000',
  excelLbs: '8000',
  cgmLbs: '4400',
  pendingCount: 5,
  pendingLbs: '47200',
  pelletPct: 58,
  mashPct: 32,
  crumblePct: 10,
  uncategorizedCount: 3,
};
const FIXTURE_TREND = [{ date: '2026-05-14', completedLbs: 18400 }];
const FIXTURE_BLOCKED = [
  {
    orderId: 'ord_1',
    orderNumber: 'ORD-001',
    customer: 'Acme Corp',
    millLine: 'Premix' as const,
    dwellSeconds: 3600,
    dwellFormatted: '1h 0m',
    earlyDeliveryDate: null,
    isOverdue: false,
  },
];

beforeEach(() => {
  mockAuth.mockReset();
  mockCheckRole.mockReset();
  mockGetProductionOrders.mockReset();
  mockGetOrderById.mockReset();
  mockGetOrderEvents.mockReset();
  mockGetKpiStrip.mockReset();
  mockGetSevenDayTrend.mockReset();
  mockGetBlockedWithDwell.mockReset();
  mockCookiesGet.mockReset();
  mockParse.mockReset();
  capturedProductionDashboardProps.length = 0;

  // Default happy-path setup
  mockGetProductionOrders.mockResolvedValue(FIXTURE_ORDERS);
  mockGetOrderById.mockResolvedValue(FIXTURE_ORDER);
  mockGetOrderEvents.mockResolvedValue(FIXTURE_EVENTS);
  mockGetKpiStrip.mockResolvedValue(FIXTURE_KPI_STRIP);
  mockGetSevenDayTrend.mockResolvedValue(FIXTURE_TREND);
  mockGetBlockedWithDwell.mockResolvedValue(FIXTURE_BLOCKED);
  // Default: tz cookie present with a valid IANA value
  mockCookiesGet.mockReturnValue({ value: 'America/New_York' });
});

describe("HomePage (Phase 34 full RSC — plan 34-07)", () => {
  it("Test 1: redirects to /sign-in when unauthenticated", async () => {
    mockUnauthenticatedSession();
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });

    await expect(
      HomePage({ searchParams: Promise.resolve({}) })
    ).rejects.toMatchObject({ url: "/sign-in" });
  });

  it("Test 2: mill_operator sees ProductionDashboard with canEdit=true", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });

    const element = await HomePage({ searchParams: Promise.resolve({}) });
    render(element);

    const dashboard = screen.getByTestId("production-dashboard");
    expect(dashboard).toBeInTheDocument();
    expect(dashboard.getAttribute("data-can-edit")).toBe("true");
  });

  it("Test 3: authenticated non-operator sees ProductionDashboard with canEdit=false (no redirect — D-02)", async () => {
    mockNonDemoSession("user");
    mockCheckRole.mockResolvedValue(false);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });

    const element = await HomePage({ searchParams: Promise.resolve({}) });
    render(element);

    const dashboard = screen.getByTestId("production-dashboard");
    expect(dashboard).toBeInTheDocument();
    expect(dashboard.getAttribute("data-can-edit")).toBe("false");
  });

  it("Test 4: with no ?order= param, getOrderById and getOrderEvents are NOT called", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    // parse returns empty order
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });

    await HomePage({ searchParams: Promise.resolve({}) });

    expect(mockGetOrderById).not.toHaveBeenCalled();
    expect(mockGetOrderEvents).not.toHaveBeenCalled();
  });

  it("Test 5: with ?order=ord_1, getOrderById and getOrderEvents are called with 'ord_1'", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: 'ord_1', status: [], q: '' });
    mockGetOrderById.mockResolvedValue(FIXTURE_ORDER);
    mockGetOrderEvents.mockResolvedValue(FIXTURE_EVENTS);

    const element = await HomePage({ searchParams: Promise.resolve({ order: 'ord_1' }) });
    render(element);

    expect(mockGetOrderById).toHaveBeenCalledTimes(1);
    expect(mockGetOrderById).toHaveBeenCalledWith('ord_1');
    expect(mockGetOrderEvents).toHaveBeenCalledTimes(1);
    expect(mockGetOrderEvents).toHaveBeenCalledWith('ord_1');

    // Props should be passed to ProductionDashboard
    expect(capturedProductionDashboardProps).toHaveLength(1);
    expect(capturedProductionDashboardProps[0].drawerOrder).toEqual(FIXTURE_ORDER);
    expect(capturedProductionDashboardProps[0].drawerEvents).toEqual(FIXTURE_EVENTS);
  });

  it("Test 6: when getOrderById returns null (stale id), no throw — drawerOrder=null, drawerEvents=[] (Pitfall 7)", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: 'ord_stale', status: [], q: '' });
    mockGetOrderById.mockResolvedValue(null);
    mockGetOrderEvents.mockResolvedValue([]);

    // Should not throw
    const element = await HomePage({ searchParams: Promise.resolve({ order: 'ord_stale' }) });
    render(element);

    expect(capturedProductionDashboardProps).toHaveLength(1);
    expect(capturedProductionDashboardProps[0].drawerOrder).toBeNull();
    expect(capturedProductionDashboardProps[0].drawerEvents).toEqual([]);
  });

  it("Test 7 (Pitfall 2): page source awaits searchParamsCache.parse(searchParams)", () => {
    const pageSrc = fs.readFileSync(
      path.join(__dirname, "page.tsx"),
      "utf-8"
    );
    const awaitParseCount = (pageSrc.match(/await searchParamsCache\.parse/g) || []).length;
    expect(awaitParseCount).toBe(1);
  });

  it("Test 8: export const dynamic = 'force-dynamic' is present", () => {
    const pageSrc = fs.readFileSync(
      path.join(__dirname, "page.tsx"),
      "utf-8"
    );
    expect(pageSrc).toContain("export const dynamic = 'force-dynamic'");
  });
});

// ─── Plan 35-07: KPI cookie read + query fan-out tests ──────────────────────

describe("HomePage Phase 35 — KPI cookie read + query fan-out (plan 35-07)", () => {
  it("Test 9 (cookie read): getKpiStrip called with tz cookie value 'America/New_York'", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });
    mockCookiesGet.mockReturnValue({ value: 'America/New_York' });

    await HomePage({ searchParams: Promise.resolve({}) });

    expect(mockGetKpiStrip).toHaveBeenCalledWith('America/New_York');
  });

  it("Test 10 (cookie absent → fallback): getKpiStrip called with 'America/Chicago' when cookie absent", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });
    // Simulate cookie absent: get() returns undefined
    mockCookiesGet.mockReturnValue(undefined);

    await HomePage({ searchParams: Promise.resolve({}) });

    expect(mockGetKpiStrip).toHaveBeenCalledWith('America/Chicago');
  });

  it("Test 11 (cookie empty string → fallback): getKpiStrip called with 'America/Chicago' when cookie value is ''", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });
    // Simulate cookie with empty string value
    mockCookiesGet.mockReturnValue({ value: '' });

    await HomePage({ searchParams: Promise.resolve({}) });

    expect(mockGetKpiStrip).toHaveBeenCalledWith('America/Chicago');
  });

  it("Test 12 (parallel fan-out): all 6 queries dispatched (getProductionOrders, getKpiStrip, getSevenDayTrend, getBlockedWithDwell, and optionally getOrderById/getOrderEvents when order present)", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });
    mockCookiesGet.mockReturnValue({ value: 'America/Chicago' });

    await HomePage({ searchParams: Promise.resolve({}) });

    // Core 4 queries always called
    expect(mockGetProductionOrders).toHaveBeenCalledTimes(1);
    expect(mockGetKpiStrip).toHaveBeenCalledTimes(1);
    expect(mockGetSevenDayTrend).toHaveBeenCalledTimes(1);
    expect(mockGetBlockedWithDwell).toHaveBeenCalledTimes(1);
    // When no ?order=, the two drawer queries are NOT called
    expect(mockGetOrderById).not.toHaveBeenCalled();
    expect(mockGetOrderEvents).not.toHaveBeenCalled();
  });

  it("Test 13 (props pass-through): kpiStrip, kpiTrend, kpiBlocked props reach ProductionDashboard", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);
    mockParse.mockResolvedValue({ order: '', status: [], q: '' });
    mockCookiesGet.mockReturnValue({ value: 'America/Chicago' });
    mockGetKpiStrip.mockResolvedValue(FIXTURE_KPI_STRIP);
    mockGetSevenDayTrend.mockResolvedValue(FIXTURE_TREND);
    mockGetBlockedWithDwell.mockResolvedValue(FIXTURE_BLOCKED);

    const element = await HomePage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(capturedProductionDashboardProps).toHaveLength(1);
    expect(capturedProductionDashboardProps[0].kpiStrip).toEqual(FIXTURE_KPI_STRIP);
    expect(capturedProductionDashboardProps[0].kpiTrend).toEqual(FIXTURE_TREND);
    expect(capturedProductionDashboardProps[0].kpiBlocked).toEqual(FIXTURE_BLOCKED);
  });
});
