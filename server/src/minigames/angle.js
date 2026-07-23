import { SPEEDS } from '@quizz/shared';

// L'Angle : deux variantes (50/50).
//  - 'set'   : un nombre de degrés est annoncé, le joueur doit CONSTRUIRE
//    l'angle en faisant pivoter une droite (points selon la proximité).
//  - 'guess' : l'angle est déjà tracé à l'écran, le joueur doit DEVINER le
//    nombre de degrés.
// Dans les deux cas le joueur soumet un nombre de degrés (deg) qu'on compare à
// la cible réelle. Scoring à la précision : 1000 pts pile dessus, 0 pt à 30° d'écart.
const MAX_DIFF = 30;

export default {
  id: 'angle',

  create(settings) {
    const mode = Math.random() < 0.5 ? 'set' : 'guess';
    const target = 15 + Math.floor(Math.random() * 151); // 15-165°, jamais plat ni nul

    return {
      // En mode 'guess', l'angle cible ne doit apparaître nulle part dans le
      // titre (seule sa valeur graphique, nécessaire au rendu, est publique).
      title: mode === 'set' ? { k: 'mg.angle.set', n: target } : { k: 'mg.angle.guess' },
      duration: Math.round(9000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: mode === 'set' ? { mode, target } : { mode, shownDeg: target },
      state: { target },
    };
  },

  validate(round, data) {
    const guess = Math.min(Math.max(Math.round(Number(data?.deg) || 0), 0), 180);
    const diff = Math.abs(guess - round.state.target);
    return { success: diff <= 15, detail: { guess, diff }, clientDetail: { target: round.state.target, diff } };
  },

  score(entries) {
    for (const e of entries) {
      e.gained = e.detail ? Math.max(0, Math.round(1000 * (1 - e.detail.diff / MAX_DIFF))) : 0;
    }
  },

  reveal(round) {
    return { target: round.state.target };
  },
  revealMs: 3000,

  formatResult: (e) => (e.detail ? { k: 'res.angle', g: e.detail.guess, d: e.detail.diff } : null),
};
