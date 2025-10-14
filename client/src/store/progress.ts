export type BiomeId = "forest" | "tropics" | "desert" | "coast";
export type LapNumber = number;

type LapConfig = Record<BiomeId, number>;
const LAPS: Record<LapNumber, LapConfig> = {
  1: { forest: 3, tropics: 3, desert: 3, coast: 3 },
  2: { forest: 4, tropics: 4, desert: 4, coast: 4 },
  3: { forest: 5, tropics: 5, desert: 5, coast: 5 },
};

export type Progress = {
  currentLap: LapNumber;
  completed: Record<LapNumber, Record<BiomeId, number>>;
};

const KEY = "island-progress-v2";

const BIOMES: BiomeId[] = ["forest", "tropics", "desert", "coast"];

function emptyProgress(lap: LapNumber = 1): Progress {
  return {
    currentLap: lap,
    completed: { [lap]: { forest: 0, tropics: 0, desert: 0, coast: 0 } },
  };
}

export function targetFor(biome: BiomeId, lap: LapNumber): number {
  const cfg = LAPS[lap] || LAPS[1];
  return cfg[biome] ?? 3;
}

export function normalize(p: Progress): Progress {
  const lap = p?.currentLap ?? 1;
  const base = emptyProgress(lap);
  const completed = { ...base.completed, ...(p?.completed ?? {}) };
  if (!completed[lap])
    completed[lap] = { forest: 0, tropics: 0, desert: 0, coast: 0 };
  // clamp counts to targets
  for (const b of BIOMES) {
    const t = targetFor(b, lap);
    const v = Math.max(0, Math.min(t, completed[lap][b] ?? 0));
    completed[lap][b] = v;
  }
  return { currentLap: lap, completed };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return normalize(emptyProgress(1));
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(emptyProgress(1));
  }
}

export function saveProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(normalize(p)));
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("island-progress-updated"));
    }
  } catch {}
}

export function resetProgress() {
  localStorage.removeItem(KEY);
}

export function increment(biome: BiomeId): Progress {
  const p = loadProgress();
  const lap = p.currentLap;
  const cur = p.completed[lap][biome] ?? 0;
  const max = targetFor(biome, lap);
  p.completed[lap][biome] = Math.min(max, cur + 1);
  if (isLapComplete(p, lap)) advanceLap(p);
  saveProgress(p);
  return p;
}

export function isLapComplete(p: Progress, lap: LapNumber): boolean {
  return BIOMES.every((b) => (p.completed[lap][b] ?? 0) >= targetFor(b, lap));
}

export function advanceLap(p: Progress) {
  const next = p.currentLap + 1;
  if (!LAPS[next]) return; // no more laps configured
  p.currentLap = next;
  if (!p.completed[next]) {
    p.completed[next] = { forest: 0, tropics: 0, desert: 0, coast: 0 };
  }
}

export function chipText(p: Progress, biome: BiomeId): string {
  const lap = p.currentLap;
  const c = p.completed[lap][biome] ?? 0;
  const t = targetFor(biome, lap);
  return `${c}/${t}`;
}

export function ensureLapConsistency(): Progress {
  const p = loadProgress();
  if (isLapComplete(p, p.currentLap)) {
    advanceLap(p);
    saveProgress(p);
  }
  return p;
}
