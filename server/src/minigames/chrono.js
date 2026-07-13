import { SPEEDS } from '@quizz/shared';

// Le Chrono Fou : stoppe le chrono le plus près possible de la cible. L'affichage
// se masque à 55 % du parcours (côté client) — il faut finir à l'instinct.
// Scoring à la précision : 1000 pts pile sur la cible, 0 pt à 800 ms d'écart.
const MAX_DIFF = 800;

export default {
  id: 'chrono',

  create(settings) {
    const mult = SPEEDS[settings.speed]?.mult ?? 1;
    const target = Math.round((2500 + Math.random() * 2500) * mult);
    return {
      title: `STOPPE À ${(target / 1000).toFixed(2)}s !`,
      duration: target + 2500,
      data: { target },
      state: { target },
    };
  },

  validate(round, data, elapsed) {
    const diff = Math.abs(elapsed - round.state.target);
    return {
      success: diff <= MAX_DIFF,
      detail: { diff },
      clientDetail: { diff },
    };
  },

  score(entries) {
    for (const e of entries) {
      e.gained = e.detail ? Math.max(0, Math.round(1000 * (1 - e.detail.diff / MAX_DIFF))) : 0;
    }
  },

  formatResult: (e) => (e.detail ? `À ${e.detail.diff} ms de la cible` : null),
};
