import { PLAYER_COLORS } from '@quizz/shared';
import { store, setColor, setFace, setAccessory } from '../state.js';
import { el } from '../ui/dom.js';
import { monsterHTML } from '../ui/monster.js';
import { sound } from '../ui/sound.js';
import { t, colorName } from '../ui/i18n.js';
import { CATALOG, priceOf, isUnlocked, itemId, coinIcon } from '../ui/catalog.js';
import { getSave, unlock } from '../save.js';

// La Boutique : overlay au-dessus de l'accueil. Acheter équipe aussitôt ;
// cliquer un item déjà possédé l'équipe (la boutique sert de vestiaire).
export function openShop(onClose) {
  const overlay = el('<div class="shop-overlay fade-in"></div>');
  document.body.appendChild(overlay);

  const kindTools = {
    color: {
      label: () => t('shop.colors'),
      name: (i) => colorName(PLAYER_COLORS[i]),
      preview: (i) => monsterHTML(PLAYER_COLORS[i], { size: 52, face: store.face, accessory: store.accessory }),
      selected: (i) => store.color === i,
      equip: (i) => setColor(i),
    },
    face: {
      label: () => t('shop.faces'),
      name: (f) => t(`item.${f}`),
      preview: (f) => monsterHTML(PLAYER_COLORS[store.color] ?? PLAYER_COLORS[0], { size: 52, face: f, accessory: 'aucun' }),
      selected: (f) => store.face === f,
      equip: (f) => setFace(f),
    },
    accessory: {
      label: () => t('shop.accessories'),
      name: (a) => t(`item.${a}`),
      preview: (a) => monsterHTML(PLAYER_COLORS[store.color] ?? PLAYER_COLORS[0], { size: 52, face: store.face, accessory: a }),
      selected: (a) => store.accessory === a,
      equip: (a) => setAccessory(a),
    },
  };

  const render = () => {
    const coins = getSave().coins;
    overlay.innerHTML = `
      <div class="shop-panel">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
          <span class="title-display" style="font-size:26px; font-weight:700;">🛍 ${t('shop.title')}</span>
          <div style="display:flex; align-items:center; gap:14px;">
            <span class="stat-chip" style="font-size:16px;">${coinIcon(18)} ${coins}</span>
            <button id="shop-close" class="btn btn-ghost" style="padding:10px 16px; font-size:16px; line-height:1;">✕</button>
          </div>
        </div>
        <p class="hint" style="margin:2px 0 0;">${t('shop.hint')}</p>
        ${CATALOG.map(({ kind, items }) => `
          <div style="display:flex; flex-direction:column; gap:10px;">
            <span class="label" style="font-size:13px;">${kindTools[kind].label()}</span>
            <div class="shop-grid">
              ${items.map((v) => {
                const tools = kindTools[kind];
                const owned = isUnlocked(kind, v);
                const equipped = tools.selected(v);
                const price = priceOf(kind, v);
                return `
                  <button class="shop-card ${equipped ? 'equipped' : ''} ${owned ? '' : 'locked'}" data-kind="${kind}" data-value="${v}">
                    <div style="pointer-events:none; display:flex; align-items:flex-end; justify-content:center; height:56px;">${tools.preview(kind === 'color' ? Number(v) : v)}</div>
                    <span style="pointer-events:none; font-size:11px; font-weight:700; color:var(--text-muted);">${tools.name(kind === 'color' ? Number(v) : v)}</span>
                    ${equipped
                      ? `<span class="badge badge-pret" style="pointer-events:none;">${t('shop.equipped')}</span>`
                      : owned
                        ? `<span style="pointer-events:none; font-size:11px; color:var(--menthe); font-weight:800;">✓</span>`
                        : `<span class="price-chip ${coins >= price ? '' : 'poor'}" style="pointer-events:none;">${coinIcon(12)} ${price}</span>`}
                  </button>`;
              }).join('')}
            </div>
          </div>`).join('')}
      </div>`;
  };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('#shop-close')) return close();
    const card = e.target.closest('.shop-card');
    if (!card) return;
    const { kind } = card.dataset;
    const value = kind === 'color' ? Number(card.dataset.value) : card.dataset.value;
    const tools = kindTools[kind];

    if (!isUnlocked(kind, value)) {
      if (!unlock(itemId(kind, value), priceOf(kind, value))) {
        sound.play('fail');
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 350);
        return;
      }
      sound.play('win'); // acheté ! (et équipé dans la foulée)
    } else {
      sound.play('click');
    }
    tools.equip(value);
    render();
  });

  render();
}
