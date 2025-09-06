import { test, expect } from '@playwright/test'

test.describe('Appearance v3 List UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders list UI when appearance v3 flag is enabled', async ({ page }) => {
    // Navigate to teacher panel
    await page.click('[data-testid="teacher-panel-button"]')
    
    // Go to dev tab and enable all required flags
    await page.click('text=Dev')
    await page.click('[data-testid="teacher-panel-v2-toggle"]')
    await page.click('[data-testid="teacher-appearance-v3-toggle"]')
    
    // Check that appearance v3 toggle exists
    await expect(page.locator('[data-testid="teacher-appearance-v3-toggle"]')).toBeVisible()
  })

  test('appearance settings page shows list UI when flags enabled', async ({ page }) => {
    // Enable required flags via URL or localStorage
    await page.addInitScript(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({
        teacherPanelV2: true,
        teacherAppearanceV3: true,
        teacherThemeV2: true
      }))
    })
    
    // Navigate to appearance settings
    await page.goto('/guide?tab=appearance')
    
    // Should see list cards
    const listCards = page.locator('.list-card')
    await expect(listCards).toHaveCount(2) // Display and Map & UI sections
    
    // Check specific appearance rows
    await expect(page.locator('[data-testid="appearance-theme-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="appearance-density-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="appearance-calm-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="appearance-hc-row"]')).toBeVisible()
  })

  test('privacy settings page shows list UI when flags enabled', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({
        teacherPanelV2: true,
        teacherAppearanceV3: true
      }))
    })
    
    // Navigate to privacy settings  
    await page.goto('/guide?tab=privacy')
    
    // Should see list cards
    const listCards = page.locator('.list-card')
    await expect(listCards).toHaveCount(2) // Data & Consent and Exports sections
    
    // Check specific privacy rows
    await expect(page.locator('[data-testid="privacy-policy-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="privacy-consent-row"]')).toBeVisible()
    await expect(page.locator('[data-testid="privacy-download-row"]')).toBeVisible()
  })

  test('chevron icons appear in list rows', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({
        teacherPanelV2: true,
        teacherAppearanceV3: true,
        teacherThemeV2: true
      }))
    })
    
    await page.goto('/guide?tab=appearance')
    
    // Check that chevron icons are present
    const chevrons = page.locator('.chevron')
    await expect(chevrons.first()).toBeVisible()
    
    // Check that list icons are present
    const listIcons = page.locator('.list-icon')
    await expect(listIcons.first()).toBeVisible()
  })

  test('list sections show proper titles', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('qi.flags.v1', JSON.stringify({
        teacherPanelV2: true,
        teacherAppearanceV3: true,
        teacherThemeV2: true
      }))
    })
    
    await page.goto('/guide?tab=appearance')
    
    // Check section titles
    await expect(page.locator('text=DISPLAY')).toBeVisible()
    await expect(page.locator('text=MAP & UI')).toBeVisible()
  })
})