import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly profileButton: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 1 });
    // The header's account menu trigger; its accessible name is "Profile" plus an icon glyph.
    this.profileButton = page.getByRole('banner').getByRole('button', { name: /^Profile/ });
    this.signOutButton = page.getByRole('button', { name: /sign out/i });
  }

  async signOut(): Promise<void> {
    await this.profileButton.click();
    await this.signOutButton.click();
  }
}
