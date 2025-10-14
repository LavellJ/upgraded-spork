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

![E2E Smoke](https://github.com/LavellJ/upgraded-spork/actions/workflows/e2e.yml/badge.svg)
