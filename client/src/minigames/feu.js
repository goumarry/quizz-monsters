// Feu Vert : un gros feu circulaire au centre. Rouge = attends, vert = CLIQUE !
// Toute la zone reste cliquable (équitable), mais le visuel est doux : seul le
// disque change de couleur. Cliquer pendant le rouge = faux départ = 0 point.
import { sound } from '../ui/sound.js';
import { t } from '../ui/i18n.js';
import { clock } from '../net.js';

export default {
  id: 'feu',

  mount(area, data, ctx) {
    area.innerHTML = `
      <button id="feu-panel" style="width:100%; height:100%; border:none; cursor:pointer; background:none;
        display:flex; flex-direction:column; align-items:center; justify-content:center; gap:26px;
        -webkit-tap-highlight-color:transparent;">
        <div id="feu-light" style="width:clamp(150px,28vh,260px); aspect-ratio:1; border-radius:50%;
          background:#8c1f3f; border:6px solid rgba(255,255,255,0.12);
          box-shadow:0 0 50px rgba(140,31,63,0.5), inset 0 -10px 0 rgba(0,0,0,0.25);
          display:flex; align-items:center; justify-content:center; font-size:clamp(50px,10vh,84px);
          transition:background 0.05s linear, box-shadow 0.05s linear;">✋</div>
        <span id="feu-text" class="title-display" style="font-size:clamp(26px,5vh,42px); font-weight:700;">${t('mg.feu.wait')}</span>
        <span id="feu-sub" class="hint">${t('mg.feu.hint')}</span>
      </button>`;

    const panel = area.querySelector('#feu-panel');
    const light = area.querySelector('#feu-light');
    const text = area.querySelector('#feu-text');
    const sub = area.querySelector('#feu-sub');

    let green = false;
    let done = false;
    let raf;
    const goLocal = ctx.startAt + data.goAt;

    const tick = () => {
      if (!green && clock() >= goLocal) {
        green = true;
        light.style.background = 'var(--menthe)';
        light.style.boxShadow = '0 0 70px rgba(46,255,199,0.55), inset 0 -10px 0 rgba(0,0,0,0.18)';
        light.textContent = '⚡';
        text.textContent = t('mg.feu.click');
        text.style.color = 'var(--menthe)';
        sub.style.visibility = 'hidden';
        sound.play('go');
      }
      if (!done && !green) raf = requestAnimationFrame(tick);
    };
    tick();

    panel.addEventListener('click', async () => {
      if (done || clock() < ctx.startAt) return;
      done = true;
      const reaction = clock() - goLocal;
      const res = await ctx.submit({});
      if (reaction < 0) {
        light.style.background = 'var(--corail)';
        light.style.boxShadow = '0 0 60px rgba(255,93,93,0.5), inset 0 -10px 0 rgba(0,0,0,0.2)';
        light.textContent = '💥';
        text.textContent = t('mg.feu.false');
        text.style.color = 'var(--corail)';
        ctx.answered(false, { emoji: '🚨', title: t('res.falsestart') });
      } else {
        text.textContent = `${reaction} ms`;
        ctx.answered(res?.success, { emoji: '⚡', title: t('res.reflex', { ms: reaction }) });
      }
    });

    return { unmount: () => cancelAnimationFrame(raf) };
  },
};
