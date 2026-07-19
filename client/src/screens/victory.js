import { C2S, PLAYER_COLORS } from '@quizz/shared';
import { socket, emitAck } from '../net.js';
import { store, isHost } from '../state.js';
import { esc, formatNum, toast } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { sdk } from '../sdk.js';
import { t } from '../ui/i18n.js';
import { coinIcon } from '../ui/catalog.js';

// Proportions des marches (d'après les hauteurs d'origine 250/190/140px),
// appliquées en % à l'intérieur d'un conteneur qui remplit l'espace vertical
// restant (voir plus bas) : le podium tient toujours dans l'écran, jamais de
// scroll, quelle que soit la hauteur disponible (tablette paysage réduite…).
const BAR_PCT = { 1: 100, 2: 76, 3: 56 };

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
    <div style="position:relative; display:flex; flex-direction:column; align-items:center; height:100%; width:100%; box-sizing:border-box; padding:clamp(10px,2.5vh,28px) 24px clamp(8px,2vh,16px); gap:clamp(6px,1.6vh,14px); overflow:hidden;">
      <span style="flex:0 0 auto; font-size:13px; letter-spacing:2px; color:var(--text-dim); text-transform:uppercase; font-weight:700;">${t('victory.over')}</span>
      <span class="title-display" style="flex:0 0 auto; font-size:clamp(18px,4vw,38px); font-weight:700; text-shadow:0 0 30px rgba(255,46,136,0.5); text-align:center;">
        ${t('victory.wins', { name: esc(winner?.name.toUpperCase() ?? '???') })}
      </span>

      <!-- Rangée du podium : remplit l'espace vertical restant (flex:1) mais
           plafonné par max-height (≈ taille d'origine : monstre 104px +
           textes + barre max 250px) pour ne pas s'étirer en plein écran ;
           ne rétrécit sous ce plafond que si l'écran est trop court (tablette
           paysage réduite…), jamais de scroll. -->
      <div style="flex:1; min-height:0; max-height:420px; width:100%; display:flex; align-items:stretch; justify-content:center; gap:clamp(10px,3vw,26px);">
        ${ordered
          .map(
            (p) => `
            <div style="display:flex; flex-direction:column; align-items:center; gap:clamp(4px,1vh,10px); width:clamp(88px, 14vw, 180px); min-height:0;">
              ${monsterHTML(p.color, { size: 104, face: p.face, accessory: p.accessory })}
              <span class="title-display" style="flex:0 0 auto; font-size:clamp(12px,2vh,16px); font-weight:600;">${esc(p.name)}</span>
              <span style="flex:0 0 auto; font-size:clamp(10px,1.6vh,13px); color:var(--text-dim);">${formatNum(p.score)} pts</span>
              <div style="flex:1; min-height:0; width:100%; display:flex; flex-direction:column; justify-content:flex-end;">
                <div style="width:100%; height:${BAR_PCT[p.rank] ?? 40}%; background:var(--surface-2); border-radius:16px 16px 0 0; display:flex; align-items:flex-start; justify-content:center; padding-top:clamp(4px,1vh,14px); border:1px solid var(--border); border-bottom:none; box-sizing:border-box;">
                  <span class="title-display" style="font-size:clamp(16px,3.6vh,30px); font-weight:700; color:var(--soleil);">${p.rank}</span>
                </div>
              </div>
            </div>`,
          )
          .join('')}
      </div>

      ${gains ? `
      <div class="fade-in" style="flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:4px;
        background:var(--surface-2); border:1px solid var(--border); border-radius:20px; padding:clamp(8px,1.6vh,16px) clamp(16px,4vw,32px);">
        ${gains.newBest ? `<span class="title-display" style="font-size:14px; font-weight:700; color:var(--soleil); text-shadow:0 0 16px rgba(255,214,10,0.5);">🏆 ${t('victory.newBest', { n: formatNum(gains.best) })}</span>` : ''}
        <span class="title-display" style="font-size:clamp(17px,3.4vh,26px); font-weight:700; color:var(--soleil);">+${gains.coins} ${coinIcon(20)}</span>
        <span class="hint" style="font-size:11px;">
          ${gains.crowd > 1 ? `×${gains.crowd} ${t('victory.crowdBonus')}` : ''}
          ${gains.podium > 1 ? ` · ×${gains.podium} ${t('victory.podiumBonus')}` : ''}
          ${gains.crowd > 1 || gains.podium > 1 ? ' · ' : ''}${t('victory.balance', { n: formatNum(gains.total) })}
        </span>
      </div>` : ''}

      <div style="flex:0 0 auto; display:flex; gap:16px;">
        ${isHost() ? `<button id="replay" class="btn" style="padding:12px 36px; font-size:15px;">${t('victory.replay')}</button>` : `<span style="align-self:center; font-size:13px; color:var(--text-dim);">${t('victory.hostReplay')}</span>`}
        <button id="quit" class="btn btn-ghost" style="padding:10px 34px; font-size:15px;">${t('victory.quit')}</button>
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
