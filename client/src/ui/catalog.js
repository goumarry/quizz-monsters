// Catalogue de la boutique : prix en pièces de chaque variante d'avatar.
// Prix 0 = gratuit (toujours disponible). Purement cosmétique et côté client
// (le serveur accepte tout item des listes partagées).
import { PLAYER_COLORS, AVATAR_FACES, AVATAR_ACCESSORIES } from '@quizz/shared';
import { isOwned } from '../save.js';

// Progression pensée pour la rétention : premiers achats en 1-2 parties,
// pièces d'un « gros » item en plusieurs jours de jeu + bonus quotidiens.
const PRICES = {
  color: { 4: 150, 5: 150, 6: 250, 7: 250 }, // violet, ciel, pomme, corail — index dans PLAYER_COLORS
  face: { joyeux: 100, grognon: 200, cyclope: 350, vampire: 600, etoiles: 900 },
  accessory: { cornes: 150, antennes: 300, chapeau: 450, noeud: 450, couronne: 800, halo: 1200 },
};

export const itemId = (kind, value) => `${kind}:${value}`;

export function priceOf(kind, value) {
  return PRICES[kind]?.[value] ?? 0;
}

export function isUnlocked(kind, value) {
  return priceOf(kind, value) === 0 || isOwned(itemId(kind, value));
}

// Tout le contenu de la boutique, par section (dans l'ordre d'affichage).
export const CATALOG = [
  { kind: 'color', items: PLAYER_COLORS.map((_, i) => i) },
  { kind: 'face', items: [...AVATAR_FACES] },
  { kind: 'accessory', items: [...AVATAR_ACCESSORIES] },
];

// Petite pièce dorée en CSS (classe .coin dans main.css).
export const coinIcon = (size = 14) => `<span class="coin" style="width:${size}px; height:${size}px;"></span>`;
