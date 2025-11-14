import * as React from 'react';

const Swatch = ({ name, varName }: { name: string; varName: string }) => (
  <div className="flex items-center justify-between rounded-xl border p-3">
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-lg border"
        style={{ backgroundColor: `rgb(var(${varName}))` }}
      />
      <div className="text-sm">
        <div className="font-medium">{name}</div>
        <div className="opacity-70 text-xs">{varName}</div>
      </div>
    </div>
    <code className="text-xs opacity-70">rgb(var({varName}))</code>
  </div>
);

export default function Styleguide() {
  return (
    <main className="min-h-screen p-6 md:p-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Styleguide</h1>
        <p className="opacity-80">Quick visual checks for tokens & primitives.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Color Tokens</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Swatch name="Background" varName="--bg" />
          <Swatch name="Foreground" varName="--fg" />
          <Swatch name="Muted" varName="--muted" />
          <Swatch name="Muted FG" varName="--muted-fg" />
          <Swatch name="Accent" varName="--accent" />
          <Swatch name="Accent FG" varName="--accent-fg" />
          <Swatch name="Positive" varName="--positive" />
          <Swatch name="Warning" varName="--warning" />
          <Swatch name="Danger" varName="--danger" />
          <Swatch name="Border" varName="--border" />
          <Swatch name="Ring" varName="--ring" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl px-4 py-2 border bg-white/70 shadow-sm hover:bg-white transition">
            Default
          </button>
          <button className="rounded-xl px-4 py-2 bg-[rgb(var(--accent))] text-[rgb(var(--accent-fg))] shadow hover:brightness-95 transition">
            Accent
          </button>
          <button className="rounded-xl px-4 py-2 bg-[rgb(var(--positive))] text-white shadow hover:brightness-95 transition">
            Positive
          </button>
          <button className="rounded-xl px-4 py-2 bg-[rgb(var(--warning))] text-black shadow hover:brightness-95 transition">
            Warning
          </button>
          <button className="rounded-xl px-4 py-2 bg-[rgb(var(--danger))] text-white shadow hover:brightness-95 transition">
            Danger
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Typography</h2>
        <div className="space-y-2">
          <p className="text-3xl font-bold">Heading XL — Geist / Inter</p>
          <p className="text-xl font-semibold">Heading L</p>
          <p className="text-base opacity-80">Body text uses your tokenized font stack.</p>
          <p className="text-sm opacity-60">Small print tone.</p>
        </div>
      </section>
    </main>
  );
}
