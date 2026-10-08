import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';

// Sign-in runs a reCAPTCHA check + API call ("Verifying...") that can outlast the
// default 5s expect timeout, so the post-login redirect gets a longer window.
const LOGIN_REDIRECT_TIMEOUT = 30_000;

test.describe('Change Password', () => {
  let loginPage: LoginPage;
  let changePasswordPage: ChangePasswordPage;

  test.beforeEach(async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    test.skip(!email || !password, 'TEST_EMAIL / TEST_PASSWORD not set in .env');

    loginPage = new LoginPage(page);
    changePasswordPage = new ChangePasswordPage(page);

    await test.step('log in', async () => {
      await loginPage.goto();
      await loginPage.login(email!, password!);
      await expect(page).toHaveURL(/\/dashboard/, { timeout: LOGIN_REDIRECT_TIMEOUT });
      await expect(new DashboardPage(page).heading).toBeVisible();
    });

    await changePasswordPage.goto();
    await expect(changePasswordPage.heading).toBeVisible();
  });

  test('renders the Change Password form with all three fields', async () => {
    await expect(changePasswordPage.currentPasswordInput).toBeVisible();
    await expect(changePasswordPage.newPasswordInput).toBeVisible();
    await expect(changePasswordPage.confirmPasswordInput).toBeVisible();
    await expect(changePasswordPage.submitButton).toBeVisible();
    await expect(changePasswordPage.cancelButton).toBeVisible();
  });

  test('shows required-field errors when submitting an empty form', async ({ page }) => {
    await changePasswordPage.submitButton.click();

    await expect(page.getByText(/current password is required/i)).toBeVisible();
    await expect(page.getByText(/new password is required/i)).toBeVisible();
    await expect(page).toHaveURL(/\/change-password/);
  });

  test('shows a mismatch error when confirmation does not match the new password', async ({ page }) => {
    await changePasswordPage.changePassword('OldPass123!', 'NewPass123!', 'Different123!');

    await expect(page.getByText(/(password.*(do not|does not|doesn't) match|passwords do not match)/i)).toBeVisible();
    await expect(page).toHaveURL(/\/change-password/);
  });
});
