import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Settings → Step-up Authentication.
 *
 * The "Re-Authentication Methods" section (Issue/Revoke/Reissue credential, each
 * with Mobile OTP / Email OTP / Trust-this-device radios) and the Save Settings
 * button only render once Two-Factor Authentication is enabled. Enabling 2FA
 * requires a verified mobile number + OTP, so on an account without one the 2FA
 * toggle stays disabled and only the toggle section is shown.
 */
export class StepUpAuthPage extends BasePage {
  readonly heading: Locator;
  readonly twoFactorToggle: Locator;
  readonly disabledStatusHeading: Locator;
  readonly saveSettingsButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Two Factor Authentication', level: 2 });
    // The 2FA toggle exposes the checkbox role.
    this.twoFactorToggle = page.getByRole('main').getByRole('checkbox');
    this.disabledStatusHeading = page.getByRole('heading', {
      name: 'Two-Factor Authentication is Disabled',
      level: 3,
    });
    // Only present when 2FA (and the Re-Authentication Methods) are enabled.
    this.saveSettingsButton = page.getByRole('button', { name: /save settings/i });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/profile/step-up-authentication');
  }
}
