import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

// Sign-in runs a reCAPTCHA check + API call ("Verifying...") that can outlast the
// default 5s expect timeout, so the post-login redirect gets a longer window.
const LOGIN_REDIRECT_TIMEOUT = 30_000;

// `baseURL` is a test-scoped option and isn't injectable into a worker-scoped
// fixture, so resolve it from the same env vars playwright.config.ts uses: the
// environment named by BASE_URL, else the first one configured.
const ENV_VARS = ['DEV_BASE_URL', 'STAGING_BASE_URL', 'PROD_BASE_URL'] as const;
function resolveBaseURL(): string {
  const requested = process.env.BASE_URL?.trim();
  const byName: Record<string, string> = { dev: 'DEV_BASE_URL', staging: 'STAGING_BASE_URL', prod: 'PROD_BASE_URL' };
  if (requested && byName[requested]) {
    const url = process.env[byName[requested]]?.trim();
    if (url) return url;
  }
  for (const key of ENV_VARS) {
    const url = process.env[key]?.trim();
    if (url) return url;
  }
  throw new Error('No base URL configured: set one of DEV_BASE_URL / STAGING_BASE_URL / PROD_BASE_URL in .env');
}

/**
 * Worker-scoped authenticated page.
 *
 * The app rotates its session token on load, so a persisted storageState becomes
 * invalid after its first reuse. Instead we log in once per worker and keep that
 * single context alive for the worker's lifetime — the live session refreshes in
 * place, exactly like a real user. With `workers: 1` this means one login for the
 * whole authenticated suite, which also avoids tripping the sign-in reCAPTCHA.
 */
export const test = base.extend<{}, { authedPage: Page }>({
  authedPage: [
    async ({ browser }, use) => {
      const email = process.env.TEST_EMAIL;
      const password = process.env.TEST_PASSWORD;
      if (!email || !password) {
        throw new Error('TEST_EMAIL / TEST_PASSWORD must be set in .env to run authenticated tests');
      }

      const context = await browser.newContext({ baseURL: resolveBaseURL() });
      const page = await context.newPage();

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(email, password);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: LOGIN_REDIRECT_TIMEOUT });
      await expect(new DashboardPage(page).heading).toBeVisible();

      await use(page);

      await context.close();
    },
    { scope: 'worker' },
  ],
});

export { expect };
