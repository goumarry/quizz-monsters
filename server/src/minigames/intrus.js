import { SPEEDS } from '@quizz/shared';

// L'Intrus : une grille remplie du même symbole, un seul diffère. Premier clic
// seulement — se tromper = 0 point. La position de la cible reste côté serveur.
const PAIRS = [
  ['6', '7'],
  ['9', '6'],
  ['3', '8'],
  ['O', 'Q'],
  ['M', 'W'],
  ['b', 'd'],
];

const GRID_SIZE = 48; // 8 × 6

export default {
  id: 'intrus',

  create(settings) {
    const [common, odd] = PAIRS[Math.floor(Math.random() * PAIRS.length)];
    const target = Math.floor(Math.random() * GRID_SIZE);
    const cells = Array.from({ length: GRID_SIZE }, (_, i) => (i === target ? odd : common));
    return {
      title: { k: 'mg.intrus.title', odd },
      duration: Math.round(6000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { cells, columns: 8 },
      state: { target },
    };
  },

  validate(round, data) {
    return { success: Number(data?.index) === round.state.target };
  },

  reveal(round) {
    return { index: round.state.target };
  },
  revealMs: 1600,
};
