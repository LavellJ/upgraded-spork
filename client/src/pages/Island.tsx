import React from "react";
import { Link, useLocation } from "wouter";
import {
  ensureLapConsistency,
  getBiomeCounts,
  type BiomeId,
} from "../store/progress";

export default function Island() {
  const [, setLocation] = useLocation();
  const [local, setLocal] = React.useState(() => ensureLapConsistency());

  React.useEffect(() => {
    const refresh = () => setLocal(ensureLapConsistency());
    refresh();
    const t1 = setTimeout(refresh, 0);
    const t2 = setTimeout(refresh, 150);
    const t3 = setTimeout(refresh, 500);
    const onVis = () => document.visibilityState === "visible" && refresh();
    const onEvt = () => refresh();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("island-progress-updated", onEvt);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("island-progress-updated", onEvt);
    };
  }, []);

  const chipFor = (id: BiomeId) => {
    const { cur, total } = getBiomeCounts(local, id);
    return `${cur}/${total}`;
  };

  const Node = ({
    id,
    label,
  }: {
    id: "forest" | "tropics" | "desert" | "coast";
    label: string;
  }) => {
    const handleClick = () => setLocation(`/island/${id}`);
    return (
      <div
        className="relative w-44 h-44 rounded-full shadow-lg bg-white/80 flex items-center justify-center cursor-pointer select-none"
        data-testid={`biome-${id}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <span className="text-sm">{label}</span>
        <span
          className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700"
          data-testid={`progress-${id}`}
        >
          {chipFor(id)}
        </span>
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
          <div
            data-testid="lap-badge"
            className="rounded-full px-3 py-1 bg-indigo-100 text-indigo-700"
          >
            Lap {local.currentLap}
          </div>
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
