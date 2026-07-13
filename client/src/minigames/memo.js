import { esc } from '../ui/dom.js';
import { clock } from '../net.js';
import { monsterHTML } from '../ui/monster.js';

const HIDDEN_COLOR = '#3a2b63';

// Mémoire Flash : les monstres colorés s'affichent ~1,5 s, puis tout devient
// gris et la question tombe : où était le monstre de telle couleur ?
export default {
  id: 'memo',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:22px;">
        <div id="memo-question" class="title-display" style="font-size:clamp(20px,3.5vh,30px); font-weight:700; min-height:40px; color:var(--text-muted);">
          Mémorise-les tous…
        </div>
        <div id="memo-grid" style="display:grid; grid-template-columns:repeat(4,1fr); gap:14px;">
          ${data.cells
            .map(
              (color, i) => `
              <button class="memo-cell" data-i="${i}" style="width:clamp(64px,10vh,92px); height:clamp(64px,10vh,92px);
                background:var(--surface-2); border:1px solid var(--border); border-radius:18px; cursor:pointer;
                display:flex; align-items:center; justify-content:center; transition:transform 0.08s ease;">
                <span class="memo-monster" data-color="${esc(color)}">${monsterHTML(color, { size: 46 })}</span>
              </button>`,
            )
            .join('')}
        </div>
      </div>`;

    const question = area.querySelector('#memo-question');
    const grid = area.querySelector('#memo-grid');
    let hidden = false;
    let locked = false;
    let timer;

    const hideAll = () => {
      hidden = true;
      grid.querySelectorAll('.memo-monster').forEach((el) => {
        el.innerHTML = monsterHTML(HIDDEN_COLOR, { size: 46 });
      });
      question.innerHTML = `Où était le monstre <span style="color:${esc(data.targetColor)};">${esc(data.targetName)}</span> ?`;
      question.style.color = 'var(--text)';
    };

    const start = () => {
      timer = setTimeout(hideAll, ctx.startAt + data.showMs - clock());
    };
    start();

    grid.addEventListener('click', async (e) => {
      const cell = e.target.closest('.memo-cell');
      // Pas de clic pendant la phase de mémorisation.
      if (!cell || locked || !hidden) return;
      locked = true;
      grid.style.pointerEvents = 'none';
      const res = await ctx.submit({ index: Number(cell.dataset.i) });
      cell.style.borderColor = res?.success ? 'var(--menthe)' : 'var(--corail)';
      cell.style.boxShadow = `0 0 18px ${res?.success ? 'rgba(46,255,199,0.6)' : 'rgba(255,93,93,0.5)'}`;
      ctx.answered(res?.success);
    });

    return {
      // Fin de manche : le monstre cible réapparaît à sa place.
      reveal({ index }) {
        locked = true;
        grid.style.pointerEvents = 'none';
        if (!hidden) hideAll();
        const cell = grid.querySelectorAll('.memo-cell')[index];
        cell.querySelector('.memo-monster').innerHTML = monsterHTML(data.targetColor, { size: 46, face: 'joyeux' });
        cell.style.borderColor = 'var(--menthe)';
        cell.style.boxShadow = '0 0 18px rgba(46,255,199,0.6)';
        cell.style.transform = 'scale(1.12)';
      },
      unmount: () => clearTimeout(timer),
    };
  },
};
