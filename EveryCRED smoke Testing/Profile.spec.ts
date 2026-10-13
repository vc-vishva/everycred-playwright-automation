import { test, expect } from './fixtures';
import { ProfilePage } from '../pages/ProfilePage';

// Each test deep-links straight to the page, which fetches profile data on load,
// so give the headings a generous appearance window.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Profile', () => {
  // These tests drive heavy navigation on the shared session; the app's session
  // token rotation can occasionally race a hard navigation and bounce to login.
  // One retry lets such a transient drop self-heal instead of failing the run.
  test.describe.configure({ retries: 1 });

  let profilePage: ProfilePage;

  test.beforeEach(async ({ authedPage }) => {
    profilePage = new ProfilePage(authedPage);
    await profilePage.goto();
    await expect(profilePage.heading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
  });

  test('renders the profile form with populated name and email', async () => {
    // On load the card is read-only and shows the name/email as text, not inputs.
    // Enter edit mode (which first waits for the late profile-data fetch) to
    // reveal the populated Full Name and Email fields.
    await profilePage.enterEditMode();
    await expect(profilePage.fullNameInput).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
    await expect(profilePage.emailInput).toBeVisible();
    await expect(profilePage.fullNameInput).not.toHaveValue('');
    await expect(profilePage.emailInput).not.toHaveValue('');
  });

  test('renders the Register Mobile Number section', async () => {
    // This section renders after a later async profile-data fetch.
    await expect(profilePage.registerMobileHeading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
    await expect(profilePage.countryCodeSelect).toBeVisible();
    await expect(profilePage.mobileNumberInput).toBeVisible();
  });

  test('shows the Save Changes button once in edit mode', async () => {
    // Save Changes only renders after entering edit mode (read-only on load).
    await profilePage.enterEditMode();
    await expect(profilePage.saveButton).toBeVisible();
    // KNOWN UX FINDING: the button looks greyed/disabled but is NOT disabled in
    // the DOM — it is enabled immediately, before any field changes. Reported to
    // the dev team; asserting the actual behavior so this stays a real signal.
    await expect(profilePage.saveButton).toBeEnabled();
  });

  test('edits Full Name via the account menu and restores it', async ({ authedPage }) => {
    // Multi-step edit → save → verify → restore flow needs more than the 30s default.
    test.setTimeout(90_000);

    // Exercise the real route: start on the dashboard, then avatar → My Profile.
    // Confirm the dashboard actually loaded (shared session alive) before using
    // the account menu — a hard navigation can briefly race the app's session
    // token rotation and bounce to login.
    await authedPage.goto('/issuer/admin/dashboard');
    await expect(authedPage).toHaveURL(/\/dashboard/, { timeout: PAGE_READY_TIMEOUT });
    await profilePage.openFromAccountMenu();
    await expect(profilePage.heading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });

    // Enter edit mode and remember the current name so we can put it back.
    // Strip any stray " QA" suffix so we always restore to a clean name.
    await profilePage.enterEditMode();
    await expect(profilePage.fullNameInput).toBeEditable({ timeout: PAGE_READY_TIMEOUT });
    const originalName = (await profilePage.fullNameInput.inputValue()).replace(/ QA$/, '');
    const updatedName = `${originalName} QA`;

    // Change the name and save.
    await profilePage.setFullName(updatedName);
    await profilePage.save();

    // Reload fresh and re-enter edit mode to confirm the new value persisted.
    // (Re-editing in place right after a save re-disables the field, so reload.)
    await profilePage.goto();
    await expect(profilePage.heading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
    await profilePage.enterEditMode();
    await expect(profilePage.fullNameInput).toHaveValue(updatedName, { timeout: PAGE_READY_TIMEOUT });

    // Restore the original name so the live account is left unchanged.
    await profilePage.setFullName(originalName);
    await profilePage.save();
  });

  test('enables Send OTP after entering a mobile number (no submit)', async () => {
    // Enter edit mode to reveal the Register Mobile Number controls.
    await profilePage.enterEditMode();
    await expect(profilePage.countryCodeSelect).toBeVisible();
    await expect(profilePage.mobileNumberInput).toBeVisible();

    // Send OTP stays disabled until a number is typed.
    await expect(profilePage.sendOtpButton).toBeDisabled();

    // Typing a number enables Send OTP. We deliberately do NOT click it —
    // that would send a real OTP and change the live account's number.
    await profilePage.mobileNumberInput.fill('9876543210');
    await expect(profilePage.sendOtpButton).toBeEnabled();

    // Cancel to discard the entry and leave the account untouched.
    await profilePage.cancelButton.click();
  });
});
