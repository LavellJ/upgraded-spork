import React, { useState, useEffect } from 'react';
import App from './App';
import { HeroLessonDemo, HeroLessonDemoIndex } from './pages/HeroLessonDemo';

/**
 * Simple routing system to showcase the hero lesson alongside the main app
 */
export function AppRouter() {
  const [currentRoute, setCurrentRoute] = useState<string>('');

  useEffect(() => {
    // Check current URL path and query params
    const updateRoute = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      
      if (path === '/hero-demo' || search.includes('hero-demo')) {
        setCurrentRoute('hero-demo');
      } else if (path === '/hero-demo/lesson' || search.includes('hero-lesson')) {
        setCurrentRoute('hero-lesson');
      } else {
        setCurrentRoute('main');
      }
    };

    updateRoute();

    // Listen for URL changes
    const handlePopState = () => updateRoute();
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Simple navigation helper
  const navigate = (route: string) => {
    const newPath = route === 'main' ? '/' : `/${route}`;
    window.history.pushState({}, '', newPath);
    setCurrentRoute(route);
  };

  // Render the appropriate component based on route
  switch (currentRoute) {
    case 'hero-demo':
      return <HeroLessonDemoIndex />;
    case 'hero-lesson':
      return <HeroLessonDemo />;
    default:
      return <AppWithHeroAccess navigate={navigate} />;
  }
}

/**
 * Main App component with hero lesson access button
 */
function AppWithHeroAccess({ navigate }: { navigate: (route: string) => void }) {
  const [showHeroButton, setShowHeroButton] = useState(true);

  return (
    <div className="relative">
      {/* Hero Lesson Access Button - moved to bottom-right to avoid blocking teacher panel */}
      {showHeroButton && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-blue-700 rounded-lg p-2 shadow-xl border border-white/20 max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-xs truncate">🎯 Hero Demo</div>
                <div className="text-blue-100 text-[10px] truncate">Try lesson system</div>
              </div>
              
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => navigate('hero-demo')}
                  className="bg-white text-blue-600 px-2 py-1 rounded text-[10px] font-medium hover:bg-blue-50 transition-colors"
                  title="Try Hero Lesson Demo"
                >
                  Try
                </button>
                
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