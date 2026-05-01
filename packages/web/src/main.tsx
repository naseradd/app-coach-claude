import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design/tokens.css';
import { applyTheme, loadTheme } from './design/themes.js';
import { App } from './App';

// Apply once eagerly so the first paint isn't flashed in the default theme.
// `App` then takes over via `useEffect(applyTheme(settings.theme))`.
applyTheme(loadTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
