// Audio 100 % WebAudio (aucun fichier à charger) : petits effets synthétisés
// + boucle musicale générative. Deux bus de volume (musique / effets) réglables
// dans le lobby et persistés en localStorage. muteAll() sert pendant les pubs.

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let musicTimer = null;
let muted = false;

const clamp01 = (v) => Math.min(Math.max(Number(v) || 0, 0), 1);
const stored = (key, fallback) => {
  const v = Number(localStorage.getItem(key));
  return Number.isFinite(v) && localStorage.getItem(key) !== null ? clamp01(v) : fallback;
};

const volumes = {
  music: stored('qm-vol-music', 0.45),
  sfx: stored('qm-vol-sfx', 0.8),
};

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = volumes.music;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = volumes.sfx;
  sfxBus.connect(master);
  return ctx;
}

// ---- Effets sonores ---------------------------------------------------------

// Note simple : oscillateur + enveloppe pluck.
function tone(freq, { at = 0, dur = 0.15, type = 'triangle', vol = 0.5, slide = 0 } = {}) {
  if (!ensureCtx()) return;
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(slide, 1), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(sfxBus);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Souffle de bruit filtré (roulement, tambour…).
function noise({ at = 0, dur = 0.08, vol = 0.3, freq = 6000 } = {}) {
  if (!ensureCtx()) return;
  const t = ctx.currentTime + at;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t);
}

const SFX = {
  click: () => tone(520, { dur: 0.07, type: 'square', vol: 0.18, slide: 300 }),
  tick: () => { tone(1900, { dur: 0.03, type: 'square', vol: 0.12 }); noise({ dur: 0.02, vol: 0.06 }); },
  pop: () => tone(340, { dur: 0.09, type: 'sine', vol: 0.4, slide: 90 }),
  beep: () => tone(880, { dur: 0.12, type: 'sine', vol: 0.35 }),
  go: () => { tone(523, { dur: 0.3, vol: 0.3 }); tone(659, { at: 0.02, dur: 0.3, vol: 0.3 }); tone(784, { at: 0.04, dur: 0.35, vol: 0.3 }); },
  success: () => { tone(660, { dur: 0.12, vol: 0.35 }); tone(880, { at: 0.1, dur: 0.2, vol: 0.35 }); },
  fail: () => { tone(220, { dur: 0.22, type: 'sawtooth', vol: 0.22, slide: 110 }); },
  reveal: () => { tone(587, { dur: 0.14, vol: 0.25 }); tone(880, { at: 0.09, dur: 0.22, vol: 0.2 }); },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.13, dur: 0.3, vol: 0.35 }));
    tone(1319, { at: 0.55, dur: 0.5, vol: 0.3 });
    noise({ at: 0.55, dur: 0.3, vol: 0.15, freq: 4000 });
  },
};

// ---- Musique d'ambiance -----------------------------------------------------
// Boucle de 4 mesures (Am → F → C → G), arpège + basse + chapeau, ~112 BPM.
// Planifiée par petits blocs pour rester précise sans bloquer le thread.

const STEP = 60 / 112 / 2; // durée d'une croche (s)
const CHORDS = [
  [220, 261.63, 329.63, 440], // Am
  [174.61, 220, 261.63, 349.23], // F
  [196, 261.63, 329.63, 392], // C/G
  [196, 246.94, 293.66, 392], // G
];
const BASS = [110, 87.31, 130.81, 98]; // A2, F2, C3, G2
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 2, 3];

function scheduleMusicStep(step, when) {
  const bar = Math.floor(step / 8) % 4;
  const inBar = step % 8;
  const chord = CHORDS[bar];

  // Arpège (pluck doux).
  const freq = chord[ARP_PATTERN[inBar]];
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.11, when + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, when + STEP * 1.8);
  osc.connect(g).connect(musicBus);
  osc.start(when);
  osc.stop(when + STEP * 2);

  // Basse sur les temps forts (pas 0 et 4).
  if (inBar === 0 || inBar === 4) {
    const b = ctx.createOscillator();
    const bg = ctx.createGain();
    b.type = 'sine';
    b.frequency.value = BASS[bar];
    bg.gain.setValueAtTime(0, when);
    bg.gain.linearRampToValueAtTime(0.22, when + 0.02);
    bg.gain.exponentialRampToValueAtTime(0.001, when + STEP * 3.5);
    b.connect(bg).connect(musicBus);
    b.start(when);
    b.stop(when + STEP * 4);
  }

  // Petit chapeau sur les temps.
  if (inBar % 2 === 0) {
    const len = Math.ceil(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 9000;
    const hg = ctx.createGain();
    hg.gain.value = 0.04;
    src.connect(f).connect(hg).connect(musicBus);
    src.start(when);
  }
}

function startMusic() {
  if (!ensureCtx() || musicTimer) return;
  let step = 0;
  let nextTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    // Planifie ~0,35 s en avance.
    while (nextTime < ctx.currentTime + 0.35) {
      scheduleMusicStep(step, nextTime);
      step = (step + 1) % 32;
      nextTime += STEP;
    }
  }, 120);
}

// ---- API publique -----------------------------------------------------------

export const sound = {
  get musicVolume() { return volumes.music; },
  get sfxVolume() { return volumes.sfx; },

  setMusicVolume(v) {
    volumes.music = clamp01(v);
    localStorage.setItem('qm-vol-music', String(volumes.music));
    if (musicBus) musicBus.gain.value = volumes.music;
  },

  setSfxVolume(v) {
    volumes.sfx = clamp01(v);
    localStorage.setItem('qm-vol-sfx', String(volumes.sfx));
    if (sfxBus) sfxBus.gain.value = volumes.sfx;
  },

  play(name) {
    try { SFX[name]?.(); } catch { /* l'audio ne doit jamais casser le jeu */ }
  },

  // Coupe tout (pubs CrazyGames) sans perdre les réglages.
  muteAll(on) {
    muted = !!on;
    if (master) master.gain.value = muted ? 0 : 1;
  },

  // À appeler une fois au démarrage : l'audio ne peut démarrer qu'après un
  // premier geste utilisateur (politique des navigateurs).
  attach() {
    const boot = () => {
      ensureCtx();
      ctx?.resume?.();
      startMusic();
    };
    document.addEventListener('pointerdown', boot, { once: true });
    document.addEventListener('keydown', boot, { once: true });
  },
};
