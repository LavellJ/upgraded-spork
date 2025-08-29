import { calcStreak } from "../utils/streak";

export default function StreakBadge({ dates }: { dates: string[] }) {
  const streak = calcStreak(dates);
  return (
    <div style={{
      padding: "4px 10px",
      border: "1px solid #f1c27d",
      borderRadius: 12,
      background: "#fff6e6",
      fontWeight: 600,
    }}>
      🔥 Streak: {streak}
    </div>
  );
}