import { Badge, allBadges } from "../store/badges";
import { calcStreak } from "./streak";

export function checkBadges(progress: { completed: { lessonId: string; date: string }[] }): Badge[] {
  const earned: Badge[] = [];

  // First lesson
  if (progress.completed.length >= 1) {
    earned.push(allBadges.find(b => b.id === "first-lesson")!);
  }

  // Streaks
  const streak = calcStreak(progress.completed.map(c => c.date));
  if (streak >= 3) earned.push(allBadges.find(b => b.id === "streak-3")!);
  if (streak >= 7) earned.push(allBadges.find(b => b.id === "streak-7")!);

  // Pack complete (simplified: if 6 lessons total done)
  if (progress.completed.length >= 6) {
    earned.push(allBadges.find(b => b.id === "pack-complete")!);
  }

  return earned;
}