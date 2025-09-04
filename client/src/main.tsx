import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";
import Providers from "./Providers";
import { initUiPrefs } from './ui/theme';
import { ToastProvider } from '@/components/ui/toast';

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

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <Providers>
        <App />
      </Providers>
    </ToastProvider>
  </React.StrictMode>
);
