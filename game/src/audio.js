// Tiny synthesised sound effects with plain WebAudio: no audio files, so
// the game ships nothing but code. Everything is a no-op until the player
// first interacts (browsers block audio before a gesture) and while muted.
let context = null;
let muted = false;
let sizzleNodes = null;

function ensureContext() {
  if (context !== null) return context;
  try {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  } catch {
    context = null;
  }
  return context;
}

export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (muted) stopSizzle();
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, when = 0, slideTo = 0) {
  const ctx = ensureContext();
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain, filterFreq) {
  const ctx = ensureContext();
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start(t0);
}

export function playClick() {
  tone(660, 0.06, 'sine', 0.12);
}

export function playPop() {
  tone(520, 0.08, 'sine', 0.14, 0, 880);
}

export function playChop() {
  noiseBurst(0.09, 0.25, 900);
  tone(140, 0.08, 'triangle', 0.2);
}

export function playCoin() {
  tone(988, 0.09, 'sine', 0.16);
  tone(1319, 0.16, 'sine', 0.16, 0.08);
}

export function playDing() {
  tone(1175, 0.35, 'sine', 0.18);
  tone(1568, 0.5, 'sine', 0.12, 0.02);
}

export function playFail() {
  tone(220, 0.25, 'sawtooth', 0.1, 0, 160);
}

export function playBurn() {
  noiseBurst(0.4, 0.2, 400);
}

export function startSizzle() {
  const ctx = ensureContext();
  if (!ctx || muted || sizzleNodes) return;
  const len = ctx.sampleRate * 1;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  const amp = ctx.createGain();
  amp.gain.value = 0.05;
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start();
  sizzleNodes = { src, amp };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.src.stop();
  } catch {
    // Already stopped.
  }
  sizzleNodes = null;
}
