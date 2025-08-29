import { checkBadges } from "../utils/badges";

export default function Badges({ progress }: { progress: { completed: { lessonId: string; date: string }[] } }) {
  const earned = checkBadges(progress);

  if (earned.length === 0) return null;

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
      {earned.map((b) => (
        <div
          key={b.id}
          style={{
            border: "2px dashed #ddd",
            borderRadius: 10,
            padding: "12px 16px",
            background: "#fff",
            boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
            textAlign: "center",
            width: 120
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{b.title}</div>
        </div>
      ))}
    </div>
  );
}