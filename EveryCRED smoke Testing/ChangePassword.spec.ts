import { test, expect } from './fixtures';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';

// Each test deep-links straight to the page, which can take a moment to render,
// so give the first heading a generous appearance window.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Change Password', () => {
  let changePasswordPage: ChangePasswordPage;

  test.beforeEach(async ({ authedPage }) => {
    changePasswordPage = new ChangePasswordPage(authedPage);
    await changePasswordPage.goto();
    await expect(changePasswordPage.heading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
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
