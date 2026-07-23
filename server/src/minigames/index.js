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
import angle from './angle.js';
import diff from './diff.js';
import couleur from './couleur.js';
import { ENABLED_GAMES } from '../dev.games.js';

// Interface d'un mini-jeu côté serveur :
//   id            — identifiant, doit correspondre au module client du même nom
//   multi         — true si le joueur peut mettre à jour sa réponse en continu
//   create(settings, room) → { title, duration, data (public), state (secret serveur) }
//   validate(round, data, elapsed) → { success, detail?, clientDetail? }
//   score(entries, round)? — optionnel, sinon scoring par défaut (base + bonus rapidité)
const REGISTRY = [
  intrus, chrono, spam, aires, verre, feu, stroop, memo, dessine, code, equation, foule, angle, diff, couleur,
];

export function pickMinigame(lastId) {
  // QM_FORCE_GAME=<id> force un mini-jeu (pratique pour tester en dev).
  const forced = REGISTRY.find((m) => m.id === process.env.QM_FORCE_GAME);
  if (forced) return forced;
  // dev.games.js : liste des jeux actifs pendant les tests (voir ce fichier).
  const active = REGISTRY.filter((m) => ENABLED_GAMES.includes(m.id));
  const source = active.length ? active : REGISTRY;
  const pool = source.length > 1 ? source.filter((m) => m.id !== lastId) : source;
  return pool[Math.floor(Math.random() * pool.length)];
}
