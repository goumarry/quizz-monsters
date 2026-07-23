import { t } from '../ui/i18n.js';

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return [Math.round((rp + m) * 255), Math.round((gp + m) * 255), Math.round((bp + m) * 255)];
}

export default {
  id: 'couleur',

  mount(area, data, ctx) {
    let hue = Math.round(Math.random() * 360);
    let sat = 0.7;
    let val = 0.7;
    let rgb = hsvToRgb(hue, sat, val);

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(10px,2.2vh,20px); width:min(320px,88vw);">
        <div style="display:flex; align-items:center; gap:clamp(18px,4vw,36px);">
          <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
            <span class="label">${t('mg.couleur.target')}</span>
            <div style="width:clamp(60px,11vh,92px); aspect-ratio:1; border-radius:18px; background:rgb(${data.r},${data.g},${data.b});
              box-shadow:0 6px 16px rgba(0,0,0,0.4), inset 0 0 0 3px rgba(255,255,255,0.15);"></div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
            <span class="label">${t('mg.couleur.yours')}</span>
            <div id="couleur-preview" style="width:clamp(60px,11vh,92px); aspect-ratio:1; border-radius:18px;
              box-shadow:0 6px 16px rgba(0,0,0,0.4), inset 0 0 0 3px rgba(255,255,255,0.15);"></div>
          </div>
        </div>

        <div id="couleur-sv" style="position:relative; width:100%; height:clamp(120px,24vh,190px); border-radius:16px; cursor:crosshair; touch-action:none;">
          <div id="couleur-cursor" style="position:absolute; width:18px; height:18px; margin:-9px 0 0 -9px; border-radius:50%;
            border:3px solid #fff; box-shadow:0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.5); pointer-events:none;"></div>
        </div>

        <input id="couleur-hue" class="range range-hue" type="range" min="0" max="359" value="${hue}" style="width:100%;">

        <button id="couleur-ok" class="btn btn-menthe" style="width:100%;">${t('mg.verre.validate')}</button>
      </div>`;

    const sv = area.querySelector('#couleur-sv');
    const cursor = area.querySelector('#couleur-cursor');
    const hueInput = area.querySelector('#couleur-hue');
    const preview = area.querySelector('#couleur-preview');
    const okBtn = area.querySelector('#couleur-ok');

    const render = () => {
      sv.style.background = `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, hsl(${hue},100%,50%))`;
      cursor.style.left = `${sat * 100}%`;
      cursor.style.top = `${(1 - val) * 100}%`;
      rgb = hsvToRgb(hue, sat, val);
      preview.style.background = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
    };

    let dragging = false;
    const setFromEvent = (e) => {
      const rect = sv.getBoundingClientRect();
      sat = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      val = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
      render();
    };
    sv.addEventListener('pointerdown', (e) => {
      if (okBtn.disabled) return;
      dragging = true;
      sv.setPointerCapture(e.pointerId);
      setFromEvent(e);
    });
    sv.addEventListener('pointermove', (e) => { if (dragging) setFromEvent(e); });
    sv.addEventListener('pointerup', () => (dragging = false));
    sv.addEventListener('pointercancel', () => (dragging = false));

    hueInput.addEventListener('input', () => {
      hue = Number(hueInput.value);
      render();
    });

    render();

    const send = async () => {
      if (okBtn.disabled) return;
      okBtn.disabled = true;
      hueInput.disabled = true;
      sv.style.pointerEvents = 'none';
      const res = await ctx.submit({ r: rgb[0], g: rgb[1], b: rgb[2] });
      okBtn.textContent = t('mg.verre.sent');
      const d = res?.detail?.dist;
      ctx.answered(res?.success, d != null ? { emoji: '🎨', title: t('res.couleur', { d }) } : undefined);
    };

    okBtn.addEventListener('click', send);

    return {
      // Le temps est écoulé sans clic sur "Valider" : on envoie quand même la
      // dernière couleur réglée plutôt que de compter une non-réponse.
      timeout: send,
    };
  },
};
