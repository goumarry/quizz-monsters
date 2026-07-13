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
    const wordHex = shuffled[1]; // couleur nommée par le mot (le client localise le nom)
    const mode = Math.random() < 0.5 ? 'ink' : 'word';
    const options = [...HEXES].sort(() => Math.random() - 0.5);
    const answer = options.indexOf(mode === 'ink' ? ink : wordHex);
    return {
      title: { k: mode === 'ink' ? 'mg.stroop.ink' : 'mg.stroop.word' },
      duration: Math.round(4500 * (SPEEDS[settings.speed]?.mult ?? 1)),
      data: { wordHex, ink, options, mode },
      state: { answer },
    };
  },

  validate(round, data) {
    return { success: Number(data?.index) === round.state.answer };
  },
};
