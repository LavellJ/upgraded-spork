import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppRouter from '@/AppRouter';
import { ThemeProvider } from '@/hooks/useAmbientTheme';
import './index.css';

if (!document.documentElement.getAttribute('lang')) {
  document.documentElement.setAttribute('lang', 'en-AU');
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  const msg = 'Missing #root element in index.html';
  console.error(msg);
  const div = document.createElement('div');
  div.textContent = msg;
  document.body.appendChild(div);
  throw new Error(msg);
}
const root = ReactDOM.createRoot(rootEl);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
