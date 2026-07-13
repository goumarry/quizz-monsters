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

export default {
  id: 'aires',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div id="aires-board" style="position:relative; width:min(76vh, 100%); aspect-ratio:1; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:24px;">
        ${data.shapes
          .map((s, i) => `<div class="aires-shape" data-i="${i}" style="${shapeStyle(s)}"></div>`)
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
