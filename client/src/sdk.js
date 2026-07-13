import { sound } from './ui/sound.js';

// Wrapper du SDK CrazyGames v3 (https://docs.crazygames.com/sdk/intro/).
// Le script est chargé dans index.html ; en dev local ou hors CrazyGames,
// chaque appel retombe proprement sur un no-op — le jeu reste jouable partout.
const SDK = () => window.CrazyGames?.SDK;
let available = false;
// Mute demandé par la plateforme CrazyGames (bouton son de leur UI) : il est
// prioritaire sur tout, et doit être ré-appliqué après une pub.
let platformMuted = false;

export const sdk = {
  async init() {
    try {
      if (!SDK()) return;
      await SDK().init();
      available = SDK().environment !== 'disabled';
      if (available) {
        platformMuted = !!SDK().game.settings?.muteAudio;
        sound.muteAll(platformMuted);
        SDK().game.addSettingsChangeListener((settings) => {
          platformMuted = !!settings?.muteAudio;
          sound.muteAll(platformMuted);
        });
      }
    } catch {
      available = false;
    }
  },

  get hasAds() {
    return available;
  },

  // À appeler quand le joueur entre en phase de jeu active.
  gameplayStart() {
    if (available) try { SDK().game.gameplayStart(); } catch { /* no-op */ }
  },

  // À appeler quand le gameplay s'arrête (lobby, classement, victoire).
  gameplayStop() {
    if (available) try { SDK().game.gameplayStop(); } catch { /* no-op */ }
  },

  // Moment de célébration (victoire) — déclenche le "happytime" CrazyGames.
  happytime() {
    if (available) try { SDK().game.happytime(); } catch { /* no-op */ }
  },

  // Pub interstitielle (fin de partie). Résout toujours : fin de pub, erreur,
  // ou immédiatement si le SDK n'est pas là. Coupe le son pendant la pub.
  requestMidgameAd() {
    return new Promise((resolve) => {
      if (!available) return resolve();
      const done = () => {
        sound.muteAll(platformMuted); // ne pas ré-activer le son si la plateforme l'a coupé
        resolve();
      };
      try {
        SDK().ad.requestAd('midgame', {
          adStarted: () => sound.muteAll(true),
          adFinished: done,
          adError: done,
        });
      } catch {
        done();
      }
    });
  },

  // Lien d'invitation : celui de CrazyGames si possible, sinon ?code=XXXXX.
  inviteLink(code) {
    if (available) {
      try { return SDK().game.inviteLink({ code }); } catch { /* fallback */ }
    }
    return `${location.origin}${location.pathname}?code=${code}`;
  },

  // Code de salon passé par un lien d'invitation CrazyGames.
  inviteCode() {
    if (available) {
      try { return SDK().game.getInviteParam('code') ?? ''; } catch { /* no-op */ }
    }
    return '';
  },

  // Lancement « instant multiplayer » : CrazyGames demande au jeu de mettre
  // directement le joueur dans un salon joignable.
  get isInstantMultiplayer() {
    if (available) {
      try { return !!SDK().game.isInstantMultiplayer; } catch { /* no-op */ }
    }
    return false;
  },

  // Signale à la plateforme le salon courant (active le bouton "inviter des
  // amis" côté CrazyGames). isJoinable = des amis peuvent encore rejoindre.
  updateRoom(code, isJoinable) {
    if (available) {
      try { SDK().game.updateRoom({ roomId: code, isJoinable: !!isJoinable, inviteParams: { code } }); } catch { /* no-op */ }
    }
  },

  leftRoom() {
    if (available) try { SDK().game.leftRoom(); } catch { /* no-op */ }
  },

  // Un ami accepte une invitation pendant que le joueur est déjà en jeu.
  onJoinRoom(cb) {
    if (available) {
      try { SDK().game.addJoinRoomListener((params) => cb(params?.code)); } catch { /* no-op */ }
    }
  },
};
