import { SPEEDS, PLAYER_COLORS } from '@quizz/shared';

// La Foule : deux foules de petits monstres, à gauche et à droite (30 à 60
// chacune) — clique le côté qui en a le PLUS (ou le MOINS, un coup sur deux,
// annoncé dans la consigne). Compter précisément est trop long dans le temps
// imparti : il faut évaluer au jugé.
const MIN_COUNT = 30;
const MAX_COUNT = 60;
const MIN_GAP = 6; // écart mini entre les deux côtés pour une réponse non ambiguë

function randomCounts() {
  let left;
  let right;
  do {
    left = MIN_COUNT + Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1));
    right = MIN_COUNT + Math.floor(Math.random() * (MAX_COUNT - MIN_COUNT + 1));
  } while (Math.abs(left - right) < MIN_GAP);
  return { left, right };
}

// Chaque monstre reçoit une position aléatoire (% du panneau) — les
// chevauchements sont volontaires, ça complique le comptage. Positions
// générées ici pour que tous les joueurs voient exactement la même foule.
const randomCrowd = (count) => Array.from({ length: count }, () => ({
  c: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
  x: Math.round(3 + Math.random() * 87),
  y: Math.round(3 + Math.random() * 85),
}));

export default {
  id: 'foule',

  create(settings) {
    const { left, right } = randomCounts();
    const mode = Math.random() < 0.5 ? 'most' : 'least';
    const moreSide = left > right ? 'left' : 'right';
    const lessSide = moreSide === 'left' ? 'right' : 'left';
    const answer = mode === 'most' ? moreSide : lessSide;
    return {
      title: { k: mode === 'most' ? 'mg.foule.most' : 'mg.foule.least' },
      duration: Math.round(7000 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { left: randomCrowd(left), right: randomCrowd(right), mode },
      state: { answer },
    };
  },

  validate(round, data) {
    return { success: data?.side === round.state.answer };
  },

  reveal(round) {
    return { side: round.state.answer };
  },
  revealMs: 1800,
};
