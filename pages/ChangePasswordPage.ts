import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChangePasswordPage extends BasePage {
  readonly heading: Locator;
  readonly currentPasswordInput: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    // The page-level heading is "Settings" (h1); this form's heading is an h2.
    this.heading = page.getByRole('heading', { name: 'Change Password', level: 2 });
    // Each field has a visible "* " label but it isn't associated with the input
    // (no id/for), so getByLabel finds nothing. The inputs also carry no accessible
    // name, so target them positionally within <main> in document order:
    // Current, New, Confirm New. (A visibility toggle flips type between
    // password/text, so don't pin the selector to a type.)
    const inputs = page.getByRole('main').locator('input');
    this.currentPasswordInput = inputs.nth(0);
    this.newPasswordInput = inputs.nth(1);
    this.confirmPasswordInput = inputs.nth(2);
    // "Change Password" also names the page heading, so scope to the submit button.
    this.submitButton = page.getByRole('button', { name: /change password/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/profile/change-password');
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string = newPassword,
  ): Promise<void> {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword);
    await this.submitButton.click();
  }
}
