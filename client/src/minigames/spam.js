import { monsterHTML } from '../ui/monster.js';
import { clock } from '../net.js';
import { sound } from '../ui/sound.js';
import { me } from '../state.js';
import { t } from '../ui/i18n.js';

export default {
  id: 'spam',

  mount(area, data, ctx) {
    // Le monstre à cliquer, c'est TON monstre : couleur, visage et accessoire.
    const p = me();
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:20px;">
        <div id="spam-count" class="title-display" style="font-size:clamp(60px,12vh,110px); font-weight:700; color:var(--soleil); font-variant-numeric:tabular-nums;">0</div>
        <button id="spam-btn" style="background:none; border:none; cursor:pointer; padding:0; -webkit-tap-highlight-color:transparent;">
          <div id="spam-monster" style="transition:transform 0.06s ease;">${monsterHTML(p?.color ?? '#ff2e88', { size: 170, face: p?.face, accessory: p?.accessory })}</div>
        </button>
        <span class="hint">${t('mg.spam.hint')}</span>
      </div>`;

    const countEl = area.querySelector('#spam-count');
    const monsterEl = area.querySelector('#spam-monster');
    let count = 0;
    let sent = 0;

    area.querySelector('#spam-btn').addEventListener('click', () => {
      if (clock() < ctx.startAt || clock() > ctx.startAt + ctx.duration) return;
      count += 1;
      countEl.textContent = count;
      sound.play('pop');
      monsterEl.style.transform = count % 2 ? 'scale(0.85, 0.75)' : 'scale(1.05, 0.9)';
      setTimeout(() => (monsterEl.style.transform = 'scale(1)'), 60);
    });

    // Envoi du compteur toutes les 200 ms (le serveur garde la dernière valeur).
    const flush = () => {
      if (count !== sent) {
        sent = count;
        ctx.submit({ count });
      }
    };
    const interval = setInterval(flush, 200);

    return {
      unmount() {
        clearInterval(interval);
        flush();
      },
    };
  },
};
