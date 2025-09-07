import { test, expect } from '@playwright/test'

test.describe('Teacher Shell', () => {
  test('should load assignments tab and show page header', async ({ page }) => {
    // Navigate directly to assignments tab
    await page.goto('/#/guide?tab=assignments')
    
    // Wait for the page to load and check for header
    await page.waitForLoadState('networkidle')
    
    // Look for assignments page header - could be h1, h2 or heading role
    const header = page.locator('h1, h2, [role="heading"]').filter({ hasText: /assignments/i }).first()
    await expect(header).toBeVisible({ timeout: 10000 })
    
    // Additional check: ensure we're in the teacher panel context
    const teacherContent = page.locator('[data-testid*="teacher"], [data-testid*="guide"], .teacher-panel, .guide-panel').first()
    await expect(teacherContent).toBeVisible()
  })

  test('should navigate between teacher tabs without errors', async ({ page }) => {
    // Start at guide/teacher panel
    await page.goto('/#/guide')
    await page.waitForLoadState('networkidle')
    
    // Test navigation to different tabs
    const tabs = ['assignments', 'learners', 'insights', 'classes']
    
    for (const tab of tabs) {
      await page.goto(`/#/guide?tab=${tab}`)
      await page.waitForLoadState('networkidle')
      
      // Ensure no critical errors appear
      const errorText = page.locator('text=/error|Error|ERROR/').first()
      await expect(errorText).toHaveCount(0, { timeout: 5000 })
      
      // Ensure some content loads
      const content = page.locator('main, .content, [role="main"]').first()
      await expect(content).toBeVisible()
    }
  })

  test('should show teacher layout elements', async ({ page }) => {
    await page.goto('/#/guide?tab=assignments')
    await page.waitForLoadState('networkidle')
    
    // Check for navigation or layout indicators
    const layoutElements = [
      page.locator('nav').first(),
      page.locator('[role="navigation"]').first(),
      page.locator('.sidebar, .nav, .header').first()
    ]
    
    // At least one layout element should be visible
    let hasLayout = false
    for (const element of layoutElements) {
      if (await element.isVisible()) {
        hasLayout = true
        break
      }
    }
    
    expect(hasLayout).toBe(true)
  })
})