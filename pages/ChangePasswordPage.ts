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
    this.heading = page.getByRole('heading', { name: 'Change Password', level: 1 });
    // Each field has a visible "* " label but it isn't associated with the input
    // (no id/for), so getByLabel finds nothing; target the three password inputs
    // positionally in document order: Current, New, Confirm New.
    const passwordInputs = page.locator('input[type="password"]');
    this.currentPasswordInput = passwordInputs.nth(0);
    this.newPasswordInput = passwordInputs.nth(1);
    this.confirmPasswordInput = passwordInputs.nth(2);
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
