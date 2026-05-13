/**
 * Playwright global setup for Clerk per-role authentication.
 *
 * Signs in each of the three test users (demo, norole, admin) once at suite startup
 * and persists their session storage state to disk so per-role projects can reuse
 * the cookies without re-signing in for every spec.
 *
 * Per RESEARCH §Pitfall 6, sign-in must happen serially to avoid the known
 * @clerk/testing concurrency landmine (clerk/javascript#7891). The
 * `setup.describe.configure({ mode: 'serial' })` call below enforces this.
 *
 * Per RESEARCH §Pitfall 3, `clerk.signIn` requires `window.Clerk` to be hydrated,
 * which means `page.goto('/sign-in')` MUST precede the sign-in call.
 *
 * Storage state files live at `playwright/.clerk/<role>.json`. Gitignored via
 * Plan 27-03 Task 3 (`playwright/.clerk/` entry in .gitignore).
 */

import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';
import path from 'path';
import { promises as fs } from 'fs';

setup.describe.configure({ mode: 'serial' });

setup('global setup', async () => {
  await clerkSetup();
});

type RoleFixture = {
  envEmail: string;
  envPassword: string;
  file: string;
};

const roles: Record<'demo' | 'norole' | 'admin' | 'mill-operator', RoleFixture> = {
  demo: {
    envEmail: 'E2E_DEMO_USER_EMAIL',
    envPassword: 'E2E_DEMO_USER_PASSWORD',
    file: 'playwright/.clerk/demo.json',
  },
  norole: {
    envEmail: 'E2E_NOROLE_USER_EMAIL',
    envPassword: 'E2E_NOROLE_USER_PASSWORD',
    file: 'playwright/.clerk/norole.json',
  },
  admin: {
    envEmail: 'E2E_ADMIN_USER_EMAIL',
    envPassword: 'E2E_ADMIN_USER_PASSWORD',
    file: 'playwright/.clerk/admin.json',
  },
  'mill-operator': {
    envEmail: 'E2E_MILL_OPERATOR_USER_EMAIL',
    envPassword: 'E2E_MILL_OPERATOR_USER_PASSWORD',
    file: 'playwright/.clerk/mill-operator.json',
  },
};

for (const [role, cfg] of Object.entries(roles)) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const email = process.env[cfg.envEmail];
    const password = process.env[cfg.envPassword];
    if (!email || !password) {
      throw new Error(
        `Missing env: ${cfg.envEmail} or ${cfg.envPassword}; populate .env.local per docs/clerk-setup.md`,
      );
    }

    const outPath = path.resolve(__dirname, '..', cfg.file);
    await fs.mkdir(path.dirname(outPath), { recursive: true });

    // Pitfall 3: page.goto MUST precede clerk.signIn so window.Clerk is hydrated.
    await page.goto('/sign-in');
    await clerk.signIn({
      page,
      signInParams: { strategy: 'password', identifier: email, password },
    });

    // Drive a post-sign-in navigation so the session cookie commits to the context.
    await page.goto('/');
    await page.context().storageState({ path: outPath });
  });
}
