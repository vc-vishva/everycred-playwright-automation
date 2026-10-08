import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';

// Sign-in runs a reCAPTCHA check + API call ("Verifying...") that can outlast the
// default 5s expect timeout, so the post-login redirect gets a longer window.
const LOGIN_REDIRECT_TIMEOUT = 30_000;

// Log in once and reuse the session across all tests in this file: repeated
// logins in quick succession trip the sign-in reCAPTCHA, so each test shares a
// single authenticated page (hence serial mode).
test.describe.serial('Change Password', () => {
  let page: Page;
  let changePasswordPage: ChangePasswordPage;

  test.beforeAll(async ({ browser }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    test.skip(!email || !password, 'TEST_EMAIL / TEST_PASSWORD not set in .env');

    page = await browser.newPage();
    const loginPage = new LoginPage(page);
    changePasswordPage = new ChangePasswordPage(page);

    await loginPage.goto();
    await loginPage.login(email!, password!);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: LOGIN_REDIRECT_TIMEOUT });
    await expect(new DashboardPage(page).heading).toBeVisible();
  });

  test.afterAll(async () => {
    await page?.close();
  });

  test.beforeEach(async () => {
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

  test('keeps the submit button disabled while the form is empty', async () => {
    await expect(changePasswordPage.submitButton).toBeDisabled();
  });

  test('enables submit once all fields are filled', async () => {
    await changePasswordPage.currentPasswordInput.fill('OldPass123!');
    await changePasswordPage.newPasswordInput.fill('NewPass123!');
    await changePasswordPage.confirmPasswordInput.fill('NewPass123!');
    await expect(changePasswordPage.submitButton).toBeEnabled();
  });
});
