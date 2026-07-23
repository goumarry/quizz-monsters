import { esc } from '../ui/dom.js';
import { clock } from '../net.js';
import { t } from '../ui/i18n.js';
import { monsterHTML } from '../ui/monster.js';

// Les 7 Différences : grille d'avatars du salon (couleur/visage/accessoire
// réels) affichée quelques instants, puis un avatar change silencieusement —
// il faut cliquer dessus le plus vite possible.
export default {
  id: 'diff',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(8px,2vh,16px);">
        <div id="diff-question" class="title-display" style="font-size:clamp(14px,3vh,22px); font-weight:700; min-height:1.3em; color:var(--text-muted); text-align:center;">${t('mg.diff.memorize')}</div>
        <div id="diff-grid" class="diff-grid">
          ${data.cells
            .map(
              (c, i) => `
              <button class="diff-cell" data-i="${i}">
                <span class="diff-avatar" data-i="${i}">${monsterHTML(c.color, { size: 44, face: c.realFace, accessory: c.realAccessory })}</span>
                <span class="diff-name">${esc(c.name)}</span>
              </button>`,
            )
            .join('')}
        </div>
      </div>`;

    const question = area.querySelector('#diff-question');
    const grid = area.querySelector('#diff-grid');
    let revealed = false;
    let locked = false;
    let timer;

    const showChanged = () => {
      revealed = true;
      data.cells.forEach((c, i) => {
        if (c.face !== c.realFace || c.accessory !== c.realAccessory) {
          grid.querySelector(`.diff-avatar[data-i="${i}"]`).innerHTML =
            monsterHTML(c.color, { size: 44, face: c.face, accessory: c.accessory });
        }
      });
      question.textContent = t('mg.diff.find');
    };

    timer = setTimeout(showChanged, Math.max(0, ctx.startAt + data.showMs - clock()));

    grid.addEventListener('click', async (e) => {
      const cell = e.target.closest('.diff-cell');
      if (!cell || locked || !revealed) return;
      locked = true;
      grid.style.pointerEvents = 'none';
      const res = await ctx.submit({ index: Number(cell.dataset.i) });
      cell.classList.add(res?.success ? 'diff-correct' : 'diff-wrong');
      ctx.answered(res?.success);
    });

    return {
      // Fin de manche : l'avatar qui a changé s'allume pour tout le monde.
      reveal({ index }) {
        locked = true;
        grid.style.pointerEvents = 'none';
        if (!revealed) showChanged();
        grid.querySelectorAll('.diff-cell')[index]?.classList.add('diff-correct');
      },
      unmount: () => clearTimeout(timer),
    };
  },
};
