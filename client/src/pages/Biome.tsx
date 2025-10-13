import React, { useMemo, useState } from "react";
import type { BiomeId } from "../store/progress";
import { loadProgress, increment, chipText } from "../store/progress";
import { Link } from "wouter";

export default function Biome({ params }: { params: { biomeId: string } }) {
  const biomeId = (params?.biomeId || "").toLowerCase() as BiomeId;
  const [p, setP] = useState(() => loadProgress());

  const valid = useMemo(
    () => ["forest", "tropics", "desert", "coast"].includes(biomeId),
    [biomeId],
  );
  if (!valid) {
    return (
      <main className="p-6">
        <h1 data-testid="biome-stub">Biome: {biomeId}</h1>
        <p>Unknown biome.</p>
      </main>
    );
  }

  const onComplete = () => setP(increment(biomeId));

  return (
    <main className="p-6 space-y-4">
      <h1 data-testid="biome-stub">Biome: {biomeId}</h1>
      <div className="flex items-center gap-3">
        <div data-testid="biome-progress">{chipText(p, biomeId)}</div>
        <button
          data-testid="complete-lesson"
          className="rounded px-3 py-1 bg-emerald-500 text-white"
          onClick={onComplete}
        >
          Complete lesson
        </button>
        <Link href="/island" className="rounded px-3 py-1 bg-neutral-200">
          Back to island
        </Link>
      </div>
    </main>
  );
}
