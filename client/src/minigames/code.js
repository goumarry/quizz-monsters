import { clock } from '../net.js';
import { t } from '../ui/i18n.js';
import { sound } from '../ui/sound.js';

const PAD_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'];

// Le Code Secret : les chiffres s'affichent un par un, puis un pavé numérique
// apparaît pour les retaper dans l'ordre. Un seul essai.
export default {
  id: 'code',

  mount(area, data, ctx) {
    const { sequence, digitMs, gapMs } = data;
    const showMs = sequence.length * (digitMs + gapMs);

    area.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(10px,3vh,24px);">
        <div id="code-question" class="title-display" style="font-size:clamp(14px,2.6vh,22px); font-weight:700; color:var(--text-muted); min-height:1.2em; text-align:center;">${t('mg.code.memorize')}</div>
        <div id="code-digit" class="title-display" style="font-size:clamp(64px,18vh,150px); font-weight:700; font-variant-numeric:tabular-nums; min-height:1.1em; color:#3ad1ff; text-shadow:0 0 50px rgba(58,209,255,0.45);"></div>
        <div id="code-slots" style="display:flex; gap:clamp(6px,1.6vw,12px); flex-wrap:wrap; justify-content:center;"></div>
        <div id="code-pad" class="code-pad" style="display:none;"></div>
      </div>`;

    const question = area.querySelector('#code-question');
    const digitEl = area.querySelector('#code-digit');
    const slots = area.querySelector('#code-slots');
    const pad = area.querySelector('#code-pad');

    slots.innerHTML = sequence.map(() => `<div class="code-slot"></div>`).join('');

    const guess = [];
    let locked = false;
    let revealed = false;
    const timers = [];

    const updateSlots = () => {
      [...slots.children].forEach((el, i) => {
        el.textContent = guess[i] ?? '';
        el.classList.toggle('filled', i < guess.length);
      });
    };

    const showDigit = (i) => {
      digitEl.textContent = String(sequence[i]);
      sound.play('tick');
      timers.push(setTimeout(() => { digitEl.textContent = ''; }, digitMs));
    };

    const revealPad = () => {
      if (revealed) return;
      revealed = true;
      question.textContent = t('mg.code.type');
      digitEl.textContent = '';
      digitEl.style.display = 'none'; // sinon son min-height laisse un grand vide au-dessus du pavé
      pad.style.display = 'grid';
      pad.innerHTML = PAD_KEYS.map((k) => {
        if (k === null) return '<span></span>';
        return `<button class="code-key" data-k="${k}">${k}</button>`;
      }).join('');
    };

    sequence.forEach((_, i) => {
      timers.push(setTimeout(() => showDigit(i), ctx.startAt + i * (digitMs + gapMs) - clock()));
    });
    timers.push(setTimeout(revealPad, ctx.startAt + showMs - clock()));

    pad.addEventListener('click', async (e) => {
      const btn = e.target.closest('.code-key');
      if (!btn || locked || !revealed) return;
      const k = btn.dataset.k;
      if (k === '⌫') {
        guess.pop();
        updateSlots();
        return;
      }
      if (guess.length >= sequence.length) return;
      sound.play('click');
      guess.push(Number(k));
      updateSlots();
      if (guess.length === sequence.length) {
        locked = true;
        pad.style.pointerEvents = 'none';
        const res = await ctx.submit({ digits: guess });
        slots.querySelectorAll('.code-slot').forEach((el) => {
          el.classList.add(res?.success ? 'correct' : 'wrong');
        });
        ctx.answered(res?.success);
      }
    });

    return {
      // Fin de manche : le vrai code s'affiche à la place des chiffres tapés.
      reveal({ sequence: real }) {
        locked = true;
        revealed = true;
        pad.style.pointerEvents = 'none';
        question.textContent = t('mg.code.truth');
        digitEl.textContent = '';
        digitEl.style.display = 'none';
        [...slots.children].forEach((el, i) => {
          el.textContent = real[i];
          el.classList.remove('correct', 'wrong');
          el.classList.add('filled', guess[i] === real[i] ? 'correct' : 'wrong');
        });
      },
      unmount: () => timers.forEach(clearTimeout),
    };
  },
};
