import { test, expect } from '@playwright/test'

test('Reef plates render (parallax off)', async ({ page }) => {
  await page.goto('/#/?biome=reef&parallax=0')
  await page.waitForTimeout(100)
  expect(await page.screenshot()).toMatchSnapshot('reef-plates.png')
})

test('Reef plates respect reduced motion preference', async ({ page }) => {
  // Set reduced motion preference
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/?biome=reef')
  await page.waitForTimeout(100)
  
  // Check that parallax is disabled
  const biomePlates = page.locator('[aria-hidden="true"]:has(img[src*="bg-far.webp"])')
  if (await biomePlates.isVisible()) {
    const transform = await biomePlates.locator('img').first().getAttribute('style')
    expect(transform).not.toContain('--par-x-far')
  }
})

test('Reef plates only show with Final Art flag', async ({ page }) => {
  // Test without Final Art flag
  await page.goto('/#/?biome=reef&finalart=0')
  await page.waitForTimeout(100)
  
  const biomePlates = page.locator('[aria-hidden="true"]:has(img[src*="bg-far.webp"])')
  await expect(biomePlates).not.toBeVisible()
  
  // Test with Final Art flag
  await page.goto('/#/?biome=reef&finalart=1')
  await page.waitForTimeout(100)
  
  await expect(biomePlates).toBeVisible()
})