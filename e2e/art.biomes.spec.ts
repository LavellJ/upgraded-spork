import { test, expect } from '@playwright/test'

const biomes = ['reef','alpine','forest','desert'] as const

for (const b of biomes){
  test(`plates render for ${b}`, async ({ page }) => {
    await page.goto(`/#/?biome=${b}&parallax=0`)
    
    // Enable Final Art flag for biome plate testing
    await page.locator('[data-testid="button-teacher-panel"]').click()
    await page.locator('[data-testid="tab-dev"]').click()
    await page.locator('[data-testid="toggle-final-art"]').check()
    await page.locator('[data-testid="button-close-teacher-panel"]').click()
    
    // Wait for biome plates to load
    await page.waitForTimeout(500)
    
    // Take screenshot of the biome plates
    expect(await page.screenshot()).toMatchSnapshot(`plates-${b}.png`)
  })
}