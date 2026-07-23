import { glassLevelFromHeight } from '@quizz/shared';
import { t } from '../ui/i18n.js';

export default {
  id: 'verre',

  mount(area, data, ctx) {
    // Trapèze : largeur du haut wt %, du bas wb % (le % à deviner/atteindre est
    // celui de la SURFACE remplie, pas de la hauteur — c'est tout le piège).
    const tl = (100 - data.wt) / 2;
    const tr = 100 - tl;
    const bl = (100 - data.wb) / 2;
    const br = 100 - bl;
    const isFill = data.mode === 'fill';

    let frac = isFill ? 0.5 : data.water; // fraction de hauteur remplie (0..1)
    let guessPct = isFill ? Math.round(glassLevelFromHeight(data.wb, data.wt, frac)) : 50;

    area.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:clamp(30px,6vw,80px); flex-wrap:wrap;">
        <div style="filter:drop-shadow(0 14px 34px rgba(58,209,255,0.18));">
          <div id="verre-glass" style="position:relative; height:min(46vh,420px); width:min(34vh,310px); overflow:hidden;
               clip-path:polygon(${tl}% 0, ${tr}% 0, ${br}% 100%, ${bl}% 100%);
               background:linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
               ${isFill ? 'cursor:ns-resize; touch-action:none;' : ''}">
            <div id="verre-water" style="position:absolute; left:0; right:0; bottom:0; height:${(frac * 100).toFixed(1)}%;
                 background:linear-gradient(180deg, #7ee4ff, #3ad1ff 30%, #2ba8d6);
                 border-top:4px solid rgba(255,255,255,0.55);">
              ${isFill ? `<span id="verre-arrow" style="position:absolute; top:0; left:50%; transform:translate(-50%,-50%);
                   font-size:clamp(20px,4.5vh,30px); line-height:1; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.55);
                   pointer-events:none; user-select:none;">⇕</span>` : ''}
            </div>
            <!-- Reflet du verre. -->
            <div style="position:absolute; top:4%; bottom:6%; left:16%; width:7%;
                 background:rgba(255,255,255,0.22); border-radius:8px; transform:rotate(${(data.wt - data.wb) / 14}deg);"></div>
          </div>
        </div>

        <div id="verre-panel" style="display:flex; flex-direction:column; align-items:center; gap:clamp(10px,2.2vh,18px); width:min(280px, 78vw);">
          <span class="label">${isFill ? t('mg.verre.yours') : t('mg.verre.estimate')}</span>
          ${isFill
            ? `<span class="hint">${t('mg.verre.dragHint')}</span>`
            : `<div id="verre-value" class="title-display" style="font-size:clamp(44px,11vh,76px); font-weight:700; color:var(--menthe); font-variant-numeric:tabular-nums;">${guessPct}%</div>
               <input id="verre-range" class="range" type="range" min="0" max="100" value="50">`}
          <button id="verre-ok" class="btn btn-menthe" style="width:100%;">${t('mg.verre.validate')}</button>
        </div>
      </div>`;

    const value = area.querySelector('#verre-value');
    const okBtn = area.querySelector('#verre-ok');
    const range = area.querySelector('#verre-range');

    if (isFill) {
      const glass = area.querySelector('#verre-glass');
      const water = area.querySelector('#verre-water');
      let dragging = false;
      const setFromEvent = (e) => {
        const rect = glass.getBoundingClientRect();
        frac = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
        water.style.height = `${(frac * 100).toFixed(1)}%`;
        guessPct = Math.round(glassLevelFromHeight(data.wb, data.wt, frac));
      };
      glass.addEventListener('pointerdown', (e) => {
        if (okBtn.disabled) return;
        dragging = true;
        glass.setPointerCapture(e.pointerId);
        setFromEvent(e);
      });
      glass.addEventListener('pointermove', (e) => { if (dragging) setFromEvent(e); });
      glass.addEventListener('pointerup', () => (dragging = false));
      glass.addEventListener('pointercancel', () => (dragging = false));
    } else {
      range.addEventListener('input', () => {
        guessPct = Number(range.value);
        value.textContent = `${guessPct}%`;
        range.style.setProperty('--val', `${range.value}%`);
      });
    }

    const send = async () => {
      if (okBtn.disabled) return;
      okBtn.disabled = true;
      if (range) range.disabled = true;
      if (isFill) area.querySelector('#verre-glass').style.pointerEvents = 'none';
      await ctx.submit(isFill ? { frac } : { pct: guessPct });
      if (value) value.style.color = 'var(--text-dim)';
      okBtn.textContent = t('mg.verre.sent');
    };

    okBtn.addEventListener('click', send);

    return {
      // Le temps est écoulé sans clic sur "Valider" : on envoie quand même la
      // dernière valeur réglée plutôt que de compter une non-réponse.
      timeout: send,
      // Fin de manche : la vraie valeur s'affiche en grand pour tout le monde,
      // le temps de la phase de révélation (~3 s).
      reveal({ level }) {
        okBtn.disabled = true;
        if (range) range.disabled = true;
        const diff = Math.abs(guessPct - level);
        area.querySelector('#verre-panel').innerHTML = `
          <span class="label">${t('mg.verre.truth')}</span>
          <div class="title-display" style="font-size:clamp(50px,12vh,90px); font-weight:700; color:var(--soleil); text-shadow:0 0 40px rgba(255,214,10,0.5);">${level}%</div>
          <div style="font-size:16px; color:${diff <= 15 ? 'var(--menthe)' : 'var(--corail)'}; font-weight:700;">
            ${t('mg.verre.you', { g: guessPct, d: diff })}
          </div>`;
      },
    };
  },
};
