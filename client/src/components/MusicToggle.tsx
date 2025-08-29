import { useState } from "react";
import { playMusic, stopMusic, isPlaying } from "../lib/audio";

export default function MusicToggle() {
  const [playing, setPlaying] = useState(isPlaying());

  function toggle() {
    if (playing) {
      stopMusic();
      setPlaying(false);
    } else {
      playMusic();
      setPlaying(true);
    }
  }

  return (
    <button
      style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 8 }}
      onClick={toggle}
    >
      {playing ? "🔊 Music On" : "🔇 Music Off"}
    </button>
  );
}