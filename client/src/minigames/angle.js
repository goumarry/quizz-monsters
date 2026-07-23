import { t } from '../ui/i18n.js';

// L'Angle : un rapporteur SVG. Sommet fixe en bas au centre, une droite de
// référence horizontale (à droite, 0°) et une droite variable qui balaie de 0°
// (droite) à 180° (gauche) en passant par le haut (90°) — d'où le sommet
// centré horizontalement (les deux extrêmes doivent rester dans le cadre).
const VB = 220;
const VX = 110;
const VY = 204;
const R = 94; // longueur des droites
const AR = 34; // rayon de l'arc indicateur

const rad = (d) => (d * Math.PI) / 180;
const rayEnd = (deg, len) => [VX + len * Math.cos(rad(deg)), VY - len * Math.sin(rad(deg))];

// Tracé de l'arc par échantillonnage (pas de flag SVG ambigu à deviner).
function arcPath(deg) {
  const steps = Math.max(2, Math.round(deg / 4));
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (deg * i) / steps;
    const [x, y] = rayEnd(a, AR);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return d;
}

function svgMarkup(deg, { interactive } = {}) {
  const [fx, fy] = rayEnd(0, R);
  const [mx, my] = rayEnd(deg, R);
  return `
    <svg id="angle-svg" viewBox="0 0 ${VB} ${VB}"
      style="display:block; width:min(72vw,54vh,320px); aspect-ratio:1; ${interactive ? 'cursor:grab; touch-action:none;' : ''}">
      <path d="${arcPath(deg)}" fill="none" stroke="var(--menthe)" stroke-width="3" stroke-linecap="round"/>
      <line x1="${VX}" y1="${VY}" x2="${fx}" y2="${fy}" stroke="var(--text-dim)" stroke-width="5" stroke-linecap="round"/>
      <line id="angle-ray" x1="${VX}" y1="${VY}" x2="${mx}" y2="${my}"
        stroke="${interactive ? 'var(--rose)' : 'var(--soleil)'}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="${VX}" cy="${VY}" r="6" fill="var(--text)"/>
      ${interactive ? `<circle id="angle-handle" cx="${mx}" cy="${my}" r="13" fill="var(--rose)" stroke="#fff" stroke-width="3"/>` : ''}
    </svg>`;
}

function updateSvg(svg, deg) {
  const [mx, my] = rayEnd(deg, R);
  const ray = svg.querySelector('#angle-ray');
  ray.setAttribute('x2', mx);
  ray.setAttribute('y2', my);
  svg.querySelector('path').setAttribute('d', arcPath(deg));
  const handle = svg.querySelector('#angle-handle');
  if (handle) {
    handle.setAttribute('cx', mx);
    handle.setAttribute('cy', my);
  }
}

export default {
  id: 'angle',

  mount(area, data, ctx) {
    const isSet = data.mode === 'set';
    let currentDeg = isSet ? 90 : 90; // 'set' : angle construit ; 'guess' : estimation
    const shownDeg = isSet ? currentDeg : data.shownDeg;

    area.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:clamp(20px,5vw,60px); flex-wrap:wrap;">
        <div id="angle-wrap" style="filter:drop-shadow(0 14px 30px rgba(255,46,136,0.15));">
          ${svgMarkup(shownDeg, { interactive: isSet })}
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(10px,2.2vh,18px); width:min(280px,78vw);">
          <span class="label">${isSet ? t('mg.angle.current') : t('mg.angle.estimate')}</span>
          ${isSet
            ? `<span class="hint">${t('mg.angle.dragHint')}</span>`
            : `<div id="angle-value" class="title-display" style="font-size:clamp(40px,10vh,70px); font-weight:700; color:var(--menthe); font-variant-numeric:tabular-nums;">${currentDeg}°</div>
               <input id="angle-range" class="range" type="range" min="0" max="180" value="${currentDeg}">`}
          <button id="angle-ok" class="btn btn-menthe" style="width:100%;">${t('mg.verre.validate')}</button>
        </div>
      </div>`;

    const wrap = area.querySelector('#angle-wrap');
    const valueEl = area.querySelector('#angle-value');
    const okBtn = area.querySelector('#angle-ok');
    const range = area.querySelector('#angle-range');

    if (isSet) {
      const svg = wrap.querySelector('#angle-svg');
      let dragging = false;
      const angleFromEvent = (e) => {
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * VB;
        const y = ((e.clientY - rect.top) / rect.height) * VB;
        const a = (Math.atan2(-(y - VY), x - VX) * 180) / Math.PI;
        return Math.min(180, Math.max(0, Math.round(a)));
      };
      const update = () => {
        updateSvg(svg, currentDeg);
      };
      svg.addEventListener('pointerdown', (e) => {
        if (okBtn.disabled) return;
        dragging = true;
        svg.setPointerCapture(e.pointerId);
        currentDeg = angleFromEvent(e);
        update();
      });
      svg.addEventListener('pointermove', (e) => {
        if (!dragging || okBtn.disabled) return;
        currentDeg = angleFromEvent(e);
        update();
      });
      svg.addEventListener('pointerup', () => (dragging = false));
      svg.addEventListener('pointercancel', () => (dragging = false));
    } else {
      range.addEventListener('input', () => {
        currentDeg = Number(range.value);
        valueEl.textContent = `${currentDeg}°`;
      });
    }

    const send = async () => {
      if (okBtn.disabled) return;
      okBtn.disabled = true;
      if (range) range.disabled = true;
      await ctx.submit({ deg: currentDeg });
      if (valueEl) valueEl.style.color = 'var(--text-dim)';
      okBtn.textContent = t('mg.verre.sent');
    };

    okBtn.addEventListener('click', send);

    return {
      // Le temps est écoulé sans clic sur "Valider" : on envoie quand même la
      // dernière valeur réglée plutôt que de compter une non-réponse.
      timeout: send,
      // Fin de manche : le vrai angle s'affiche, avec l'écart du joueur.
      reveal({ target }) {
        okBtn.disabled = true;
        if (range) range.disabled = true;
        const diff = Math.abs(currentDeg - target);
        area.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(10px,2.2vh,18px);">
            <div style="filter:drop-shadow(0 14px 30px rgba(255,214,10,0.15));">${svgMarkup(target, { interactive: false })}</div>
            <span class="label">${t('mg.verre.truth')}</span>
            <div class="title-display" style="font-size:clamp(40px,9vh,66px); font-weight:700; color:var(--soleil); text-shadow:0 0 40px rgba(255,214,10,0.5);">${target}°</div>
            <div style="font-size:16px; color:${diff <= 15 ? 'var(--menthe)' : 'var(--corail)'}; font-weight:700;">
              ${t('mg.verre.you', { g: currentDeg, d: diff })}
            </div>
          </div>`;
      },
    };
  },
};
