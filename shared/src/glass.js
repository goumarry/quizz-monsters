// Formules du Verre d'Eau : verre trapézoïdal, largeur du haut wt %, du bas wb
// %. f = fraction de hauteur remplie (0..1) → % de SURFACE remplie, et son
// inverse. Partagées entre serveur (scoring) et client (rendu + variante
// « Remplis le verre », où le client doit convertir la position du trait en %).
export function glassLevelFromHeight(wb, wt, f) {
  const total = (wb + wt) / 2;
  const cumulative = wb * f + ((wt - wb) * f * f) / 2;
  return (cumulative / total) * 100;
}

export function glassHeightFromLevel(wb, wt, levelPct) {
  const A = (wt - wb) / 2;
  const B = wb;
  const C = -(levelPct / 100) * ((wb + wt) / 2);
  return A === 0 ? -C / B : (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
}
