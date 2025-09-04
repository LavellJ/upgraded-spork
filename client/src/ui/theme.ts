export type ThemeChoice = 'auto' | 'light' | 'dark'
export type ContrastChoice = 'normal' | 'high'
export type DensityChoice = 'comfy' | 'compact'

export type UiPrefs = {
  theme: ThemeChoice
  contrast: ContrastChoice
  density: DensityChoice
}

const KEY = 'qi.ui.v1'

export function loadUiPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { theme: 'auto', contrast: 'normal', density: 'comfy' }
}

export function saveUiPrefs(p: UiPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function applyUiPrefs(p: UiPrefs) {
  const root = document.documentElement
  root.setAttribute('data-contrast', p.contrast === 'high' ? 'high' : 'normal')
  root.setAttribute('data-density', p.density === 'compact' ? 'compact' : 'comfy')

  // theme handling
  if (p.theme === 'auto') {
    root.removeAttribute('data-theme') // let prefers-color-scheme drive vars
  } else {
    root.setAttribute('data-theme', p.theme)
  }
}

export function initUiPrefs() {
  const prefs = loadUiPrefs()
  applyUiPrefs(prefs)
  // react to OS changes when in auto
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    const p = loadUiPrefs()
    if (p.theme === 'auto') applyUiPrefs(p)
  }
  if (mql?.addEventListener) mql.addEventListener('change', handler)
}