// client/src/AppRouter.tsx
import React, { useState, useEffect } from "react";
import { Route, Link, Redirect, useLocation } from "wouter";

import App from "./App";
import { HeroLessonDemo, HeroLessonDemoIndex } from "./pages/HeroLessonDemo";
import { PromptRunner } from "./pages/PromptRunner";
import { HealthBadge } from "./components/HealthBadge";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Providers from "./Providers";
import { TeacherLayoutV2 } from "./guide/teacher/TeacherLayoutV2";
import TabContentV2 from "./guide/teacher/TabContentV2";
import TopNav from "./components/TopNav";
import Island from "./pages/Island";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";

function BootMarker() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.setAttribute("data-testid", "app-loaded");
    document.body.setAttribute("data-app-loaded", "1");
  }, []);
  return null;
}

/* ---------------------------------- utils --------------------------------- */

/** Normalize legacy/alt tab keys coming from URLs or old code */
function normalizeTab(t?: string | null): string {
  if (!t) return "overview";
  const key = t.split("/")[0].trim().toLowerCase();
  if (key === "" || key === "home" || key === "index") return "overview";
  if (key === "dev") return "debug"; // legacy alias
  return key;
}

/** Legacy hash → clean /teacher/<tab> redirect (e.g. /#/?guide&tab=classes) */
function useLegacyHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash || "";
    if (!hash) return;

    // Remove "#/" or "#" then split on "?"
    const afterHash = hash.replace(/^#\/?/, "");
    const [maybePath, maybeQuery] = afterHash.split("?");

    // Old links often looked like "#/?guide&tab=classes" or "#/guide?tab=classes"
    const indicatesGuide =
      (maybePath && /(^|\/)guide(\/|$)/i.test(maybePath)) ||
      (maybeQuery && /(^|&)guide(&|=|$)/i.test(maybeQuery));

    if (!indicatesGuide) return;

    const sp = new URLSearchParams(maybeQuery || "");
    const tab = normalizeTab(sp.get("tab"));

    // Avoid loops: only redirect if we’re not already on /teacher/<tab>
    if (!window.location.pathname.startsWith("/teacher/")) {
      window.location.replace(`/teacher/${tab}`);
    }
  }, []);
}

/* ---------------------------- routed entry point --------------------------- */

/** Teacher Panel Entry — derives tab from the URL and updates URL on tab clicks */
function TeacherPanelEntry({ params }: { params?: { "sub*"?: string } }) {
  const [location, setLocation] = useLocation();

  // Read tab from segment first, then fallback to query param (?tab=)
  const fromPath = (params?.["sub*"] || "").split("/")[0] || "";
  const qp =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tab")
      : null;
  const tab = normalizeTab(fromPath || qp);

  // Keep ?tab synchronized for back-compat (so old links still see a tab=…)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("tab") !== tab) {
      sp.set("tab", tab);
      const base = location.split("?")[0];
      window.history.replaceState(null, "", `${base}?${sp.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

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

/* ------------------------------- app chrome ------------------------------- */

/** Main App component with hero lesson access button & top-left nav */
function AppWithHeroAccess() {
  const [showHeroButton, setShowHeroButton] = useState(true);

  return (
    <div className="relative">
      {/* Top Navigation Bar */}
      <div className="fixed top-4 left-4 right-4 z-40">
        <TopNav />
      </div>

      {/* Hero Lesson Access Button */}
      {showHeroButton && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-blue-700 rounded-lg p-2 shadow-xl border border-white/20 max-w-xs">
            <div className="flex items-center gap-2">
              <div
                className="flex-1 min-w-0"
                role="region"
                aria-label="Hero demo button content"
              >
                <div className="text-white font-medium text-xs truncate">
                  🎯 Hero Demo
                </div>
                <div className="text-blue-100 text-[10px] truncate">
                  Try lesson system
                </div>
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

/* ---------------------------------- router -------------------------------- */

export function AppRouter() {
  // Back-compat for legacy hash URLs used by older tests/links
  useLegacyHashRedirect();

  return (
    <ErrorBoundary>
      <Providers>
        <BootMarker />
        {/* Hero lesson demo */}
        <Route path="/hero-demo" component={HeroLessonDemoIndex} />
        <Route path="/hero-demo/lesson" component={HeroLessonDemo} />

        {/* Prompt tools */}
        <Route path="/tools/prompts" component={PromptRunner} />

        {/* Teacher panel: support both /teacher and /teacher/:sub* */}
        <Route path="/teacher/:sub*" component={TeacherPanelEntry} />
        <Route path="/teacher" component={TeacherPanelEntry} />

        {/* Legacy redirects */}
        <Route
          path="/referrals"
          component={() => <Redirect to="/teacher/referrals" />}
        />
        <Route
          path="/debug"
          component={() => <Redirect to="/teacher/debug" />}
        />
        {/* explicit legacy alias */}
        <Route path="/dev" component={() => <Redirect to="/teacher/debug" />} />

        {/* Sprint 1 routes */}
        <Route path="/island" component={Island} />
        <Route path="/progress" component={Progress} />
        <Route path="/settings" component={Settings} />

        {/* App home */}
        <Route path="/" component={AppWithHeroAccess} />
      </Providers>
    </ErrorBoundary>
  );
}

export default AppRouter;
