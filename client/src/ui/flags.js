// Petits drapeaux SVG (rendu garanti partout, contrairement aux emoji drapeau
// qui n'existent pas sur Windows — Segoe UI Emoji affiche les 2 lettres du
// pays dans une boîte au lieu du drapeau).
const FLAGS = {
  en: `<svg viewBox="0 0 30 20" width="100%" height="100%">
    <rect width="30" height="20" fill="#00247d"/>
    <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/>
    <path d="M0,0 L30,20 M30,0 L0,20" stroke="#cf142b" stroke-width="1.8"/>
    <path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="6.5"/>
    <path d="M15,0 V20 M0,10 H30" stroke="#cf142b" stroke-width="3.6"/>
  </svg>`,
  fr: `<svg viewBox="0 0 30 20" width="100%" height="100%">
    <rect width="30" height="20" fill="#fff"/>
    <rect width="10" height="20" fill="#0055a4"/>
    <rect x="20" width="10" height="20" fill="#ef4135"/>
  </svg>`,
  es: `<svg viewBox="0 0 30 20" width="100%" height="100%">
    <rect width="30" height="20" fill="#aa151b"/>
    <rect y="5" width="30" height="10" fill="#f1bf00"/>
  </svg>`,
  de: `<svg viewBox="0 0 30 20" width="100%" height="100%">
    <rect width="30" height="6.67" fill="#000"/>
    <rect y="6.67" width="30" height="6.67" fill="#dd0000"/>
    <rect y="13.34" width="30" height="6.66" fill="#ffce00"/>
  </svg>`,
  pt: `<svg viewBox="0 0 30 20" width="100%" height="100%">
    <rect width="30" height="20" fill="#ff0000"/>
    <rect width="12" height="20" fill="#046a38"/>
    <circle cx="12" cy="10" r="4" fill="#ffce00" stroke="#fff" stroke-width="0.6"/>
  </svg>`,
};

// icon(code, size) → un petit drapeau arrondi de `size` px de large (ratio 3:2).
export function flagIcon(code, size = 24) {
  const svg = FLAGS[code] ?? FLAGS.en;
  return `<span style="display:inline-flex; width:${size}px; height:${Math.round((size * 2) / 3)}px;
    border-radius:4px; overflow:hidden; box-shadow:0 0 0 1px rgba(255,255,255,0.15); flex-shrink:0;">${svg}</span>`;
}
