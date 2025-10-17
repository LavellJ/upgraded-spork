import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/hooks/useAmbientTheme';
import './index.css';

// Ensure <html lang> for a11y in all envs
if (!document.documentElement.getAttribute('lang')) {
  document.documentElement.setAttribute('lang', 'en-AU');
}

const useDevShell = import.meta.env.VITE_DEV_SHELL === '1';

async function bootstrap() {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    const msg = 'Missing #root element in index.html';
    console.error(msg);
    const div = document.createElement('div');
    div.textContent = msg;
    document.body.appendChild(div);
    throw new Error(msg);
  }

  // Dynamically pick router (both files exist, so bundling succeeds)
  const { default: Router } = useDevShell
    ? await import('@/AppRouter.dev')
    : await import('@/AppRouter');

  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
      </ThemeProvider>
    </React.StrictMode>
  );
}

bootstrap();
