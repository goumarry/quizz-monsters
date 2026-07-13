import { SPEEDS, SCORING } from '@quizz/shared';

// Spam Click : cliquer le plus possible avant la fin. Le client envoie son
// compteur régulièrement (multi : la dernière valeur écrase la précédente).
// Scoring au rang : le plus gros compteur gagne le plus.
const MAX_CLICKS_PER_SEC = 25; // borne anti-autoclicker

export default {
  id: 'spam',
  multi: true,

  create(settings) {
    return {
      title: 'CLIQUE COMME UN FOU !',
      duration: Math.round(5000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: {},
      state: {},
    };
  },

  validate(round, data) {
    const cap = Math.ceil((round.duration / 1000) * MAX_CLICKS_PER_SEC);
    const count = Math.min(Math.max(Math.floor(Number(data?.count) || 0), 0), cap);
    return { success: count > 0, detail: { count } };
  },

  score(entries) {
    const ranked = entries
      .filter((e) => (e.detail?.count ?? 0) > 0)
      .sort((a, b) => b.detail.count - a.detail.count || a.elapsed - b.elapsed);
    entries.forEach((e) => (e.gained = 0));
    ranked.forEach((e, i) => {
      e.gained = SCORING.BASE + Math.round((SCORING.SPEED_BONUS * (ranked.length - i)) / ranked.length);
    });
  },

  formatResult: (e) => (e.detail ? `${e.detail.count} clic${e.detail.count > 1 ? 's' : ''}` : null),
};
