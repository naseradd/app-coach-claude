export const THEMES = ['warm-cream', 'slate-cool', 'forest-calm', 'carbon-mono', 'auto'] as const;
export type ThemeId = typeof THEMES[number];

export function applyTheme(t: ThemeId) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
  localStorage.setItem('coach.theme', t);
}

export function loadTheme(): ThemeId {
  const v = localStorage.getItem('coach.theme') as ThemeId | null;
  return v && (THEMES as readonly string[]).includes(v) ? v : 'warm-cream';
}
