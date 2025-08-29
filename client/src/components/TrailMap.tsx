import { lessons } from "../content";

type Props = {
  onSelect: (lesson: any) => void;
  progress?: { completed?: Array<{ lessonId: string }> };
};

export default function TrailMap({ onSelect, progress }: Props) {
  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <h2>Campfire Trail</h2>

      <div style={{ display: "grid", gap: 10, maxWidth: 520, margin: "0 auto" }}>
        {lessons.map((l) => {
          const done =
            progress?.completed?.some((c) => c.lessonId === l.id) ?? false;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l)}
              style={{
                padding: "12px 16px",
                borderRadius: 16,
                border: "1px solid #ddd",
                textAlign: "left",
                opacity: done ? 0.6 : 1,
              }}
            >
              {l.title}
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 14, marginTop: 10 }}>
        Tap a node to begin today’s trail.
      </p>
    </div>
  );
}