import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordButton: Locator;
  readonly signUpButton: Locator;
  // Forgot Password view (swaps in place; URL stays on /auth/login).
  readonly forgotPasswordHeading: Locator;
  readonly recoveryEmailInput: Locator;
  readonly sendRecoveryEmailButton: Locator;
  readonly backToLoginButton: Locator;
  // Shown after a successful sign-in when the account already has the maximum of
  // 5 active sessions (automated runs accumulate them). Blocks the redirect until
  // a session is terminated.
  readonly sessionLimitDialog: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i);
    // The app's "Password" <label> is not associated with its input (no id/for),
    // so getByLabel finds nothing; target the password input by type instead.
    this.passwordInput = page.locator('input[type="password"]');
    // Case-sensitive exact match: the login view can show both "Sign In" (the
    // submit button) and a secondary "Sign in" button, so an /i regex matches two.
    this.submitButton = page.getByRole('button', { name: 'Sign In', exact: true });
    // Forgot Password and Sign Up swap views in place; the URL stays on /auth/login.
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot password/i });
    this.signUpButton = page.getByRole('button', { name: 'Sign Up' });
    this.forgotPasswordHeading = page.getByRole('heading', { name: 'Forgot Password?' });
    this.sendRecoveryEmailButton = page.getByRole('button', { name: 'Send Recovery Email' });
    this.backToLoginButton = page.getByRole('button', { name: /back to login/i });
    // The Forgot Password view's own email field (same unassociated-label caveat
    // as login, so target the email input within this view by type).
    this.recoveryEmailInput = page.locator('input[type="email"]');
    this.sessionLimitDialog = page.getByRole('dialog', { name: 'Session Limit Reached' });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** Switch the login view into the Forgot Password view. */
  async openForgotPassword(): Promise<void> {
    await this.forgotPasswordButton.click();
    await this.forgotPasswordHeading.waitFor({ state: 'visible' });
  }

  /**
   * If sign-in surfaces the "Session Limit Reached" dialog (the account already
   * has 5 active sessions — automated runs pile these up), free a slot so the
   * login can proceed. Terminates the OLDEST listed session (bottom of the list)
   * to avoid killing this run's most recent session. No-op if the dialog never
   * appears. `timeout` bounds how long we wait for it after submitting.
   */
  async resolveSessionLimitIfPresent(timeout = 8_000): Promise<void> {
    try {
      await this.sessionLimitDialog.waitFor({ state: 'visible', timeout });
    } catch {
      return; // No session-limit dialog — nothing to resolve.
    }
    const terminateButtons = this.sessionLimitDialog.getByRole('button', { name: 'Terminate' });
    await terminateButtons.last().click();
    await this.sessionLimitDialog.waitFor({ state: 'hidden' });
  }
}
