// Bibliothèque de formes pour le mini-jeu « La Plus Grande ». Partagée entre le
// serveur (calcul des aires) et le client (rendu clip-path) pour rester cohérents.
// Les polygones sont définis en fractions de la boîte englobante [0..1].

const POLYGONS = {
  tri: [[0.5, 0], [1, 1], [0, 1]],
  triRight: [[0, 0], [1, 1], [0, 1]],
  diamond: [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]],
  pentagon: [[0.5, 0], [1, 0.38], [0.82, 1], [0.18, 1], [0, 0.38]],
  hexagon: [[0.25, 0], [0.75, 0], [1, 0.5], [0.75, 1], [0.25, 1], [0, 0.5]],
  star: [
    [0.5, 0], [0.618, 0.363], [1, 0.382], [0.691, 0.606], [0.809, 0.968],
    [0.5, 0.75], [0.191, 0.968], [0.309, 0.606], [0, 0.382], [0.382, 0.363],
  ],
  cross: [
    [0.34, 0], [0.66, 0], [0.66, 0.34], [1, 0.34], [1, 0.66], [0.66, 0.66],
    [0.66, 1], [0.34, 1], [0.34, 0.66], [0, 0.66], [0, 0.34], [0.34, 0.34],
  ],
  arrow: [[0, 0.25], [0.6, 0.25], [0.6, 0], [1, 0.5], [0.6, 1], [0.6, 0.75], [0, 0.75]],
  parallelogram: [[0.25, 0], [1, 0], [0.75, 1], [0, 1]],
  trapeze: [[0.2, 0], [0.8, 0], [1, 1], [0, 1]],
};

// Aire d'un polygone unitaire (formule du lacet) → facteur à multiplier par w·h.
function shoelace(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

// Chaque type : ratio d'aspect imposé éventuel + fonction d'aire (unités : w,h).
export const SHAPES = {
  circle: { kind: 'round', square: true, area: (w) => (Math.PI * w * w) / 4 },
  ellipse: { kind: 'round', area: (w, h) => (Math.PI * w * h) / 4 },
  semi: { kind: 'semi', area: (w) => (Math.PI * w * w) / 8 }, // h = w/2
  square: { kind: 'box', square: true, area: (w) => w * w },
  rect: { kind: 'box', area: (w, h) => w * h },
  ...Object.fromEntries(
    Object.entries(POLYGONS).map(([name, points]) => {
      const factor = shoelace(points);
      return [name, {
        kind: 'poly',
        clip: `polygon(${points.map(([x, y]) => `${x * 100}% ${y * 100}%`).join(', ')})`,
        area: (w, h) => factor * w * h,
      }];
    }),
  ),
};

export const SHAPE_TYPES = Object.keys(SHAPES);

export function shapeArea(shape) {
  return SHAPES[shape.type].area(shape.w, shape.h);
}
