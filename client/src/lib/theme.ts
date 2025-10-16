export function setDark(enabled: boolean) {
  const root = document.documentElement;
  root.classList.toggle('theme-dark', enabled);
}

export function isDark() {
  return document.documentElement.classList.contains('theme-dark');
}
