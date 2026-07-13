import './styles/main.css';
import { S2C } from '@quizz/shared';
import { socket, syncClock } from './net.js';
import { store, setMyId } from './state.js';
import { sdk } from './sdk.js';
import { sound } from './ui/sound.js';
import { toast } from './ui/dom.js';
import { homeScreen } from './screens/home.js';
import { lobbyScreen } from './screens/lobby.js';
import { countdownScreen } from './screens/countdown.js';
import { roundScreen } from './screens/round.js';
import { leaderboardScreen } from './screens/leaderboard.js';
import { victoryScreen } from './screens/victory.js';
import { adScreen } from './screens/ad.js';

const SCREENS = {
  home: homeScreen,
  lobby: lobbyScreen,
  countdown: countdownScreen,
  round: roundScreen,
  leaderboard: leaderboardScreen,
  victory: victoryScreen,
  ad: adScreen,
};

// Sons d'interaction : un « clic » sur tout élément cliquable du jeu.
sound.attach();
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn, .pill, .stroop-dot, .memo-cell, .aires-shape')) sound.play('click');
});

const root = document.getElementById('app');
let current = null;
let currentName = null;

export function show(name, props) {
  current?.unmount?.();
  root.innerHTML = '';
  currentName = name;
  current = SCREENS[name](root, props) ?? {};
}

socket.on('connect', async () => {
  setMyId(socket.id);
  await syncClock();
});

// Re-synchronise l'horloge régulièrement : l'heure du serveur peut être
// ajustée (NTP) en cours de session, l'offset doit suivre.
setInterval(() => {
  if (socket.connected) syncClock(3);
}, 10000);

socket.on('disconnect', () => {
  if (currentName !== 'home') {
    show('home');
    toast('Connexion perdue… Reviens vite !');
  }
});

socket.on(S2C.STATE, (state) => {
  store.room = state;
  // Le lobby se re-rend à chaque mise à jour (arrivées, départs, réglages).
  if (state.state === 'lobby' && (currentName === 'lobby' || currentName === 'home' || currentName === 'victory')) {
    show('lobby');
  } else if (currentName === 'lobby') {
    show('lobby');
  }
});

socket.on(S2C.COUNTDOWN, (payload) => {
  sdk.gameplayStart();
  show('countdown', payload);
});

socket.on(S2C.PREPARE, (payload) => show('round', payload));

// Révélation de la bonne réponse en fin de manche (délégué à l'écran de jeu).
socket.on(S2C.REVEAL, (payload) => current?.reveal?.(payload.data));

socket.on(S2C.RESULT, (payload) => {
  store.leaderboard = payload.leaderboard;
  sound.play('reveal');
  show('leaderboard', payload);
});

// Fin de partie : pub interstitielle AVANT le classement final (podium).
socket.on(S2C.OVER, async (payload) => {
  sdk.gameplayStop();
  if (sdk.hasAds) {
    show('ad');
    await sdk.requestMidgameAd();
  }
  sdk.happytime();
  sound.play('win');
  show('victory', payload);
});

sdk.init().finally(() => {
  // Lien d'invitation CrazyGames → pré-remplit le code du salon.
  if (!store.inviteCode) store.inviteCode = String(sdk.inviteCode() ?? '').toUpperCase();
  show('home');
});
