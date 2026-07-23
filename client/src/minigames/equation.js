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
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(6px,1.6vh,16px);">
        <div id="eq-display" class="title-display" style="font-size:clamp(22px,6.2vh,56px); font-weight:700; font-variant-numeric:tabular-nums; text-align:center;">
          ${parts.a} <span style="color:#3ad1ff;">${SYM[data.op]}</span> ${parts.b} <span style="color:var(--text-dim);">=</span> ${parts.c}
        </div>
        <div id="eq-answer" class="code-slot" style="width:clamp(48px,10.5vh,84px); height:clamp(32px,7vh,48px); font-size:clamp(15px,3vh,22px);">?</div>
        <!-- Même formule que le pavé du jeu Code Secret (min(vw, vh, px)) : une
             vraie hauteur MAX en plein écran, qui ne rétrécit que sur les
             petits viewports. Le coefficient vh est un peu plus bas que celui
             du Code Secret car l'équation a plus d'éléments autour du pavé
             (l'expression + la case réponse + le bouton OK). -->
        <div id="eq-pad" class="code-pad" style="width:min(70vw, 40vh, 280px);"></div>
        <button id="eq-ok" class="btn btn-menthe" style="padding:clamp(8px,1.8vh,14px) clamp(20px,5vw,28px); font-size:clamp(13px,2.6vh,15px);" disabled>OK</button>
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

    const send = async () => {
      if (locked || typed.length === 0) return;
      locked = true;
      pad.style.pointerEvents = 'none';
      okBtn.disabled = true;
      const res = await ctx.submit({ value: Number(typed) });
      answerEl.classList.add(res?.success ? 'correct' : 'wrong');
      ctx.answered(res?.success);
    };

    okBtn.addEventListener('click', send);

    return {
      // Le temps est écoulé sans clic sur "OK" : si le joueur a tapé une
      // réponse, on l'envoie quand même plutôt que de compter une non-réponse.
      timeout: send,
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
