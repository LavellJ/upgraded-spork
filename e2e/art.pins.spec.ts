import { test, expect } from '@playwright/test'

test('pin states are visible and accessible', async ({ page }) => {
  await page.goto('/')
  
  // Enable Final Art flag for pin testing
  await page.locator('[data-testid="button-teacher-panel"]').click()
  await page.locator('[data-testid="tab-dev"]').click()
  await page.locator('[data-testid="toggle-final-art"]').check()
  await page.locator('[data-testid="button-close-teacher-panel"]').click()
  
  // Wait for pins to load
  await page.waitForSelector('[data-testid^="pin-"]')
  await page.waitForTimeout(200)
  
  await expect(page).toHaveScreenshot('pin-gallery.png', { fullPage: false })
})