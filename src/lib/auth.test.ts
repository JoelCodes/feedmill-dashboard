// Mock @clerk/nextjs/server.auth() and next/navigation.redirect() BEFORE importing
// the module under test (Pattern C: jest.mock placement). The redirect mock uses a
// sentinel-throw shape so that the function under test does NOT continue executing
// past the redirect call — mirroring real Next.js runtime behavior where redirect()
// throws NEXT_REDIRECT internally (RESEARCH §Pitfall 5).
const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw Object.assign(new Error('NEXT_REDIRECT'), { url });
  },
}));

import { requireRole, checkRole } from './auth';

beforeEach(() => {
  mockAuth.mockReset();
});

describe('requireRole', () => {
  it('redirects to /sign-in when userId is missing', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    });
    await expect(requireRole('demo')).rejects.toMatchObject({ url: '/sign-in' });
  });

  it('redirects to / when role does not match', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['user'] } },
    });
    await expect(requireRole('demo')).rejects.toMatchObject({ url: '/' });
  });

  it('resolves without throwing when role matches', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['demo'] } },
    });
    await expect(requireRole('demo')).resolves.toBeUndefined();
  });

  it('resolves for each role in a multi-role session', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['demo', 'admin'] } },
    });
    await expect(requireRole('demo')).resolves.toBeUndefined();

    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['demo', 'admin'] } },
    });
    await expect(requireRole('admin')).resolves.toBeUndefined();
  });

  it('redirects to / when roles field is missing from metadata', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: {} },
    });
    await expect(requireRole('demo')).rejects.toMatchObject({ url: '/' });
  });

  // Phase 31 (AUTH-01) — mill_operator role coverage.
  // These cases exercise the Role-union extension locked in CONTEXT.md D-01
  // and verified by the v2.0 milestone. They use the canonical
  // `mockAuth.mockResolvedValue({ ... })` pattern established above.

  it("requireRole('mill_operator') resolves when session has roles: ['mill_operator']", async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['mill_operator'] } },
    });
    await expect(requireRole('mill_operator')).resolves.toBeUndefined();
  });

  it("requireRole('mill_operator') redirects to / when role missing", async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['user'] } },
    });
    await expect(requireRole('mill_operator')).rejects.toMatchObject({ url: '/' });
  });

  it("requireRole('mill_operator') resolves when session has roles: ['demo','mill_operator']", async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['demo', 'mill_operator'] } },
    });
    await expect(requireRole('mill_operator')).resolves.toBeUndefined();
  });
});

// Phase 31, Plan 01, Task 2 — checkRole boolean predicate.
// Per CONTEXT.md D-03, src/app/page.tsx will compute
// `const canEdit = await checkRole('mill_operator')` and pass the
// boolean as a prop. The function has NO redirect side-effect — it
// is the read-only counterpart to requireRole.
describe('checkRole', () => {
  it('returns true when session has the role', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['mill_operator'] } },
    });
    await expect(checkRole('mill_operator')).resolves.toBe(true);
  });

  it('returns false when session does not have the role', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['user'] } },
    });
    await expect(checkRole('mill_operator')).resolves.toBe(false);
  });

  it('returns false when metadata is missing', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: {},
    });
    await expect(checkRole('mill_operator')).resolves.toBe(false);
  });

  it('returns true for any of multiple roles in the session', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['demo', 'mill_operator'] } },
    });
    await expect(checkRole('demo')).resolves.toBe(true);

    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { roles: ['demo', 'mill_operator'] } },
    });
    await expect(checkRole('mill_operator')).resolves.toBe(true);
  });

  it('returns false when userId is null (unauthenticated)', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    });
    await expect(checkRole('mill_operator')).resolves.toBe(false);
  });
});
