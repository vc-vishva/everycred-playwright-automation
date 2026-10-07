---
name: everycred-playwright
description: >-
  Write and maintain Playwright + TypeScript E2E tests for the EveryCRED suite.
  Use when adding or editing test specs, Page Object Model classes, Playwright
  config, or the email/report tooling in this repo. Covers the POM pattern,
  multi-environment (dev/staging/prod) setup, locator conventions, and reporting.
---

# EveryCRED Playwright Automation

End-to-end test automation for the EveryCRED platform. Playwright + TypeScript,
Page Object Model, runs against dev/staging/prod, and emails an HTML summary
after each run.

## Project layout

```
EveryCRED smoke Testing/   # Test specs (*.spec.ts) — note the space in the dir name
pages/                     # Page Object Model classes (one per app page)
reports/                   # Generated HTML report (git-ignored)
test-results/              # Raw JSON, traces, videos (git-ignored)
screenshots/               # Captured screenshots
playwright.config.ts       # Environments, reporters, timeouts
send-report.js             # Builds + emails HTML summary from results.json
report-server.js           # Static server for viewing the summary
.env                       # Credentials + SMTP (git-ignored, never commit)
```

- `testDir` is `./EveryCRED smoke Testing` (the directory name contains a space —
  quote it in shell commands).
- Path aliases: none. Import page objects with relative paths
  (`../pages/LoginPage`).

## Running tests

| Command | Purpose |
|---|---|
| `npm test` | All configured environments, then email report |
| `npm run test:dev` / `test:staging` / `test:prod` | Single environment (via `cross-env BASE_URL=`) |
| `npm run test:all` | dev → staging → prod sequentially |
| `npm run test:no-email` | Tests without the email step |
| `npm run show-report` | Open the Playwright HTML report |
| `npm run send-report` | Re-send the email from the last run |
| `npm run report-server` | Serve the summary locally |

## Page Object Model conventions

Every page class extends `BasePage` (`pages/BasePage.ts`), which holds the
`protected readonly page: Page` plus shared `goto(path)` and `title()`.

When creating a new page object:

1. Extend `BasePage`; declare locators as `readonly` fields and assign them in
   the constructor after `super(page)`.
2. **Prefer accessible, role-based locators** (`getByRole`, `getByLabel`,
   `getByText`) over CSS/XPath. Fall back to `page.locator('css')` only when the
   DOM lacks accessibility hooks — and leave a comment explaining why (see
   `LoginPage.passwordInput`, where the label isn't associated with the input).
3. Use case-insensitive regex for names that may vary
   (`/log ?in|sign ?in/i`).
4. Override `goto()` for the page's own path, delegating to
   `super.goto('/issuer/auth/login')`.
5. Expose user actions as methods (`login(email, password)`, `signOut()`), not
   raw clicks in the spec.

Example skeleton:

```ts
import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExamplePage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Example', level: 1 });
  }

  async goto(): Promise<void> {
    await super.goto('/example/path');
  }
}
```

## Spec conventions

- Import `{ test, expect }` from `@playwright/test` and the page objects you need.
- Wrap related tests in `test.describe('Feature', ...)`; instantiate page
  objects and navigate in `test.beforeEach`.
- Use `test.step('…', async () => { … })` to group multi-stage flows (e.g. log in,
  then sign out) so the report reads clearly.
- Pull credentials from `process.env` and `test.skip(!email || !password, '…')`
  when they're unset — never hardcode credentials.
- Login flows hit reCAPTCHA + a verifying API call that can exceed the default
  5s `expect` timeout; give post-login redirect assertions a longer timeout
  (see `LOGIN_REDIRECT_TIMEOUT = 30_000` in `Login.spec.ts`).
- Assert on both URL (`toHaveURL(/regex/)`) and a visible element to confirm a
  page transition.

## Configuration notes

- Environments are `dev`/`staging`/`prod`, each with a base URL from
  `DEV_BASE_URL` / `STAGING_BASE_URL` / `PROD_BASE_URL` in `.env`.
- Setting `BASE_URL=<env>` scopes a run to one environment (fails fast if that
  env's URL is unset). With no `BASE_URL`, every configured environment runs and
  unconfigured ones are skipped with a warning.
- Tests run **sequentially** (`fullyParallel: false`, `workers: 1`,
  `retries: 0`). Trace, screenshot, and video are `'on'` for every run.
- `headless: false` by default (shows the browser). Set to `true` for CI /
  display-less servers.
- Reports: HTML → `reports/`, JSON → `test-results/results.json`.

## Reporting tooling

- `send-report.js` reads `test-results/results.json`, writes
  `reports/summary.html`, and emails it via nodemailer. It tallies on the
  **test-level** outcome (`expected`/`flaky`/`skipped`/unexpected), not the
  per-attempt result status. Email is skipped if SMTP vars are incomplete.
- `report-server.js` is a dependency-free static server for `reports/`, with
  path-traversal guarding — keep that guard intact if editing.

## Guardrails

- Never commit `.env` or any file with real credentials; `.env`, `reports/`,
  `test-results/`, and `playwright-report/` are git-ignored.
- Don't introduce flaky waits (`waitForTimeout`); rely on Playwright's
  web-first assertions and auto-waiting locators.
- After changing specs or pages, run the relevant `npm run test:<env>` to verify.
