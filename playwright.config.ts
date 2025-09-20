import { defineConfig, devices } from '@playwright/test';

const PORT = 5000;
const LOCAL_URL = `http://localhost:${PORT}`;
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || LOCAL_URL;

// Run full suite only when FULL_E2E=1; otherwise skip heavy specs in CI.
const isFull = process.env.FULL_E2E === '1';

const HEAVY_SPECS = [
  'a11y.reports.spec.ts',
  'a11y.spec.ts',
  'art.*.spec.ts',
  'ui.pin.spec.ts',
  'visual.*.spec.ts',
  'offline*.spec.ts',
  'hero-full.spec.ts',
  'content_packs.spec.ts',
  'pack_toggles.spec.ts',
  'student.flow.spec.ts',
  'reports*.spec.ts',
  'settings.list.spec.ts',
  'teacher.settings.spec.ts',
  'keyboard.*.spec.ts',
  'template-lesson.spec.ts',
  'classmode*.spec.ts',
  'gov.spec.ts',
  'final-art.spec.ts',
];

const webServer = process.env.PLAYWRIGHT_BASE_URL
  ? undefined
  : {
      command: [
        "bash -lc '",
        'mkdir -p .data .backups && ',
        'JWT_SECRET=ci_jwt_secret_please_rotate_123456 ',
        `APP_BASE_URL=${LOCAL_URL} `,
        'DATABASE_URL=file:.data/qi.db ',
        'NODE_ENV=test ',
        'FINAL_ART=false ',
        'PRIVACY_STRICT=false ',
        'TEACHER_PANEL_V2=true ',
        'npx tsx server/index.ts',
        "'",
      ].join(''),
      url: LOCAL_URL,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    };

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  testIgnore: isFull ? [] : HEAVY_SPECS,

  reporter: process.env.CI
    ? [['line']]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer,
});