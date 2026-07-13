import { C2S, ROOM, SPEEDS } from '@quizz/shared';
import { socket, emitAck } from '../net.js';
import { store, me, isHost } from '../state.js';
import { esc, toast } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { sound } from '../ui/sound.js';
import { sdk } from '../sdk.js';

export function lobbyScreen(root) {
  const room = store.room;
  if (!room) return;
  const host = isHost();

  const playersHTML = room.players
    .map(
      (p) => `
      <div class="card fade-in" style="align-items:center; gap:10px; padding:20px 14px; border-radius:20px; width:158px; ${p.connected ? '' : 'opacity:0.4;'}">
        ${monsterHTML(p.color, { size: 60, face: p.face, accessory: p.accessory })}
        <span class="title-display" style="font-size:15px; font-weight:600; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(p.name)}</span>
        ${p.id === room.hostId
          ? '<span title="Hôte" style="font-size:20px; line-height:20px;">👑</span>'
          : p.ready
            ? '<span class="badge badge-pret">PRÊT ✓</span>'
            : '<span class="hint" style="font-size:11px;">se prépare…</span>'}
      </div>`,
    )
    .join('');

  const pillsHTML = (options, selected, attr) =>
    options
      .map(
        ([value, label]) =>
          `<button class="pill ${String(value) === String(selected) ? 'active' : ''}" data-${attr}="${value}" ${host ? '' : 'disabled'}>${label}</button>`,
      )
      .join('');

  root.innerHTML = `
  <div class="screen fade-in">
    <div class="glow glow-rose"></div>
    <div class="glow glow-menthe"></div>

    <div style="position:relative; display:flex; flex-direction:column; align-items:center; height:100%; padding:36px 24px; gap:24px; overflow:auto;">

      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:12px; letter-spacing:2px; color:var(--text-dim); text-transform:uppercase;">Code du salon${room.isPublic ? ' (public)' : ''}</span>
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="title-display" style="font-size:32px; letter-spacing:6px; background:var(--surface-2); padding:10px 24px; border-radius:16px; border:2px dashed rgba(255,255,255,0.15);">${esc(room.code)}</span>
          <button id="copy" class="btn btn-ghost" style="font-size:13px; padding:10px 18px;">COPIER LE LIEN</button>
        </div>
        <span class="hint" style="margin-top:2px;">${room.players.length}/${ROOM.MAX_PLAYERS} joueurs</span>
      </div>

      <div style="flex:1; display:flex; align-items:stretch; justify-content:center; gap:26px; width:100%; max-width:1240px; flex-wrap:wrap;">

        <!-- Réglages audio, locaux à chaque joueur. -->
        <aside style="width:250px; flex-shrink:0; display:flex; flex-direction:column; justify-content:flex-start;">
          <div style="display:flex; flex-direction:column; gap:22px; background:var(--surface-2); padding:26px 24px; border-radius:22px; border:1px solid var(--border);">
            <span class="label" style="font-size:13px;">🔊 Son</span>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline;">
                <span style="font-size:13px; color:var(--text-muted); font-weight:700;">🎵 Musique</span>
                <span id="vol-music-val" class="hint">${Math.round(sound.musicVolume * 100)}%</span>
              </div>
              <input id="vol-music" class="range" type="range" min="0" max="100" value="${Math.round(sound.musicVolume * 100)}"
                style="--val:${Math.round(sound.musicVolume * 100)}%;">
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="display:flex; justify-content:space-between; align-items:baseline;">
                <span style="font-size:13px; color:var(--text-muted); font-weight:700;">🔔 Effets</span>
                <span id="vol-sfx-val" class="hint">${Math.round(sound.sfxVolume * 100)}%</span>
              </div>
              <input id="vol-sfx" class="range" type="range" min="0" max="100" value="${Math.round(sound.sfxVolume * 100)}"
                style="--val:${Math.round(sound.sfxVolume * 100)}%;">
            </div>
          </div>
        </aside>

        <div style="flex:1; min-width:340px; display:flex; align-items:center; justify-content:center;">
          <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:16px; max-width:700px;">
            ${playersHTML}
          </div>
        </div>

        <!-- Options du salon : visibles par tous, modifiables par l'hôte seulement. -->
        <aside style="width:290px; flex-shrink:0; display:flex; flex-direction:column; justify-content:flex-start;">
          <div style="display:flex; flex-direction:column; gap:22px; background:var(--surface-2); padding:26px 24px; border-radius:22px; border:1px solid var(--border);">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <span class="label" style="font-size:13px;">⚙ Options de partie</span>
              ${host ? '' : '<span style="font-size:16px;" title="Seul l\'hôte peut modifier">👑</span>'}
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <span style="font-size:12px; color:var(--text-dim); text-transform:uppercase; letter-spacing:1.5px; font-weight:800;">Nombre de manches</span>
              <div class="pills" style="flex-wrap:wrap;">
                ${pillsHTML(ROOM.ROUNDS_OPTIONS.map((r) => [r, r]), room.settings.rounds, 'rounds')}
              </div>
            </div>
            <div style="height:1px; background:rgba(255,255,255,0.08);"></div>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <span style="font-size:12px; color:var(--text-dim); text-transform:uppercase; letter-spacing:1.5px; font-weight:800;">Durée des manches</span>
              <div class="pills" style="flex-wrap:wrap;">
                ${pillsHTML(Object.entries(SPEEDS).map(([k, v]) => [k, v.label]), room.settings.speed, 'speed')}
              </div>
            </div>
            ${host ? '' : '<span class="hint" style="font-size:12px;">Seul l\'hôte 👑 peut modifier les options — tout le monde les voit en direct.</span>'}
          </div>
        </aside>
      </div>

      <div style="display:flex; align-items:center; justify-content:center; gap:16px; padding-bottom:6px;">
        ${host
          ? `<button id="start" class="btn btn-big">LANCER LA PARTIE</button>`
          : `<button id="ready" class="btn ${me()?.ready ? 'btn-menthe' : ''} btn-big">${me()?.ready ? 'PRÊT ✓' : 'JE SUIS PRÊT !'}</button>`}
        <button id="leave" class="btn btn-ghost">QUITTER</button>
      </div>
    </div>
  </div>`;

  // Barres de volume — réglage local, immédiat, persisté.
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

  root.querySelector('#copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sdk.inviteLink(room.code));
      const btn = root.querySelector('#copy');
      btn.textContent = 'COPIÉ ✓';
      setTimeout(() => (btn.textContent = 'COPIER LE LIEN'), 1500);
    } catch {
      toast('Impossible de copier — le code est ' + room.code);
    }
  });

  if (host) {
    root.querySelectorAll('[data-rounds]').forEach((btn) =>
      btn.addEventListener('click', () => socket.emit(C2S.SETTINGS, { rounds: Number(btn.dataset.rounds) })),
    );
    root.querySelectorAll('[data-speed]').forEach((btn) =>
      btn.addEventListener('click', () => socket.emit(C2S.SETTINGS, { speed: btn.dataset.speed })),
    );
    root.querySelector('#start').addEventListener('click', async () => {
      const res = await emitAck(C2S.START);
      if (!res?.ok) toast(res?.error ?? 'Impossible de lancer la partie.');
    });
  } else {
    root.querySelector('#ready').addEventListener('click', () => {
      socket.emit(C2S.READY, { ready: !me()?.ready });
    });
  }

  root.querySelector('#leave').addEventListener('click', () => {
    socket.emit(C2S.LEAVE);
    sdk.leftRoom();
    store.room = null;
    import('../main.js').then(({ show }) => show('home'));
  });
}
