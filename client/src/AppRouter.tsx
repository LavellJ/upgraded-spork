import * as React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Styleguide from '@/pages/Styleguide';

function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-3">Quest Island — Dev shell</h1>
        <p className="opacity-80 mb-6">Vite dev server is running.</p>
        <div className="flex items-center justify-center gap-3">
          <Link className="underline" to="/styleguide">Open Styleguide</Link>
          <a className="underline opacity-80" href="https://github.com" target="_blank">Docs</a>
        </div>
      </div>
    </main>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
        <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold">Quest Island</Link>
          <Link to="/styleguide" className="opacity-80 hover:opacity-100">Styleguide</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/styleguide" element={<Styleguide />} />
      </Routes>
    </BrowserRouter>
  );
}
