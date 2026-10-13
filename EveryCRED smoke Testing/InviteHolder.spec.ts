import { test, expect } from './fixtures';
import { InviteHolderPage } from '../pages/InviteHolderPage';

// The wizard deep-links straight to the Invite step and loads org/onboarding
// context on the way in, so give the heading a generous appearance window.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Invite Holder — Invite', () => {
  let invitePage: InviteHolderPage;

  test.beforeEach(async ({ authedPage }) => {
    invitePage = new InviteHolderPage(authedPage);
    await invitePage.goto();
    await expect(invitePage.pageHeading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
  });

  test('renders the Invite step with its form and wizard tabs', async () => {
    await expect(invitePage.inviteHeading).toBeVisible();
    // Wizard tabs for the three holder-onboarding steps.
    await expect(invitePage.inviteStep).toBeVisible();
    await expect(invitePage.identityStep).toBeVisible();
    await expect(invitePage.walletStep).toBeVisible();
    // Form fields (Name + Email required, Mobile optional) and actions.
    await expect(invitePage.nameInput).toBeVisible();
    await expect(invitePage.emailInput).toBeVisible();
    await expect(invitePage.mobileInput).toBeVisible();
    await expect(invitePage.nextButton).toBeVisible();
    await expect(invitePage.cancelButton).toBeVisible();
  });

  test('blocks advancing with an empty form and stays on the step', async ({ authedPage }) => {
    // Next is clickable immediately (not disabled); submitting an empty form must
    // surface validation and keep us on the Invite step rather than advancing to
    // Identity.
    await invitePage.nextButton.click();

    await expect(authedPage.getByText(/required/i).first()).toBeVisible();
    await expect(invitePage.inviteHeading).toBeVisible();
  });

  test('accepts the holder details without submitting', async () => {
    // Fill the fields and confirm the values stick. We deliberately do NOT click
    // Next — advancing would send a real invitation email to the holder.
    await invitePage.fillInvite('QA Holder', 'qa.holder@example.com', '9876543210');

    await expect(invitePage.nameInput).toHaveValue('QA Holder');
    await expect(invitePage.emailInput).toHaveValue('qa.holder@example.com');
    await expect(invitePage.mobileInput).toHaveValue('9876543210');
  });
});
