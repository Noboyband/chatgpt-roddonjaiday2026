const socket = io();
const field = document.querySelector("#heart-field");
const total = document.querySelector("#total");
const audioToggle = document.querySelector("#audio-toggle");
let audioEnabled = true;
let audioContext;
let eventCount = 0;

socket.on("total", (value) => total.textContent = Number(value).toLocaleString("th-TH"));
socket.on("reset", () => {
  total.textContent = "0";
  field.replaceChildren();
});
socket.on("heart", ({ total: value, hue, x }) => {
  total.textContent = Number(value).toLocaleString("th-TH");
  createHeart(x, hue);
  eventCount += 1;
  if (audioEnabled) playCrowd(eventCount);
});

function createHeart(x, hue) {
  const heart = document.createElement("span");
  heart.className = "floating-heart";
  heart.textContent = "♥";
  heart.style.left = `${x}%`;
  heart.style.color = `hsl(${hue}, 78%, 55%)`;
  heart.style.setProperty("--size", `${55 + Math.random() * 90}px`);
  heart.style.setProperty("--duration", `${4.2 + Math.random() * 2.2}s`);
  heart.style.setProperty("--drift", `${-100 + Math.random() * 200}px`);
  field.append(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function ensureAudio() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function noiseBurst(context, at, duration, volume, highpass) {
  const length = Math.floor(context.sampleRate * duration);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  filter.type = "highpass";
  filter.frequency.value = highpass;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(.001, at + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(at);
}

function playCrowd(count) {
  const context = ensureAudio();
  const now = context.currentTime;
  noiseBurst(context, now, .11, .11, 650);
  noiseBurst(context, now + .12, .1, .08, 750);
  if (count % 8 === 0) {
    for (let i = 0; i < 7; i += 1) noiseBurst(context, now + i * .08, .16, .06, 350 + i * 30);
  }
}

audioToggle.addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  audioToggle.classList.toggle("muted", !audioEnabled);
  audioToggle.textContent = audioEnabled ? "♪" : "×";
  if (audioEnabled) playCrowd(1);
});

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r" && event.shiftKey && confirm("รีเซ็ตจำนวนหัวใจทั้งหมด?")) socket.emit("reset-stage");
});
