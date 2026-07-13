import { toLocal, clock } from '../net.js';
import { store } from '../state.js';
import { monsterHTML } from '../ui/monster.js';
import { sound } from '../ui/sound.js';

const RADIUS = 114;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function countdownScreen(root, { startAt, seconds }) {
  const players = store.room?.players ?? [];

  root.innerHTML = `
  <div class="screen fade-in">
    <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
      <div style="width:560px; height:560px; border-radius:50%; background:radial-gradient(circle, rgba(255,46,136,0.25), transparent 70%);"></div>
    </div>
    <div style="position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; gap:22px;">
      <span style="font-size:14px; letter-spacing:3px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">La partie commence dans</span>
      <div style="position:relative; width:260px; height:260px; display:flex; align-items:center; justify-content:center;">
        <svg width="260" height="260" style="position:absolute; top:0; left:0; transform:rotate(-90deg);">
          <circle cx="130" cy="130" r="${RADIUS}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14"></circle>
          <circle id="ring" cx="130" cy="130" r="${RADIUS}" fill="none" stroke="var(--menthe)" stroke-width="14"
            stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="0"></circle>
        </svg>
        <span id="num" class="title-display" style="font-size:150px; text-shadow:0 0 60px rgba(255,46,136,0.7);">${seconds}</span>
      </div>
      <div style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap; justify-content:center; max-width:600px;">
        ${players.map((p) => monsterHTML(p.color, { size: 36 })).join('')}
      </div>
      <span style="font-size:14px; color:var(--text-dim);">${players.length} joueur${players.length > 1 ? 's' : ''} prêt${players.length > 1 ? 's' : ''} à jouer</span>
    </div>
  </div>`;

  const num = root.querySelector('#num');
  const ring = root.querySelector('#ring');
  const localStart = toLocal(startAt);
  const totalMs = seconds * 1000;
  let raf;

  const tick = () => {
    const remaining = localStart - clock();
    if (remaining <= 0) {
      num.textContent = 'GO !';
      num.style.fontSize = '110px';
      ring.style.strokeDashoffset = CIRCUMFERENCE;
      sound.play('go');
      return;
    }
    const shown = Math.ceil(remaining / 1000);
    if (num.textContent !== String(shown)) {
      num.textContent = shown;
      sound.play('beep');
    }
    ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - remaining / totalMs);
    raf = requestAnimationFrame(tick);
  };
  tick();

  return { unmount: () => cancelAnimationFrame(raf) };
}
