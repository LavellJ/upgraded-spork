import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";
import { ProfileProvider } from "./profile/context";
import { RosterProvider } from "./roster/context";
import { GuideNoticeProvider } from "./guide/notices";

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
    <GuideNoticeProvider>
      <ProfileProvider>
        <RosterProvider>
          <App />
        </RosterProvider>
      </ProfileProvider>
    </GuideNoticeProvider>
  </React.StrictMode>
);
