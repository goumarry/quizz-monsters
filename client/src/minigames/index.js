import intrus from './intrus.js';
import chrono from './chrono.js';
import spam from './spam.js';
import aires from './aires.js';
import verre from './verre.js';
import feu from './feu.js';
import stroop from './stroop.js';
import memo from './memo.js';
import dessine from './dessine.js';
import code from './code.js';
import equation from './equation.js';
import foule from './foule.js';

// Interface d'un mini-jeu côté client :
//   id — le même que côté serveur
//   mount(area, data, ctx) → { start()?, unmount()? }
// ctx : { submit(data) → Promise<{ok, success}>, startAt (local), duration }
// L'area est masquée par le splash de consigne jusqu'au GO ; start() est
// appelé au moment exact du départ synchronisé.
const REGISTRY = { intrus, chrono, spam, aires, verre, feu, stroop, memo, dessine, code, equation, foule };

export function getMinigame(id) {
  return REGISTRY[id];
}
