import { t } from '../ui/i18n.js';

// Écran affiché pendant la pub interstitielle de fin de partie (CrazyGames).
export function adScreen(root) {
  root.innerHTML = `
  <div class="screen fade-in">
    <div style="position:relative; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;">
      <div class="title-display" style="font-size:clamp(24px,4vw,36px);">${t('ad.title')}</div>
      <span class="hint">${t('ad.sub')}</span>
    </div>
  </div>`;
}
