import React from "react";
import {
  type BiomeId,
  completeLesson,
  ensureLapConsistency,
  getBiomeCounts,
} from "../store/progress";

type Props = { params?: { biomeId?: string } };

export default function Biome({ params }: Props) {
  const asBiome = (id: string | undefined): BiomeId => {
    const v = (id ?? "forest") as BiomeId;
    return (["forest", "tropics", "desert", "coast"] as const).includes(v)
      ? v
      : "forest";
  };

  const biome = asBiome(params?.biomeId);
  const [p, setP] = React.useState(() => ensureLapConsistency());
  const { cur, total } = getBiomeCounts(p, biome);

  const onComplete = () => {
    const updated = completeLesson(biome);
    setP(updated);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 data-testid="biome-stub" className="text-xl font-semibold">
        Biome: {biome}
      </h1>
      <div data-testid="biome-progress" className="text-sm">
        {cur}/{total}
      </div>
      <button
        data-testid="complete-lesson"
        className="px-3 py-2 rounded bg-indigo-600 text-white"
        onClick={onComplete}
      >
        Complete Lesson
      </button>
    </div>
  );
}
