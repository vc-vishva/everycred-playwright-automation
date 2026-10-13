import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Onboarding → Invite Holder.
 *
 * A multi-step wizard (Invite → Identity → Wallet). This page object covers the
 * first step, "Invite", where a secure invitation is sent for the holder to
 * enrol and set up their wallet.
 */
export class InviteHolderPage extends BasePage {
  readonly pageHeading: Locator;
  readonly inviteHeading: Locator;
  // Wizard step tabs down the left rail.
  readonly inviteStep: Locator;
  readonly identityStep: Locator;
  readonly walletStep: Locator;
  // Form fields. Targeted by placeholder, matching the app-wide pattern where the
  // visible "* " labels aren't associated with their inputs.
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly mobileInput: Locator;
  readonly nextButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: 'Invite Holder', level: 1 });
    // "Invite" is both the content heading (h2) and a step tab; pin the heading
    // by level so each locator resolves to one element.
    this.inviteHeading = page.getByRole('heading', { name: 'Invite', exact: true });
    this.inviteStep = page.getByRole('button', { name: 'Invite', exact: true });
    this.identityStep = page.getByRole('button', { name: 'Identity' });
    this.walletStep = page.getByRole('button', { name: 'Wallet' });
    this.nameInput = page.getByPlaceholder('e.g. John Doe');
    this.emailInput = page.getByPlaceholder('e.g. john@example.com');
    this.mobileInput = page.getByPlaceholder('Enter mobile number');
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/onboarding/invite-holder?section=invite');
  }

  /**
   * Fill the Invite step fields. Does NOT submit, so tests can validate the form
   * without sending a real invitation email. Mobile is optional.
   */
  async fillInvite(name: string, email: string, mobile = ''): Promise<void> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    if (mobile) await this.mobileInput.fill(mobile);
  }
}
