import { SPEEDS } from '@quizz/shared';

// Trait Parfait : dessine un rond ou un carré d'un seul trait. Le serveur note
// le tracé (0-100 %) : régularité du rayon autour du centre (norme L2 pour le
// rond, L∞ pour le carré — un carré droit a un « rayon Chebyshev » constant),
// couverture angulaire (tour complet) et fermeture du trait.
// Scoring à la précision : 10 pts par % (max 1000).
const MAX_POINTS = 600;
const SECTORS = 24;

export function tracePct(shape, raw) {
  if (!Array.isArray(raw)) return 0;
  const pts = raw
    .slice(0, MAX_POINTS)
    .map((p) => [Number(p?.[0]), Number(p?.[1])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (pts.length < 8) return 0;

  const cx = pts.reduce((s, [x]) => s + x, 0) / pts.length;
  const cy = pts.reduce((s, [, y]) => s + y, 0) / pts.length;

  const radii = pts.map(([x, y]) =>
    shape === 'carre'
      ? Math.max(Math.abs(x - cx), Math.abs(y - cy))
      : Math.hypot(x - cx, y - cy),
  );
  const rMean = radii.reduce((s, r) => s + r, 0) / radii.length;
  if (rMean < 0.03) return 0; // tracé quasi ponctuel

  // Irrégularité : écart-type du rayon, relatif au rayon moyen.
  const dev = Math.sqrt(radii.reduce((s, r) => s + (r - rMean) ** 2, 0) / radii.length) / rMean;

  // Couverture : combien de secteurs angulaires autour du centre sont visités.
  const bins = new Set(
    pts.map(([x, y]) => Math.floor(((Math.atan2(y - cy, x - cx) + Math.PI) / (2 * Math.PI)) * SECTORS) % SECTORS),
  );
  const coverage = bins.size / SECTORS;

  // Fermeture : distance entre le début et la fin du trait, relative au diamètre.
  const [x0, y0] = pts[0];
  const [xn, yn] = pts[pts.length - 1];
  const gap = Math.hypot(x0 - xn, y0 - yn) / (rMean * 2);

  const score = 100 - dev * 220 - (1 - coverage) * 60 - Math.min(gap, 1) * 25;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default {
  id: 'dessine',

  create(settings) {
    const shape = Math.random() < 0.5 ? 'rond' : 'carre';
    return {
      title: { k: shape === 'rond' ? 'mg.dessine.rond' : 'mg.dessine.carre' },
      duration: Math.round(9000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { shape },
      state: { shape },
    };
  },

  validate(round, data) {
    const pct = tracePct(round.state.shape, data?.points);
    return { success: pct >= 50, detail: { pct }, clientDetail: { pct } };
  },

  score(entries) {
    for (const e of entries) e.gained = e.detail ? e.detail.pct * 10 : 0;
  },

  formatResult: (e) => (e.detail ? { k: 'res.precision', pct: e.detail.pct } : null),
};
