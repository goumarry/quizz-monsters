import { me } from '../state.js';
import { clock } from '../net.js';
import { t } from '../ui/i18n.js';

// Trait Parfait : dessine la forme demandée (rond ou carré) d'un seul trait
// sur le canvas. Au lâcher, les points normalisés partent au serveur qui
// renvoie le % de précision. Un seul essai.
export default {
  id: 'dessine',

  mount(area, data, ctx) {

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(8px,2vh,16px); width:100%;">
        <span id="dessine-hint" class="hint" style="font-size:15px;">${t(data.shape === 'rond' ? 'mg.dessine.hintRond' : 'mg.dessine.hintCarre')}</span>
        <div style="position:relative; width:min(56vh, 90%); aspect-ratio:1;">
          <canvas id="dessine-canvas" style="position:absolute; inset:0; width:100%; height:100%;
            background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:24px;
            cursor:crosshair; touch-action:none;"></canvas>
          <div id="dessine-score" class="title-display" style="position:absolute; inset:0; display:none;
            align-items:center; justify-content:center; font-size:clamp(50px,10vh,90px); font-weight:700;
            pointer-events:none; text-shadow:0 0 40px rgba(0,0,0,0.5);"></div>
        </div>
      </div>`;

    const canvas = area.querySelector('#dessine-canvas');
    const scoreEl = area.querySelector('#dessine-score');
    const hint = area.querySelector('#dessine-hint');
    const color = me()?.color ?? '#ff2e88';

    // Résolution réelle du canvas = taille affichée (net sur écran haute densité).
    const dpr = window.devicePixelRatio || 1;
    const fit = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
    };
    const g = canvas.getContext('2d');

    let drawing = false;
    let done = false;
    const points = []; // normalisés [0..1]

    const toLocalPt = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (done || clock() < ctx.startAt) return;
      fit();
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      points.length = 0;
      points.push(toLocalPt(e));
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.lineWidth = 6 * dpr;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.strokeStyle = color;
      g.shadowColor = color;
      g.shadowBlur = 12 * dpr;
      g.beginPath();
      g.moveTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing || done) return;
      const [x, y] = toLocalPt(e);
      const [px, py] = points[points.length - 1];
      // Échantillonnage : on ignore les déplacements minuscules.
      if (Math.hypot(x - px, y - py) < 0.004) return;
      if (points.length < 600) points.push([x, y]);
      g.lineTo(x * canvas.width, y * canvas.height);
      g.stroke();
    });

    const finish = async () => {
      if (!drawing || done) return;
      drawing = false;
      done = true;
      const res = await ctx.submit({ points: [...points] });
      const pct = res?.detail?.pct ?? 0;
      canvas.style.opacity = '0.45';
      hint.textContent = t('mg.dessine.sent');
      scoreEl.textContent = `${pct} %`;
      scoreEl.style.color = res?.success ? 'var(--menthe)' : 'var(--corail)';
      scoreEl.style.display = 'flex';
      ctx.answered(res?.success, { emoji: '✏️', title: t('mg.dessine.precision', { pct }) });
    };
    canvas.addEventListener('pointerup', finish);
    canvas.addEventListener('pointercancel', finish);

    return {};
  },
};
