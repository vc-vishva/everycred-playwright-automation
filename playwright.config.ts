import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Base URL env var for each environment, set per deployment in .env.
 * An environment with no URL set is not configured and is not run.
 */
const ENV_VARS = {
  dev: 'DEV_BASE_URL',
  staging: 'STAGING_BASE_URL',
  prod: 'PROD_BASE_URL',
} as const;

type EnvName = keyof typeof ENV_VARS;

const baseUrlFor = (name: EnvName): string | undefined => process.env[ENV_VARS[name]]?.trim() || undefined;

const allEnvNames = Object.keys(ENV_VARS) as EnvName[];
const requestedEnv = process.env.BASE_URL as EnvName | undefined;

// If BASE_URL names an environment, scope the run to it (fail fast if it has no URL);
// otherwise run every configured environment (mirrors `npm test` vs `npm run test:dev`).
let envNames: EnvName[];
if (requestedEnv && requestedEnv in ENV_VARS) {
  if (!baseUrlFor(requestedEnv)) {
    throw new Error(`BASE_URL=${requestedEnv} but ${ENV_VARS[requestedEnv]} is not set in .env`);
  }
  envNames = [requestedEnv];
} else {
  envNames = allEnvNames.filter((name) => baseUrlFor(name));
  const skipped = allEnvNames.filter((name) => !baseUrlFor(name));
  if (envNames.length === 0) {
    throw new Error(`No environment configured: set at least one of ${Object.values(ENV_VARS).join(', ')} in .env`);
  }
  if (skipped.length > 0) {
    console.warn(`[playwright.config] Skipping unconfigured environment(s): ${skipped.join(', ')}`);
  }
}

export default defineConfig({
  testDir: './EveryCRED smoke Testing',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    headless: false, // false = show the browser window, true = hidden (default). Use true for CI / servers without a display.
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: envNames.map((name) => ({
    name,
    use: {
      ...devices['Desktop Chrome'],
      baseURL: baseUrlFor(name),
    },
  })),
});
