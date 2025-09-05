import { test, expect } from '@playwright/test'

test.describe('Projector Mode Art Tests', () => {
  test('pins are larger and parallax disabled in projector mode', async ({ page }) => {
    // Navigate to Quest Island
    await page.goto('/')
    await page.click('[data-testid="link-quest-island"]')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="quest-island"]')
    
    // Take screenshot of normal mode
    await page.screenshot({ path: 'test-results/normal-mode.png' })
    
    // Enable projector mode by setting data attribute
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-projector-font-scale', '1.2')
    })
    
    // Wait for changes to take effect
    await page.waitForTimeout(500)
    
    // Check that pins are larger
    const pin = page.locator('[data-testid^="pin-"]').first()
    if (await pin.count() > 0) {
      const pinSize = await pin.evaluate((el) => {
        const svg = el.querySelector('svg')
        return svg ? parseInt(svg.getAttribute('width') || '0') : 0
      })
      expect(pinSize).toBeGreaterThan(24) // Should be scaled up from default
    }
    
    // Check that parallax is disabled by looking for biome plates
    const biomePlates = page.locator('[data-testid="biome-plates"]')
    if (await biomePlates.count() > 0) {
      // Biome plates should not respond to mouse movement in projector mode
      await page.mouse.move(100, 100)
      await page.waitForTimeout(100)
      await page.mouse.move(500, 500)
      await page.waitForTimeout(100)
      
      // In projector mode, CSS variables for parallax should not change
      const hasParallax = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement)
        return style.getPropertyValue('--par-x-far') !== ''
      })
      expect(hasParallax).toBeFalsy()
    }
    
    // Take screenshot of projector mode
    await page.screenshot({ path: 'test-results/projector-mode.png' })
  })

  test('high contrast mode affects pin styling', async ({ page }) => {
    await page.goto('/')
    await page.click('[data-testid="link-quest-island"]')
    await page.waitForSelector('[data-testid="quest-island"]')
    
    // Set high contrast mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-contrast', 'high')
    })
    
    await page.waitForTimeout(500)
    
    // Check that done state pins use solid fills in high contrast
    const donePin = page.locator('[data-testid="pin-done"]').first()
    if (await donePin.count() > 0) {
      const fillColor = await donePin.evaluate((el) => {
        const svg = el.querySelector('svg')
        const path = svg?.querySelector('path')
        return path?.getAttribute('fill') || ''
      })
      expect(fillColor).not.toBe('transparent')
    }
    
    await page.screenshot({ path: 'test-results/high-contrast-mode.png' })
  })
})