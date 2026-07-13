import { C2S } from '@quizz/shared';
import { emitAck, toLocal, clock } from '../net.js';
import { store, me, myId } from '../state.js';
import { esc, formatNum } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { sound } from '../ui/sound.js';
import { t, tr } from '../ui/i18n.js';
import { getMinigame } from '../minigames/index.js';

// Ids des mini-jeux du tambour de la roulette (noms localisés via mg.<id>.name).
const GAME_IDS = ['intrus', 'chrono', 'spam', 'aires', 'verre', 'feu', 'stroop', 'memo', 'dessine'];
const SLOT_ITEM_H = 96; // = hauteur .slot-item / .slot-frame (main.css)

export function roundScreen(root, prep) {
  const { round, total, minigameId, title, data, startAt, duration } = prep;
  const localStart = toLocal(startAt);
  const player = me();

  const top3 = (store.leaderboard ?? store.room?.players.map((p, i) => ({ ...p, rank: i + 1 })) ?? [])
    .slice(0, 3);

  root.innerHTML = `
  <div class="screen fade-in">
    <div style="position:relative; display:flex; flex-direction:column; height:100%;">

      <div style="display:flex; align-items:center; justify-content:space-between; gap:16px; padding:24px 44px 0;">
        <span class="title-display" style="font-size:15px; font-weight:600; color:var(--text-dim); background:var(--surface-2); padding:8px 18px; border-radius:20px; white-space:nowrap;">${t('round.label', { r: round, t: total })}</span>
        <span class="title-display" style="font-size:clamp(15px,2vw,24px); font-weight:700; color:var(--bg); background:var(--rose); padding:12px 36px; border-radius:20px; box-shadow:0 6px 0 var(--rose-shadow); text-align:center;">${esc(tr(title))}</span>
        <div style="display:flex; align-items:center; gap:10px; background:var(--surface-2); padding:8px 16px; border-radius:20px; white-space:nowrap;">
          ${monsterHTML(player?.color ?? '#ff2e88', { size: 28, face: player?.face, accessory: player?.accessory })}
          <span id="my-score" class="title-display" style="font-size:15px; font-weight:600;">${t('round.pts', { n: formatNum(player?.score ?? 0) })}</span>
        </div>
      </div>

      <div style="padding:20px 44px 0;">
        <div class="timebar"><div id="timebar-fill" class="timebar-fill"></div></div>
      </div>

      <div style="flex:1; display:flex; gap:32px; padding:24px 44px 32px; min-height:0;">
        <div id="area" style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; min-width:0;"></div>

        <div style="width:220px; display:none; flex-direction:column; gap:14px;" class="live-panel">
          <span class="label">${t('round.live')}</span>
          ${top3
            .map(
              (p) => `
              <div style="display:flex; align-items:center; gap:10px; background:var(--surface-2); padding:10px 14px; border-radius:14px;">
                ${monsterHTML(p.color, { size: 30, face: p.face, accessory: p.accessory })}
                <div style="display:flex; flex-direction:column; min-width:0;">
                  <span class="title-display" style="font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(p.name)}</span>
                  <span style="font-size:11px; color:var(--text-dim);">${t('round.pts', { n: formatNum(p.score) })}</span>
                </div>
              </div>`,
            )
            .join('')}
        </div>
      </div>

      <div id="splash" style="position:absolute; inset:0; z-index:10; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:26px; background:linear-gradient(160deg,#1f1440 0%,#2a1a52 55%,#1f1440 100%);">
        <span style="font-size:14px; letter-spacing:3px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">${t('round.label', { r: round, t: total })} — ${t('round.draw')}</span>
        <div class="slot-frame">
          <div class="slot-marker left"></div>
          <div class="slot-marker right"></div>
          <div id="slot-reel"></div>
        </div>
        <span id="splash-count" class="title-display" style="font-size:40px; color:var(--menthe); min-height:48px;"></span>
      </div>

      <div id="waiting" style="position:absolute; inset:0; z-index:9; display:none; flex-direction:column; align-items:center; justify-content:center; gap:14px; background:rgba(21,12,43,0.82); backdrop-filter:blur(3px);">
        <div id="waiting-emoji" style="font-size:56px;"></div>
        <div id="waiting-title" class="title-display" style="font-size:34px; font-weight:700;"></div>
        <div style="font-size:14px; color:var(--text-muted);">${t('round.waiting')}</div>
      </div>
    </div>
  </div>`;

  const area = root.querySelector('#area');
  const splash = root.querySelector('#splash');
  const splashCount = root.querySelector('#splash-count');
  const timebarFill = root.querySelector('#timebar-fill');
  const waiting = root.querySelector('#waiting');

  // Roulette façon casino : le tambour défile sur les noms des mini-jeux et
  // ralentit jusqu'à s'arrêter sur celui qui vient d'être tiré.
  const reel = root.querySelector('#slot-reel');
  const pool = GAME_IDS.map((id) => t(`mg.${id}.name`));
  const slotItems = [
    ...[...pool].sort(() => Math.random() - 0.5),
    ...[...pool].sort(() => Math.random() - 0.5),
    tr(title),
  ];
  reel.innerHTML = slotItems.map((t) => `<div class="slot-item">${esc(t)}</div>`).join('');
  const slotTravel = slotItems.length - 1; // en nombre d'items
  const spinStart = clock();
  const spinEnd = Math.max(spinStart + 400, Math.min(localStart - 700, spinStart + 2400));
  let slotIndex = -1;
  let landed = false;
  if (store.room?.players.length > 3 || (store.leaderboard?.length ?? 0) > 3) {
    root.querySelector('.live-panel').style.display = 'flex';
  }

  let answered = false;
  let raf;

  const ctx = {
    startAt: localStart,
    duration,
    async submit(payload) {
      if (answered) return { ok: false };
      const elapsed = Math.max(0, Math.round(clock() - localStart));
      return emitAck(C2S.INPUT, { data: payload, elapsed });
    },
    answered(success, custom = {}) {
      answered = true;
      sound.play(success ? 'success' : 'fail');
      // Petit délai pour laisser voir le feedback du mini-jeu.
      setTimeout(() => {
        waiting.style.display = 'flex';
        root.querySelector('#waiting-emoji').textContent = custom.emoji ?? (success ? '🎉' : '💥');
        root.querySelector('#waiting-title').textContent = custom.title ?? (success ? t('round.good') : t('round.missed'));
        root.querySelector('#waiting-title').style.color = success ? 'var(--menthe)' : 'var(--corail)';
      }, 450);
    },
  };

  const mg = getMinigame(minigameId);
  const instance = mg ? mg.mount(area, data, ctx) : null;

  let started = false;
  const tick = () => {
    const now = clock();
    if (!started) {
      // Animation du tambour : décélération douce (ease-out cubique).
      const p = Math.min(1, (now - spinStart) / (spinEnd - spinStart));
      const eased = 1 - (1 - p) ** 3;
      const pos = eased * slotTravel;
      reel.style.transform = `translateY(${(-pos * SLOT_ITEM_H).toFixed(1)}px)`;
      if (Math.floor(pos) !== slotIndex) {
        slotIndex = Math.floor(pos);
        sound.play('tick');
      }
      if (p >= 1 && !landed) {
        landed = true;
        reel.lastElementChild.classList.add('slot-win');
        sound.play('reveal');
      }

      const beforeStart = localStart - now;
      if (beforeStart <= 0) {
        started = true;
        splash.style.display = 'none';
        sound.play('go');
        instance?.start?.();
      } else if (landed) {
        splashCount.textContent = Math.ceil(beforeStart / 1000);
      }
    }
    if (started) {
      const remaining = Math.max(0, localStart + duration - now);
      timebarFill.style.width = `${(remaining / duration) * 100}%`;
      if (remaining <= 0) return; // fin — on attend le classement du serveur
    }
    raf = requestAnimationFrame(tick);
  };
  tick();

  return {
    // Révélation de la bonne réponse : on masque l'overlay d'attente pour que
    // tout le monde voie la réponse dans la zone de jeu.
    reveal(data) {
      waiting.style.display = 'none';
      instance?.reveal?.(data);
    },
    unmount() {
      cancelAnimationFrame(raf);
      instance?.unmount?.();
    },
  };
}
