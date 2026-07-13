import { SPEEDS, PLAYER_COLORS, COLOR_NAMES } from '@quizz/shared';

// Mémoire Flash : une grille de monstres colorés s'affiche brièvement, puis
// tout devient gris — où était le monstre de la couleur demandée ? La couleur
// cible n'est révélée qu'au moment où la grille se masque : il faut TOUT retenir.
const GRID = 16; // 4 × 4

export default {
  id: 'memo',

  create(settings) {
    const mult = SPEEDS[settings.speed]?.mult ?? 1;
    const target = Math.floor(Math.random() * GRID);
    const targetColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
    const others = PLAYER_COLORS.filter((c) => c !== targetColor);
    const cells = Array.from({ length: GRID }, (_, i) =>
      i === target ? targetColor : others[Math.floor(Math.random() * others.length)],
    );
    const showMs = Math.round(1600 * mult);
    return {
      title: 'MÉMOIRE FLASH !',
      duration: showMs + Math.round(3500 * mult),
      data: { cells, showMs, targetColor, targetName: COLOR_NAMES[targetColor] },
      state: { target },
    };
  },

  validate(round, data) {
    return { success: Number(data?.index) === round.state.target };
  },

  reveal(round) {
    return { index: round.state.target };
  },
  revealMs: 2200,
};
