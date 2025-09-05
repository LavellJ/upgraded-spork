import { test, expect } from '@playwright/test'

test('projector mode scales pins and disables parallax', async ({ page }) => {
  await page.goto('/#/?biome=reef&parallax=0')
  
  // Enable Final Art and Projector mode
  await page.locator('[data-testid="button-teacher-panel"]').click()
  await page.locator('[data-testid="tab-dev"]').click()
  await page.locator('[data-testid="toggle-final-art"]').check()
  await page.locator('[data-testid="toggle-projector-mode"]').check()
  await page.locator('[data-testid="button-close-teacher-panel"]').click()
  
  await page.waitForTimeout(300)
  await expect(page).toHaveScreenshot('projector-reef.png', { fullPage: false })
})

test('high-contrast renders readable pins & breadcrumbs', async ({ page }) => {
  await page.addInitScript(() => document.documentElement.setAttribute('data-contrast','high'))
  await page.goto('/#/?biome=reef&parallax=0')
  
  // Enable Final Art flag
  await page.locator('[data-testid="button-teacher-panel"]').click()
  await page.locator('[data-testid="tab-dev"]').click()
  await page.locator('[data-testid="toggle-final-art"]').check()
  await page.locator('[data-testid="button-close-teacher-panel"]').click()
  
  await page.waitForTimeout(300)
  await expect(page).toHaveScreenshot('hc-reef.png', { fullPage: false })
})