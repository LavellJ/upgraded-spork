// client/src/AppRouter.tsx
import React, { useState } from "react";
import { Route, Link, Redirect, useLocation, useRoute } from "wouter";
import App from "./App";
import { HeroLessonDemo, HeroLessonDemoIndex } from "./pages/HeroLessonDemo";
import { PromptRunner } from "./pages/PromptRunner";
import { HealthBadge } from "./components/HealthBadge";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Providers from "./Providers";
import { TeacherLayoutV2 } from "./guide/teacher/TeacherLayoutV2";
import TabContentV2 from "./guide/teacher/TabContentV2";

/** Normalize legacy/alt tab keys coming from URLs or old code */
function normalizeTab(t?: string): string {
  if (!t) return "referrals";
  const key = t.split("/")[0].trim().toLowerCase();
  if (key === "" || key === "home" || key === "index") return "referrals";
  if (key === "dev") return "debug"; // legacy alias
  return key;
}

/** Teacher Panel Entry — derives tab from the URL and updates URL on tab clicks */
function TeacherPanelEntry() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/teacher/:sub*");
  const tab = normalizeTab(params?.sub);

  const handleTabChange = (next: string) => {
    const nextNorm = normalizeTab(next);
    if (nextNorm !== tab) setLocation(`/teacher/${nextNorm}`);
  };

  return (
    <TeacherLayoutV2
      activeTab={tab}
      onTabChange={handleTabChange}
      onClose={() => window.history.back()}
      renderContent={() => <TabContentV2 tab={tab} />}
    />
  );
}

/** Main App component with hero lesson access button & top-left nav */
function AppWithHeroAccess() {
  const [showHeroButton, setShowHeroButton] = useState(true);

  return (
    <div className="relative">
      {/* Top Navigation Bar */}
      <div className="fixed top-4 left-4 z-40">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
          <HealthBadge />
          <span className="text-gray-300">|</span>
          <Link
            href="/teacher/referrals"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            data-testid="nav-referrals-main"
          >
            Referrals
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/teacher/debug"
            className="text-sm text-gray-600 hover:text-gray-800"
            data-testid="nav-debug-main"
          >
            Debug
          </Link>
        </div>
      </div>

      {/* Hero Lesson Access Button */}
      {showHeroButton && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-blue-700 rounded-lg p-2 shadow-xl border border-white/20 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0" role="region" aria-label="Hero demo button content">
                <div className="text-white font-medium text-xs truncate">🎯 Hero Demo</div>
                <div className="text-blue-100 text-[10px] truncate">Try lesson system</div>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <Link
                  href="/hero-demo"
                  className="bg-white text-blue-600 px-2 py-1 rounded text-[10px] font-medium hover:bg-blue-50 transition-colors"
                  title="Try Hero Lesson Demo"
                >
                  Try
                </Link>

                <button
                  onClick={() => setShowHeroButton(false)}
                  aria-label="Close"
                  className="text-white/70 hover:text-white text-xs px-1 leading-none"
                  title="Hide demo button"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main App */}
      <App />
    </div>
  );
}

/** URL routing system using wouter for direct navigation */
export function AppRouter() {
  return (
    <ErrorBoundary>
      <Providers>
        {/* Hero lesson demo */}
        <Route path="/hero-demo" component={HeroLessonDemoIndex} />
        <Route path="/hero-demo/lesson" component={HeroLessonDemo} />

        {/* Prompt tools */}
        <Route path="/tools/prompts" component={PromptRunner} />

        {/* Teacher panel: redirect bare /teacher to a real tab */}
        <Route path="/teacher" component={() => <Redirect to="/teacher/referrals" />} />
        <Route path="/teacher/:sub*" component={TeacherPanelEntry} />

        {/* Legacy redirects */}
        <Route path="/referrals" component={() => <Redirect to="/teacher/referrals" />} />
        <Route path="/debug" component={() => <Redirect to="/teacher/debug" />} />
        <Route path="/dev" component={() => <Redirect to="/teacher/debug" />} /> {/* legacy alias */}

        {/* App home */}
        <Route path="/" component={AppWithHeroAccess} />
      </Providers>
    </ErrorBoundary>
  );
}