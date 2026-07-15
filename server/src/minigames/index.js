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

// Interface d'un mini-jeu côté serveur :
//   id            — identifiant, doit correspondre au module client du même nom
//   multi         — true si le joueur peut mettre à jour sa réponse en continu
//   create(settings) → { title, duration, data (public), state (secret serveur) }
//   validate(round, data, elapsed) → { success, detail?, clientDetail? }
//   score(entries, round)? — optionnel, sinon scoring par défaut (base + bonus rapidité)
const REGISTRY = [intrus, chrono, spam, aires, verre, feu, stroop, memo, dessine, code, equation, foule];

export function pickMinigame(lastId) {
  // QM_FORCE_GAME=<id> force un mini-jeu (pratique pour tester en dev).
  const forced = REGISTRY.find((m) => m.id === process.env.QM_FORCE_GAME);
  if (forced) return forced;
  const pool = REGISTRY.length > 1 ? REGISTRY.filter((m) => m.id !== lastId) : REGISTRY;
  return pool[Math.floor(Math.random() * pool.length)];
}
