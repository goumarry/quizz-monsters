import { SPEEDS, glassHeightFromLevel, glassLevelFromHeight } from '@quizz/shared';

// Le Verre d'Eau : deux variantes (50/50), piège commun : le verre est souvent
// évasé (trapèze), donc la hauteur d'eau ne correspond pas au % réel — le %
// est celui de la SURFACE remplie.
//  - 'guess' : le verre est déjà rempli à un % choisi par le serveur (lui seul
//    le connaît), le joueur estime ce % avec un curseur.
//  - 'fill'  : le % cible est ANNONCÉ, le verre est vide, le joueur doit
//    monter le trait d'eau jusqu'à ce % exact.
// Scoring à la précision : 1000 pts pile dessus, 0 pt à 30 points d'écart.
const MAX_DIFF = 30;

export default {
  id: 'verre',

  create(settings) {
    const straight = Math.random() < 0.25;
    const wb = straight ? 60 : 28 + Math.random() * 20; // largeur du fond (%)
    const wt = straight ? wb : 72 + Math.random() * 28; // largeur du haut (%)
    const level = 15 + Math.floor(Math.random() * 76); // % de surface cible (15-90)
    const mode = Math.random() < 0.5 ? 'guess' : 'fill';

    const data = { wb: Math.round(wb), wt: Math.round(wt), mode };
    if (mode === 'guess') {
      const water = glassHeightFromLevel(wb, wt, level);
      data.water = Math.round(water * 1000) / 1000;
    } else {
      data.target = level; // annoncé au joueur : rien à cacher côté données
    }

    return {
      title: mode === 'guess' ? { k: 'mg.verre.title' } : { k: 'mg.verre.fillTitle', n: level },
      duration: Math.round(8500 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data,
      state: { level },
    };
  },

  validate(round, data) {
    const level = round.state.level;
    if (round.data.mode === 'fill') {
      const frac = Math.min(Math.max(Number(data?.frac) || 0, 0), 1);
      const guess = Math.round(glassLevelFromHeight(round.data.wb, round.data.wt, frac));
      const diff = Math.abs(guess - level);
      return { success: diff <= 15, detail: { guess, diff }, clientDetail: { level, diff } };
    }
    const guess = Math.min(Math.max(Math.round(Number(data?.pct) || 0), 0), 100);
    const diff = Math.abs(guess - level);
    return { success: diff <= 15, detail: { guess, diff }, clientDetail: { level, diff } };
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

  formatResult: (e) => (e.detail ? { k: 'res.verre', g: e.detail.guess, d: e.detail.diff } : null),
};
