import { Page } from '@playwright/test'

export async function setUiPrefs(page: Page, {
  theme='light', contrast='normal', density='comfy'
}:{ theme?:'light'|'dark', contrast?:'normal'|'high', density?:'comfy'|'compact' } = {}) {
  await page.addInitScript(({theme,contrast,density})=>{
    localStorage.setItem('qi.ui.v1', JSON.stringify({ theme, contrast, density }))
  }, {theme,contrast,density})
}