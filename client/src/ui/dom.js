// Échappe les valeurs interpolées dans du HTML (noms de joueurs…).
export function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// Format « 1 875 » (espace fine des milliers, cf. charte).
export function formatNum(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function toast(message) {
  document.querySelector('.toast')?.remove();
  const node = el(`<div class="toast">${esc(message)}</div>`);
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}
