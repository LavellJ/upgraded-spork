export default function NewBadgeModal({
  titles,
  onClose,
}: {
  titles: Array<{ icon: string; title: string }>;
  onClose: () => void;
}) {
  if (!titles || titles.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          minWidth: 280,
          maxWidth: 360,
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>You earned a badge!</h3>
        <div style={{ display: "grid", gap: 8, justifyItems: "center" }}>
          {titles.map((b, i) => (
            <div
              key={i}
              style={{
                border: "2px dashed #ddd",
                borderRadius: 10,
                padding: "10px 12px",
                width: 200,
                boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: 28 }}>{b.icon}</div>
              <div style={{ fontWeight: 600 }}>{b.title}</div>
            </div>
          ))}
        </div>
        <button
          style={{
            marginTop: 14,
            padding: "8px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
          }}
          onClick={onClose}
        >
          Nice!
        </button>
      </div>
    </div>
  );
}