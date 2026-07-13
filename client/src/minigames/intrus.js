import { esc } from '../ui/dom.js';

export default {
  id: 'intrus',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div class="intrus-grid" style="grid-template-columns:repeat(${Number(data.columns) || 8}, 1fr);">
        ${data.cells.map((c, i) => `<button class="intrus-cell" data-i="${i}">${esc(c)}</button>`).join('')}
      </div>`;
    const grid = area.querySelector('.intrus-grid');

    grid.addEventListener('click', async (e) => {
      const cell = e.target.closest('.intrus-cell');
      if (!cell || grid.classList.contains('locked')) return;
      grid.classList.add('locked'); // un seul essai !
      const res = await ctx.submit({ index: Number(cell.dataset.i) });
      cell.classList.add(res?.success ? 'correct' : 'wrong');
      ctx.answered(res?.success);
    });

    return {
      // Fin de manche : l'intrus s'allume pour tout le monde.
      reveal({ index }) {
        grid.classList.add('locked');
        grid.querySelectorAll('.intrus-cell')[index]?.classList.add('correct');
      },
    };
  },
};
