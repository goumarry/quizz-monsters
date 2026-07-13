// Écran affiché pendant la pub interstitielle de fin de partie (CrazyGames).
export function adScreen(root) {
  root.innerHTML = `
  <div class="screen fade-in">
    <div style="position:relative; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px;">
      <div class="title-display" style="font-size:clamp(24px,4vw,36px);">PETITE PAUSE PUB…</div>
      <span class="hint">Le classement final arrive juste après !</span>
    </div>
  </div>`;
}
