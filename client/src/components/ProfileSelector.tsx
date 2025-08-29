import { useState } from "react";
import { defaultProfiles, Profile } from "../store/profiles";

export default function ProfileSelector({ onSelect }: { onSelect: (p: Profile) => void }) {
  const [profiles] = useState(defaultProfiles);

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {profiles.map((p) => (
        <button
          key={p.id}
          style={{ padding: "10px", border: "1px solid #ccc", borderRadius: 12 }}
          onClick={() => onSelect(p)}
        >
          <span style={{ fontSize: 24 }}>{p.avatar}</span><br />
          {p.name}
        </button>
      ))}
    </div>
  );
}