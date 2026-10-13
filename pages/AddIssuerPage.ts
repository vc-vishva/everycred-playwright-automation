import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Issuers → Add Issuer.
 *
 * A multi-step wizard (Organization identity → Blockchain Credential Setup →
 * Signing keys → Review). This page object covers the first step, "Organization
 * identity", where the legal identity backing every credential is collected.
 */
export class AddIssuerPage extends BasePage {
  readonly pageHeading: Locator;
  readonly orgIdentityHeading: Locator;
  // Wizard step tabs down the left rail.
  readonly orgIdentityStep: Locator;
  readonly blockchainSetupStep: Locator;
  readonly signingKeysStep: Locator;
  readonly reviewStep: Locator;
  // Form fields. Targeted by placeholder, matching the app-wide pattern where the
  // visible "* " labels aren't associated with their inputs.
  readonly legalEntityNameInput: Locator;
  readonly emailInput: Locator;
  readonly entityTypeInput: Locator;
  readonly primaryDomainInput: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: 'Add Issuer', level: 1 });
    // "Organization identity" is both the content heading and a step tab; pin the
    // heading by a non-tab role so each locator resolves to one element.
    this.orgIdentityHeading = page.getByRole('heading', { name: 'Organization identity' });
    this.orgIdentityStep = page.getByRole('button', { name: 'Organization identity' });
    this.blockchainSetupStep = page.getByRole('button', { name: 'Blockchain Credential Setup' });
    this.signingKeysStep = page.getByRole('button', { name: 'Signing keys' });
    this.reviewStep = page.getByRole('button', { name: 'Review' });
    this.legalEntityNameInput = page.getByPlaceholder('Legal Name of the Issuing Organization');
    this.emailInput = page.getByPlaceholder(/official issuer email/i);
    this.entityTypeInput = page.getByPlaceholder(/type of entity/i);
    this.primaryDomainInput = page.getByPlaceholder(/website url/i);
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/issuer/add');
  }

  /**
   * Fill the text fields of the Organization identity step. Does NOT submit or
   * upload a logo, so tests can validate the form without creating a real issuer.
   */
  async fillOrganizationIdentity(
    legalEntityName: string,
    email: string,
    entityType = '',
    primaryDomain = '',
  ): Promise<void> {
    await this.legalEntityNameInput.fill(legalEntityName);
    await this.emailInput.fill(email);
    if (entityType) await this.entityTypeInput.fill(entityType);
    if (primaryDomain) await this.primaryDomainInput.fill(primaryDomain);
  }
}
