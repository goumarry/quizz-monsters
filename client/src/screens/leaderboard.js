import { toLocal, clock } from '../net.js';
import { myId } from '../state.js';
import { esc, formatNum } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';

export function leaderboardScreen(root, { round, total, leaderboard, finished, nextAt }) {
  const rowsHTML = leaderboard
    .map(
      (p, i) => `
      <div class="lb-row" style="animation-delay:${i * 0.07}s; ${p.id === myId() ? 'border-color:rgba(46,255,199,0.35);' : ''} ${p.connected ? '' : 'opacity:0.45;'}">
        <span class="title-display" style="font-size:20px; font-weight:700; color:var(--soleil); width:26px;">${p.rank}</span>
        ${monsterHTML(p.color, { size: 44, face: p.face, accessory: p.accessory })}
        <span style="flex:1; min-width:0; display:flex; flex-direction:column; gap:1px;">
          <span class="title-display" style="font-size:16px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${esc(p.name)}${p.id === myId() ? ' <span style="font-size:11px; color:var(--text-dim); font-family:var(--font-body);">(Toi)</span>' : ''}
          </span>
          <!-- Résumé de la réponse : permet de se comparer aux autres. -->
          <span style="font-size:12px; color:${p.success ? 'var(--menthe)' : 'var(--text-dim)'}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${esc(p.result ?? '')}
          </span>
        </span>
        ${p.delta > 0
          ? `<span class="delta-up" style="width:34px;"><span class="tri-up"></span>${p.delta}</span>`
          : p.delta < 0
            ? `<span class="delta-down" style="width:34px;"><span class="tri-down"></span>${-p.delta}</span>`
            : '<span style="color:var(--text-dim); font-size:12px; font-weight:800; width:34px;">—</span>'}
        <span style="font-weight:800; font-size:13px; color:${p.gained > 0 ? 'var(--menthe)' : 'var(--text-dim)'}; width:56px; text-align:right;">${p.gained > 0 ? '+' + formatNum(p.gained) : '—'}</span>
        <span class="title-display" style="font-size:18px; font-weight:700; width:88px; text-align:right;">${formatNum(p.score)}</span>
      </div>`,
    )
    .join('');

  root.innerHTML = `
  <div class="screen fade-in">
    <div class="glow glow-rose"></div>
    <div class="glow glow-menthe"></div>
    <div style="position:relative; display:flex; flex-direction:column; height:100%; padding:40px clamp(24px, 8vw, 90px); gap:22px; overflow:auto;">
      <div style="text-align:center; display:flex; flex-direction:column; gap:6px;">
        <span class="title-display" style="font-size:40px; font-weight:700;">CLASSEMENT</span>
        <span style="font-size:14px; color:var(--text-dim);">Manche ${round}/${total} terminée</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:10px; max-width:900px; width:100%; margin:0 auto;">
        ${rowsHTML}
      </div>
      <div id="next" style="text-align:center; font-size:13px; color:var(--text-dim); margin-top:4px;"></div>
    </div>
  </div>`;

  const next = root.querySelector('#next');
  const localNext = toLocal(nextAt);
  const interval = setInterval(() => {
    const s = Math.max(0, Math.ceil((localNext - clock()) / 1000));
    next.textContent = finished ? 'Résultats finaux dans un instant…' : `Prochaine manche dans ${s}s…`;
    if (s <= 0) clearInterval(interval);
  }, 200);

  return { unmount: () => clearInterval(interval) };
}
