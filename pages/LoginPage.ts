import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordButton: Locator;
  readonly signUpButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    // The app's "Password" <label> is not associated with its input (no id/for),
    // so getByLabel finds nothing; target the password input by type instead.
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.getByRole('button', { name: /log ?in|sign ?in/i });
    // Forgot Password and Sign Up swap views in place; the URL stays on /auth/login.
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot password/i });
    this.signUpButton = page.getByRole('button', { name: 'Sign Up' });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
