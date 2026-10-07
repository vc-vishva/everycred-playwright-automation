import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

// Sign-in runs a reCAPTCHA check + API call ("Verifying...") that can outlast the
// default 5s expect timeout, so the post-login redirect gets a longer window.
const LOGIN_REDIRECT_TIMEOUT = 30_000;

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('shows required-field errors when submitting an empty form', async ({ page }) => {
    await loginPage.submitButton.click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('opens Forgot Password and returns to login', async ({ page }) => {
    await loginPage.forgotPasswordButton.click();
    await expect(page.getByRole('heading', { name: 'Forgot Password?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Recovery Email' })).toBeVisible();

    await page.getByRole('button', { name: /back to login/i }).click();
    await expect(loginPage.forgotPasswordButton).toBeVisible();
  });

  test('opens Sign Up and returns to login', async ({ page }) => {
    await loginPage.signUpButton.click();
    await expect(page.getByRole('textbox', { name: /^name/i })).toBeVisible();
    await expect(page.getByText('Already have an account?')).toBeVisible();

    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(loginPage.forgotPasswordButton).toBeVisible();
  });

  test('logs in with valid default credentials and signs out', async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    test.skip(!email || !password, 'TEST_EMAIL / TEST_PASSWORD not set in .env');

    const dashboard = new DashboardPage(page);

    await test.step('log in', async () => {
      await loginPage.login(email!, password!);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: LOGIN_REDIRECT_TIMEOUT });
      await expect(dashboard.heading).toBeVisible();
    });

    await test.step('sign out', async () => {
      await dashboard.signOut();
      await expect(page).toHaveURL(/\/auth\/login/);
      await expect(loginPage.submitButton).toBeVisible();
    });
  });
});
