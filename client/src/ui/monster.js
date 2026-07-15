// Mascotte « blob » 100 % CSS, conforme à la charte : même silhouette pour
// tous, la couleur identifie le joueur. Personnalisation : variante de visage
// (`face`) + accessoire (`accessory`) — voir AVATAR_FACES / AVATAR_ACCESSORIES.
const INK = '#150c2b';

function accessoryHTML(accessory, w, h) {
  if (accessory === 'cornes') {
    return `<div style="position:absolute; top:${-Math.round(h * 0.09)}px; left:${Math.round(w * 0.24)}px; width:0; height:0;
         border-left:${Math.round(w * 0.055)}px solid transparent; border-right:${Math.round(w * 0.055)}px solid transparent;
         border-bottom:${Math.round(h * 0.2)}px solid #2effc7; transform:rotate(-8deg);"></div>
       <div style="position:absolute; top:${-Math.round(h * 0.11)}px; left:${Math.round(w * 0.6)}px; width:0; height:0;
         border-left:${Math.round(w * 0.045)}px solid transparent; border-right:${Math.round(w * 0.045)}px solid transparent;
         border-bottom:${Math.round(h * 0.18)}px solid #2effc7; transform:rotate(10deg);"></div>`;
  }
  if (accessory === 'antennes') {
    const stalk = (left, rot) => `
      <div style="position:absolute; top:${-Math.round(h * 0.17)}px; left:${left}px; width:${Math.max(2, Math.round(w * 0.035))}px;
        height:${Math.round(h * 0.2)}px; background:${INK}; border-radius:3px; transform:rotate(${rot}deg);">
        <div style="position:absolute; top:${-Math.round(w * 0.06)}px; left:50%; transform:translateX(-50%);
          width:${Math.max(5, Math.round(w * 0.11))}px; height:${Math.max(5, Math.round(w * 0.11))}px;
          background:#ffd60a; border-radius:50%;"></div>
      </div>`;
    return stalk(Math.round(w * 0.32), -10) + stalk(Math.round(w * 0.62), 10);
  }
  if (accessory === 'chapeau') {
    return `<div style="position:absolute; top:${-Math.round(h * 0.26)}px; left:${Math.round(w * 0.31)}px; width:0; height:0;
         border-left:${Math.round(w * 0.13)}px solid transparent; border-right:${Math.round(w * 0.13)}px solid transparent;
         border-bottom:${Math.round(h * 0.3)}px solid #ffd60a; transform:rotate(5deg);"></div>
       <div style="position:absolute; top:${-Math.round(h * 0.32)}px; left:${Math.round(w * 0.42)}px;
         width:${Math.max(5, Math.round(w * 0.1))}px; height:${Math.max(5, Math.round(w * 0.1))}px;
         background:#ff2e88; border-radius:50%;"></div>`;
  }
  if (accessory === 'noeud') {
    const s = Math.round(w * 0.11);
    const wing = (left, side) => `<div style="position:absolute; top:${-Math.round(h * 0.1)}px; left:${left}px; width:0; height:0;
      border-top:${s}px solid transparent; border-bottom:${s}px solid transparent;
      border-${side}:${Math.round(s * 1.5)}px solid #ff2e88; transform:rotate(-8deg);"></div>`;
    const cx = Math.round(w * 0.62);
    return wing(cx - Math.round(s * 1.5), 'left') + wing(cx, 'right')
      + `<div style="position:absolute; top:${-Math.round(h * 0.1) + Math.round(s * 0.45)}px; left:${cx - Math.round(s * 0.55)}px;
        width:${Math.round(s * 1.1)}px; height:${Math.round(s * 1.1)}px; background:#d61e6e; border-radius:50%;"></div>`;
  }
  if (accessory === 'couronne') {
    return `<div style="position:absolute; top:${-Math.round(h * 0.19)}px; left:${Math.round(w * 0.3)}px;
      width:${Math.round(w * 0.4)}px; height:${Math.round(h * 0.24)}px; background:#ffd60a; transform:rotate(-4deg);
      clip-path:polygon(0 100%, 0 25%, 25% 55%, 50% 0, 75% 55%, 100% 25%, 100% 100%);
      filter:drop-shadow(0 0 6px rgba(255,214,10,0.5));"></div>`;
  }
  if (accessory === 'halo') {
    return `<div style="position:absolute; top:${-Math.round(h * 0.24)}px; left:${Math.round(w * 0.28)}px;
      width:${Math.round(w * 0.44)}px; height:${Math.round(h * 0.14)}px; border:${Math.max(3, Math.round(w * 0.05))}px solid #ffd60a;
      border-radius:50%; box-shadow:0 0 12px rgba(255,214,10,0.6), inset 0 0 6px rgba(255,214,10,0.4);"></div>`;
  }
  return '';
}

