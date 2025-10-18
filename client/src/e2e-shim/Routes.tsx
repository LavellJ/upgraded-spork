import * as React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

/** Shared layout with a simple header & nav visible in all shim pages */
function Layout({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 data-testid="app-title" style={{ margin: 0 }}>Quest Island — E2E Shim</h1>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/island?shim=1" data-testid="nav-island">Island</Link>
          <Link to="/progress?shim=1" data-testid="nav-progress">Progress</Link>
          <Link to="/settings?shim=1" data-testid="nav-settings">Settings</Link>
          <Link to="/lesson-launcher?shim=1" data-testid="nav-lesson-launcher">Lesson</Link>
        </nav>
      </header>
      <h2 data-testid={`${title}-heading`} style={{ marginTop: 0, marginBottom: 16, fontSize: 22, fontWeight: 700 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Pages with exact test IDs your specs expect */
function Island() {
  return (
    <Layout title="island">
      <div data-testid="scout-bubble">👋 Hi! I’m Scout.</div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button data-testid="journal-btn">Journal</button>
        <button data-testid="backpack-btn">Backpack</button>
      </div>
    </Layout>
  );
}

function Progress() {
  return (
    <Layout title="progress">
      <div data-testid="progress-grid">[progress grid]</div>
    </Layout>
  );
}

function Settings() {
  return (
    <Layout title="settings">
      <div data-testid="settings-panel">[settings panel]</div>
    </Layout>
  );
}

/** A minimal lesson page with a complete button */
function LessonLauncher() {
  const nav = useNavigate();
  const [count, setCount] = React.useState(0);
  const target = 4; // enough for flows.lap-progression.spec; adjust if needed

  return (
    <Layout title="lesson-launcher">
      <p>Complete the lesson a few times to simulate progression.</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          data-testid="complete-lesson"
          onClick={() => {
            const next = count + 1;
            setCount(next);
            if (next >= target) nav('/progress?shim=1', { replace: true });
          }}
        >
          Complete Lesson
        </button>
        <span data-testid="lesson-count">Completed: {count}/{target}</span>
      </div>
    </Layout>
  );
}

/** Root routes */
export default function ShimRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Island />} />
        <Route path="/island" element={<Island />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/lesson-launcher" element={<LessonLauncher />} />
        {/* catch-all -> island */}
        <Route path="*" element={<Island />} />
      </Routes>
    </BrowserRouter>
  );
}
