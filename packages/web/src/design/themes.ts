export const THEMES = ['warm-cream', 'slate-cool', 'forest-calm', 'carbon-mono', 'auto'] as const;
export type ThemeId = typeof THEMES[number];

const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v);

export function applyTheme(t: ThemeId) {
  const root = document.documentElement;
  if (t === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', t);
}

/**
 * Eager initial-paint loader. Reads from the Zustand-persist payload so we
 * don't flash a default theme before App's `useEffect` fires. Falls back to
 * the legacy `coach.theme` key for users on prior versions.
 */
export function loadTheme(): ThemeId {
  try {
    const raw = localStorage.getItem('coach.settings');
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { theme?: unknown } };
      const t = parsed?.state?.theme;
      if (isThemeId(t)) return t;
    }
  } catch {
    // ignore — fall through to legacy + default
  }
  const legacy = localStorage.getItem('coach.theme');
  if (isThemeId(legacy)) return legacy;
  return 'warm-cream';
}
