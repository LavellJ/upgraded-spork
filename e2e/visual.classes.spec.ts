import { test, expect } from '@playwright/test'
import { setUiPrefs } from './visual.utils'

test('Classes — two-pane layout', async ({ page }) => {
  await setUiPrefs(page, { theme:'light' })
  await page.goto('/teacher/classes')
  await page.getByRole('heading', { level: 1, name: /classes/i }).waitFor()
  expect(await page.screenshot()).toMatchSnapshot('classes-two-pane.png')
})