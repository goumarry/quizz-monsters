import { SPEEDS } from '@quizz/shared';

// Trouve X : une équation simple (+, −, ×, ÷) où l'un des trois nombres est
// remplacé par X, à une position aléatoire (opérande gauche, droite ou
// résultat). Un seul essai, réponse tapée sur un pavé numérique.
function generate() {
  const ops = ['+', '-', '×', '÷'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a;
  let b;
  let c; // a op b = c
  if (op === '+') {
    a = 1 + Math.floor(Math.random() * 40);
    b = 1 + Math.floor(Math.random() * 40);
    c = a + b;
  } else if (op === '-') {
    a = 10 + Math.floor(Math.random() * 70);
    b = 1 + Math.floor(Math.random() * a);
    c = a - b;
  } else if (op === '×') {
    a = 2 + Math.floor(Math.random() * 11);
    b = 2 + Math.floor(Math.random() * 11);
    c = a * b;
  } else {
    b = 2 + Math.floor(Math.random() * 11);
    c = 2 + Math.floor(Math.random() * 11);
    a = b * c;
  }
  const slot = ['a', 'b', 'c'][Math.floor(Math.random() * 3)];
  const answer = { a, b, c }[slot];
  return { a, b, c, op, slot, answer };
}

export default {
  id: 'equation',

  create(settings) {
    const eq = generate();
    return {
      title: { k: 'mg.equation.title' },
      duration: Math.round(8000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { a: eq.a, b: eq.b, c: eq.c, op: eq.op, slot: eq.slot },
      state: { answer: eq.answer },
    };
  },

  validate(round, data) {
    const value = Number(data?.value);
    return { success: value === round.state.answer, detail: { value } };
  },

  reveal(round) {
    return { answer: round.state.answer };
  },
  revealMs: 2000,

  formatResult: (e) => (e.detail && Number.isFinite(e.detail.value) ? { k: 'res.equation', v: e.detail.value } : null),
};
