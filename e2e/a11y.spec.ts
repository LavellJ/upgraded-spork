import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('WCAG AA: app has no critical violations', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  if (results.violations.length) {
    console.log('Accessibility violations:\n');
    for (const v of results.violations) {
      console.log(`- ${v.id}: ${v.help} (${v.impact})`);
      for (const n of v.nodes) {
        console.log(`  • ${n.target.join(' ')}`);
      }
    }
  }

  expect(results.violations.length, 'No WCAG A/AA violations').toBe(0);
});