const backgroundMusic = document.querySelector("#background-music");
const backgroundMusicToggle = document.querySelector("#music-toggle");
let backgroundMusicEnabled = false;
let backgroundFadeFrame;
const backgroundMusicVolume = .16;

backgroundMusic.volume = 0;
syncBackgroundMusicButton();

function syncBackgroundMusicButton() {
  backgroundMusicToggle.classList.toggle("muted", !backgroundMusicEnabled);
  backgroundMusicToggle.setAttribute("aria-pressed", String(backgroundMusicEnabled));
  const label = backgroundMusicEnabled ? "ปิดเสียงเพลง" : "เปิดเสียงเพลง";
  backgroundMusicToggle.textContent = label;
  backgroundMusicToggle.setAttribute("aria-label", label);
}

async function playBackgroundMusic() {
  if (!backgroundMusicEnabled || !backgroundMusic.paused) return;
  try {
    backgroundMusic.volume = 0;
    await backgroundMusic.play();
    const startedAt = performance.now();
    cancelAnimationFrame(backgroundFadeFrame);
    const fadeIn = (now) => {
      const progress = Math.min(1, (now - startedAt) / 1800);
      backgroundMusic.volume = backgroundMusicVolume * progress;
      if (progress < 1) backgroundFadeFrame = requestAnimationFrame(fadeIn);
    };
    backgroundFadeFrame = requestAnimationFrame(fadeIn);
  } catch {
    // Mobile browsers start audio after the next user gesture.
  }
}

backgroundMusicToggle.addEventListener("click", () => {
  backgroundMusicEnabled = !backgroundMusicEnabled;
  syncBackgroundMusicButton();
  if (backgroundMusicEnabled) playBackgroundMusic();
  else {
    cancelAnimationFrame(backgroundFadeFrame);
    backgroundMusic.pause();
  }
});
