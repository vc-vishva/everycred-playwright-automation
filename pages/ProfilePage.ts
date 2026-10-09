import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly countryCodeSelect: Locator;
  readonly registerMobileHeading: Locator;
  readonly sendOtpButton: Locator;
  readonly editProfileButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  // Account menu in the top banner → "My Profile" link (the real-user route here).
  readonly accountMenuButton: Locator;
  readonly myProfileLink: Locator;

  constructor(page: Page) {
    super(page);
    // The page-level heading is "Settings" (h1); this tab's heading is an h2.
    this.heading = page.getByRole('heading', { name: 'Profile Information', level: 2 });
    // Fields carry a visible "* " label that isn't associated with the input
    // (no id/for), so getByLabel finds nothing. Target the inputs positionally
    // within <main> in document order — excluding the hidden avatar file input:
    // Full Name, Email, Mobile Number.
    const inputs = page.getByRole('main').locator('input:not([type="file"])');
    this.fullNameInput = inputs.nth(0);
    this.emailInput = inputs.nth(1);
    this.mobileNumberInput = inputs.nth(2);
    this.countryCodeSelect = page.getByRole('combobox', { name: /country code/i });
    this.registerMobileHeading = page.getByRole('heading', { name: 'Register Mobile Number' });
    // Disabled until a mobile number is entered; clicking it would send a real OTP.
    this.sendOtpButton = page.getByRole('button', { name: /send otp/i });
    // The profile card is read-only on load; the pencil ("Edit profile") unlocks
    // the form (editable Full Name + Save Changes / Cancel).
    this.editProfileButton = page.getByRole('button', { name: /edit profile/i });
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    // Another " Cancel" button (with a leading icon) exists elsewhere, so match
    // the profile form's Cancel by its exact accessible name.
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
    // The account dropdown is the last button in the top banner (the avatar + name).
    this.accountMenuButton = page.getByRole('banner').getByRole('button').last();
    // "My Profile" is a plain clickable text node (not a link/button role), so
    // match it by its exact text.
    this.myProfileLink = page.getByText('My Profile', { exact: true });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/profile/info');
  }

  /** Reach the profile page the way a user does: avatar menu → "My Profile". */
  async openFromAccountMenu(): Promise<void> {
    await this.accountMenuButton.click();
    await this.myProfileLink.click();
  }

  /**
   * Wait until the profile's late async data fetch has finished. The "Register
   * Mobile Number" section renders only after that fetch, so its heading is a
   * reliable "fully loaded" marker. Entering edit mode before this completes can
   * be reset by the late re-render.
   */
  async waitUntilLoaded(timeout = 30_000): Promise<void> {
    await this.registerMobileHeading.waitFor({ state: 'visible', timeout });
  }

  /** Click the card pencil to switch the form from read-only into edit mode. */
  async enterEditMode(): Promise<void> {
    await this.waitUntilLoaded();
    await this.editProfileButton.click();
  }

  /** Replace the Full Name value (must be in edit mode first). */
  async setFullName(name: string): Promise<void> {
    await this.fullNameInput.waitFor({ state: 'visible' });
    await this.fullNameInput.fill(name);
  }

  /** Click Save Changes and wait for the form to return to read-only. */
  async save(): Promise<void> {
    await this.saveButton.click();
    // Save closes edit mode and the pencil reappears — a reliable "done" signal.
    await this.editProfileButton.waitFor({ state: 'visible', timeout: 30_000 });
  }
}
