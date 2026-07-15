import { SHAPES } from '@quizz/shared';

// La Plus Grande : plateau carré, formes positionnées en % du côté. Le rendu
// (clip-path / border-radius) vient de la même bibliothèque de formes que le
// calcul d'aire côté serveur.
function shapeStyle(s) {
  const def = SHAPES[s.type];
  const rot = s.rot ? ` rotate(${s.rot}deg)` : '';
  let style = `position:absolute; left:${s.x}%; top:${s.y}%; width:${s.w}%; height:${s.h}%;
    transform:translate(-50%,-50%)${rot}; background:${s.color}; cursor:pointer;
    transition:transform 0.1s ease, filter 0.1s ease;`;
  if (def.kind === 'round') style += ' border-radius:50%;';
  else if (def.kind === 'semi') style += ' border-radius:50vh 50vh 0 0;';
  else if (def.kind === 'box') style += ' border-radius:10%;';
  else if (def.kind === 'poly') style += ` clip-path:${def.clip};`;
  return style;
}

// Visage de monstre (yeux + bouche, même style que la mascotte) dessiné dans
// chaque forme. Le clip-path rogne aussi les enfants : l'ancre (x,y) et
// l'échelle k sont ajustées par forme pour rester dans la zone visible.
const INK = '#150c2b';
const FACE_POS = {
  tri: { y: 66, k: 0.85 },
  triRight: { x: 33, y: 68, k: 0.8 },
  semi: { y: 58 },
  star: { y: 48, k: 0.6 },
  cross: { k: 0.75 },
  arrow: { x: 45, y: 50, k: 0.85 },
};

function faceHTML(type) {
  const { x = 50, y = 52, k = 1 } = FACE_POS[type] || {};
  const eye = 16 * k; // largeur d'un œil, en % de la forme
  const eyeCss = (cx) => `position:absolute; left:${cx - eye / 2}%; top:${y - 10 * k}%; width:${eye}%;
    aspect-ratio:1; background:#fff; border-radius:50%; display:flex; align-items:center;
    justify-content:center; pointer-events:none;`;
  const pupil = `<div style="width:42%; height:42%; background:${INK}; border-radius:50%;"></div>`;
  return `
    <div style="${eyeCss(x - 10 * k)}">${pupil}</div>
    <div style="${eyeCss(x + 10 * k)}">${pupil}</div>
    <div style="position:absolute; left:${x - 10 * k}%; top:${y + 7 * k}%; width:${20 * k}%;
      aspect-ratio:2.2; background:${INK}; border-radius:0 0 999px 999px; pointer-events:none;"></div>`;
}

export default {
  id: 'aires',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div id="aires-board" style="position:relative; width:min(76vh, 100%); aspect-ratio:1; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:24px;">
        ${data.shapes
          .map((s, i) => `<div class="aires-shape" data-i="${i}" style="${shapeStyle(s)}">${faceHTML(s.type)}</div>`)
          .join('')}
      </div>`;

    const board = area.querySelector('#aires-board');
    let locked = false;
    const baseTransform = (i) => `translate(-50%,-50%)${data.shapes[i].rot ? ` rotate(${data.shapes[i].rot}deg)` : ''}`;

    board.addEventListener('click', async (e) => {
      const shape = e.target.closest('.aires-shape');
      if (!shape || locked) return;
      locked = true;
      board.style.pointerEvents = 'none';
      const i = Number(shape.dataset.i);
      const res = await ctx.submit({ index: i });
      shape.style.filter = `drop-shadow(0 0 18px ${res?.success ? 'var(--menthe)' : 'var(--corail)'})`;
      shape.style.transform = `${baseTransform(i)} scale(1.15)`;
      ctx.answered(res?.success);
    });

    board.addEventListener('mouseover', (e) => {
      const shape = e.target.closest('.aires-shape');
      if (shape && !locked) shape.style.transform = `${baseTransform(Number(shape.dataset.i))} scale(1.08)`;
    });
    board.addEventListener('mouseout', (e) => {
      const shape = e.target.closest('.aires-shape');
      if (shape && !locked) shape.style.transform = baseTransform(Number(shape.dataset.i));
    });

    return {
      // Fin de manche : la bonne forme pulse en vert, les autres s'estompent.
      reveal({ index }) {
        locked = true;
        board.style.pointerEvents = 'none';
        board.querySelectorAll('.aires-shape').forEach((el, i) => {
          if (i === index) {
            el.style.filter = 'drop-shadow(0 0 24px var(--menthe))';
            el.style.transform = `${baseTransform(i)} scale(1.2)`;
          } else {
            el.style.opacity = '0.25';
          }
        });
      },
    };
  },
};
