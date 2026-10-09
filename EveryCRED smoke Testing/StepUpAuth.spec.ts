import { test, expect } from './fixtures';
import { StepUpAuthPage } from '../pages/StepUpAuthPage';

// Deep-links straight to the page, which fetches settings on load.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Step-up Authentication', () => {
  let stepUpAuthPage: StepUpAuthPage;

  test.beforeEach(async ({ authedPage }) => {
    stepUpAuthPage = new StepUpAuthPage(authedPage);
    await stepUpAuthPage.goto();
    await expect(stepUpAuthPage.heading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
  });

  test('renders the Two Factor Authentication section with a toggle', async () => {
    await expect(stepUpAuthPage.heading).toBeVisible();
    await expect(stepUpAuthPage.twoFactorToggle).toBeVisible();
  });

  test('shows the disabled status when 2FA is off', async () => {
    await expect(stepUpAuthPage.disabledStatusHeading).toBeVisible();
  });

  test('keeps the 2FA toggle disabled without a verified mobile number', async () => {
    // On an account with no verified mobile number, 2FA cannot be enabled, so the
    // toggle is disabled. (With a verified number it would be enabled/toggleable.)
    await expect(stepUpAuthPage.twoFactorToggle).toBeDisabled();
  });
});
