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

import { requireRole } from './auth';

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
});
