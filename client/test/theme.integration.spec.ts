import { test, expect } from '@playwright/test'

test.describe('Theme System Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('can toggle teacher theme v2 flag', async ({ page }) => {
    // Navigate to teacher panel
    await page.click('[data-testid="teacher-panel-button"]')
    
    // Go to dev tab
    await page.click('text=Dev')
    
    // Enable teacher theme v2
    await page.click('[data-testid="teacher-theme-v2-toggle"]')
    
    // Verify flag is enabled
    const toggle = page.locator('[data-testid="teacher-theme-v2-toggle"]')
    await expect(toggle).toBeChecked()
  })

  test('can switch between themes when feature enabled', async ({ page }) => {
    // Enable teacher theme v2 first
    await page.click('[data-testid="teacher-panel-button"]')
    await page.click('text=Dev')
    await page.click('[data-testid="teacher-theme-v2-toggle"]')
    
    // Verify theme selector appears
    await expect(page.locator('text=Theme Selection')).toBeVisible()
    
    // Test switching to dark theme
    await page.click('text=Slate Dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    
    // Test switching to high contrast
    await page.click('text=High Contrast')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'hc')
    
    // Test switching back to parchment
    await page.click('text=Parchment Light')
    await expect(page.locator('html')).not.toHaveAttribute('data-theme')
  })

  test('theme persists across page reloads', async ({ page }) => {
    // Set up dark theme
    await page.click('[data-testid="teacher-panel-button"]')
    await page.click('text=Dev')
    await page.click('[data-testid="teacher-theme-v2-toggle"]')
    await page.click('text=Slate Dark')
    
    // Reload page
    await page.reload()
    
    // Verify theme persisted
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('takes screenshots for visual regression', async ({ page }) => {
    await page.click('[data-testid="teacher-panel-button"]')
    await page.click('text=Dev')
    await page.click('[data-testid="teacher-theme-v2-toggle"]')
    
    // Parchment theme
    await page.click('text=Parchment Light')
    await expect(page).toHaveScreenshot('teacher-panel-parchment.png')
    
    // Dark theme
    await page.click('text=Slate Dark')
    await expect(page).toHaveScreenshot('teacher-panel-dark.png')
    
    // High contrast theme
    await page.click('text=High Contrast')
    await expect(page).toHaveScreenshot('teacher-panel-hc.png')
  })
})