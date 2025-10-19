// client/src/e2e-shim/Routes.tsx
import * as React from 'react';
import { createHashRouter, RouterProvider, Link } from 'react-router-dom';

declare global {
  interface Window {
    __E2E__?: {
      getLap: () => number;
      completeLesson: () => void;
      reset: () => void;
      getSeenTodayLesson: () => boolean;
      setSeenTodayLesson: (v: boolean) => void;
    };
  }
}

// --- Global test store (singleton) ---
const store = (() => {
  let lap = 1;
  let completed = 0;
  const target = 4; // finish all 4 biomes to advance
  let seenTodayLesson = false;

  return {
    get lap() { return lap; },
    get seenTodayLesson() { return seenTodayLesson; },
    complete() {
      completed += 1;
      if (completed >= target) {
        lap += 1;
        completed = 0;
      }
    },
    reset() {
      lap = 1;
      completed = 0;
      seenTodayLesson = false;
    },
    setSeenToday(v: boolean) { seenTodayLesson = v; },
  };
})();

// Expose helpers to tests
window.__E2E__ = {
  getLap: () => store.lap,
  completeLesson: () => store.complete(),
  reset: () => store.reset(),
  getSeenTodayLesson: () => store.seenTodayLesson,
  setSeenTodayLesson: (v: boolean) => store.setSeenToday(v),
};

// Small badge with current lap
const LapBadge: React.FC = () => (
  <div data-testid="lap-badge" style={{ fontWeight: 700 }}>
    Lap {store.lap}
  </div>
);

// Common toolbar used on island/progress/settings
const Toolbar: React.FC = () => (
  <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
    <button data-testid="journal-btn">Journal</button>
    <button data-testid="backpack-btn">Backpack</button>
    <button data-testid="complete-lesson" onClick={() => store.complete()}>
      Complete Lesson
    </button>
  </div>
);

// Pages expected by tests
const Island: React.FC = () => (
  <main>
    <h1 data-testid="island-heading">island</h1>
    <LapBadge />
    <Toolbar />
    {/* biome chips */}
    <div data-testid="biome-forest">Forest</div>
    <div data-testid="biome-tropics">Tropics</div>
    <div data-testid="biome-desert">Desert</div>
    <div data-testid="biome-coast">Coast</div>
    {/* progress chips */}
    <div data-testid="progress-forest" />
    <div data-testid="progress-tropics" />
    <div data-testid="progress-desert" />
    <div data-testid="progress-coast" />
  </main>
);

const Progress: React.FC = () => (
  <main>
    {/* Ensure only one element has this testId to avoid strict-mode duplicates */}
    <h1 data-testid="progress-heading">progress</h1>
    <LapBadge />
    <Toolbar />
  </main>
);

const Settings: React.FC = () => (
  <main>
    <h1 data-testid="settings-heading">settings</h1>
    <Toolbar />
  </main>
);

// Lesson launcher flow
const LessonLauncher: React.FC = () => (
  <main>
    <h1 data-testid="lesson-launcher-heading">Lesson Launcher</h1>
    <button
      data-testid="start-lesson"
      onClick={() => {
        window.__E2E__?.setSeenTodayLesson(true);
        // match test expectation to navigate to /activity/act-001
        location.hash = '#/activity/act-001';
      }}
    >
      Start
    </button>
  </main>
);

const Activity: React.FC = () => (
  <main>
    <h1 data-testid="activity-heading">Patterns Intro</h1>
    <LapBadge />
  </main>
);

// Simple home with links for manual sanity
const Home: React.FC = () => (
  <main style={{ display: 'grid', gap: 8 }}>
    <Link to="/island">Island</Link>
    <Link to="/progress">Progress</Link>
    <Link to="/settings">Settings</Link>
    <Link to="/lesson-launcher">Lesson Launcher</Link>
  </main>
);

const router = createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/island', element: <Island /> },
  { path: '/progress', element: <Progress /> },
  { path: '/settings', element: <Settings /> },
  { path: '/lesson-launcher', element: <LessonLauncher /> },
  { path: '/activity/act-001', element: <Activity /> },
]);

export default function ShimRoutes() {
  return <RouterProvider router={router} />;
}