import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard', level: 1 });
    // "Sign Out" lives directly in the sidebar (no account dropdown to open first).
    // Its accessible name carries a leading icon glyph, so match on substring.
    this.signOutButton = page.getByRole('button', { name: /sign out/i });
  }

  async signOut(): Promise<void> {
    await this.signOutButton.click();
  }
}
