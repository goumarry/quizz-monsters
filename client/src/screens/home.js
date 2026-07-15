import { C2S, PLAYER_COLORS, AVATAR_FACES, AVATAR_ACCESSORIES } from '@quizz/shared';
import { emitAck } from '../net.js';
import { store, setName, setColor, setFace, setAccessory } from '../state.js';
import { esc, toast, formatNum } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { sound } from '../ui/sound.js';
import { t, tr, getLang, setLang, LANG_LIST } from '../ui/i18n.js';
import { flagIcon } from '../ui/flags.js';
import { isUnlocked, coinIcon } from '../ui/catalog.js';
import { getSave, dailyState, claimDaily } from '../save.js';
import { openShop } from './shop.js';

// Accueil minimaliste : avatar (personnalisation via la boutique-vestiaire),
// pièces + record + boutique bien visibles, Créer un salon — ou un code à
// rejoindre, et la partie publique en bouton.
export function homeScreen(root) {
  const myColor = PLAYER_COLORS[store.color] ?? PLAYER_COLORS[0];
  const saveData = getSave();
  const daily = dailyState();

  root.innerHTML = `
  <div class="screen fade-in">
    <div class="glow glow-rose"></div>
    <div class="glow glow-menthe"></div>

    <!-- Coin réglages : son + langue, mêmes icônes-menus en haut à droite. -->
    <div style="position:absolute; top:14px; right:16px; z-index:20; display:flex; gap:8px;">
      <div id="sound-box" style="position:relative;">
        <button id="sound-toggle" class="pill" title="${t('lobby.sound')}" style="width:42px; height:42px; padding:0; font-size:18px; line-height:1;">🔊</button>
        <div id="sound-menu" style="display:none; position:absolute; top:calc(100% + 8px); right:0; flex-direction:column; gap:12px;
          background:var(--surface-2); border:1px solid var(--border); border-radius:16px; padding:14px 16px;
          box-shadow:0 10px 30px rgba(0,0,0,0.35); width:240px;">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span style="font-size:12px; color:var(--text-muted); font-weight:700;">${t('lobby.music')}</span>
              <span id="vol-music-val" class="hint">${Math.round(sound.musicVolume * 100)}%</span>
            </div>
            <input id="vol-music" class="range" type="range" min="0" max="100" value="${Math.round(sound.musicVolume * 100)}"
              style="--val:${Math.round(sound.musicVolume * 100)}%;">
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:baseline;">
              <span style="font-size:12px; color:var(--text-muted); font-weight:700;">${t('lobby.sfx')}</span>
              <span id="vol-sfx-val" class="hint">${Math.round(sound.sfxVolume * 100)}%</span>
            </div>
            <input id="vol-sfx" class="range" type="range" min="0" max="100" value="${Math.round(sound.sfxVolume * 100)}"
              style="--val:${Math.round(sound.sfxVolume * 100)}%;">
          </div>
        </div>
      </div>
      <!-- Sélecteur de langue : le drapeau de la langue actuelle, cliquer l'ouvre. -->
      <div id="langs" style="position:relative;">
        <button id="lang-toggle" class="pill" style="padding:8px; line-height:0; height:42px;" title="${getLang().toUpperCase()}">${flagIcon(getLang(), 26)}</button>
        <div id="lang-menu" style="display:none; position:absolute; top:calc(100% + 8px); right:0; flex-direction:column; gap:6px;
          background:var(--surface-2); border:1px solid var(--border); border-radius:16px; padding:8px;
          box-shadow:0 10px 30px rgba(0,0,0,0.35);">
          ${LANG_LIST.map(
            (l) => `
            <button data-lang="${l}" class="pill" style="display:flex; align-items:center; gap:8px; padding:6px 12px; justify-content:flex-start;
              ${l === getLang() ? 'color:var(--bg); background:var(--menthe);' : ''}">
              ${flagIcon(l, 22)}<span style="font-size:11px; font-family:var(--font-body); font-weight:700;">${l.toUpperCase()}</span>
            </button>`,
          ).join('')}
        </div>
      </div>
    </div>

    <div style="position:relative; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:24px; overflow:auto;">
      <h1 class="title-display" style="margin:0; font-size:clamp(32px,4.5vw,52px); text-shadow:0 0 40px rgba(255,46,136,0.6); letter-spacing:1px;">QUIZZ MONSTERS</h1>

      <!-- Progression : pièces, record, boutique, bonus quotidien — bien en vue. -->
      <div style="display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap;">
        <span class="stat-chip" style="font-size:16px; padding:10px 18px;" title="${t('home.coins')}">${coinIcon(18)} ${formatNum(saveData.coins)}</span>
        ${saveData.best > 0 ? `<span class="stat-chip" style="font-size:16px; padding:10px 18px;" title="${t('home.best')}">🏆 ${formatNum(saveData.best)} pts</span>` : ''}
        <button id="shop-open" class="btn btn-menthe" style="font-size:14px; padding:11px 22px;">🛍 ${t('shop.title')}</button>
        ${daily.claimable ? `<button id="daily" class="btn gift-btn" style="font-size:14px; padding:11px 22px;">🎁 +${daily.reward} ${t('home.daily')}</button>` : ''}
      </div>

      <!-- Avatar : uniquement le monstre équipé ; les boutons sur le côté
           ouvrent le vestiaire (= la boutique) ou tirent un skin au hasard. -->
      <div style="display:flex; align-items:center; gap:20px; padding-top:12px;">
        <div id="preview" style="animation: bob 3s ease-in-out infinite;">
          ${monsterHTML(myColor, { size: 130, face: store.face, accessory: store.accessory })}
        </div>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button id="customize" class="pill" title="${t('home.customize')}" style="width:46px; height:46px; font-size:20px; line-height:1; padding:0;">✏️</button>
          <button id="random-skin" class="pill" title="${t('home.random')}" style="width:46px; height:46px; font-size:20px; line-height:1; padding:0;">🎲</button>
        </div>
      </div>

      <input id="name" class="input" maxlength="14" value="${esc(store.name)}" placeholder="${t('home.pseudo')}"
        style="width:240px; text-align:center; font-family:var(--font-display); font-size:18px; padding:14px;">

      <button id="create" class="btn btn-big">${t('home.create')}</button>

      <div style="display:flex; align-items:center; gap:12px; color:var(--text-disabled); font-size:12px; font-weight:800; letter-spacing:2px; width:280px;">
        <div style="flex:1; height:1px; background:rgba(255,255,255,0.1);"></div>${t('home.or')}<div style="flex:1; height:1px; background:rgba(255,255,255,0.1);"></div>
      </div>

      <div style="display:flex; gap:10px;">
        <input id="code" class="input input-code" maxlength="5" placeholder="${t('home.codePh')}" value="${esc(store.inviteCode)}" style="width:130px;">
        <button id="join" class="btn btn-menthe">${t('home.join')}</button>
      </div>

      <button id="quickplay" class="btn btn-ghost" style="font-size:14px; padding:12px 28px;">
        🎲 ${t('home.quickplay')}
      </button>
    </div>
  </div>`;

  const nameInput = root.querySelector('#name');
  const readProfile = () => {
    const name = nameInput.value.trim().slice(0, 14) || store.name;
    setName(name);
    return { name, color: store.color, face: store.face, accessory: store.accessory };
  };

  // On préserve ce que l'utilisateur a tapé avant de re-rendre.
  const rerender = () => {
    store.name = nameInput.value.trim() || store.name;
    store.inviteCode = root.querySelector('#code').value.trim().toUpperCase();
    homeScreen(root);
  };

  // Menu son : reste ouvert pendant le réglage, se ferme au clic ailleurs.
  const soundMenu = root.querySelector('#sound-menu');
  const closeSound = (e) => {
    if (e && root.querySelector('#sound-box')?.contains(e.target)) return;
    soundMenu.style.display = 'none';
    document.removeEventListener('click', closeSound);
  };
  root.querySelector('#sound-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const open = soundMenu.style.display === 'flex';
    if (open) return closeSound();
    soundMenu.style.display = 'flex';
    setTimeout(() => document.addEventListener('click', closeSound), 0);
  });
  const bindVolume = (id, valId, setter) => {
    const input = root.querySelector(id);
    const label = root.querySelector(valId);
    input.addEventListener('input', () => {
      setter(Number(input.value) / 100);
      label.textContent = `${input.value}%`;
      input.style.setProperty('--val', `${input.value}%`);
    });
  };
  bindVolume('#vol-music', '#vol-music-val', (v) => sound.setMusicVolume(v));
  bindVolume('#vol-sfx', '#vol-sfx-val', (v) => sound.setSfxVolume(v));

  const langMenu = root.querySelector('#lang-menu');
  root.querySelector('#lang-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    const open = langMenu.style.display === 'flex';
    langMenu.style.display = open ? 'none' : 'flex';
    if (!open) {
      // Ferme le menu au prochain clic n'importe où ailleurs.
      setTimeout(() => document.addEventListener('click', () => (langMenu.style.display = 'none'), { once: true }), 0);
    }
  });
  langMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    setLang(btn.dataset.lang);
    rerender();
  });
  // Le vestiaire, c'est la boutique : elle équipe aussi les items possédés.
  root.querySelector('#customize').addEventListener('click', () => openShop(rerender));
  root.querySelector('#random-skin').addEventListener('click', () => {
    // Uniquement parmi les items débloqués.
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setColor(pick(PLAYER_COLORS.map((_, i) => i).filter((i) => isUnlocked('color', i))));
    setFace(pick(AVATAR_FACES.filter((f) => isUnlocked('face', f))));
    setAccessory(pick(AVATAR_ACCESSORIES.filter((a) => isUnlocked('accessory', a))));
    rerender();
  });
  root.querySelector('#shop-open').addEventListener('click', () => openShop(rerender));
  root.querySelector('#daily')?.addEventListener('click', () => {
    const res = claimDaily();
    if (!res) return rerender();
    sound.play('win');
    toast(t('home.dailyClaimed', { n: res.reward, d: res.streak }));
    rerender();
  });

  const act = async (event, payload) => {
    const res = await emitAck(event, payload);
    if (!res?.ok) toast(res?.error ? tr(res.error) : t('home.oops'));
  };

  root.querySelector('#create').addEventListener('click', () => act(C2S.CREATE, readProfile()));
  root.querySelector('#join').addEventListener('click', () => {
    const code = root.querySelector('#code').value.trim().toUpperCase();
    if (code.length < 4) return toast(t('home.codeShort'));
    act(C2S.JOIN, { code, ...readProfile() });
  });
  root.querySelector('#quickplay').addEventListener('click', () => act(C2S.QUICKPLAY, readProfile()));

  // Lien d'invitation ?code=XXXXX → focus direct sur REJOINDRE.
  if (store.inviteCode) {
    store.inviteCode = root.querySelector('#code').value;
    history.replaceState(null, '', location.pathname);
    root.querySelector('#join').focus();
  }
}
