const backgroundMusic = document.querySelector("#background-music");
const backgroundMusicToggle = document.querySelector("#music-toggle");
let backgroundMusicEnabled = localStorage.getItem("roddonjai-background-music") !== "off";

backgroundMusic.volume = .38;
syncBackgroundMusicButton();

function syncBackgroundMusicButton() {
  backgroundMusicToggle.classList.toggle("muted", !backgroundMusicEnabled);
  backgroundMusicToggle.setAttribute("aria-pressed", String(backgroundMusicEnabled));
}

async function playBackgroundMusic() {
  if (!backgroundMusicEnabled || !backgroundMusic.paused) return;
  try {
    await backgroundMusic.play();
  } catch {
    // Mobile browsers start audio after the next user gesture.
  }
}

backgroundMusicToggle.addEventListener("click", () => {
  backgroundMusicEnabled = !backgroundMusicEnabled;
  localStorage.setItem("roddonjai-background-music", backgroundMusicEnabled ? "on" : "off");
  syncBackgroundMusicButton();
  if (backgroundMusicEnabled) playBackgroundMusic();
  else backgroundMusic.pause();
});

document.addEventListener("pointerdown", playBackgroundMusic, { passive: true });
document.addEventListener("keydown", playBackgroundMusic);
playBackgroundMusic();
