import { toLocal, clock } from '../net.js';
import { myId } from '../state.js';
import { esc, formatNum } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { t, tr } from '../ui/i18n.js';

export function leaderboardScreen(root, { round, total, leaderboard, finished, nextAt }) {
  const rowsHTML = leaderboard
    .map(
      (p, i) => `
      <div class="lb-row" style="animation-delay:${i * 0.07}s; gap:clamp(8px,2vw,18px); padding:clamp(9px,1.6vh,12px) clamp(12px,3vw,24px); ${p.id === myId() ? 'border-color:rgba(46,255,199,0.35);' : ''} ${p.connected ? '' : 'opacity:0.45;'}">
        <span class="title-display" style="font-size:clamp(15px,2.4vw,20px); font-weight:700; color:var(--soleil); width:clamp(18px,4vw,26px); flex-shrink:0;">${p.rank}</span>
        ${monsterHTML(p.color, { size: 44, face: p.face, accessory: p.accessory })}
        <span style="flex:1; min-width:0; display:flex; flex-direction:column; gap:1px;">
          <span class="title-display" style="font-size:clamp(13px,2.2vw,16px); font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${esc(p.name)}${p.id === myId() ? ` <span style="font-size:11px; color:var(--text-dim); font-family:var(--font-body);">${t('lb.you')}</span>` : ''}
          </span>
          <!-- Résumé de la réponse : permet de se comparer aux autres. -->
          <span style="font-size:11px; color:${p.success ? 'var(--menthe)' : 'var(--text-dim)'}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${esc(tr(p.result))}
          </span>
        </span>
        ${p.delta > 0
          ? `<span class="delta-up" style="min-width:clamp(22px,5vw,34px); flex-shrink:0; white-space:nowrap;"><span class="tri-up"></span>${p.delta}</span>`
          : p.delta < 0
            ? `<span class="delta-down" style="min-width:clamp(22px,5vw,34px); flex-shrink:0; white-space:nowrap;"><span class="tri-down"></span>${-p.delta}</span>`
            : '<span style="color:var(--text-dim); font-size:12px; font-weight:800; min-width:clamp(22px,5vw,34px); flex-shrink:0; white-space:nowrap;">—</span>'}
        <span style="font-weight:800; font-size:13px; color:${p.gained > 0 ? 'var(--menthe)' : 'var(--text-dim)'}; min-width:clamp(40px,9vw,56px); flex-shrink:0; text-align:right; white-space:nowrap;">${p.gained > 0 ? '+' + formatNum(p.gained) : '—'}</span>
        <span class="title-display" style="font-size:clamp(14px,2.6vw,18px); font-weight:700; min-width:clamp(50px,11vw,80px); flex-shrink:0; text-align:right; white-space:nowrap;">${formatNum(p.score)}</span>
      </div>`,
    )
    .join('');

  root.innerHTML = `
  <div class="screen fade-in">
    <div class="glow glow-rose"></div>
    <div class="glow glow-menthe"></div>
    <div style="position:relative; display:flex; flex-direction:column; height:100%; padding:clamp(16px,5vh,40px) clamp(14px, 8vw, 90px); gap:clamp(12px,2.75vh,22px); overflow:auto;">
      <div style="text-align:center; display:flex; flex-direction:column; gap:6px;">
        <span class="title-display" style="font-size:clamp(24px,5vh,40px); font-weight:700;">${t('lb.title')}</span>
        <span style="font-size:14px; color:var(--text-dim);">${t('lb.roundDone', { r: round, t: total })}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:clamp(6px,1.2vh,10px); max-width:900px; width:100%; margin:0 auto;">
        ${rowsHTML}
      </div>
      <div id="next" style="text-align:center; font-size:13px; color:var(--text-dim); margin-top:4px;"></div>
    </div>
  </div>`;

  const next = root.querySelector('#next');
  const localNext = toLocal(nextAt);
  const interval = setInterval(() => {
    const s = Math.max(0, Math.ceil((localNext - clock()) / 1000));
    next.textContent = finished ? t('lb.final') : t('lb.next', { s });
    if (s <= 0) clearInterval(interval);
  }, 200);

  return { unmount: () => clearInterval(interval) };
}
