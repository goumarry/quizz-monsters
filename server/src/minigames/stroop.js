import { SPEEDS, COLOR_NAMES } from '@quizz/shared';

// Effet Stroop : un nom de couleur s'affiche… écrit dans une autre couleur.
// Deux variantes (50/50) :
//  - mode 'ink'  → « La Couleur, Pas le Mot » : clique la couleur de L'ENCRE.
//  - mode 'word' → « Le Mot, Pas la Couleur » : clique la couleur que DIT le mot.
// Un seul essai.
const HEXES = Object.keys(COLOR_NAMES)
  .filter((h) => COLOR_NAMES[h] !== 'POMME' && COLOR_NAMES[h] !== 'ROUGE'); // 6 couleurs bien distinctes

export default {
  id: 'stroop',

  create(settings) {
    const shuffled = [...HEXES].sort(() => Math.random() - 0.5);
    const ink = shuffled[0]; // couleur de l'encre
    const wordHex = shuffled[1]; // couleur nommée par le mot
    const word = COLOR_NAMES[wordHex];
    const mode = Math.random() < 0.5 ? 'ink' : 'word';
    const options = [...HEXES].sort(() => Math.random() - 0.5);
    const answer = options.indexOf(mode === 'ink' ? ink : wordHex);
    return {
      title: mode === 'ink' ? 'LA COULEUR, PAS LE MOT !' : 'LE MOT, PAS LA COULEUR !',
      duration: Math.round(4500 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { word, ink, options, mode },
      state: { answer },
    };
  },

  validate(round, data) {
    return { success: Number(data?.index) === round.state.answer };
  },
};
