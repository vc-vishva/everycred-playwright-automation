import { test, expect } from './fixtures';
import { ProfilePage } from '../pages/ProfilePage';

// Each test deep-links straight to the page, which fetches profile data on load,
// so give the headings a generous appearance window.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Profile', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ authedPage }) => {
    profilePage = new ProfilePage(authedPage);
    await profilePage.goto();
    await expect(profilePage.heading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
  });

  test('renders the profile form with populated name and email', async () => {
    await expect(profilePage.fullNameInput).toBeVisible();
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
    await authedPage.goto('/issuer/admin/dashboard');
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
});
