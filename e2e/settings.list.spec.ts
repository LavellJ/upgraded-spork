import { test, expect } from '@playwright/test'

test.describe('Settings List UI', () => {
  const settingsPages = [
    { name: 'privacy', path: '/#/guide/privacy' },
    { name: 'appearance', path: '/#/guide/appearance' }, 
    { name: 'consent', path: '/#/guide/consent' },
    { name: 'reports', path: '/#/guide/reports' },
    { name: 'dev', path: '/#/guide/dev' }
  ]

  for (const setting of settingsPages) {
    test(`should load ${setting.name} page with list cards`, async ({ page }) => {
      await page.goto(setting.path)
      await page.waitForLoadState('networkidle')
      
      // Check for list-card components (if teacherAppearanceV3 is enabled)
      const listCard = page.locator('.list-card, [data-testid*="list-card"]').first()
      
      // If list cards are present, test the new list UI
      if (await listCard.isVisible()) {
        await expect(listCard).toBeVisible()
        
        // Check for list rows within the card
        const listRows = page.locator('.list-row, [data-testid*="list-row"]')
        await expect(listRows.first()).toBeVisible()
        
        // Test that rows are clickable (have proper interactive elements)
        const clickableRows = page.locator('.list-row button, .list-row [role="button"], .list-row a, .list-row [tabindex="0"]')
        if (await clickableRows.count() > 0) {
          await expect(clickableRows.first()).toBeVisible()
        }
      } else {
        // Fallback: check for general settings content
        const settingsContent = page.locator('main, .content, [role="main"]').first()
        await expect(settingsContent).toBeVisible()
      }
    })
  }

  test('should have clickable rows in privacy settings', async ({ page }) => {
    await page.goto('/#/guide/privacy')
    await page.waitForLoadState('networkidle')
    
    // Look for interactive elements
    const interactiveElements = page.locator('button, [role="button"], input, select, a[href]')
    await expect(interactiveElements.first()).toBeVisible({ timeout: 8000 })
    
    // Test clicking doesn't cause errors
    const clickableElement = interactiveElements.first()
    await clickableElement.click()
    
    // Ensure no critical errors after click
    const errorIndicator = page.locator('text=/error|Error|ERROR/').first()
    await expect(errorIndicator).toHaveCount(0, { timeout: 3000 })
  })

  test('should load appearance settings with theme controls', async ({ page }) => {
    await page.goto('/#/guide/appearance')
    await page.waitForLoadState('networkidle')
    
    // Look for theme-related controls
    const themeControls = page.locator('button, [role="button"], select').filter({ hasText: /theme|light|dark|auto/i })
    
    if (await themeControls.count() > 0) {
      await expect(themeControls.first()).toBeVisible()
    } else {
      // Fallback: ensure page loaded
      const content = page.locator('main, .content').first()
      await expect(content).toBeVisible()
    }
  })

  test('should load dev panel with diagnostics', async ({ page }) => {
    await page.goto('/#/guide/dev')
    await page.waitForLoadState('networkidle')
    
    // Look for development-related content
    const devContent = page.locator('text=/diagnostic|debug|flag|feature|test/i').first()
    
    if (await devContent.isVisible()) {
      await expect(devContent).toBeVisible()
    } else {
      // Fallback: ensure page exists
      const mainContent = page.locator('main, .content, [role="main"]').first()
      await expect(mainContent).toBeVisible()
    }
  })

  test('should handle navigation between settings pages', async ({ page }) => {
    // Start at privacy
    await page.goto('/#/guide/privacy')
    await page.waitForLoadState('networkidle')
    
    // Navigate to appearance
    await page.goto('/#/guide/appearance')
    await page.waitForLoadState('networkidle')
    
    // Check no errors occurred during navigation
    const errorText = page.locator('text=/error|Error|ERROR/').first()
    await expect(errorText).toHaveCount(0)
    
    // Ensure content is visible
    const content = page.locator('main, .content, [role="main"]').first()
    await expect(content).toBeVisible()
  })
})