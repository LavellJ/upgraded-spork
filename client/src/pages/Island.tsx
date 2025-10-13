import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type BiomeId = "forest" | "tropics" | "desert" | "coast";
type BiomeProgress = {
  id: BiomeId;
  completed: number;
  total: number;
  locked: boolean;
};

export default function Island() {
  const [progress, setProgress] = useState<BiomeProgress[] | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    fetch("/api/progress/island")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setProgress)
      .catch(() =>
        setProgress([
          { id: "forest", completed: 1, total: 3, locked: false },
          { id: "tropics", completed: 3, total: 3, locked: false },
          { id: "desert", completed: 0, total: 3, locked: true },
          { id: "coast", completed: 0, total: 3, locked: true },
        ]),
      );
  }, []);

  const byId = (id: BiomeId) => progress?.find((b) => b.id === id);

  const Node = ({ id, label }: { id: BiomeId; label: string }) => {
    const p = byId(id);
    const locked = p?.locked;
    const chip = p ? `${p.completed}/${p.total}` : "";

    const handleClick = () => {
      if (!locked) setLocation(`/island/${id}`);
    };

    return (
      <div
        className="relative w-44 h-44 rounded-full shadow-lg bg-white/80 flex items-center justify-center cursor-pointer select-none"
        data-testid={`biome-${id}`}
        onClick={handleClick}
        aria-disabled={locked ? "true" : "false"}
        role="button"
        tabIndex={locked ? -1 : 0}
      >
        <span className="text-sm">{label}</span>
        {!locked && p && (
          <span
            className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700"
            data-testid={`progress-${id}`}
          >
            {chip}
          </span>
        )}
        {locked && (
          <span
            className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-neutral-200 text-neutral-700"
            data-testid={`lock-${id}`}
            aria-label="locked"
          >
            🔒
          </span>
        )}
      </div>
    );
  };

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 data-testid="island-heading" className="text-xl font-semibold">
          Quest Island
        </h1>
        <div className="flex items-center gap-3">
          <button
            data-testid="journal-btn"
            className="rounded-lg px-3 py-1 bg-white/80 shadow"
          >
            Journal
          </button>
          <button
            data-testid="backpack-btn"
            className="rounded-lg px-3 py-1 bg-white/80 shadow"
          >
            Backpack
          </button>
        </div>
      </header>

      <section
        className="relative w-full max-w-4xl mx-auto grid grid-cols-2 gap-10 place-items-center"
        data-testid="island-scene"
      >
        <Node id="forest" label="Forest" />
        <Node id="desert" label="Desert" />
        <Node id="tropics" label="Tropics" />
        <Node id="coast" label="Coast" />
      </section>

      <aside
        className="max-w-md rounded-2xl p-4 bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow"
        data-testid="scout-bubble"
      >
        <div className="font-semibold mb-1">Scout</div>
        <p>
          G'day, Harvey! Welcome to Quest Island! Click on the glowing biomes to
          start your learning adventure. Complete lessons to unlock new areas
          and collect amazing treasures!
        </p>
      </aside>

      <footer className="text-sm text-neutral-500">
        <Link href="/">← Back home</Link>
      </footer>
    </main>
  );
}
