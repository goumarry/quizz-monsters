import { SPEEDS } from '@quizz/shared';

// Trouve la Couleur : une couleur RGB cible est affichée, le joueur compose sa
// réponse dans un panneau teinte/saturation/luminosité. Scoring à la
// précision : distance euclidienne entre le RGB cible et le RGB soumis.
const MAX_DIST = 260; // 0 pt au-delà (max théorique ≈ 441)
const SUCCESS_DIST = 40;

const rand = () => 15 + Math.floor(Math.random() * 226); // 15..240, évite le noir/blanc pur

export default {
  id: 'couleur',

  create(settings) {
    const r = rand();
    const g = rand();
    const b = rand();
    return {
      title: { k: 'mg.couleur.title' },
      duration: Math.round(11000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { r, g, b },
      state: { r, g, b },
    };
  },

  validate(round, data) {
    const clamp = (v) => Math.min(255, Math.max(0, Math.round(Number(v)) || 0));
    const r = clamp(data?.r);
    const g = clamp(data?.g);
    const b = clamp(data?.b);
    const { r: tr, g: tg, b: tb } = round.state;
    const dist = Math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2);
    return {
      success: dist <= SUCCESS_DIST,
      detail: { r, g, b, dist: Math.round(dist) },
      clientDetail: { dist: Math.round(dist) },
    };
  },

  score(entries) {
    for (const e of entries) {
      e.gained = e.detail ? Math.max(0, Math.round(1000 * (1 - e.detail.dist / MAX_DIST))) : 0;
    }
  },

  formatResult: (e) => (e.detail ? { k: 'res.couleur', d: e.detail.dist } : null),
};
