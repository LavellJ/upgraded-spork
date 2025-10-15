import React from "react";
import { Link, useLocation } from "wouter";
import {
  ensureLapConsistency,
  getBiomeCounts,
  type BiomeId,
} from "../store/progress";
import IslandScene from "../components/island/IslandScene";
import ScoutBubble from "../components/island/ScoutBubble";
import SceneChrome from "../components/island/SceneChrome";

const BIOME_NODES = [
  { id: "forest" as const, x: 28, y: 30 },
  { id: "desert" as const, x: 72, y: 30 },
  { id: "tropics" as const, x: 28, y: 70 },
  { id: "coast" as const, x: 72, y: 70 },
];

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

  // Build progressById map
  const progressById = React.useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    BIOME_NODES.forEach((node) => {
      const { cur, total } = getBiomeCounts(local, node.id);
      map[node.id] = { done: cur, total };
    });
    return map;
  }, [local]);

  const handleBiomeClick = (id: BiomeId) => {
    setLocation(`/island/${id}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 to-amber-50 p-6 space-y-6">
      {/* Header with lap badge and chrome */}
      <header className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <h1
            data-testid="island-heading"
            className="text-2xl font-bold text-amber-900"
          >
            Quest Island
          </h1>
          <div
            data-testid="lap-badge"
            className="rounded-full px-4 py-1.5 bg-indigo-500 text-white font-semibold text-sm shadow-lg"
          >
            Lap {local.currentLap}
          </div>
        </div>
        <SceneChrome />
      </header>

      {/* Island scene with biomes */}
      <section className="max-w-6xl mx-auto">
        <IslandScene
          lap={local.currentLap}
          nodes={BIOME_NODES}
          onClickBiome={handleBiomeClick}
          progressById={progressById}
        />
      </section>

      {/* Scout bubble */}
      <aside className="max-w-6xl mx-auto">
        <ScoutBubble firstName="Harvey" />
      </aside>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto text-sm text-neutral-600">
        <Link href="/" className="hover:underline">
          ← Back home
        </Link>
      </footer>
    </main>
  );
}
