import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// Self-hosted OFL fonts (see docs/asset-register.md): latin subset only.
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/barlow-condensed/latin-800.css';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/share-tech-mono/latin-400.css';
import './styles.css';
import { settings } from './settings';

// Settings that are pure CSS: UI scale and reduce motion live on <html>.
const applyHtml = () => {
  const s = settings.get(), el = document.documentElement;
  el.style.setProperty('--ui-scale', String(s.uiScale));
  el.classList.toggle('reduce-motion', s.reduceMotion);
};
applyHtml();
settings.subscribe(applyHtml);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
