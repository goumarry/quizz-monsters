// Mode dev : commente (ou retire) l'id d'un mini-jeu ci-dessous pour l'exclure
// du tirage aléatoire pendant les tests. Redémarre le serveur pour appliquer.
// Liste complète (rien de commenté) = comportement normal, tous les jeux
// participent au tirage ; une liste vide est aussi traitée comme "tout activer"
// pour éviter un plantage si tu oublies de tout recommenter.
//
// Astuce : pour forcer UN SEUL jeu précis (au lieu d'exclure les autres),
// utilise plutôt la variable d'environnement QM_FORCE_GAME=<id>.
export const ENABLED_GAMES = [
  'intrus',
  'chrono',
  'spam',
  'aires',
  'verre',
  'feu',
  'stroop',
  'memo',
  'dessine',
  'code',
  'equation',
  'foule',
  'angle',
  'diff',
  'couleur',
];
