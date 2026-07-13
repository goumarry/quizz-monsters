import { SPEEDS } from '@quizz/shared';

// Feu Vert : l'écran est rouge, il passe au vert à un instant aléatoire —
// clique le plus vite possible. Cliquer avant le vert = faux départ = 0 point.
// Scoring au réflexe : 1000 pts jusqu'à 150 ms de réaction, 0 pt à 750 ms.
const PERFECT_MS = 150;
const RANGE_MS = 600;

export default {
  id: 'feu',

  create(settings) {
    const mult = SPEEDS[settings.speed]?.mult ?? 1;
    const goAt = Math.round((1200 + Math.random() * 2300) * mult);
    return {
      title: 'CLIQUE AU VERT !',
      duration: goAt + 1600,
      data: { goAt },
      state: { goAt },
    };
  },

  validate(round, data, elapsed) {
    const reaction = elapsed - round.state.goAt;
    return {
      success: reaction >= 0,
      detail: { reaction },
      clientDetail: { reaction },
    };
  },

  score(entries) {
    for (const e of entries) {
      if (!e.detail || e.detail.reaction < 0) {
        e.gained = 0;
      } else {
        const over = Math.max(0, e.detail.reaction - PERFECT_MS);
        e.gained = Math.max(0, Math.round(1000 * (1 - over / RANGE_MS)));
      }
    }
  },

  formatResult: (e) =>
    e.detail ? (e.detail.reaction < 0 ? 'Faux départ !' : `Réflexe : ${e.detail.reaction} ms`) : null,
};
