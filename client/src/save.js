// Sauvegarde persistante du joueur : meilleur score, pièces, items débloqués,
// bonus quotidien. Stockée via le module data du SDK CrazyGames (synchronisée
// sur le compte du joueur s'il est connecté) AVEC miroir localStorage — hors
// CrazyGames ou en cas d'échec du SDK, le localStorage prend le relais.
// Pas de base de données : tout est côté client (cosmétique uniquement).

const KEY = 'qm-save';

const DEFAULTS = () => ({
  v: 1,
  best: 0, // meilleur score total sur une partie
  coins: 0,
  owned: [], // ids d'items : 'color:4', 'face:vampire', 'accessory:halo'…
  games: 0, // parties terminées
  daily: { last: '', streak: 0 }, // bonus quotidien : dernière date réclamée + série
});

// Le module data du SDK n'est fiable qu'après SDK.init() (main.js appelle
// initSave() après sdkReady) et s'utilise comme localStorage (get/setItem).
function sdkData() {
  try {
    const sdk = window.CrazyGames?.SDK;
    if (sdk?.data && sdk.environment !== 'disabled') return sdk.data;
  } catch { /* no-op */ }
  return null;
}

function parse(json) {
  try {
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return null;
    const s = { ...DEFAULTS(), ...raw };
    s.best = Math.max(0, Number(s.best) || 0);
    s.coins = Math.max(0, Number(s.coins) || 0);
    s.games = Math.max(0, Number(s.games) || 0);
    s.owned = Array.isArray(s.owned) ? s.owned.filter((x) => typeof x === 'string') : [];
    if (!s.daily || typeof s.daily !== 'object') s.daily = DEFAULTS().daily;
    return s;
  } catch {
    return null;
  }
}

let save = null;

function persist() {
  const json = JSON.stringify(save);
  try { sdkData()?.setItem(KEY, json); } catch { /* no-op */ }
  try { localStorage.setItem(KEY, json); } catch { /* no-op */ }
}

// À appeler une fois après l'init du SDK. `seed` = sélection actuelle du
// joueur : à la première migration, on lui offre ce qu'il portait déjà
// (aucun joueur existant ne doit perdre son avatar quand des items deviennent payants).
export function initSave(seed = []) {
  let json = null;
  try { json = sdkData()?.getItem(KEY) ?? null; } catch { /* no-op */ }
  if (json == null) {
    try { json = localStorage.getItem(KEY); } catch { /* no-op */ }
  }
  const existing = json != null ? parse(json) : null;
  save = existing ?? DEFAULTS();
  if (!existing) {
    save.owned = [...new Set(seed)];
    persist();
  }
  return save;
}

export function getSave() {
  return save ?? initSave();
}

export function isOwned(id) {
  return getSave().owned.includes(id);
}

export function unlock(id, cost) {
  const s = getSave();
  if (s.owned.includes(id)) return true;
  if (s.coins < cost) return false;
  s.coins -= cost;
  s.owned.push(id);
  persist();
  return true;
}

// ---- Gains de fin de partie -------------------------------------------------
// Proportionnels au score, multipliés par la taille du lobby (jouer à
// plusieurs rapporte plus) et par la place sur le podium. Un joueur seul
// gagne quand même (multiplicateur ×1 + prime de participation).
export function recordGame({ score, players, rank }) {
  const s = getSave();
  const crowd = 1 + 0.25 * Math.min(Math.max(players - 1, 0), 4); // ×1 solo → ×2 à 5+
  const podium = players >= 2 ? ({ 1: 1.5, 2: 1.25, 3: 1.1 }[rank] ?? 1) : 1;
  const coins = Math.round((Math.max(0, score) / 100) * crowd * podium) + 5; // +5 : participation
  const newBest = score > s.best;
  if (newBest) s.best = score;
  s.coins += coins;
  s.games += 1;
  persist();
  return { coins, crowd, podium, newBest, best: s.best, total: s.coins };
}

// ---- Bonus quotidien ----------------------------------------------------------
// Une réclamation par jour (date locale). Les jours consécutifs augmentent la
// série et donc la récompense — levier de rétention J1 assumé.
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dailyReward = (streak) => Math.min(15 + 10 * (streak - 1), 75);

export function dailyState() {
  const s = getSave();
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 864e5));
  const claimable = s.daily.last !== today;
  const nextStreak = s.daily.last === yesterday ? s.daily.streak + 1 : 1;
  return { claimable, streak: claimable ? nextStreak : s.daily.streak, reward: dailyReward(claimable ? nextStreak : s.daily.streak) };
}

export function claimDaily() {
  const s = getSave();
  const state = dailyState();
  if (!state.claimable) return null;
  s.daily = { last: dayKey(new Date()), streak: state.streak };
  s.coins += state.reward;
  persist();
  return { reward: state.reward, streak: state.streak, total: s.coins };
}
