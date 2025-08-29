// Import the actual file URL that Vite serves
import musicUrl from "../assets/bg-music.mp3";

const audio = new Audio(musicUrl);
audio.loop = true;
// Optional: start quieter
audio.volume = 0.25;

export function playMusic() {
  audio.play().catch((err) => {
    // If something blocks playback, you'll see it in the console
    console.error("Audio play error:", err);
  });
}

export function stopMusic() {
  audio.pause();
  audio.currentTime = 0;
}

export function isPlaying() {
  return !audio.paused;
}