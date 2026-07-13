import { SPEEDS } from '@quizz/shared';

// Le Verre d'Eau : devine le % de remplissage. Piège : le verre est souvent
// évasé (trapèze), donc la hauteur d'eau ne correspond pas au % réel — le %
// est celui de la SURFACE remplie. Le serveur choisit un % cible et calcule la
// hauteur d'eau correspondante ; seul lui connaît le vrai %.
// Scoring à la précision : 1000 pts pile dessus, 0 pt à 30 points d'écart.
const MAX_DIFF = 30;

export default {
  id: 'verre',

  create(settings) {
    const straight = Math.random() < 0.25;
    const wb = straight ? 60 : 28 + Math.random() * 20; // largeur du fond (%)
    const wt = straight ? wb : 72 + Math.random() * 28; // largeur du haut (%)
    const level = 15 + Math.floor(Math.random() * 76); // % de surface remplie (15-90)

    // Largeur à la hauteur f (fraction 0→1) : w(f) = wb + (wt−wb)·f
    // Surface cumulée : wb·f + (wt−wb)·f²/2 ; totale : (wb+wt)/2
    // On résout f pour que cumulée/totale = level/100.
    const A = (wt - wb) / 2;
    const B = wb;
    const C = -(level / 100) * ((wb + wt) / 2);
    const water = A === 0 ? -C / B : (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);

    return {
      title: "DEVINE LE % D'EAU !",
      duration: Math.round(8000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { wb: Math.round(wb), wt: Math.round(wt), water: Math.round(water * 1000) / 1000 },
      state: { level },
    };
  },

  validate(round, data) {
    const guess = Math.min(Math.max(Math.round(Number(data?.pct) || 0), 0), 100);
    const diff = Math.abs(guess - round.state.level);
    return {
      success: diff <= 15,
      detail: { guess, diff },
      clientDetail: { level: round.state.level, diff },
    };
  },

  score(entries) {
    for (const e of entries) {
      e.gained = e.detail ? Math.max(0, Math.round(1000 * (1 - e.detail.diff / MAX_DIFF))) : 0;
    }
  },

  // La vraie valeur reste affichée pour tout le monde avant le classement.
  reveal(round) {
    return { level: round.state.level };
  },
  revealMs: 3200,

  formatResult: (e) => (e.detail ? `Estimé ${e.detail.guess} % (à ${e.detail.diff})` : null),
};
