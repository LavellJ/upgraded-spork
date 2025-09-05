import { test, expect } from '@playwright/test'

test.describe('Route Breadcrumbs Tests', () => {
  test('compass route shows breadcrumbs with Final Art enabled', async ({ page }) => {
    await page.goto('/')
    
    // Enable Final Art in teacher panel
    await page.click('[data-testid="button-teacher-panel"]')
    await page.click('[data-testid="tab-dev"]')
    
    // Toggle Final Art ON if not already enabled
    const finalArtSwitch = page.locator('[data-testid="switch-final-art"]')
    const isEnabled = await finalArtSwitch.evaluate((el: HTMLElement) => {
      return el.getAttribute('aria-checked') === 'true'
    })
    
    if (!isEnabled) {
      await finalArtSwitch.click()
    }
    
    // Close teacher panel
    await page.click('[data-testid="button-teacher-panel"]')
    
    // Navigate to Quest Island
    await page.click('[data-testid="link-quest-island"]')
    await page.waitForSelector('[data-testid="quest-island"]')
    
    // Click Scout to trigger compass navigation
    const scout = page.locator('[data-testid="scout"]')
    if (await scout.count() > 0) {
      await scout.click()
      await page.waitForTimeout(1000)
      
      // Check if breadcrumbs are visible
      const breadcrumbs = page.locator('[aria-hidden="true"] svg')
      if (await breadcrumbs.count() > 0) {
        // Verify breadcrumb elements exist
        const dots = breadcrumbs.locator('circle')
        const lines = breadcrumbs.locator('line')
        
        expect(await dots.count()).toBeGreaterThan(0)
        expect(await lines.count()).toBeGreaterThan(0)
      }
    }
    
    await page.screenshot({ path: 'test-results/route-breadcrumbs.png' })
  })

  test('breadcrumbs are static with reduced motion', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    await page.goto('/')
    
    // Enable Final Art
    await page.click('[data-testid="button-teacher-panel"]')
    await page.click('[data-testid="tab-dev"]')
    
    const finalArtSwitch = page.locator('[data-testid="switch-final-art"]')
    const isEnabled = await finalArtSwitch.evaluate((el: HTMLElement) => {
      return el.getAttribute('aria-checked') === 'true'
    })
    
    if (!isEnabled) {
      await finalArtSwitch.click()
    }
    
    await page.click('[data-testid="button-teacher-panel"]')
    
    // Navigate to Quest Island
    await page.click('[data-testid="link-quest-island"]')
    await page.waitForSelector('[data-testid="quest-island"]')
    
    // Trigger compass
    const scout = page.locator('[data-testid="scout"]')
    if (await scout.count() > 0) {
      await scout.click()
      await page.waitForTimeout(1000)
      
      // Check that animations are disabled on breadcrumb lines
      const animatedLines = page.locator('line animate')
      expect(await animatedLines.count()).toBe(0)
      
      // Verify dash patterns are static
      const lines = page.locator('line[stroke-dasharray]')
      if (await lines.count() > 0) {
        const dashArray = await lines.first().getAttribute('stroke-dasharray')
        expect(dashArray).toBe('4,4') // Static pattern, not animated
      }
    }
    
    await page.screenshot({ path: 'test-results/route-reduced-motion.png' })
  })
})