
## End-to-End Tests (Playwright)

**Smoke tests (default on PRs):**
```bash
npm run test:e2e:smoke
```

**Full suite (manual / on-demand):**
```bash
npm run test:e2e:full
```

The full suite includes a11y, visual, offline, and large-flow tests. Set FULL_E2E=1 to include these in a local run or trigger the E2E Full (manual) workflow in GitHub Actions.

**Quarantine**

Add globs to `.ci/quarantine.txt` (one per line) to skip unstable specs from all runs.

![E2E Smoke](https://github.com/<owner>/<repo>/actions/workflows/e2e-smoke.yml/badge.svg)
![E2E Full](https://github.com/<owner>/<repo>/actions/workflows/e2e-full.yml/badge.svg)