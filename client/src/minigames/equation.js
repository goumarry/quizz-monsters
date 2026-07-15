const SYM = { '+': '+', '-': '−', '×': '×', '÷': '÷' };
const PAD_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'];

// Trouve X : équation à trou, réponse tapée sur un pavé numérique + bouton OK
// (contrairement au Code Secret, la longueur de la réponse n'est pas connue
// à l'avance, donc pas de soumission automatique).
export default {
  id: 'equation',

  mount(area, data, ctx) {
    const parts = { a: data.a, b: data.b, c: data.c };
    parts[data.slot] = '<span style="color:var(--rose); text-shadow:0 0 20px rgba(255,46,136,0.5);">X</span>';

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:26px;">
        <div id="eq-display" class="title-display" style="font-size:clamp(32px,6.2vh,56px); font-weight:700; font-variant-numeric:tabular-nums;">
          ${parts.a} <span style="color:#3ad1ff;">${SYM[data.op]}</span> ${parts.b} <span style="color:var(--text-dim);">=</span> ${parts.c}
        </div>
        <div id="eq-answer" class="code-slot" style="width:84px; height:48px; font-size:22px;">?</div>
        <div id="eq-pad" class="code-pad"></div>
        <button id="eq-ok" class="btn btn-menthe" disabled>OK</button>
      </div>`;

    const answerEl = area.querySelector('#eq-answer');
    const pad = area.querySelector('#eq-pad');
    const okBtn = area.querySelector('#eq-ok');
    pad.innerHTML = PAD_KEYS.map((k) => (k === null ? '<span></span>' : `<button class="code-key" data-k="${k}">${k}</button>`)).join('');

    let typed = '';
    let locked = false;

    const update = () => {
      answerEl.textContent = typed || '?';
      okBtn.disabled = typed.length === 0;
    };

    pad.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-key');
      if (!btn || locked) return;
      const k = btn.dataset.k;
      if (k === '⌫') typed = typed.slice(0, -1);
      else if (typed.length < 6) typed += k;
      update();
    });

    okBtn.addEventListener('click', async () => {
      if (locked || typed.length === 0) return;
      locked = true;
      pad.style.pointerEvents = 'none';
      okBtn.disabled = true;
      const res = await ctx.submit({ value: Number(typed) });
      answerEl.classList.add(res?.success ? 'correct' : 'wrong');
      ctx.answered(res?.success);
    });

    return {
      // Fin de manche : la vraie valeur de X remplace la réponse tapée.
      reveal({ answer }) {
        locked = true;
        pad.style.pointerEvents = 'none';
        okBtn.disabled = true;
        const wasCorrect = typed !== '' && Number(typed) === answer;
        answerEl.textContent = answer;
        answerEl.classList.remove('correct', 'wrong');
        answerEl.classList.add(wasCorrect ? 'correct' : 'wrong');
      },
    };
  },
};
