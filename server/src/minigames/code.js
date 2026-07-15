import { SPEEDS } from '@quizz/shared';

// Le Code Secret : une suite de 4 chiffres s'affiche un par un, il faut la
// retaper dans l'ordre sur un pavé numérique. Un seul essai.
const LENGTH = 4;
const DIGIT_MS = 400; // temps d'affichage de chaque chiffre
const GAP_MS = 150; // écran vide entre deux chiffres
const INPUT_MS = 6000; // temps laissé pour retaper le code

export default {
  id: 'code',

  create(settings) {
    const mult = SPEEDS[settings.speed]?.mult ?? 1;
    const digitMs = Math.round(DIGIT_MS * mult);
    const gapMs = Math.round(GAP_MS * mult);
    const sequence = Array.from({ length: LENGTH }, () => Math.floor(Math.random() * 10));
    const showMs = LENGTH * (digitMs + gapMs);
    return {
      title: { k: 'mg.code.title' },
      duration: showMs + Math.round(INPUT_MS * mult),
      data: { sequence, digitMs, gapMs },
      state: { sequence },
    };
  },

  validate(round, data) {
    const guess = Array.isArray(data?.digits) ? data.digits.map(Number) : [];
    const success = guess.length === LENGTH && guess.every((d, i) => d === round.state.sequence[i]);
    return { success, detail: { guess } };
  },

  reveal(round) {
    return { sequence: round.state.sequence };
  },
  revealMs: 2200,

  formatResult: (e) => (e.detail?.guess?.length ? { k: 'res.code', d: e.detail.guess.join('') } : null),
};
