import { test, expect } from '@playwright/test'
import { setUiPrefs } from './visual.utils'

test('Assignments — table', async ({ page }) => {
  await setUiPrefs(page, { theme:'light' })
  await page.goto('/teacher/assign')
  await page.getByRole('heading', { level: 1, name: /assignments/i }).waitFor()
  expect(await page.screenshot()).toMatchSnapshot('assignments-table.png')
})