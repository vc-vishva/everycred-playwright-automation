import { test, expect } from './fixtures';
import { AddIssuerPage } from '../pages/AddIssuerPage';

// The wizard deep-links straight to the Organization identity step and loads
// org/issuer context on the way in, so give the heading a generous window.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Add Issuer — Organization identity', () => {
  let addIssuerPage: AddIssuerPage;

  test.beforeEach(async ({ authedPage }) => {
    addIssuerPage = new AddIssuerPage(authedPage);
    await addIssuerPage.goto();
    await expect(addIssuerPage.pageHeading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
  });

  test('renders the Organization identity step with its form and wizard tabs', async () => {
    await expect(addIssuerPage.orgIdentityHeading).toBeVisible();
    // Wizard tabs for the four issuer-setup steps.
    await expect(addIssuerPage.orgIdentityStep).toBeVisible();
    await expect(addIssuerPage.blockchainSetupStep).toBeVisible();
    await expect(addIssuerPage.signingKeysStep).toBeVisible();
    await expect(addIssuerPage.reviewStep).toBeVisible();
    // Core form fields are present.
    await expect(addIssuerPage.legalEntityNameInput).toBeVisible();
    await expect(addIssuerPage.emailInput).toBeVisible();
    await expect(addIssuerPage.entityTypeInput).toBeVisible();
    await expect(addIssuerPage.primaryDomainInput).toBeVisible();
    await expect(addIssuerPage.nextButton).toBeVisible();
  });

  test('blocks advancing with an empty form and stays on the step', async ({ authedPage }) => {
    // Next is clickable immediately (not disabled); submitting an empty form must
    // surface validation and keep us on the Organization identity step rather
    // than advancing to Blockchain Credential Setup.
    await addIssuerPage.nextButton.click();

    await expect(authedPage.getByText(/required/i).first()).toBeVisible();
    await expect(addIssuerPage.orgIdentityHeading).toBeVisible();
  });

  test('accepts the organization text fields without submitting', async () => {
    // Fill the text inputs and confirm the values stick. We deliberately do NOT
    // upload a logo or click Next — that would create a real issuer on the live
    // environment.
    await addIssuerPage.fillOrganizationIdentity(
      'QA Issuer Ltd',
      'qa.issuer@example.com',
      'Private Company',
      'https://qa-issuer.example.com',
    );

    await expect(addIssuerPage.legalEntityNameInput).toHaveValue('QA Issuer Ltd');
    await expect(addIssuerPage.emailInput).toHaveValue('qa.issuer@example.com');
    await expect(addIssuerPage.entityTypeInput).toHaveValue('Private Company');
    await expect(addIssuerPage.primaryDomainInput).toHaveValue('https://qa-issuer.example.com');
  });
});
