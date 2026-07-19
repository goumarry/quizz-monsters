import { esc } from '../ui/dom.js';
import { t, colorName } from '../ui/i18n.js';

// Effet Stroop, deux variantes selon data.mode :
//  - 'ink'  → clique la pastille de la couleur de L'ENCRE du mot.
//  - 'word' → clique la pastille de la couleur que DIT le mot.
export default {
  id: 'stroop',

  mount(area, data, ctx) {
    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(16px,5.5vh,44px);">
        <div class="title-display" style="font-size:clamp(44px,12vh,110px); font-weight:700; color:${esc(data.ink)}; text-shadow:0 0 50px ${esc(data.ink)}66; letter-spacing:2px; text-align:center;">
          ${esc(colorName(data.wordHex))}
        </div>
        <div style="display:flex; gap:clamp(10px,2.4vw,18px); flex-wrap:wrap; justify-content:center;">
          ${data.options
            .map(
              (hex, i) => `
              <button class="stroop-dot" data-i="${i}" style="width:clamp(44px,9vh,64px); height:clamp(44px,9vh,64px); border-radius:50%; border:none;
                background:${esc(hex)}; cursor:pointer; transition:transform 0.08s ease, opacity 0.15s ease;
                box-shadow:0 6px 0 rgba(0,0,0,0.3);"></button>`,
            )
            .join('')}
        </div>
        <span class="hint">${t(data.mode === 'word' ? 'mg.stroop.hintWord' : 'mg.stroop.hintInk')}</span>
      </div>`;

    let locked = false;
    area.addEventListener('click', async (e) => {
      const dot = e.target.closest('.stroop-dot');
      if (!dot || locked) return;
      locked = true;
      area.querySelectorAll('.stroop-dot').forEach((d) => (d.style.pointerEvents = 'none'));
      const res = await ctx.submit({ index: Number(dot.dataset.i) });
      dot.style.transform = 'scale(1.25)';
      dot.style.boxShadow = `0 0 24px ${res?.success ? 'var(--menthe)' : 'var(--corail)'}`;
      area.querySelectorAll('.stroop-dot').forEach((d) => d !== dot && (d.style.opacity = '0.3'));
      ctx.answered(res?.success);
    });

    return {};
  },
};
