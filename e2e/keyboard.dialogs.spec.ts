import { test, expect } from '@playwright/test'

test('Feedback dialog traps focus and returns to opener', async ({ page }) => {
  await page.goto('/teacher/insights?dev=1')
  const openBtn = page.getByRole('button', { name: /feedback/i })
  await openBtn.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(openBtn).toBeFocused()
})