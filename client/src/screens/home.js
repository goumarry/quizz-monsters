import { C2S, PLAYER_COLORS, AVATAR_FACES, AVATAR_ACCESSORIES } from '@quizz/shared';
import { emitAck } from '../net.js';
import { store, setName, setColor, setFace, setAccessory } from '../state.js';
import { esc, toast } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';

// Accueil minimaliste : pseudo, avatar (couleur + visage + accessoire),
// Créer un salon — ou un code à rejoindre.
export function homeScreen(root) {
  const myColor = PLAYER_COLORS[store.color] ?? PLAYER_COLORS[0];

  // Boutons de personnalisation : mini-aperçu du monstre pour chaque variante.
  const avatarPicker = (items, selected, attr, opts) =>
    items
      .map(
        (item) => `
        <button data-${attr}="${item}" title="${item}" style="width:54px; height:54px; border-radius:16px; cursor:pointer;
          background:var(--surface-2); display:flex; align-items:flex-end; justify-content:center; padding-bottom:6px; overflow:hidden;
          border:3px solid ${item === selected ? 'var(--menthe)' : 'transparent'}; transition:all 0.12s ease;">
          ${monsterHTML(myColor, { size: 34, ...opts(item) })}
        </button>`,
      )
      .join('');

  root.innerHTML = `
  <div class="screen fade-in">
    <div class="glow glow-rose"></div>
    <div class="glow glow-menthe"></div>

    <div style="position:relative; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px; padding:24px; overflow:auto;">
      <h1 class="title-display" style="margin:0; font-size:clamp(32px,4.5vw,52px); text-shadow:0 0 40px rgba(255,46,136,0.6); letter-spacing:1px;">QUIZZ MONSTERS</h1>

      <div id="preview" style="animation: bob 3s ease-in-out infinite; padding-top:18px;">
        ${monsterHTML(myColor, { size: 130, face: store.face, accessory: store.accessory })}
      </div>

      <div id="colors" style="display:flex; gap:10px;">
        ${PLAYER_COLORS.map(
          (c, i) => `
          <button data-color="${i}" style="width:34px; height:34px; border-radius:50%; background:${c}; cursor:pointer;
            border:3px solid ${i === store.color ? '#f5f1ff' : 'transparent'};
            box-shadow:${i === store.color ? `0 0 14px ${c}` : 'none'}; transition:all 0.12s ease;"></button>`,
        ).join('')}
      </div>

      <div id="faces" style="display:flex; gap:8px;">
        ${avatarPicker(AVATAR_FACES, store.face, 'face', (f) => ({ face: f, accessory: 'aucun' }))}
      </div>

      <div id="accessories" style="display:flex; gap:8px;">
        ${avatarPicker(AVATAR_ACCESSORIES, store.accessory, 'accessory', (a) => ({ face: store.face, accessory: a }))}
      </div>

      <button id="random-skin" class="btn btn-ghost" style="font-size:13px; padding:9px 20px;">🎲 SKIN ALÉATOIRE</button>

      <input id="name" class="input" maxlength="14" value="${esc(store.name)}" placeholder="Ton pseudo"
        style="width:240px; text-align:center; font-family:var(--font-display); font-size:18px; padding:14px;">

      <button id="create" class="btn btn-big">Créer un salon !</button>

      <div style="display:flex; align-items:center; gap:12px; color:var(--text-disabled); font-size:12px; font-weight:800; letter-spacing:2px; width:280px;">
        <div style="flex:1; height:1px; background:rgba(255,255,255,0.1);"></div>OU<div style="flex:1; height:1px; background:rgba(255,255,255,0.1);"></div>
      </div>

      <div style="display:flex; gap:10px;">
        <input id="code" class="input input-code" maxlength="5" placeholder="CODE" value="${esc(store.inviteCode)}" style="width:130px;">
        <button id="join" class="btn btn-menthe">REJOINDRE</button>
      </div>

      <a id="quickplay" href="#" style="font-size:13px; color:var(--text-dim); text-decoration:underline; text-underline-offset:4px;">
        Partie publique aléatoire
      </a>
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

  root.querySelector('#colors').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    setColor(Number(btn.dataset.color));
    rerender();
  });
  root.querySelector('#faces').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-face]');
    if (!btn) return;
    setFace(btn.dataset.face);
    rerender();
  });
  root.querySelector('#accessories').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accessory]');
    if (!btn) return;
    setAccessory(btn.dataset.accessory);
    rerender();
  });
  root.querySelector('#random-skin').addEventListener('click', () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setColor(Math.floor(Math.random() * PLAYER_COLORS.length));
    setFace(pick(AVATAR_FACES));
    setAccessory(pick(AVATAR_ACCESSORIES));
    rerender();
  });

  const act = async (event, payload) => {
    const res = await emitAck(event, payload);
    if (!res?.ok) toast(res?.error ?? 'Oups, quelque chose a raté…');
  };

  root.querySelector('#create').addEventListener('click', () => act(C2S.CREATE, readProfile()));
  root.querySelector('#join').addEventListener('click', () => {
    const code = root.querySelector('#code').value.trim().toUpperCase();
    if (code.length < 4) return toast('Entre le code du salon (5 caractères).');
    act(C2S.JOIN, { code, ...readProfile() });
  });
  root.querySelector('#quickplay').addEventListener('click', (e) => {
    e.preventDefault();
    act(C2S.QUICKPLAY, readProfile());
  });

  // Lien d'invitation ?code=XXXXX → focus direct sur REJOINDRE.
  if (store.inviteCode) {
    store.inviteCode = root.querySelector('#code').value;
    history.replaceState(null, '', location.pathname);
    root.querySelector('#join').focus();
  }
}
