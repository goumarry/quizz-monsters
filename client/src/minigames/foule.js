import { monsterHTML } from '../ui/monster.js';

// La Foule : deux panneaux (à peu près carrés) remplis de petits monstres
// éparpillés au hasard — chevauchements permis. Clic sur tout le panneau
// (pas juste une icône) pour choisir un côté.
const sidePanel = (key, crowd) => `
  <button class="foule-side" data-side="${key}" style="position:relative; width:min(46%, 42vh, 320px); aspect-ratio:1;
    align-self:center; cursor:pointer; overflow:hidden;
    background:var(--surface-2); border:2px solid transparent; border-radius:22px; transition:border-color 0.15s ease, opacity 0.15s ease;">
    ${crowd.map((m) => `<div style="position:absolute; left:${m.x}%; top:${m.y}%; pointer-events:none;">${monsterHTML(m.c, { size: 22 })}</div>`).join('')}
  </button>`;

export default {
  id: 'foule',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div style="display:flex; gap:clamp(10px,3vw,18px); width:100%; height:100%; align-items:center; justify-content:center; flex-wrap:wrap;">
        ${sidePanel('left', data.left)}
        ${sidePanel('right', data.right)}
      </div>`;

    const sides = area.querySelectorAll('.foule-side');
    let locked = false;

    area.addEventListener('click', async (e) => {
      const btn = e.target.closest('.foule-side');
      if (!btn || locked) return;
      locked = true;
      sides.forEach((s) => (s.style.pointerEvents = 'none'));
      const res = await ctx.submit({ side: btn.dataset.side });
      btn.style.borderColor = res?.success ? 'var(--menthe)' : 'var(--corail)';
      btn.style.boxShadow = `0 0 20px ${res?.success ? 'rgba(46,255,199,0.5)' : 'rgba(255,93,93,0.4)'}`;
      ctx.answered(res?.success);
    });

    return {
      // Fin de manche : le bon côté s'illumine, l'autre s'estompe.
      reveal({ side }) {
        locked = true;
        sides.forEach((s) => {
          s.style.pointerEvents = 'none';
          if (s.dataset.side === side) {
            s.style.borderColor = 'var(--menthe)';
            s.style.boxShadow = '0 0 22px rgba(46,255,199,0.55)';
          } else {
            s.style.opacity = '0.35';
          }
        });
      },
    };
  },
};
