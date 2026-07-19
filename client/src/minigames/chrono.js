import { clock } from '../net.js';
import { t } from '../ui/i18n.js';
export default {
  id: 'chrono',

  mount(area, data, ctx) {
    const targetSec = (data.target / 1000).toFixed(2);
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(12px,3.25vh,26px);">
        <span class="label" style="font-size:14px;">${t('mg.chrono.target')} <span style="color:var(--soleil); font-size:18px;">${targetSec}s</span></span>
        <div id="chrono-display" class="title-display" style="font-size:clamp(52px,14vh,130px); font-weight:700; font-variant-numeric:tabular-nums; text-shadow:0 0 50px rgba(46,255,199,0.45);">0.00</div>
        <button id="chrono-stop" class="btn btn-big" style="font-size:clamp(18px,3.6vh,26px); padding:clamp(14px,3vh,22px) clamp(40px,12vw,90px);">${t('mg.chrono.stop')}</button>
        <span class="hint">${t('mg.chrono.hint')}</span>
      </div>`;

    const display = area.querySelector('#chrono-display');
    const stopBtn = area.querySelector('#chrono-stop');
    const hideAfter = data.target * 0.55; // au-delà : affichage masqué
    let stopped = false;
    let raf;

    const tick = () => {
      if (!stopped) {
        const elapsed = clock() - ctx.startAt;
        if (elapsed <= 0) display.textContent = '0.00';
        else if (elapsed > hideAfter) {
          display.textContent = '?.??';
          display.style.color = 'var(--text-dim)';
        } else display.textContent = (elapsed / 1000).toFixed(2);
        raf = requestAnimationFrame(tick);
      }
    };
    tick();

    stopBtn.addEventListener('click', async () => {
      if (stopped) return;
      stopped = true;
      const elapsed = clock() - ctx.startAt;
      stopBtn.disabled = true;
      const res = await ctx.submit({});
      const diff = Math.abs(elapsed - data.target);
      display.textContent = (elapsed / 1000).toFixed(2);
      display.style.color = res?.success ? 'var(--menthe)' : 'var(--corail)';
      ctx.answered(res?.success, {
        emoji: '⏱️',
        title: t('mg.chrono.result', { t: (elapsed / 1000).toFixed(2), d: (diff / 1000).toFixed(2) }),
      });
    });

    return { unmount: () => cancelAnimationFrame(raf) };
  },
};
