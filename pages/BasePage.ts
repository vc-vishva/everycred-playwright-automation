import { Page } from '@playwright/test';

/**
 * Shared base class for all Page Object Model classes.
 * Extend this for each app page and add page-specific locators/actions.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async title(): Promise<string> {
    return this.page.title();
  }
}
