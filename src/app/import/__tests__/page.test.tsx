/**
 * Unit tests for src/app/import/page.tsx — plan 34-07.
 *
 * Tests 13-15: RSC page tests for the /import route.
 *   - Test 13: unauthenticated → redirect('/sign-in')
 *   - Test 14: authenticated → DashboardLayout + ImportFlow; getImportBatches called once
 *   - Test 15: canEdit from checkRole('mill_operator') is passed to ImportFlow
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

// Mock getImportBatches to prevent real DB connections
const mockGetImportBatches = jest.fn();
jest.mock("@/db/queries/imports", () => ({
  getImportBatches: (...args: unknown[]) => mockGetImportBatches(...args),
}));

// Mock DashboardLayout
jest.mock("@/components/DashboardLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

// Mock ImportFlow — capture props
const capturedImportFlowProps: Record<string, unknown>[] = [];
jest.mock("@/components/ImportFlow", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedImportFlowProps.push({ ...props });
    return (
      <div
        data-testid="import-flow"
        data-can-edit={String(props.canEdit)}
      />
    );
  },
}));

import { render, screen } from "@testing-library/react";
import ImportPage from "../page";
import {
  mockAuth,
  mockUnauthenticatedSession,
  mockMillOperatorSession,
  mockNonDemoSession,
} from "@/test/fixtures/clerkAuth";
import type { ImportBatch } from "@/db/schema/imports";

const FIXTURE_BATCHES: ImportBatch[] = [
  {
    id: 'batch_1',
    fileName: 'Book1.xlsx',
    rowCount: 5,
    importedBy: 'user_123',
    importedAt: new Date('2026-05-14T10:00:00Z'),
  },
];

beforeEach(() => {
  mockAuth.mockReset();
  mockCheckRole.mockReset();
  mockGetImportBatches.mockReset();
  capturedImportFlowProps.length = 0;

  mockGetImportBatches.mockResolvedValue(FIXTURE_BATCHES);
});

describe("ImportPage (/import RSC — plan 34-07)", () => {
  it("Test 13: redirects to /sign-in when unauthenticated", async () => {
    mockUnauthenticatedSession();

    await expect(ImportPage()).rejects.toMatchObject({ url: "/sign-in" });
  });

  it("Test 14: authenticated → renders DashboardLayout + ImportFlow; getImportBatches called with limit:10", async () => {
    mockMillOperatorSession();
    mockCheckRole.mockResolvedValue(true);

    const element = await ImportPage();
    render(element);

    expect(screen.getByTestId("dashboard-layout")).toBeInTheDocument();
    expect(screen.getByTestId("import-flow")).toBeInTheDocument();

    expect(mockGetImportBatches).toHaveBeenCalledTimes(1);
    expect(mockGetImportBatches).toHaveBeenCalledWith({ limit: 10 });
  });

  it("Test 15: canEdit from checkRole is passed to ImportFlow as a prop", async () => {
    mockNonDemoSession("user");
    mockCheckRole.mockResolvedValue(false);

    const element = await ImportPage();
    render(element);

    const importFlow = screen.getByTestId("import-flow");
    expect(importFlow.getAttribute("data-can-edit")).toBe("false");
  });
});
