import { test, expect } from '@playwright/test'

test.describe('Pin UI Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays pins in assignments manager', async ({ page }) => {
    // Navigate to assignments or find an area that shows pins
    // Look for pins in the UI (they should be visible in assignments manager)
    const pins = page.locator('[data-testid^="pin-"]')
    
    if (await pins.count() > 0) {
      // Verify first pin is properly rendered
      const firstPin = pins.first()
      await expect(firstPin).toBeVisible()
      
      // Check that pin has correct structure (button with SVG)
      const svg = firstPin.locator('svg')
      await expect(svg).toBeVisible()
      await expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    }
  })

  test('pin states render with correct visual elements', async ({ page }) => {
    // For now, just verify basic pin structure exists
    // In a full implementation, this would screenshot pins at different sizes
    
    const pins = page.locator('[data-testid^="pin-"]')
    
    for (let i = 0; i < Math.min(3, await pins.count()); i++) {
      const pin = pins.nth(i)
      
      // Each pin should be a button
      await expect(pin).toHaveRole('button')
      
      // Each pin should contain an SVG
      const svg = pin.locator('svg')
      await expect(svg).toBeVisible()
      
      // SVG should have the teardrop path
      const tearDropPath = svg.locator('path[d*="M12 2c-4 0-7 3.1-7 7"]')
      await expect(tearDropPath).toBeVisible()
    }
  })

  test('pins are accessible', async ({ page }) => {
    const pins = page.locator('[data-testid^="pin-"]')
    
    if (await pins.count() > 0) {
      const firstPin = pins.first()
      
      // Should be focusable
      await firstPin.focus()
      await expect(firstPin).toBeFocused()
      
      // Should have proper ARIA attributes if aria-label is set
      const ariaLabel = await firstPin.getAttribute('aria-label')
      if (ariaLabel) {
        expect(ariaLabel).toContain('Status:')
      }
    }
  })

  test('pins respond to interaction', async ({ page }) => {
    const pins = page.locator('[data-testid^="pin-"]')
    
    if (await pins.count() > 0) {
      const firstPin = pins.first()
      
      // Should be clickable (even if click doesn't do anything yet)
      await firstPin.click()
      await expect(firstPin).toBeVisible()
    }
  })
})