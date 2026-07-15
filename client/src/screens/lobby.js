import { C2S, ROOM, SPEEDS } from '@quizz/shared';
import { socket, emitAck } from '../net.js';
import { store, me, isHost } from '../state.js';
import { esc, toast } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { t, tr } from '../ui/i18n.js';
import { sdk } from '../sdk.js';

export function lobbyScreen(root) {
  const room = store.room;
  if (!room) return;
  const host = isHost();

  const playersHTML = room.players
    .map(
      (p) => `
      <div class="card fade-in" style="align-items:center; gap:10px; padding:clamp(12px,2vh,20px) 10px; border-radius:20px; width:clamp(112px, 26vw, 158px); ${p.connected ? '' : 'opacity:0.4;'}">
        ${monsterHTML(p.color, { size: 60, face: p.face, accessory: p.accessory })}
        <span class="title-display" style="font-size:15px; font-weight:600; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(p.name)}</span>
        ${p.id === room.hostId
          ? '<span title="Hôte" style="font-size:20px; line-height:20px;">👑</span>'
          : p.ready
            ? `<span class="badge badge-pret">${t('lobby.ready')}</span>`
            : `<span class="hint" style="font-size:11px;">${t('lobby.preparing')}</span>`}
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

    <div style="position:relative; display:flex; flex-direction:column; align-items:center; height:100%; padding:clamp(16px,3vh,32px) 16px clamp(12px,2vh,20px); gap:clamp(12px,2.2vh,20px); overflow:auto;">

      <!-- Entête : le code du salon, l'info la plus importante à partager. -->
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <span style="font-size:12px; letter-spacing:2px; color:var(--text-dim); text-transform:uppercase;">${t('lobby.codeLabel')}${room.isPublic ? t('lobby.public') : ''}</span>
        <div style="display:flex; align-items:center; justify-content:center; gap:14px; flex-wrap:wrap;">
          <span class="title-display" style="font-size:clamp(26px,4vh,32px); letter-spacing:6px; background:var(--surface-2); padding:10px 24px; border-radius:16px; border:2px dashed rgba(255,255,255,0.15);">${esc(room.code)}</span>
          <button id="copy" class="btn btn-ghost" style="font-size:13px; padding:10px 18px;">${t('lobby.copy')}</button>
        </div>
        <span class="hint" style="margin-top:2px;">${t('lobby.players', { n: room.players.length, max: ROOM.MAX_PLAYERS })}</span>
      </div>

      <!-- Les monstres : la zone principale, au centre. -->
      <div style="flex:1; display:flex; align-items:center; justify-content:center; width:100%; min-height:0;">
        <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:clamp(10px,1.8vh,16px); max-width:900px;">
          ${playersHTML}
        </div>
      </div>

      <!-- Barre de réglages : options du salon (hôte) + son (local), groupes
           côte à côte sur PC, empilés sur mobile (flex-wrap). -->
      <div class="lobby-bar">
        <div class="lobby-group">
          <span class="lobby-group-label">${t('lobby.rounds')}</span>
          <div class="pills">
            ${pillsHTML(ROOM.ROUNDS_OPTIONS.map((r) => [r, r]), room.settings.rounds, 'rounds')}
          </div>
        </div>
        <div class="lobby-group">
          <span class="lobby-group-label">${t('lobby.duration')}</span>
          <div class="pills">
            ${pillsHTML(Object.keys(SPEEDS).map((k) => [k, t(`speed.${k}`)]), room.settings.speed, 'speed')}
          </div>
        </div>
      </div>
      ${host ? '' : `<span class="hint" style="font-size:12px; text-align:center;">${t('lobby.hostOnly')}</span>`}

      <div style="display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap;">
        ${host
          ? `<button id="start" class="btn btn-big">${t('lobby.start')}</button>`
          : `<button id="ready" class="btn ${me()?.ready ? 'btn-menthe' : ''} btn-big">${me()?.ready ? t('lobby.ready') : t('lobby.imReady')}</button>`}
        <button id="leave" class="btn btn-ghost">${t('lobby.quit')}</button>
      </div>
    </div>
  </div>`;

  root.querySelector('#copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(sdk.inviteLink(room.code));
      const btn = root.querySelector('#copy');
      btn.textContent = t('lobby.copied');
      setTimeout(() => (btn.textContent = t('lobby.copy')), 1500);
    } catch {
      toast(t('lobby.copyFail', { code: room.code }));
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
      if (!res?.ok) toast(res?.error ? tr(res.error) : t('lobby.cantStart'));
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
