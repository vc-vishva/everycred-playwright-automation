import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Onboarding → Enrol Verifier.
 *
 * A multi-step wizard (Register Device → Assign Checkpoint → Activate). This
 * page object covers the first step, "Register Device", where a field device is
 * enrolled before it can read credentials at a checkpoint.
 */
export class EnrolVerifierPage extends BasePage {
  readonly pageHeading: Locator;
  readonly registerDeviceHeading: Locator;
  // Wizard step tabs down the left rail.
  readonly registerDeviceStep: Locator;
  readonly assignCheckpointStep: Locator;
  readonly activateStep: Locator;
  // The three required fields. Their visible "* " labels aren't associated with
  // the inputs (no id/for) — the same app-wide pattern seen on Login/Profile —
  // so target them by their distinctive placeholders instead of getByLabel.
  readonly deviceNameInput: Locator;
  readonly platformInput: Locator;
  readonly serialTagInput: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading = page.getByRole('heading', { name: 'Enrol Verifier', level: 1 });
    // "Register Device" is both the h2 content heading and a step-tab button, so
    // pin the heading by level to keep each locator resolving to one element.
    this.registerDeviceHeading = page.getByRole('heading', { name: 'Register Device', level: 2 });
    // Step tabs are buttons in the left rail of the wizard.
    this.registerDeviceStep = page.getByRole('button', { name: 'Register Device' });
    this.assignCheckpointStep = page.getByRole('button', { name: 'Assign Checkpoint' });
    this.activateStep = page.getByRole('button', { name: 'Activate' });
    // Each field's label IS associated with its input here, so the textbox has an
    // accessible name (including the trailing "*"). Match it with a regex.
    this.deviceNameInput = page.getByRole('textbox', { name: /device name/i });
    this.platformInput = page.getByRole('textbox', { name: /platform/i });
    this.serialTagInput = page.getByRole('textbox', { name: /serial \/ asset tag/i });
    this.nextButton = page.getByRole('button', { name: 'Next', exact: true });
  }

  async goto(): Promise<void> {
    await super.goto('/issuer/admin/onboarding/enrol-verifier');
  }

  /**
   * Fill the Register Device form. Does NOT submit — callers decide whether to
   * click Next, so tests can validate the form without enrolling a real device.
   */
  async fillRegisterDevice(
    deviceName: string,
    platform: string,
    serialTag: string,
  ): Promise<void> {
    await this.deviceNameInput.fill(deviceName);
    await this.platformInput.fill(platform);
    await this.serialTagInput.fill(serialTag);
  }
}
