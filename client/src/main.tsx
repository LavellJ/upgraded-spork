import { createRoot } from "react-dom/client";
import React from "react";
import { AppRouter } from "./AppRouter";
import "./index.css";
import Providers from "./Providers";
import { initUiPrefs } from './ui/theme';
import { ToastProvider } from './components/ui/toast';

// Initialize UI preferences
initUiPrefs();

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Dev accessibility checks (development only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  const axe = (await import('@axe-core/react')).default;
  const React = await import('react');
  const ReactDOM = await import('react-dom/client');
  axe(React, ReactDOM, 1000);
}

// Dev console helper for art diagnostics (development only)
if (import.meta.env.DEV) {
  // @ts-ignore
  window.qiArtCheck = async () => {
    const urls = [
      'art/ui/backpack.webp',
      'art/spots/map-parchment.webp',
      'art/scout/scout.svg',
      'art/scout/scout-neutral.webp'
    ].map(u => (import.meta.env.BASE_URL || '/') + u.replace(/^\//, ''))
    const out = await Promise.all(urls.map(async u => {
      try { const r = await fetch(u, { cache:'reload' }); return [u, r.status] } catch { return [u, 'ERR'] }
    }))
    console.table(out)
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <Providers>
        <AppRouter />
      </Providers>
    </ToastProvider>
  </React.StrictMode>
);
