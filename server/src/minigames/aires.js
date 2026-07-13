import { SPEEDS, PLAYER_COLORS, SHAPES, shapeArea } from '@quizz/shared';

// La Plus Grande : uniquement des formes classiques (rond, triangle, rectangle,
// carré) mais en grand nombre — il faut cliquer celle qui a la plus grande AIRE.
// La difficulté vient de la quantité et des tailles très proches. Le plateau
// client est carré, toutes les dimensions sont en % du côté.
const CLASSIC_TYPES = ['circle', 'ellipse', 'square', 'rect', 'tri', 'triRight'];
const SHAPE_COUNT = 15;

function randomShape(type) {
  const def = SHAPES[type];
  const r = (min, max) => min + Math.random() * (max - min);
  let w;
  let h;
  if (def.square) {
    w = h = r(8, 16);
  } else {
    w = r(9, 20);
    h = r(7, 16);
  }
  return { type, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 };
}

function generate() {
  // Positions sur une grille 4×4 (jitter léger) pour éviter les chevauchements.
  const cells = [];
  for (const cy of [13, 38, 62, 87]) for (const cx of [13, 38, 62, 87]) cells.push([cx, cy]);
  cells.sort(() => Math.random() - 0.5);

  const shapes = cells.slice(0, SHAPE_COUNT).map(([cx, cy]) => {
    const type = CLASSIC_TYPES[Math.floor(Math.random() * CLASSIC_TYPES.length)];
    const shape = randomShape(type);
    shape.x = Math.round(cx + (Math.random() * 6 - 3));
    shape.y = Math.round(cy + (Math.random() * 6 - 3));
    // Petite rotation pour la variété (l'aire ne change pas).
    const kind = SHAPES[type].kind;
    shape.rot = kind === 'poly' || kind === 'box' ? [0, -15, 15, 30, -30][Math.floor(Math.random() * 5)] : 0;
    return shape;
  });

  const areas = shapes.map(shapeArea);
  const best = areas.indexOf(Math.max(...areas));
  const second = Math.max(...areas.filter((_, i) => i !== best));
  return { shapes, best, ratio: areas[best] / second };
}

export default {
  id: 'aires',

  create(settings) {
    // On veut un vainqueur net mais pas évident : 8 à 30 % plus grand que le 2e.
    let gen = generate();
    for (let tries = 0; tries < 120 && !(gen.ratio >= 1.08 && gen.ratio <= 1.3); tries++) gen = generate();

    const colors = [...PLAYER_COLORS].sort(() => Math.random() - 0.5);
    gen.shapes.forEach((s, i) => (s.color = colors[i % colors.length]));

    return {
      title: 'CLIQUE LA PLUS GRANDE !',
      duration: Math.round(7000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { shapes: gen.shapes },
      state: { best: gen.best },
    };
  },

  validate(round, data) {
    return { success: Number(data?.index) === round.state.best };
  },

  reveal(round) {
    return { index: round.state.best };
  },
  revealMs: 2000,
};
