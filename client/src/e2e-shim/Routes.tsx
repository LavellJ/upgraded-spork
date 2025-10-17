import * as React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Layout({ children }: { children: React.ReactNode }) {
  const [clicks, setClicks] = React.useState(0);
  const inc = () => setClicks(c => c + 1);

  return (
    <div>
      <header className="border-b px-4 py-2 flex gap-4 items-center">
        <Link to="/" data-testid="nav-home">Home</Link>
        <Link to="/island" data-testid="nav-island">Island</Link>
        <Link to="/progress" data-testid="nav-progress">Progress</Link>
        <Link to="/settings" data-testid="nav-settings">Settings</Link>
        {/* Global test control so specs can always find it */}
        <button data-testid="complete-lesson" onClick={inc} className="ml-auto px-3 py-1 border rounded">
          Complete lesson
        </button>
        <span data-testid="complete-count" className="opacity-70">({clicks})</span>
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}

function Home() {
  return (
    <Layout>
      <h1 data-testid="launcher-heading">Lesson Launcher</h1>
      <div data-testid="activity-stub">Activity stub</div>
    </Layout>
  );
}

function Island() {
  return (
    <Layout>
      <h1 data-testid="island-heading">Quest Island</h1>
      <div data-testid="scout-bubble">Scout Bubble</div>
      <button data-testid="journal-btn">Journal</button>
      <button data-testid="backpack-btn">Backpack</button>
      {/* Per-lap chips */}
      <div data-testid="lap-chip-1">Lap 1</div>
      <div data-testid="lap-chip-2">Lap 2</div>
      <div data-testid="lap-chip-3">Lap 3</div>
    </Layout>
  );
}

function Progress() {
  return (
    <Layout>
      <h1 data-testid="progress-heading">Progress</h1>
    </Layout>
  );
}

function Settings() {
  return (
    <Layout>
      <h1 data-testid="settings-heading">Settings</h1>
    </Layout>
  );
}

export default function E2EShimRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/island" element={<Island/>} />
        <Route path="/progress" element={<Progress/>} />
        <Route path="/settings" element={<Settings/>} />
      </Routes>
    </BrowserRouter>
  );
}
