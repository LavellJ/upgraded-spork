export function calcStreak(dates: string[]): number {
  // dates like ["2025-08-27", "2025-08-28", ...]
  if (!dates || dates.length === 0) return 0;
  const set = new Set(dates);
  const d = new Date();
  let streak = 0;
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}