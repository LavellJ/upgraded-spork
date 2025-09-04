import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('Trends view meets WCAG A/AA', async ({ page }) => {
  await page.goto('/#/?guide&tab=reports')
  await page.getByRole('heading', { level: 1, name: /trends/i }).waitFor()
  const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze()
  expect(results.violations).toEqual([])
})