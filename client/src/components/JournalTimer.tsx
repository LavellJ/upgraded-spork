import { useState, useEffect } from "react";

export default function JournalTimer({
  seconds = 300,
  onComplete,
}: {
  seconds?: number;
  onComplete: () => void;
}) {
  const [time, setTime] = useState(seconds);

  useEffect(() => {
    if (time <= 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(t);
  }, [time, onComplete]);

  const mins = Math.floor(time / 60);
  const secs = time % 60;

  return (
    <div style={{ textAlign: "center", fontSize: "2rem" }}>
      {mins}:{secs.toString().padStart(2, "0")}
    </div>
  );
}