/**
 * Unit tests for the Phase 34 production homepage (`src/app/page.tsx`).
 *
 * Plan 34-07 full rewrite — 8 tests covering:
 *   - Test 1: unauthenticated → redirect('/sign-in')
 *   - Test 2: authenticated mill_operator → ProductionDashboard with canEdit=true
 *   - Test 3: authenticated non-operator → ProductionDashboard with canEdit=false (no redirect)
 *   - Test 4: no ?order= param → getOrderById/getOrderEvents NOT called
 *   - Test 5: ?order=ord_1 → getOrderById + getOrderEvents called; passed to ProductionDashboard
 *   - Test 6: getOrderById returns null (stale id) → drawerOrder=null, drawerEvents=[] (Pitfall 7)
 *   - Test 7 (Pitfall 2): await searchParamsCache.parse(searchParams) in source
 *   - Test 8: export const dynamic = 'force-dynamic' present
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

beforeEach(() => {
  mockAuth.mockReset();
  mockCheckRole.mockReset();
  mockGetProductionOrders.mockReset();
  mockGetOrderById.mockReset();
  mockGetOrderEvents.mockReset();
  mockParse.mockReset();
  capturedProductionDashboardProps.length = 0;

  // Default happy-path setup
  mockGetProductionOrders.mockResolvedValue(FIXTURE_ORDERS);
  mockGetOrderById.mockResolvedValue(FIXTURE_ORDER);
  mockGetOrderEvents.mockResolvedValue(FIXTURE_EVENTS);
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
