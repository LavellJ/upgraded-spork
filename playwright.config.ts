// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const isCI = !!process.env.CI;
const isFull = process.env.FULL_E2E === '1';

// 🟥 Specs we don't want on every PR (big / visual / offline / a11y / art etc.)
const HEAVY_SPECS: string[] = [
  // accessibility + visual
  'e2e/a11y.reports.spec.ts',
  'e2e/a11y.spec.ts',
  'e2e/visual.*.spec.ts',

  // art & pins
  'e2e/art.*.spec.ts',
  'e2e/ui.pin.spec.ts',

  // offline / projector
  'e2e/offline*.spec.ts',
  'e2e/art.projector-hc.spec.ts',

  // big flows
  'e2e/hero-full.spec.ts',
  'e2e/student.flow.spec.ts',

  // content packs, reports, class mode, etc.
  'e2e/content_packs.spec.ts',
  'e2e/reports.spec.ts',
  'e2e/classmode.spec.ts',
  'e2e/profile.spec.ts',
  'e2e/teacher.shell.*.spec.ts',
  'e2e/template-lesson.spec.ts',
  'e2e/keyboard.*.spec.ts',
  'e2e/pack_toggles.spec.ts',
];

// 🟨 Optional quarantine list (one glob per line)
const quarantineFile = path.join(process.cwd(), '.ci', 'quarantine.txt');
let quarantineGlobs: string[] = [];
if (fs.existsSync(quarantineFile)) {
  quarantineGlobs = fs
    .readFileSync(quarantineFile, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

const testIgnore: (string | RegExp)[] = [];
if (!isFull) testIgnore.push(...HEAVY_SPECS);
testIgnore.push(...quarantineGlobs);

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: isCI ? [['line']] : [['list']],

  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  // Start the unified server locally for tests
  webServer: {
    command: `bash -lc 'mkdir -p .data .backups && \\
      JWT_SECRET=ci_jwt_secret_please_rotate \\
      DATABASE_URL=file:.data/qi.db \\
      APP_BASE_URL=http://localhost:5000 \\
      npx tsx server/index.ts'`,
    url: 'http://localhost:5000',
    timeout: 240_000,
    reuseExistingServer: !isCI,
  },

  // Only include heavy specs when FULL_E2E=1
  testIgnore,

  // Single project (expand later if needed)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});