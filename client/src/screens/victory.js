import { C2S, PLAYER_COLORS } from '@quizz/shared';
import { socket, emitAck } from '../net.js';
import { store, isHost } from '../state.js';
import { esc, formatNum, toast } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { sdk } from '../sdk.js';
import { t } from '../ui/i18n.js';
import { coinIcon } from '../ui/catalog.js';

const BAR_HEIGHTS = { 1: 250, 2: 190, 3: 140 };

export function victoryScreen(root, { podium, leaderboard, gains }) {
  const winner = podium[0];
  // Ordre visuel du podium : 2e — 1er — 3e.
  const ordered = [podium[1], podium[0], podium[2]].filter(Boolean);

  const confettiHTML = Array.from({ length: 40 }, (_, i) => {
    const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
    const size = 8 + (i % 4) * 4;
    const left = (i * 53) % 100;
    const duration = 3.5 + (i % 5) * 0.8;
    const delay = (i * 0.37) % duration;
    const radius = i % 2 === 0 ? '50%' : '3px';
    return `<div class="confetti" style="left:${left}%; width:${size}px; height:${size}px; background:${color}; border-radius:${radius}; animation-duration:${duration}s; animation-delay:-${delay}s;"></div>`;
  }).join('');

  root.innerHTML = `
  <div class="screen fade-in">
    ${confettiHTML}
    <div style="position:relative; display:flex; flex-direction:column; align-items:center; height:100%; padding:44px 24px 0; overflow:auto;">
      <span style="font-size:13px; letter-spacing:2px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">${t('victory.over')}</span>
      <span class="title-display" style="font-size:clamp(26px,4vw,38px); font-weight:700; text-shadow:0 0 30px rgba(255,46,136,0.5); margin-top:8px; text-align:center;">
        ${t('victory.wins', { name: esc(winner?.name.toUpperCase() ?? '???') })}
      </span>

      <div style="display:flex; align-items:flex-end; gap:26px; margin-top:44px;">
        ${ordered
          .map(
            (p) => `
            <div style="display:flex; flex-direction:column; align-items:center; gap:10px; width:clamp(120px, 14vw, 180px);">
              ${monsterHTML(p.color, { size: 104, face: p.face, accessory: p.accessory })}
              <span class="title-display" style="font-size:16px; font-weight:600;">${esc(p.name)}</span>
              <span style="font-size:13px; color:var(--text-dim);">${formatNum(p.score)} pts</span>
              <div style="width:100%; height:${BAR_HEIGHTS[p.rank] ?? 120}px; background:var(--surface-2); border-radius:16px 16px 0 0; display:flex; align-items:flex-start; justify-content:center; padding-top:14px; border:1px solid var(--border); border-bottom:none;">
                <span class="title-display" style="font-size:30px; font-weight:700; color:var(--soleil);">${p.rank}</span>
              </div>
            </div>`,
          )
          .join('')}
      </div>

      ${gains ? `
      <div class="fade-in" style="display:flex; flex-direction:column; align-items:center; gap:8px; margin-top:30px;
        background:var(--surface-2); border:1px solid var(--border); border-radius:20px; padding:18px 34px;">
        ${gains.newBest ? `<span class="title-display" style="font-size:15px; font-weight:700; color:var(--soleil); text-shadow:0 0 16px rgba(255,214,10,0.5);">🏆 ${t('victory.newBest', { n: formatNum(gains.best) })}</span>` : ''}
        <span class="title-display" style="font-size:26px; font-weight:700; color:var(--soleil);">+${gains.coins} ${coinIcon(22)}</span>
        <span class="hint" style="font-size:12px;">
          ${gains.crowd > 1 ? `×${gains.crowd} ${t('victory.crowdBonus')}` : ''}
          ${gains.podium > 1 ? ` · ×${gains.podium} ${t('victory.podiumBonus')}` : ''}
          ${gains.crowd > 1 || gains.podium > 1 ? ' · ' : ''}${t('victory.balance', { n: formatNum(gains.total) })}
        </span>
      </div>` : ''}

      <div style="display:flex; gap:16px; margin:36px 0 44px;">
        ${isHost() ? `<button id="replay" class="btn" style="padding:14px 40px; font-size:16px;">${t('victory.replay')}</button>` : `<span style="align-self:center; font-size:13px; color:var(--text-dim);">${t('victory.hostReplay')}</span>`}
        <button id="quit" class="btn btn-ghost" style="padding:12px 38px; font-size:16px;">${t('victory.quit')}</button>
      </div>
    </div>
  </div>`;

  root.querySelector('#replay')?.addEventListener('click', async () => {
    const res = await emitAck(C2S.REPLAY);
    if (!res?.ok) toast(t('victory.replayFail'));
  });

  root.querySelector('#quit').addEventListener('click', () => {
    socket.emit(C2S.LEAVE);
    sdk.leftRoom();
    store.room = null;
    store.leaderboard = null;
    import('../main.js').then(({ show }) => show('home'));
  });
}
