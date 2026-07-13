import './styles/main.css';
import { S2C, C2S, ROOM } from '@quizz/shared';
import { socket, syncClock, emitAck } from './net.js';
import { store, setMyId } from './state.js';
import { sdk } from './sdk.js';
import { sound } from './ui/sound.js';
import { t, tr, autodetect } from './ui/i18n.js';
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
  await sdkReady;
  autoMultiplayer();
});

// Re-synchronise l'horloge régulièrement : l'heure du serveur peut être
// ajustée (NTP) en cours de session, l'offset doit suivre.
setInterval(() => {
  if (socket.connected) syncClock(3);
}, 10000);

socket.on('disconnect', () => {
  sdk.leftRoom();
  if (currentName !== 'home') {
    show('home');
    toast(t('net.lost'));
  }
});

socket.on(S2C.STATE, (state) => {
  store.room = state;
  // La plateforme CrazyGames suit le salon courant (bouton "inviter des amis").
  sdk.updateRoom(state.code, state.state === 'lobby' && state.players.length < ROOM.MAX_PLAYERS);
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

const profile = () => ({ name: store.name, color: store.color, face: store.face, accessory: store.accessory });

// Flux CrazyGames au lancement : lien d'invitation → rejoint directement le
// salon de l'ami ; « instant multiplayer » → crée directement un salon joignable.
let autoDone = false;
async function autoMultiplayer() {
  if (autoDone || !socket.connected || store.room) return;
  autoDone = true;
  if (store.inviteCode) {
    const code = store.inviteCode;
    store.inviteCode = '';
    const res = await emitAck(C2S.JOIN, { code, ...profile() });
    if (!res?.ok) toast(res?.error ? tr(res.error) : t('err.join'));
  } else if (sdk.isInstantMultiplayer) {
    await emitAck(C2S.CREATE, profile());
  }
}

const sdkReady = sdk.init().finally(() => {
  // La locale CrazyGames n'est connue qu'après l'init du SDK.
  autodetect();
  // Lien d'invitation CrazyGames → code du salon de l'ami.
  if (!store.inviteCode) store.inviteCode = String(sdk.inviteCode() ?? '').toUpperCase();
  show('home');
  autoMultiplayer();
  // Invitation acceptée alors qu'on est déjà en jeu : on change de salon.
  sdk.onJoinRoom(async (code) => {
    if (!code) return;
    socket.emit(C2S.LEAVE);
    const res = await emitAck(C2S.JOIN, { code: String(code).toUpperCase(), ...profile() });
    if (res?.ok) show('lobby');
    else toast(res?.error ? tr(res.error) : t('err.join'));
  });
});
