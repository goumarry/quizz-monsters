// Palette joueurs — voir docs/charte-graphique.md
export const PLAYER_COLORS = [
  '#ff2e88', // rose
  '#2effc7', // menthe
  '#ffd60a', // soleil
  '#ff8a3d', // mangue
  '#b967ff', // violet
  '#3ad1ff', // ciel
  '#7cff6b', // pomme
  '#ff5d5d', // corail
];

// Noms français des couleurs (jeux Stroop, Mémoire Flash…).
export const COLOR_NAMES = {
  '#ff2e88': 'ROSE',
  '#2effc7': 'VERT',
  '#ffd60a': 'JAUNE',
  '#ff8a3d': 'ORANGE',
  '#b967ff': 'VIOLET',
  '#3ad1ff': 'BLEU',
  '#7cff6b': 'POMME',
  '#ff5d5d': 'ROUGE',
};

// Personnalisation d'avatar : variante de visage + accessoire (rendu 100 % CSS
// côté client, voir client/src/ui/monster.js). Certains items sont payants
// (pièces gagnées en jouant) — prix côté client dans ui/catalog.js.
export const AVATAR_FACES = ['classique', 'joyeux', 'cyclope', 'grognon', 'vampire', 'etoiles'];
export const AVATAR_ACCESSORIES = ['aucun', 'cornes', 'antennes', 'chapeau', 'noeud', 'couronne', 'halo'];

export const MONSTER_NAMES = [
  'Glouglou', 'Pixel', 'Mochi', 'Turbo', 'Grrmlin', 'Zap', 'Bubulle', 'Nacho',
  'Krokro', 'Ziggy', 'Bloup', 'Patate', 'Fuzzy', 'Tornade', 'Miam', 'Choco',
];

export const ROOM = {
  CODE_LENGTH: 5,
  MAX_PLAYERS: 20,
  MIN_PLAYERS: 1,
  MAX_NAME_LENGTH: 14,
  ROUNDS_OPTIONS: [5, 10, 15],
};

// Multiplicateur appliqué à la durée de base de chaque mini-jeu.
export const SPEEDS = {
  detente: { label: 'Détente', mult: 1.4 },
  normal: { label: 'Normale', mult: 1 },
  eclair: { label: 'Éclair', mult: 0.7 },
};

export const DEFAULT_SETTINGS = { rounds: 10, speed: 'normal' };

export const TIMING = {
  COUNTDOWN_MS: 3000, // compte à rebours de début de partie
  PREPARE_MS: 3200, // roulette de tirage + consigne avant le GO
  RESULT_GRACE_MS: 350, // marge après la fin d'une manche pour les inputs en vol
  LEADERBOARD_MS: 5000, // affichage du classement entre deux manches
  EARLY_END_MS: 600, // délai avant fin anticipée quand tout le monde a répondu
};

export const SCORING = {
  BASE: 400, // points pour un objectif réussi
  SPEED_BONUS: 600, // bonus max, dégressif selon le rang de rapidité
};