function faceHTML(face, w, h) {
  const eye = Math.round(w * 0.26);
  const pupil = Math.max(3, Math.round(eye * 0.42));
  const eyeTop = Math.round(h * 0.27);
  const eye1 = Math.round(w * 0.15);
  const eye2 = Math.round(w * 0.555);
  const line = Math.max(2, Math.round(w * 0.045));

  const roundEye = (left) =>
    `<div style="position:absolute; top:${eyeTop}px; left:${left}px; width:${eye}px; height:${eye}px;
       background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center;">
       <div style="width:${pupil}px; height:${pupil}px; background:${INK}; border-radius:50%;"></div>
     </div>`;

  const mouth = (width, height, radius, top) =>
    `<div style="position:absolute; top:${top}px; left:${Math.round((w - width) / 2)}px;
       width:${width}px; height:${height}px; background:${INK}; border-radius:${radius};"></div>`;

  if (face === 'joyeux') {
    const arcEye = (left) =>
      `<div style="position:absolute; top:${eyeTop + Math.round(eye * 0.2)}px; left:${left}px; width:${eye}px; height:${Math.round(eye * 0.55)}px;
         border:${line}px solid ${INK}; border-bottom:none; border-radius:${eye}px ${eye}px 0 0; box-sizing:border-box;"></div>`;
    return arcEye(eye1) + arcEye(eye2)
      + mouth(Math.round(w * 0.34), Math.round(h * 0.19), `0 0 ${Math.round(w * 0.2)}px ${Math.round(w * 0.2)}px`, Math.round(h * 0.58));
  }

  if (face === 'cyclope') {
    const big = Math.round(w * 0.36);
    return `<div style="position:absolute; top:${Math.round(h * 0.22)}px; left:${Math.round((w - big) / 2)}px; width:${big}px; height:${big}px;
        background:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center;">
        <div style="width:${Math.round(big * 0.42)}px; height:${Math.round(big * 0.42)}px; background:${INK}; border-radius:50%;"></div>
      </div>`
      + mouth(Math.round(w * 0.18), Math.max(3, Math.round(h * 0.05)), '8px', Math.round(h * 0.7));
  }

  if (face === 'grognon') {
    const brow = (left, rot) =>
      `<div style="position:absolute; top:${eyeTop - Math.round(h * 0.07)}px; left:${left}px; width:${Math.round(eye * 1.1)}px;
         height:${Math.max(2, Math.round(h * 0.05))}px; background:${INK}; border-radius:3px; transform:rotate(${rot}deg);"></div>`;
    return brow(eye1 - Math.round(w * 0.01), 16) + brow(eye2 - Math.round(w * 0.01), -16)
      + roundEye(eye1) + roundEye(eye2)
      + mouth(Math.round(w * 0.24), Math.round(h * 0.1), `${Math.round(w * 0.12)}px ${Math.round(w * 0.12)}px 0 0`, Math.round(h * 0.68));
  }

  if (face === 'vampire') {
    const mw = Math.round(w * 0.3);
    const mtop = Math.round(h * 0.6);
    const fangW = Math.max(2, Math.round(w * 0.035));
    const fang = (left) => `<div style="position:absolute; top:${mtop + Math.round(h * 0.02)}px; left:${left}px; width:0; height:0;
      border-left:${fangW}px solid transparent; border-right:${fangW}px solid transparent;
      border-top:${Math.round(h * 0.1)}px solid #fff;"></div>`;
    return roundEye(eye1) + roundEye(eye2)
      + mouth(mw, Math.round(h * 0.15), `0 0 ${Math.round(w * 0.15)}px ${Math.round(w * 0.15)}px`, mtop)
      + fang(Math.round(w * 0.4)) + fang(Math.round(w * 0.55));
  }

  if (face === 'etoiles') {
    const star = Math.round(eye * 1.25);
    const starEye = (left) => `<div style="position:absolute; top:${eyeTop - Math.round(eye * 0.15)}px; left:${left}px;
      width:${star}px; height:${star}px; background:#ffd60a; filter:drop-shadow(0 0 4px rgba(255,214,10,0.7));
      clip-path:polygon(50% 0%, 61.8% 36.3%, 100% 38.2%, 69.1% 60.6%, 80.9% 96.8%, 50% 75%, 19.1% 96.8%, 30.9% 60.6%, 0% 38.2%, 38.2% 36.3%);"></div>`;
    const o = Math.round(w * 0.14);
    return starEye(eye1 - Math.round(w * 0.02)) + starEye(eye2 - Math.round(w * 0.02))
      + `<div style="position:absolute; top:${Math.round(h * 0.6)}px; left:${Math.round((w - o) / 2)}px;
        width:${o}px; height:${o}px; background:${INK}; border-radius:50%;"></div>`;
  }

  // classique
  return roundEye(eye1) + roundEye(eye2)
    + mouth(Math.round(w * 0.23), Math.round(h * 0.13), `0 0 ${Math.round(w * 0.12)}px ${Math.round(w * 0.12)}px`, Math.round(h * 0.64));
}

export function monsterHTML(color, { size = 64, face = 'classique', accessory = 'aucun' } = {}) {
  const w = size;
  const h = Math.round(size * 0.875);

  return `<div class="monster" style="position:relative; width:${w}px; height:${h}px; flex-shrink:0;">
    <div style="position:absolute; inset:0; background:${color};
      border-radius:58% 42% 45% 55% / 50% 55% 45% 50%;
      box-shadow:inset 0 ${-Math.round(h * 0.09)}px 0 rgba(0,0,0,0.15);"></div>
    ${accessoryHTML(accessory, w, h)}
    ${faceHTML(face, w, h)}
  </div>`;
}
