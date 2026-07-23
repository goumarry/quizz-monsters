import { SPEEDS, PLAYER_COLORS, MONSTER_NAMES, AVATAR_FACES, AVATAR_ACCESSORIES } from '@quizz/shared';

// Les 7 Différences : la grille affiche les avatars du salon (vrais joueurs +
// figurants générés si le salon est petit), avec leurs pseudos — comme dans le
// salon d'attente. Après une courte mémorisation, UN avatar change de visage ou
// de couleur d'accessoire : il faut le retrouver le plus vite possible.
// Toujours 16 cases (grille 4×4, cf. .diff-grid en CSS).
const GRID_COUNT = 16;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickOther = (arr, exclude) => {
  const other = arr.filter((v) => v !== exclude);
  return other.length ? pick(other) : pick(arr);
};

export default {
  id: 'diff',

  create(settings, room) {
    const mult = SPEEDS[settings.speed]?.mult ?? 1;
    const realPlayers = room ? [...room.players.values()] : [];
    const usedNames = new Set(realPlayers.map((p) => p.name));

    const cells = realPlayers.slice(0, GRID_COUNT).map((p) => ({
      name: p.name, color: p.color, face: p.face, accessory: p.accessory,
    }));

    while (cells.length < GRID_COUNT) {
      let name = pick(MONSTER_NAMES);
      let tries = 0;
      while (usedNames.has(name) && tries++ < 20) name = pick(MONSTER_NAMES);
      usedNames.add(name);
      cells.push({ name, color: pick(PLAYER_COLORS), face: pick(AVATAR_FACES), accessory: pick(AVATAR_ACCESSORIES) });
    }
    cells.sort(() => Math.random() - 0.5);

    const target = Math.floor(Math.random() * cells.length);
    const real = cells.map((c) => ({ face: c.face, accessory: c.accessory }));
    const shown = cells.map((c) => ({ face: c.face, accessory: c.accessory }));
    if (Math.random() < 0.5) shown[target].face = pickOther(AVATAR_FACES, real[target].face);
    else shown[target].accessory = pickOther(AVATAR_ACCESSORIES, real[target].accessory);

    const showMs = Math.round(1700 * mult);
    return {
      title: { k: 'mg.diff.title' },
      duration: showMs + Math.round(5500 * mult),
      data: {
        cells: cells.map((c, i) => ({
          name: c.name,
          color: c.color,
          realFace: real[i].face,
          realAccessory: real[i].accessory,
          face: shown[i].face,
          accessory: shown[i].accessory,
        })),
        showMs,
      },
      state: { target },
    };
  },

  validate(round, data) {
    return { success: Number(data?.index) === round.state.target };
  },

  reveal(round) {
    return { index: round.state.target };
  },
  revealMs: 2200,
};
