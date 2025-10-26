# Quest Island

[![CI (a11y)](https://github.com/your-org/quest-island/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/quest-island/actions/workflows/ci.yml)
[![CI (@ci E2E)](https://github.com/your-org/quest-island/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/quest-island/actions/workflows/ci.yml)

## End-to-End Tests (Playwright)

**Smoke tests (default on PRs):**

```bash
npx playwright test --project=chromium --reporter=line
```

**Full suite (manual / on-demand):**

```bash
FULL_E2E=1 npx playwright test --project=chromium --reporter=line
```

The full suite includes a11y, visual, offline, and large-flow tests. Set FULL_E2E=1 to include these in a local run or trigger the E2E Full (manual) workflow in GitHub Actions.

**Quarantine**

Add globs to `.ci/quarantine.txt` (one per line) to skip unstable specs from all runs.

## E2E Controls on Biome Pages

For Playwright smoke/flow tests we expose a small E2E-only button on `/island/:biomeId`:

- Append `?e2e=1` to the URL **or** set `localStorage.E2E_CONTROLS = "1"` to reveal a **Complete lesson** button.
- This control triggers `completeLesson(biome)` and causes the store to persist and dispatch `island-progress-updated`.
- It is not visible in production UX unless explicitly enabled for tests.

Example (Playwright):

```ts
await page.goto(`${BASE_URL}/island/forest?e2e=1`);
await page.getByTestId("complete-lesson").click();
```

### Activity E2E

`/lesson` loads a mocked "today's lesson" and links to `/activity/:id?e2e=1`.  
On the activity page, enabling E2E (via `?e2e=1` or `localStorage.E2E_CONTROLS="1"`) reveals **Complete lesson** used by tests.

![E2E Smoke](https://github.com/LavellJ/upgraded-spork/actions/workflows/e2e.yml/badge.svg)

## Local Preview with CI-like Mocks

Build once and serve mock APIs + static app on the same origin (127.0.0.1:4173):

```bash
npm run dev:mock:full
# then open http://127.0.0.1:4173/__seed  (sets E2E_CONTROLS=1) -> redirects to /island
```

**Manual Step Required:** Add these scripts to package.json:

```json
"preview": "vite preview --port 4173 --host 127.0.0.1 --strictPort",
"dev:mock": "node server/dev-mock-server.cjs",
"dev:mock:full": "npm-run-all -s build dev:mock"
```

Endpoints served locally:

- `GET /api/progress/island` (reads e2e/fixtures/island-progress.json if present, else fallback)
- `GET /api/lessons/today` → `{ id: "les-001", displayTitle: "Patterns", firstActivityId: "act-001", firstActivityTitle: "Patterns Intro" }`

**Tip:** Use `/__seed` once per fresh session to enable biome E2E controls.

## CI DOM Shim (?shim=1)

The CI DOM shim is a lightweight testing tool that provides stable test-ids and predictable markup for E2E tests without affecting production code. It activates only when `?shim=1` is present in the URL.

### What It Does

- **Automatic Activation**: When tests navigate with `?shim=1`, the shim intercepts page rendering
- **Stable Test IDs**: Provides consistent `data-testid` attributes for all interactive elements
- **Lap Progression**: Simulates biome completion and lap advancement logic
- **SPA Navigation**: Handles client-side routing with proper URL management
- **Zero Production Impact**: Completely inactive in normal user sessions

### Files

- `client/public/e2e-ci-shim.js` - The shim implementation
- `client/index.html` - Conditional loader (only loads with `?shim=1`)
- `e2e/fixtures.ts` - Auto-appends `?shim=1` to all test navigation

### Running Locally

The shim is automatically used by Playwright tests via the fixture in `e2e/fixtures.ts`:

```bash
# Build and run @ci tests (shim active)
npm run build
npx playwright test --project=chromium --grep "@ci" --reporter=line
```

To manually test the shim in a browser:

```bash
# Start preview server
npm run preview

# Visit with shim parameter
open http://127.0.0.1:4173/island?shim=1
```

### Test IDs Provided

The shim provides these test-ids for reliable E2E testing:

- **Island**: `island-heading`, `journal-btn`, `backpack-btn`, `scout-bubble`, `lap-badge`
- **Biomes**: `biome-forest`, `biome-tropics`, `biome-desert`, `biome-coast`, `enter-forest`
- **Progress**: `progress-forest`, `progress-tropics`, `progress-desert`, `progress-coast`
- **Lesson**: `lesson-launcher-heading`, `start-lesson`, `complete-lesson`
- **Activity**: `activity-heading`
- **Routes**: `progress-heading`, `settings-heading`

### Lap Progression Logic

The shim tracks lesson completion per biome:
- Each biome requires 3 lessons to complete
- When all 4 biomes are completed (12 lessons total), the lap advances
- Progress persists in localStorage (`e2e.completedBiomes`, `e2e.lap`)
- Reset with `window.__e2e_resetProgress()`
