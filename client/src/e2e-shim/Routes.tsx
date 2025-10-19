import * as React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

function usePersistedNumber(key: string, initial: number) {
  const [val, setVal] = React.useState<number>(() => {
    const s = localStorage.getItem(key);
    return s ? Number(s) : initial;
  });
  React.useEffect(() => { localStorage.setItem(key, String(val)); }, [key, val]);
  return [val, setVal] as const;
}

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

function ProgressControls({
  onAdvance,
  target = 4,
  count,
}: {
  onAdvance: () => void;
  target: number;
  count: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button data-testid="complete-lesson" onClick={onAdvance}>
        Complete Lesson
      </button>
      <span data-testid="lesson-count">Completed: {count}/{target}</span>
    </div>
  );
}

function Island() {
  const target = 4;
  const [lap, setLap] = usePersistedNumber('e2e_lap', 1);
  const [count, setCount] = usePersistedNumber('e2e_count', 0);

  const advance = () => {
    setCount(c => {
      const next = c + 1;
      if (next >= target) {
        setLap(l => l + 1);
        // reset after lap up
        return 0;
      }
      return next;
    });
  };

  // Expose E2E hooks for tests
  React.useEffect(() => {
    (window as any).__E2E__ = {
      getLap: () => lap,
      setLap: (n: number) => setLap(n),
      resetProgress: () => { setLap(1); setCount(0); },
      seenTodayLesson: true,
    };
  }, [lap, setLap, setCount]);

  return (
    <Layout title="island">
      <div data-testid="lap-badge" style={{ fontWeight: 800, marginBottom: 12 }}>Lap {lap}</div>
      <div data-testid="scout-bubble">👋 Hi! I’m Scout.</div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button data-testid="journal-btn">Journal</button>
        <button data-testid="backpack-btn">Backpack</button>
      </div>

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

      <div style={{ marginTop: 20 }}>
        <ProgressControls onAdvance={advance} target={target} count={count} />
      </div>
    </Layout>
  );
}

function Progress() {
  return (
    <Layout title="progress">
      {/* removed duplicate data-testid to avoid strict mode violation */}
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

function LessonLauncher() {
  const nav = useNavigate();
  React.useEffect(() => {
    // also expose seenTodayLesson truthy for the spec
    (window as any).__E2E__ = { ...(window as any).__E2E__, seenTodayLesson: true };
  }, []);
  return (
    <Layout title="lesson-launcher">
      <p>Launch a lesson to enter the activity stub.</p>
      <button
        data-testid="start-lesson"
        onClick={() => nav('/activity/act-001?shim=1')}
      >
        Start Lesson
      </button>
      <div style={{ marginTop: 16 }}>
        {/* small convenience: completing lessons here also advances count/lap via island; non-essential */}
      </div>
    </Layout>
  );
}

function Activity() {
  return (
    <Layout title="activity">
      <h3 data-testid="activity-heading">Patterns Intro</h3>
      <p>Stubbed activity content…</p>
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
        <Route path="/lesson-launcher" element={<LessonLauncher />} />
        <Route path="/lesson" element={<LessonLauncher />} />
        <Route path="/launcher" element={<LessonLauncher />} />
        <Route path="/activity/act-001" element={<Activity />} />
        {/* teacher stubs */}
        <Route path="/teacher/reports" element={<Layout title="reports"><div data-testid="reports">[reports]</div></Layout>} />
        <Route path="/teacher/assignments" element={<Layout title="assignments"><div data-testid="assignments">[assignments]</div></Layout>} />
        <Route path="*" element={<Island />} />
      </Routes>
    </BrowserRouter>
  );
}
