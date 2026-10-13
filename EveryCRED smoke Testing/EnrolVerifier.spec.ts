import { test, expect } from './fixtures';
import { EnrolVerifierPage } from '../pages/EnrolVerifierPage';

// The wizard deep-links straight to the Register Device step and loads org/onboarding
// context on the way in, so give the heading a generous appearance window.
const PAGE_READY_TIMEOUT = 30_000;

// Every test reuses the worker's shared logged-in session (see fixtures.ts).
test.describe('Enrol Verifier — Register Device', () => {
  let enrolPage: EnrolVerifierPage;

  test.beforeEach(async ({ authedPage }) => {
    enrolPage = new EnrolVerifierPage(authedPage);
    await enrolPage.goto();
    await expect(enrolPage.pageHeading).toBeVisible({ timeout: PAGE_READY_TIMEOUT });
  });

  test('renders the Register Device step with its form and wizard tabs', async () => {
    await expect(enrolPage.registerDeviceHeading).toBeVisible();
    // Wizard tabs for the three onboarding steps.
    await expect(enrolPage.registerDeviceStep).toBeVisible();
    await expect(enrolPage.assignCheckpointStep).toBeVisible();
    await expect(enrolPage.activateStep).toBeVisible();
    // All three required fields are present.
    await expect(enrolPage.deviceNameInput).toBeVisible();
    await expect(enrolPage.platformInput).toBeVisible();
    await expect(enrolPage.serialTagInput).toBeVisible();
  });

  test('keeps Next disabled until every required field is filled', async () => {
    // Empty form → Next is rendered but disabled (opacity-50 / cursor-not-allowed).
    await expect(enrolPage.nextButton).toBeVisible();
    await expect(enrolPage.nextButton).toBeDisabled();

    // Filling only some of the required fields must NOT enable Next.
    await enrolPage.deviceNameInput.fill('QA Verifier A9');
    await enrolPage.platformInput.fill('Dedicated Android reader');
    await expect(enrolPage.nextButton).toBeDisabled();
  });

  test('enables Next once all three required fields are filled', async () => {
    // Fill every required field. Next should become enabled. We deliberately do
    // NOT click it — advancing would enrol a real device on the live environment.
    await enrolPage.fillRegisterDevice('QA Verifier A9', 'Dedicated Android reader', 'SN-QA-00001');
    await expect(enrolPage.nextButton).toBeEnabled();
  });
});
