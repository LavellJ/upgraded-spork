import type { Profile } from "../store/profiles";
import { calcStreak } from "../utils/streak";

export default function ParentView({
  profiles,
  progressByProfile,
  onClose,
}: {
  profiles: Profile[];
  progressByProfile: Record<string, { completed: Array<{ lessonId: string; date: string }> }>;
  onClose: () => void;
}) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, marginTop: 12, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Parent Summary</h3>
        <button style={{ border: "1px solid #ccc", borderRadius: 8, padding: "6px 10px" }} onClick={onClose}>Close</button>
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {profiles.map((p) => {
          const prog = progressByProfile[p.id] || { completed: [] as Array<{ lessonId: string; date: string }> };
          const streak = calcStreak(prog.completed.map((c) => c.date));
          const last = prog.completed
            .map((c) => c.date)
            .sort()
            .slice(-1)[0] || "—";
          return (
            <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 700 }}>{p.avatar} {p.name}</div>
              <div style={{ fontSize: 14 }}>Lessons done: {prog.completed.length} • Streak: {streak} • Last: {last}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}