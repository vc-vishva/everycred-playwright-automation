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

  test('keeps Save Changes disabled until the profile is edited', async () => {
    await expect(profilePage.saveButton).toBeVisible();
    await expect(profilePage.saveButton).toBeDisabled();
  });
});
