const button = document.querySelector("#heart-button");
const countNode = document.querySelector("#count");
const progress = document.querySelector("#progress");
const connection = document.querySelector("#connection");
const burstLayer = document.querySelector("#burst-layer");
const speedLevel = document.querySelector("#speed-level");
const maxHearts = 500;
let count = Math.min(maxHearts, Number(localStorage.getItem("roddonjai-heart-count")) || 0);
let audioContext;
let recentTaps = [];
let currentLevel = 1;
const heartColors = ["#f16b34", "#010966", "#0094ff"];

connection.classList.remove("offline");
connection.lastChild.textContent = " พร้อมเล่น";
updateCount(count);

button.addEventListener("click", () => {
  if (count >= maxHearts) return;
  const now = performance.now();
  recentTaps.push(now);
  recentTaps = recentTaps.filter((time) => now - time <= 1400);
  currentLevel = recentTaps.length >= 12 ? 4 : recentTaps.length >= 7 ? 3 : recentTaps.length >= 4 ? 2 : 1;
  updateSpeedLevel(currentLevel);
  count += 1;
  localStorage.setItem("roddonjai-heart-count", count);
  updateCount(count);
  playHeartSound(count, currentLevel);
  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 100);
  navigator.vibrate?.(18);
  burst();
});

function updateSpeedLevel(level) {
  speedLevel.className = `speed-level level-${level}`;
  speedLevel.querySelector("strong").textContent = ["", "จังหวะปกติ", "กำลังเร่ง!", "ติดเทอร์โบ!", "รัวสุดพลัง!"][level];
  clearTimeout(updateSpeedLevel.timer);
  updateSpeedLevel.timer = setTimeout(() => {
    recentTaps = [];
    currentLevel = 1;
    speedLevel.className = "speed-level level-1";
    speedLevel.querySelector("strong").textContent = "จังหวะปกติ";
  }, 1500);
}

function ensureAudio() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function tone(context, at, frequency, duration, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.35, at + duration);
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
}

function clap(context, at, volume = .13) {
  const duration = .13;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const envelope = Math.exp(-i / (context.sampleRate * .022));
    data[i] = (Math.random() * 2 - 1) * envelope;
  }
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "bandpass";
  filter.frequency.value = 1450;
  filter.Q.value = .7;
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(at);
}

function playHeartSound(nextCount, level) {
  const context = ensureAudio();
  const now = context.currentTime;

  if (level === 1) {
    tone(context, now, 420 + (nextCount % 5) * 35, .11, .12);
    tone(context, now + .055, 660 + (nextCount % 4) * 45, .14, .08);
    clap(context, now + .015, .1);
  } else if (level === 2) {
    tone(context, now, 520 + (nextCount % 6) * 45, .09, .11);
    tone(context, now + .04, 790 + (nextCount % 5) * 55, .12, .075);
    clap(context, now, .13);
    clap(context, now + .07, .075);
  } else if (level === 3) {
    tone(context, now, 650 + (nextCount % 7) * 55, .08, .1);
    tone(context, now + .03, 980 + (nextCount % 5) * 75, .1, .07);
    clap(context, now, .15);
    clap(context, now + .045, .11);
  } else {
    tone(context, now, 760 + (nextCount % 7) * 70, .07, .12);
    tone(context, now + .025, 1120 + (nextCount % 5) * 90, .085, .085);
    tone(context, now + .05, 1540 + (nextCount % 4) * 110, .1, .055);
    clap(context, now, .17);
    clap(context, now + .03, .13);
    clap(context, now + .06, .1);
    clap(context, now + .09, .07);
  }

  // Celebrate milestones with a fuller applause and cheer-like rise.
  if (nextCount % 10 === 0 || nextCount === maxHearts) {
    for (let i = 0; i < 9; i += 1) clap(context, now + .1 + i * .075, .09);
    for (let i = 0; i < 5; i += 1) {
      tone(context, now + .12 + i * .065, 250 + i * 70, .28, .045);
    }
  }
}

function updateCount(value) {
  count = Number(value) || 0;
  countNode.textContent = count.toLocaleString("th-TH");
  progress.style.width = `${Math.min(100, count / maxHearts * 100)}%`;
  button.disabled = count >= maxHearts;
}

function burst() {
  const rect = button.getBoundingClientRect();
  const burstColors = shuffledHeartColors();
  for (let i = 0; i < 9; i += 1) {
    const heart = document.createElement("span");
    const angle = (Math.PI * 2 * i / 7) - Math.PI / 2;
    const distance = 65 + Math.random() * 55;
    heart.className = "burst-heart";
    heart.textContent = "\u2665\uFE0E";
    heart.style.color = burstColors[i % burstColors.length];
    heart.style.left = `${rect.left + rect.width / 2}px`;
    heart.style.top = `${rect.top + rect.height / 2}px`;
    heart.style.setProperty("--size", `${18 + Math.random() * 15}px`);
    heart.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    heart.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    heart.style.setProperty("--r", `${-25 + Math.random() * 50}deg`);
    burstLayer.append(heart);
    heart.addEventListener("animationend", () => heart.remove());
  }

  const floatingColors = shuffledHeartColors();
  for (let i = 0; i < 4; i += 1) {
    const floating = document.createElement("span");
    floating.className = "mobile-floating-heart";
    floating.textContent = "\u2665\uFE0E";
    floating.style.left = `${rect.left + rect.width * (.25 + Math.random() * .5)}px`;
    floating.style.top = `${rect.top + rect.height * .35}px`;
    floating.style.setProperty("--float-x", `${-75 + Math.random() * 150}px`);
    floating.style.setProperty("--float-size", `${48 + Math.random() * 52}px`);
    floating.style.setProperty("--float-delay", `${i * .045}s`);
    floating.style.color = floatingColors[i % floatingColors.length];
    burstLayer.append(floating);
    floating.addEventListener("animationend", () => floating.remove());
  }
}

function shuffledHeartColors() {
  const colors = [...heartColors];
  for (let i = colors.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  return colors;
}
