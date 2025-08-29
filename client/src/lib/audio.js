const audio = new Audio("/src/assets/bg-music.mp3");
audio.loop = true;

export function playMusic() {
  audio.play().catch(() => {}); // ignore if blocked until user interacts
}

export function stopMusic() {
  audio.pause();
  audio.currentTime = 0;
}

export function isPlaying() {
  return !audio.paused;
}