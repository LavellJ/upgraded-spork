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
      {/* Hero Lesson Access Button */}
      {showHeroButton && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-3 shadow-2xl border-2 border-white/20">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-white font-bold text-sm">🎯 Hero Lesson Demo</div>
                <div className="text-blue-100 text-xs">Production-ready lesson system</div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('hero-demo')}
                  className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-medium hover:bg-blue-50 transition-colors"
                >
                  Try It
                </button>
                
                <button
                  onClick={() => setShowHeroButton(false)}
                  className="text-white/70 hover:text-white text-xs px-2"
                >
                  ✕
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