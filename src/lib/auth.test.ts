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

import { checkRole, requireRole } from './auth';

beforeEach(() => {
  mockAuth.mockReset();
});

describe('checkRole', () => {
  it('returns true when claim matches', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { role: 'demo' } },
    });
    expect(await checkRole('demo')).toBe(true);
  });

  it('returns false when claim does not match', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { role: 'admin' } },
    });
    expect(await checkRole('demo')).toBe(false);
  });

  it('returns false when sessionClaims is undefined', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: undefined,
    });
    expect(await checkRole('demo')).toBe(false);
  });

  it('returns false when metadata.role is missing', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: {} },
    });
    expect(await checkRole('demo')).toBe(false);
  });

  it('returns false when userId is null (unauthenticated)', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    });
    expect(await checkRole('demo')).toBe(false);
  });
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
      sessionClaims: { metadata: { role: 'user' } },
    });
    await expect(requireRole('demo')).rejects.toMatchObject({ url: '/' });
  });

  it('resolves without throwing when role matches', async () => {
    mockAuth.mockResolvedValue({
      userId: 'u1',
      sessionClaims: { metadata: { role: 'demo' } },
    });
    await expect(requireRole('demo')).resolves.toBeUndefined();
  });
});
