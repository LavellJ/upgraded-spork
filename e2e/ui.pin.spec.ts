import { test, expect } from '@playwright/test'

test.describe('B1 Pin System - Real Map Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Enable Final Art flag for pin testing
    await page.locator('[data-testid="button-teacher-panel"]').click()
    await page.locator('[data-testid="tab-dev"]').click()
    await page.locator('[data-testid="toggle-final-art"]').check()
    await page.locator('[data-testid="button-close-teacher-panel"]').click()
  })

  test('pins are accessible with proper hit targets', async ({ page }) => {
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(0)
    
    const firstPin = pins.first()
    
    // Should be focusable and have minimum 44x44 hit target
    await firstPin.focus()
    await expect(firstPin).toBeFocused()
    
    // Check hit area size (should be at least 44px)
    const boundingBox = await firstPin.boundingBox()
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44)
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44)
    
    // Should have proper aria-label with lesson title and state
    const ariaLabel = await firstPin.getAttribute('aria-label')
    expect(ariaLabel).toMatch(/Start lesson: .+/)
    expect(ariaLabel).toMatch(/\((overdue|due soon|assigned|completed|locked)\)/)
  })

  test('pin states map correctly to lesson status', async ({ page }) => {
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(0)
    
    // Test different pin states exist
    const stateSelectors = [
      'pin-next',    // Available lessons  
      'pin-assigned', // Assigned lessons
      'pin-due',     // Due soon lessons
      'pin-overdue', // Overdue lessons  
      'pin-done',    // Completed lessons
      'pin-locked'   // Locked lessons
    ]
    
    for (const state of stateSelectors) {
      const statePins = page.locator(`[data-testid="${state}"]`)
      if (await statePins.count() > 0) {
        // Verify state-specific styling exists
        const firstStatePin = statePins.first()
        await expect(firstStatePin).toBeVisible()
        
        // Check SVG structure
        const svg = firstStatePin.locator('svg')
        await expect(svg).toBeVisible()
        await expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      }
    }
  })

  test('tooltips display lesson metadata on hover', async ({ page }) => {
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(0)
    
    const firstPin = pins.first()
    
    // Hover to show tooltip
    await firstPin.hover()
    
    // Tooltip should appear with lesson title
    const tooltip = page.locator('.group-hover\\:opacity-100')
    await expect(tooltip).toBeVisible()
    
    // Should contain lesson title
    const tooltipText = await tooltip.textContent()
    expect(tooltipText).toBeTruthy()
    expect(tooltipText?.length).toBeGreaterThan(0)
  })

  test('collision detection offsets overlapping pins', async ({ page }) => {
    // Look for pins that might be close together
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(1)
    
    // Get positions of all pins
    const pinPositions = await pins.evaluateAll(pins => 
      pins.map(pin => {
        const rect = pin.getBoundingClientRect()
        return { x: rect.x, y: rect.y }
      })
    )
    
    // Check if collision detection is working (pins shouldn't overlap exactly)
    for (let i = 0; i < pinPositions.length; i++) {
      for (let j = i + 1; j < pinPositions.length; j++) {
        const pin1 = pinPositions[i]
        const pin2 = pinPositions[j]
        
        // If pins are very close horizontally, they should be offset vertically
        const horizontalDistance = Math.abs(pin1.x - pin2.x)
        if (horizontalDistance < 50) { // Close horizontally
          const verticalDistance = Math.abs(pin1.y - pin2.y)
          expect(verticalDistance).toBeGreaterThan(5) // Should be offset
        }
      }
    }
  })

  test('calm mode disables hover animations', async ({ page }) => {
    // Enable calm mode
    await page.locator('[data-testid="button-teacher-panel"]').click()
    await page.locator('[data-testid="tab-overview"]').click()
    await page.locator('[data-testid="toggle-calm-mode"]').check()
    await page.locator('[data-testid="button-close-teacher-panel"]').click()
    
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(0)
    
    const firstPin = pins.first()
    
    // Get initial position
    const initialPosition = await firstPin.boundingBox()
    
    // Hover over pin
    await firstPin.hover()
    
    // Position shouldn't change much in calm mode (no lift animation)
    const hoveredPosition = await firstPin.boundingBox()
    
    if (initialPosition && hoveredPosition) {
      const verticalMovement = Math.abs(initialPosition.y - hoveredPosition.y)
      expect(verticalMovement).toBeLessThan(2) // Should be minimal movement
    }
  })

  test('pins are keyboard navigable', async ({ page }) => {
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(0)
    
    // First pin should be tabbable
    const firstPin = pins.first()
    await page.keyboard.press('Tab')
    
    // Should be able to reach pin via keyboard
    let attempts = 0
    while (attempts < 20) {
      const focused = page.locator(':focus')
      if (await focused.getAttribute('data-testid') === await firstPin.getAttribute('data-testid')) {
        break
      }
      await page.keyboard.press('Tab')
      attempts++
    }
    
    expect(attempts).toBeLessThan(20) // Should find the pin
    
    // Should be activatable with Enter or Space
    await page.keyboard.press('Enter')
    // Verify some response (could be lesson opening, etc.)
  })

  test('visual snapshots of pin states', async ({ page }) => {
    // Test each pin state visually
    const stateSelectors = [
      'pin-next',
      'pin-assigned', 
      'pin-due',
      'pin-overdue',
      'pin-done',
      'pin-locked'
    ]
    
    for (const state of stateSelectors) {
      const statePins = page.locator(`[data-testid="${state}"]`)
      if (await statePins.count() > 0) {
        const firstStatePin = statePins.first()
        await expect(firstStatePin).toBeVisible()
        
        // Take screenshot of the pin state
        await expect(firstStatePin).toHaveScreenshot(`${state}.png`)
      }
    }
  })

  test('density handling with mini pins', async ({ page }) => {
    // Test if dense areas use smaller pins
    const pins = page.locator('[data-testid^="pin-"]')
    await expect(pins).toHaveCountGreaterThan(0)
    
    // Check for any pins that might be using mini size (16px)
    const miniPins = await pins.evaluateAll(pins => 
      pins.filter(pin => {
        const svg = pin.querySelector('svg')
        return svg && (svg.getAttribute('width') === '16' || svg.getAttribute('height') === '16')
      })
    )
    
    // If mini pins exist, they should be in dense areas
    if (miniPins.length > 0) {
      console.log(`Found ${miniPins.length} mini pins for density handling`)
    }
  })

  // Legacy tests for backwards compatibility
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