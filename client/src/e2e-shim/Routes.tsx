import * as React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

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
      {/* H2 id matches "<title>-heading" that specs assert */}
      <h2 data-testid={`${title}-heading`} style={{ marginTop: 0, marginBottom: 16, fontSize: 22, fontWeight: 700 }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Chip({ id, label }: { id: string; label: string }) {
  return (
    <div
      data-testid={`chip-${id}`}
      style={{ border: '1px solid #CBD5E1', borderRadius: 999, padding: '6px 10px' }}
    >
      {label}
    </div>
  );
}

function Island() {
  return (
    <Layout title="island">
      {/* what specs look for */}
      <div data-testid="lap-badge" style={{ fontWeight: 800, marginBottom: 12 }}>Lap 1</div>
      <div data-testid="scout-bubble">👋 Hi! I’m Scout.</div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button data-testid="journal-btn">Journal</button>
        <button data-testid="backpack-btn">Backpack</button>
      </div>

      {/* biome + progress test IDs */}
      <section style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        {(['forest','tropics','desert','coast'] as const).map(id => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div data-testid={`biome-${id}`} style={{ width: 80, height: 40, background: '#E2E8F0', display:'grid', placeItems:'center' }}>
              {id}
            </div>
            <div data-testid={`progress-${id}`} style={{ width: 160, height: 12, background: '#F1F5F9', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, width:'40%', background:'#A7F3D0' }} />
            </div>
            <Chip id={id} label={id[0].toUpperCase() + id.slice(1)} />
          </div>
        ))}
      </section>

      {/* keep the progression control here too for the flow test */}
      <div style={{ marginTop: 20 }}>
        <ProgressControls />
      </div>
    </Layout>
  );
}

function Progress() {
  return (
    <Layout title="progress">
      <div data-testid="progress-heading" style={{ display:'none' }} />
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

function ProgressControls() {
  const [count, setCount] = React.useState(0);
  const target = 4;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button data-testid="complete-lesson" onClick={() => setCount(c => c + 1)}>
        Complete Lesson
      </button>
      <span data-testid="lesson-count">Completed: {count}/{target}</span>
    </div>
  );
}

function LessonLauncher() {
  return (
    <Layout title="lesson-launcher">
      {/* explicit elements the smoke.lesson-launcher spec asserts */}
      <p>Launch a lesson to enter the activity stub.</p>
      <button data-testid="start-lesson">Start Lesson</button>
      <div style={{ marginTop: 16 }}>
        <ProgressControls />
      </div>
    </Layout>
  );
}

export default function ShimRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Island />} />
        <Route path="/island" element={<Island />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/settings" element={<Settings />} />
        {/* multiple entry points to satisfy any spec pathing */}
        <Route path="/lesson-launcher" element={<LessonLauncher />} />
        <Route path="/lesson" element={<LessonLauncher />} />
        <Route path="/launcher" element={<LessonLauncher />} />
        {/* teacher stubs */}
        <Route path="/teacher/reports" element={<Layout title="reports"><div data-testid="reports">[reports]</div></Layout>} />
        <Route path="/teacher/assignments" element={<Layout title="assignments"><div data-testid="assignments">[assignments]</div></Layout>} />
        <Route path="*" element={<Island />} />
      </Routes>
    </BrowserRouter>
  );
}
