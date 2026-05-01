import { useEffect } from 'react';
import { AppRouter } from './router.js';
import { useApiBoot } from './hooks/useApiBoot.js';
import { applyTheme } from './design/themes.js';
import { useSettings } from './store/settings.store.js';

export function App() {
  // Re-apply whenever the persisted theme changes (Settings page mutates it).
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useApiBoot();

  return <AppRouter />;
}
