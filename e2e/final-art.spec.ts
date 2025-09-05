import { test, expect } from '@playwright/test'

test.describe('Final Art Flag System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing flags
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
  })

  test('displays emoji fallbacks when final art flag is disabled', async ({ page }) => {
    // Disable final art flag
    await page.evaluate(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({ finalArt: false }))
    })
    await page.reload()

    // Scout avatar should show emoji fallback
    const scoutAvatar = page.locator('[aria-label="Scout"]')
    await expect(scoutAvatar).toContainText('🧭')

    // Backpack icon should show emoji
    const backpackIcon = page.locator('text=🎒')
    await expect(backpackIcon).toBeVisible()

    // Empty states should show default placeholder box
    const emptyPlaceholder = page.locator('.h-10.w-10.rounded-xl[aria-hidden]')
    if (await emptyPlaceholder.count() > 0) {
      await expect(emptyPlaceholder.first()).toBeVisible()
    }
  })

  test('displays art assets when final art flag is enabled', async ({ page }) => {
    // Enable final art flag
    await page.evaluate(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({ finalArt: true }))
    })
    await page.reload()

    // Scout avatar should show art image
    const scoutImage = page.locator('img[src="/art/scout/scout-neutral.webp"]')
    await expect(scoutImage).toBeVisible()
    await expect(scoutImage).toHaveClass(/art-shadow/)

    // Backpack icon should show art image
    const backpackImage = page.locator('img[src="/art/ui/backpack.webp"]')
    await expect(backpackImage).toBeVisible()
    await expect(backpackImage).toHaveClass(/art-shadow/)

    // Empty states should show art image if present
    const emptyArtImage = page.locator('img[src="/art/spots/map-parchment.webp"]')
    if (await emptyArtImage.count() > 0) {
      await expect(emptyArtImage.first()).toBeVisible()
      await expect(emptyArtImage.first()).toHaveClass(/art-shadow/)
    }
  })

  test('allows toggling final art flag via feature flags panel', async ({ page }) => {
    // Enable development mode to show feature flags panel
    await page.evaluate(() => {
      localStorage.setItem('qi.env', 'development')
    })
    await page.reload()

    // Open feature flags panel (assuming it's in a settings or dev panel)
    const featureFlagsPanel = page.locator('[data-testid*="feature-flags"]').or(
      page.locator('text=Feature Flags')
    ).or(
      page.locator('text=Final Art')
    )

    if (await featureFlagsPanel.count() > 0) {
      await featureFlagsPanel.first().click()

      // Toggle final art flag
      const finalArtToggle = page.locator('input[type="checkbox"]').or(
        page.locator('[role="switch"]')
      )

      if (await finalArtToggle.count() > 0) {
        const initialState = await finalArtToggle.first().isChecked()
        await finalArtToggle.first().click()

        // Verify flag state changed in localStorage
        const flagsAfterToggle = await page.evaluate(() => {
          const flags = localStorage.getItem('qi.flags.v1')
          return flags ? JSON.parse(flags) : {}
        })

        expect(flagsAfterToggle.finalArt).toBe(!initialState)
      }
    }
  })

  test('art images have proper accessibility attributes', async ({ page }) => {
    // Enable final art flag
    await page.evaluate(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({ finalArt: true }))
    })
    await page.reload()

    // Check Scout avatar accessibility
    const scoutImage = page.locator('img[src="/art/scout/scout-neutral.webp"]')
    if (await scoutImage.count() > 0) {
      await expect(scoutImage).toHaveAttribute('alt')
      await expect(scoutImage).toHaveAttribute('draggable', 'false')
    }

    // Check backpack icon accessibility
    const backpackImage = page.locator('img[src="/art/ui/backpack.webp"]')
    if (await backpackImage.count() > 0) {
      await expect(backpackImage).toHaveAttribute('alt')
      await expect(backpackImage).toHaveAttribute('draggable', 'false')
    }

    // Check empty state art accessibility (decorative, so alt should be empty)
    const emptyArtImage = page.locator('img[src="/art/spots/map-parchment.webp"]')
    if (await emptyArtImage.count() > 0) {
      await expect(emptyArtImage.first()).toHaveAttribute('alt', '')
    }
  })

  test('art images apply consistent shadow styling', async ({ page }) => {
    // Enable final art flag
    await page.evaluate(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({ finalArt: true }))
    })
    await page.reload()

    // All art images should have art-shadow class
    const artImages = page.locator('img[src^="/art/"]')
    const imageCount = await artImages.count()

    for (let i = 0; i < imageCount; i++) {
      await expect(artImages.nth(i)).toHaveClass(/art-shadow/)
    }

    // Test shadow styling in both light and dark themes
    await page.locator('html').evaluate(el => el.setAttribute('data-theme', 'dark'))
    
    // Verify dark theme shadows are applied (visual regression would be ideal)
    const darkShadowElements = page.locator('.art-shadow')
    await expect(darkShadowElements.first()).toBeVisible()
  })

  test('gracefully handles missing art assets', async ({ page }) => {
    // Enable final art flag
    await page.evaluate(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({ finalArt: true }))
    })

    // Mock network to return 404 for art assets
    await page.route('/art/**', route => route.fulfill({ status: 404 }))
    await page.reload()

    // Components should still render (though images may show broken)
    const scoutContainer = page.locator('[aria-label="Scout"]').or(
      page.locator('img[src="/art/scout/scout-neutral.webp"]')
    )
    await expect(scoutContainer).toBeVisible()

    // App should remain functional despite missing assets
    await expect(page.locator('body')).toBeVisible()
  })
})