import { test, expect } from '@playwright/test'

test('SubTabs arrow navigation + aria-selected', async ({ page }) => {
  await page.goto('/#/?guide&tab=insights')
  const tablist = page.getByRole('tablist')
  await expect(tablist).toBeVisible()
  const tabs = await tablist.getByRole('tab').all()
  await tabs[0].focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(tablist.getByRole('tab', { selected: true })).toHaveCount(1)
})