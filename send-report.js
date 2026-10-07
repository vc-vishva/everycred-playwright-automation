/**
 * Builds an HTML summary from the last Playwright JSON results and emails it.
 * Reads SMTP settings from .env — see .env.example for the required variables.
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const RESULTS_PATH = path.join(__dirname, 'test-results', 'results.json');
const SUMMARY_PATH = path.join(__dirname, 'reports', 'summary.html');

function loadResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    throw new Error(`No results found at ${RESULTS_PATH}. Run the tests first.`);
  }
  return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));
}

function summarize(results) {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const rows = [];

  for (const suite of results.suites || []) {
    // Tally on the test-level outcome (expected/unexpected/skipped/flaky), not the
    // per-attempt result status (passed/failed/...), which never equals 'expected'.
    walkSuite(suite, rows, (outcome) => {
      if (outcome === 'expected' || outcome === 'flaky') passed += 1;
      else if (outcome === 'skipped') skipped += 1;
      else failed += 1;
    });
  }

  return { passed, failed, skipped, total: passed + failed + skipped, rows };
}

function walkSuite(suite, rows, tally) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const lastResult = test.results?.[test.results.length - 1];
      const status = lastResult?.status || 'unknown';
      tally(test.status);
      rows.push({
        title: spec.title,
        project: test.projectName,
        status,
        duration: lastResult?.duration ?? 0,
      });
    }
  }
  for (const nested of suite.suites || []) {
    walkSuite(nested, rows, tally);
  }
}

function renderHtml(summary) {
  // Keyed by per-attempt result status, which is what each row displays.
  const statusColor = {
    passed: '#2e7d32',
    failed: '#c62828',
    timedOut: '#c62828',
    interrupted: '#c62828',
    skipped: '#f9a825',
  };
  const rowsHtml = summary.rows
    .map(
      (r) => `
    <tr>
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.project)}</td>
      <td style="color:${statusColor[r.status] || '#555'}">${escapeHtml(r.status)}</td>
      <td>${r.duration}ms</td>
    </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>EveryCRED Test Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 2rem; color: #1a1a1a; }
  h1 { margin-bottom: 0.25rem; }
  .summary { margin-bottom: 1.5rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
  th { background: #f5f5f5; }
</style>
</head>
<body>
  <h1>EveryCRED Test Report</h1>
  <p class="summary">
    Total: ${summary.total} &nbsp;|&nbsp;
    Passed: ${summary.passed} &nbsp;|&nbsp;
    Failed: ${summary.failed} &nbsp;|&nbsp;
    Skipped: ${summary.skipped}
  </p>
  <table>
    <thead><tr><th>Test</th><th>Environment</th><th>Status</th><th>Duration</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendEmail(html, summary) {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, REPORT_EMAIL_FROM, REPORT_EMAIL_TO } =
    process.env;

  if (!SMTP_HOST || !REPORT_EMAIL_FROM || !REPORT_EMAIL_TO) {
    console.warn('SMTP settings not fully configured in .env — skipping email send.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === 'true',
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: REPORT_EMAIL_FROM,
    to: REPORT_EMAIL_TO,
    subject: `EveryCRED Test Report — ${summary.passed}/${summary.total} passed`,
    html,
  });

  console.log(`Report emailed to ${REPORT_EMAIL_TO}`);
}

async function main() {
  const results = loadResults();
  const summary = summarize(results);
  const html = renderHtml(summary);

  fs.mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true });
  fs.writeFileSync(SUMMARY_PATH, html, 'utf-8');
  console.log(`Summary written to ${SUMMARY_PATH}`);

  await sendEmail(html, summary);
}

main().catch((err) => {
  console.error('Failed to build/send report:', err.message);
  process.exitCode = 1;
});
