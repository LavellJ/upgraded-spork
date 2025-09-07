import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

const pages = [
  '/#/guide?tab=overview',
  '/#/guide?tab=assignments',
  '/#/guide?tab=appearance',
  '/#/'  // student map
]

for (const url of pages) {
  test(`a11y: ${url}`, async ({ page }) => {
    await page.goto(url)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a','wcag2aa'])
      .analyze()
    // Fail only on critical basics; log the rest
    const violations = results.violations
    console.log('AXE', url, violations.map(v=>({ id:v.id, impact:v.impact, nodes:v.nodes.length })))
    // Allow non-critical noise during dev; assert no serious/critical
    const bad = violations.filter(v => ['serious','critical'].includes(v.impact || ''))
    expect(bad.length, `Serious/critical a11y issues on ${url}`).toBe(0)
  })
}