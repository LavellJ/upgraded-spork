import { test, expect } from '@playwright/test'
import { setUiPrefs } from './visual.utils'

test('Reports/Trends — light/comfy', async ({ page }) => {
  await setUiPrefs(page, { theme:'light', density:'comfy' })
  await page.goto('/#/?guide&tab=reports')
  await page.getByRole('heading', { level: 1, name: /trends/i }).waitFor()
  await page.waitForTimeout(200)
  expect(await page.screenshot()).toMatchSnapshot('reports-trends-light.png')
})

test('Reports/Trends — dark/compact', async ({ page }) => {
  await setUiPrefs(page, { theme:'dark', density:'compact' })
  await page.goto('/#/?guide&tab=reports')
  await page.getByRole('heading', { level: 1, name: /trends/i }).waitFor()
  await page.waitForTimeout(200)
  expect(await page.screenshot()).toMatchSnapshot('reports-trends-dark-compact.png')
})