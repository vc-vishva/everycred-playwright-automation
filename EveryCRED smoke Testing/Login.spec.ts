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

  test('opens Forgot Password and returns to login', async () => {
    await loginPage.openForgotPassword();
    await expect(loginPage.sendRecoveryEmailButton).toBeVisible();

    await loginPage.backToLoginButton.click();
    await expect(loginPage.forgotPasswordButton).toBeVisible();
  });

  test('Forgot Password requires a valid email', async ({ page }) => {
    await loginPage.openForgotPassword();

    // Submit with an empty field: the form must reject it and stay on the view.
    // We deliberately never submit a real address — that would send a live
    // recovery email to the account.
    await loginPage.sendRecoveryEmailButton.click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(loginPage.forgotPasswordHeading).toBeVisible();
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
      // This account is also signed in by the worker fixture, so a concurrent
      // login can hit the 5-session cap; clear a slot if the dialog appears.
      await loginPage.resolveSessionLimitIfPresent();
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
