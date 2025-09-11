import React, { useState } from 'react';
import { Route, Link } from 'wouter';
import App from './App';
import { HeroLessonDemo, HeroLessonDemoIndex } from './pages/HeroLessonDemo';
import { PromptRunner } from './pages/PromptRunner';
import DebugDashboard from './pages/DebugDashboard';
import { ReferralsPage } from './pages/ReferralsPage';
import { HealthBadge } from './components/HealthBadge';
import { ErrorBoundary } from './components/ErrorBoundary';
import Providers from './Providers';

/**
 * URL routing system using wouter for direct navigation
 */
export function AppRouter() {
  return (
    <ErrorBoundary>
      <Providers>
        <Route path="/hero-demo" component={HeroLessonDemoIndex} />
        <Route path="/hero-demo/lesson" component={HeroLessonDemo} />
        <Route path="/tools/prompts" component={PromptRunner} />
        <Route path="/debug" component={DebugDashboard} />
        <Route path="/referrals" component={ReferralsPage} />
        <Route path="/" component={AppWithHeroAccess} />
      </Providers>
    </ErrorBoundary>
  );
}

/**
 * Main App component with hero lesson access button
 */
function AppWithHeroAccess() {
  const [showHeroButton, setShowHeroButton] = useState(true);

  return (
    <div className="relative">
      {/* Top Navigation Bar */}
      <div className="fixed top-4 left-4 z-40">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200">
          <HealthBadge />
          <span className="text-gray-300">|</span>
          <Link href="/referrals" className="text-sm text-blue-600 hover:text-blue-800 font-medium" data-testid="nav-referrals-main">
            Referrals
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/debug" className="text-sm text-gray-600 hover:text-gray-800" data-testid="nav-debug-main">
            Debug
          </Link>
        </div>
      </div>

      {/* Hero Lesson Access Button - moved to bottom-right to avoid blocking teacher panel */}
      {showHeroButton && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-blue-700 rounded-lg p-2 shadow-xl border border-white/20 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0" role="region" aria-label="Hero demo button content">
                <div className="text-white font-medium text-xs truncate">🎯 Hero Demo</div>
                <div className="text-blue-100 text-[10px] truncate">Try lesson system</div>
              </div>
              
              <div className="flex gap-1 flex-shrink-0">
                <Link href="/hero-demo" className="bg-white text-blue-600 px-2 py-1 rounded text-[10px] font-medium hover:bg-blue-50 transition-colors" title="Try Hero Lesson Demo">
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