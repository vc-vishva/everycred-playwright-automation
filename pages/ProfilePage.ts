import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
  readonly heading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly countryCodeSelect: Locator;
  readonly registerMobileHeading: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

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
    this.saveButton = page.getByRole('button', { name: /save changes/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/profile/info');
  }
}
