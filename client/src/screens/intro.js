import { SERVER_URL } from '../net.js';
import { t } from '../ui/i18n.js';

// Le serveur (Render, plan gratuit) s'endort après inactivité et met 5-10s à
// se relancer sur la première requête. Sans ça, un joueur qui clique
// "Rejoindre" pendant ce réveil ne voit rien se passer et croit le jeu cassé.
// On occupe ce temps avec la vidéo d'intro tout en réveillant le serveur en
// parallèle (le socket s'y connecte déjà seul, ce ping HTTP est une garantie
// en plus, indépendante des aléas de transport de socket.io).
const VIDEO_SRC = './intro_video_game.mp4';
const SAFETY_MS = 12000; // filet si la vidéo ne se termine jamais (format refusé, lecture bloquée…)

export function introScreen(root, { onDone } = {}) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(safety);
    onDone?.();
  };

  root.innerHTML = `
  <div class="screen fade-in" style="background:#000; align-items:center; justify-content:center;">
    <video id="intro-video" src="${VIDEO_SRC}" autoplay muted playsinline
      style="width:100%; height:100%; object-fit:cover;"></video>
    <button id="intro-skip" class="pill" style="display:none; position:absolute; bottom:24px; right:24px; z-index:10; font-size:13px; padding:10px 18px;">
      ${t('intro.skip')} ⏭
    </button>
  </div>`;

  const video = root.querySelector('#intro-video');
  video.addEventListener('ended', finish);
  // Lecture impossible (format non supporté, autoplay bloqué…) : on n'attend pas pour rien.
  video.addEventListener('error', finish);
  video.play?.().catch(finish);

  const skipBtn = root.querySelector('#intro-skip');
  skipBtn.addEventListener('click', finish);
  // Le bouton "Passer" n'apparaît qu'une fois le serveur confirmé réveillé —
  // sinon skipper enverrait le joueur sur une connexion toujours en train de démarrer.
  fetch(`${SERVER_URL ?? ''}/health`)
    .then((res) => { if (res.ok && !done) skipBtn.style.display = ''; })
    .catch(() => {});

  const safety = setTimeout(finish, SAFETY_MS);

  return {
    unmount() {
      clearTimeout(safety);
      video.pause();
    },
  };
}
