import { Page } from '@playwright/test';

export async function setUiPrefs(
  page: Page,
  prefs: { theme?: 'light' | 'dark'; density?: 'comfortable' | 'compact' } = {}
) {
  await page.addInitScript((p) => {
    try {
      const existing = JSON.parse(localStorage.getItem('ui:prefs') || '{}');
      const merged = { ...existing, ...p, reducedMotion: true };
      localStorage.setItem('ui:prefs', JSON.stringify(merged));
    } catch {
      localStorage.setItem('ui:prefs', JSON.stringify({ ...p, reducedMotion: true }));
    }
  }, prefs);
}

export async function devLogin(page: Page, user: Record<string, any> = {}) {
  await page.addInitScript((u) => {
    localStorage.setItem('auth:token', 'dev-ci-token');
    localStorage.setItem('auth:user', JSON.stringify({ id: 'dev', name: 'CI Bot', role: 'teacher', ...u }));
  }, user);
}