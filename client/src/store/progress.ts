export type BiomeId = "forest" | "tropics" | "desert" | "coast";
export const BIOMES: BiomeId[] = ["forest", "tropics", "desert", "coast"];
const KEY = "island-progress-v2";
const DEFAULT_TARGET = 3;

export type Progress = {
  currentLap: number; // starts at 1
  targetPerLap: number; // per-lap target, default 3
  completed: Record<number, Record<BiomeId, number>>; // lap -> biome -> count
};

function initLapCounts(): Record<BiomeId, number> {
  return { forest: 0, tropics: 0, desert: 0, coast: 0 };
}

export function defaultProgress(): Progress {
  return {
    currentLap: 1,
    targetPerLap: DEFAULT_TARGET,
    completed: { 1: initLapCounts() },
  };
}

export function normalize(p: any): Progress {
  if (!p || typeof p !== "object") return defaultProgress();
  const currentLap = Number(p.currentLap) > 0 ? Number(p.currentLap) : 1;
  const targetPerLap =
    Number(p.targetPerLap) > 0 ? Number(p.targetPerLap) : DEFAULT_TARGET;
  const completed =
    typeof p.completed === "object" && p.completed ? p.completed : {};
  if (!completed[currentLap]) completed[currentLap] = initLapCounts();
  // Fill missing biomes for current lap
  for (const b of BIOMES) {
    if (typeof completed[currentLap][b] !== "number")
      completed[currentLap][b] = 0;
  }
  return { currentLap, targetPerLap, completed };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return normalize(raw ? JSON.parse(raw) : undefined);
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(p));
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("island-progress-updated"));
    }
  } catch {}
}

export function isLapComplete(p: Progress, lap = p.currentLap): boolean {
  const target = p.targetPerLap ?? DEFAULT_TARGET;
  const lapCounts = p.completed[lap] || {};
  return BIOMES.every((b) => (lapCounts[b] ?? 0) >= target);
}

export function advanceLap(p: Progress): void {
  p.currentLap = (p.currentLap ?? 1) + 1;
  if (!p.completed[p.currentLap]) p.completed[p.currentLap] = initLapCounts();
}

export function ensureLapConsistency(): Progress {
  const p = loadProgress();
  if (isLapComplete(p, p.currentLap)) {
    advanceLap(p);
    saveProgress(p);
  }
  return p;
}

export function getBiomeCounts(
  p: Progress,
  biome: BiomeId,
  lap = p.currentLap,
): { cur: number; total: number } {
  const total = p.targetPerLap ?? DEFAULT_TARGET;
  const cur = p.completed[lap]?.[biome] ?? 0;
  return { cur, total };
}

export function completeLesson(biome: BiomeId): Progress {
  const p = loadProgress();
  const lap = p.currentLap;
  if (!p.completed[lap]) p.completed[lap] = initLapCounts();
  const cur = p.completed[lap][biome] ?? 0;
  const total = p.targetPerLap ?? DEFAULT_TARGET;
  p.completed[lap][biome] = Math.min(cur + 1, total);
  if (isLapComplete(p, lap)) {
    advanceLap(p);
  }
  saveProgress(p);
  return p;
}
