export default {
  id: 'verre',

  mount(area, data, ctx) {
    // Trapèze : largeur du haut wt %, du bas wb % (le % à deviner est celui de
    // la SURFACE remplie, pas de la hauteur — c'est tout le piège).
    const tl = (100 - data.wt) / 2;
    const tr = 100 - tl;
    const bl = (100 - data.wb) / 2;
    const br = 100 - bl;

    area.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; gap:clamp(30px,6vw,80px); flex-wrap:wrap;">
        <div style="filter:drop-shadow(0 14px 34px rgba(58,209,255,0.18));">
          <div style="position:relative; height:min(46vh,420px); width:min(34vh,310px); overflow:hidden;
               clip-path:polygon(${tl}% 0, ${tr}% 0, ${br}% 100%, ${bl}% 100%);
               background:linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));">
            <div style="position:absolute; left:0; right:0; bottom:0; height:${(data.water * 100).toFixed(1)}%;
                 background:linear-gradient(180deg, #7ee4ff, #3ad1ff 30%, #2ba8d6);
                 border-top:4px solid rgba(255,255,255,0.55);"></div>
            <!-- Reflet du verre. -->
            <div style="position:absolute; top:4%; bottom:6%; left:16%; width:7%;
                 background:rgba(255,255,255,0.22); border-radius:8px; transform:rotate(${(data.wt - data.wb) / 14}deg);"></div>
          </div>
        </div>

        <div id="verre-panel" style="display:flex; flex-direction:column; align-items:center; gap:18px; width:280px;">
          <span class="label">Ton estimation</span>
          <div id="verre-value" class="title-display" style="font-size:76px; font-weight:700; color:var(--menthe); font-variant-numeric:tabular-nums;">50%</div>
          <input id="verre-range" class="range" type="range" min="0" max="100" value="50">
          <button id="verre-ok" class="btn btn-menthe" style="width:100%;">VALIDER</button>
        </div>
      </div>`;

    const range = area.querySelector('#verre-range');
    const value = area.querySelector('#verre-value');
    const okBtn = area.querySelector('#verre-ok');
    range.addEventListener('input', () => {
      value.textContent = `${range.value}%`;
      range.style.setProperty('--val', `${range.value}%`);
    });

    okBtn.addEventListener('click', async () => {
      if (okBtn.disabled) return;
      okBtn.disabled = true;
      range.disabled = true;
      await ctx.submit({ pct: Number(range.value) });
      value.style.color = 'var(--text-dim)';
      okBtn.textContent = 'ENVOYÉ ✓';
    });

    return {
      // Fin de manche : la vraie valeur s'affiche en grand pour tout le monde,
      // le temps de la phase de révélation (~3 s).
      reveal({ level }) {
        okBtn.disabled = true;
        range.disabled = true;
        const guess = Number(range.value);
        const diff = Math.abs(guess - level);
        area.querySelector('#verre-panel').innerHTML = `
          <span class="label">La vraie valeur</span>
          <div class="title-display" style="font-size:90px; font-weight:700; color:var(--soleil); text-shadow:0 0 40px rgba(255,214,10,0.5);">${level}%</div>
          <div style="font-size:16px; color:${diff <= 15 ? 'var(--menthe)' : 'var(--corail)'}; font-weight:700;">
            Toi : ${guess}% (à ${diff} point${diff > 1 ? 's' : ''})
          </div>`;
      },
    };
  },
};
