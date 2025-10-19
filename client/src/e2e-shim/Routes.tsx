import * as React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';

/** ------- Shared store (persists to localStorage) ------- */
const LS_LAP = 'e2e_lap';
const LS_CNT = 'e2e_count';

function getNum(key: string, def = 0) {
  const v = localStorage.getItem(key);
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : def;
}
function setNum(key: string, v: number) {
  localStorage.setItem(key, String(v));
}

const Store = {
  target: 4,
  get lap() { return getNum(LS_LAP, 1); },
  set lap(v: number) { setNum(LS_LAP, v); },
  get count() { return getNum(LS_CNT, 0); },
  set count(v: number) { setNum(LS_CNT, v); },
  completeLesson() {
    const next = this.count + 1;
    if (next >= this.target) {
      this.lap = this.lap + 1;
      this.count = 0;
    } else {
      this.count = next;
    }
    window.dispatchEvent(new CustomEvent('e2e:store-updated'));
  },
  reset() { this.lap = 1; this.count = 0; window.dispatchEvent(new CustomEvent('e2e:store-updated')); },
};

/** ------- Stable E2E API on window (don’t replace object) ------- */
declare global { interface Window { __E2E__?: any } }
(function ensureE2E() {
  if (!window.__E2E__) window.__E2E__ = {};
  Object.assign(window.__E2E__, {
    getLap: () => Store.lap,
    setLap: (n: number) => { Store.lap = n; },
    resetProgress: () => Store.reset(),
    seenTodayLesson: true,
  });
})();

/** ------- Global click listener for complete-lesson anywhere ------- */
if (!(window as any).__E2E_click_hook_installed) {
  (window as any).__E2E_click_hook_installed = true;
  document.addEventListener('click', (ev) => {
    const el = ev.target as HTMLElement | null;
    const hit = el?.closest?.('[data-testid="complete-lesson"]');
    if (hit) {
      ev.preventDefault();
      Store.completeLesson();
    }
  }, { capture: true });
}

/** ------- UI scaffolding ------- */
function useStoreSync() {
  const [, force] = React.useReducer(n => n + 1, 0);
  React.useEffect(() => {
    const onUpd = () => force();
    window.addEventListener('e2e:store-updated', onUpd);
    return () => window.removeEventListener('e2e:store-updated', onUpd);
  }, []);
  return { lap: Store.lap, count: Store.count, target: Store.target };
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
    <div data-testid={`chip-${id}`} style={{ border: '1px solid #CBD5E1', borderRadius: 999, padding: '6px 10px' }}>
      {label}
    </div>
  );
}

function ProgressControls() {
  const { count, target } = useStoreSync();
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button data-testid="complete-lesson">Complete Lesson</button>
      <span data-testid="lesson-count">Completed: {count}/{target}</span>
    </div>
  );
}

function Island() {
  const { lap } = useStoreSync();
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
        <ProgressControls />
      </div>
    </Layout>
  );
}

function Progress() {
  const { lap } = useStoreSync();
  return (
    <Layout title="progress">
      <div data-testid="lap-badge">Lap {lap}</div>
      <div data-testid="progress-grid">[progress grid]</div>
      <div style={{ marginTop: 12 }}><ProgressControls /></div>
    </Layout>
  );
}

function Settings() {
  const { lap } = useStoreSync();
  return (
    <Layout title="settings">
      <div data-testid="lap-badge">Lap {lap}</div>
      <div data-testid="settings-panel">[settings panel]</div>
      <div style={{ marginTop: 12 }}><ProgressControls /></div>
    </Layout>
  );
}

function LessonLauncher() {
  const nav = useNavigate();
  React.useEffect(() => {
    if (!window.__E2E__) window.__E2E__ = {};
    window.__E2E__.seenTodayLesson = true;
  }, []);
  return (
    <Layout title="lesson-launcher">
      <p>Launch a lesson to enter the activity stub.</p>
      <button data-testid="start-lesson" onClick={() => nav('/activity/act-001?shim=1')}>Start Lesson</button>
      <div style={{ marginTop: 12 }}>
        {/* Provide the same control here so the flow spec can find it if it lands here */}
        <ProgressControls />
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
