// Test de bout en bout : lance le serveur, simule 3 joueurs socket.io et joue
// une partie complète de 10 manches. Les bots savent jouer aux 5 mini-jeux :
// BotA joue parfaitement, BotB moyennement, BotC mal — le scoring doit refléter
// cet ordre à chaque manche, quel que soit le jeu tiré au sort.
import { spawn } from 'node:child_process';
import { io } from 'socket.io-client';
import { C2S, S2C, shapeArea } from '@quizz/shared';

const PORT = 3995;
const URL = `http://localhost:${PORT}`;
const ROUNDS = 10;

// Les timestamps partagés (startAt…) sont en heure murale : on se cale dessus
// avec Date.now() au moment de la réception ; l'attente elle-même (setTimeout)
// est monotone des deux côtés, comme la mesure d'elapsed du serveur.

let failures = 0;
const check = (cond, label) => {
  if (cond) console.log('  ✓', label);
  else {
    failures += 1;
    console.error('  ✗', label);
  }
};

const emitAck = (socket, event, payload) =>
  new Promise((resolve) =>
    payload === undefined ? socket.emit(event, resolve) : socket.emit(event, payload, resolve),
  );

const once = (socket, event, ms = 30000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout en attendant ${event}`)), ms);
    socket.once(event, (payload) => {
      clearTimeout(t);
      resolve(payload);
    });
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// ---- Stratégies par mini-jeu : renvoie { delay, data } pour un bot (0=A, 1=B, 2=C).
const strategies = {
  intrus(prep, bot) {
    const counts = {};
    for (const c of prep.data.cells) counts[c] = (counts[c] ?? 0) + 1;
    const odd = Object.keys(counts).find((k) => counts[k] === 1);
    const target = prep.data.cells.indexOf(odd);
    const wrong = (target + 1) % prep.data.cells.length;
    return [
      { delay: 120, data: { index: target } },
      { delay: 450, data: { index: target } },
      { delay: 250, data: { index: wrong } },
    ][bot];
  },
  chrono(prep, bot) {
    const t = prep.data.target;
    return { delay: t + [0, 300, 900][bot], data: {} };
  },
  spam(prep, bot) {
    return { delay: 500, data: { count: [30, 15, 3][bot] } };
  },
  aires(prep, bot) {
    const areas = prep.data.shapes.map(shapeArea);
    const best = areas.indexOf(Math.max(...areas));
    const wrong = (best + 1) % areas.length;
    return [
      { delay: 150, data: { index: best } },
      { delay: 500, data: { index: best } },
      { delay: 300, data: { index: wrong } },
    ][bot];
  },
  verre(prep, bot) {
    const { wb, wt, water: f } = prep.data;
    const level = Math.round(((wb * f + ((wt - wb) * f * f) / 2) / ((wb + wt) / 2)) * 100);
    const off = [0, 10, 40][bot] * (level > 50 ? -1 : 1);
    return { delay: 200 + bot * 150, data: { pct: clamp(level + off, 0, 100) } };
  },
  feu(prep, bot) {
    // A réflexe parfait, B correct, C faux départ (clique avant le vert).
    return { delay: prep.data.goAt + [150, 400, -500][bot], data: {} };
  },
  stroop(prep, bot) {
    // mode 'ink' → couleur de l'encre ; mode 'word' → couleur que dit le mot.
    const answerHex = prep.data.mode === 'word' ? prep.data.wordHex : prep.data.ink;
    const correct = prep.data.options.indexOf(answerHex);
    const wrong = (correct + 1) % prep.data.options.length;
    return [
      { delay: 150, data: { index: correct } },
      { delay: 450, data: { index: correct } },
      { delay: 300, data: { index: wrong } },
    ][bot];
  },
  memo(prep, bot) {
    const target = prep.data.cells.indexOf(prep.data.targetColor);
    const wrong = (target + 1) % prep.data.cells.length;
    const after = prep.data.showMs;
    return [
      { delay: after + 150, data: { index: target } },
      { delay: after + 450, data: { index: target } },
      { delay: after + 300, data: { index: wrong } },
    ][bot];
  },
  dessine(prep, bot) {
    // A trace la forme parfaite, B une version tremblante, C une simple ligne.
    const trace = (jitter, line) => {
      const pts = [];
      const N = 80;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        let x;
        let y;
        if (line) {
          x = 0.2 + 0.6 * t;
          y = 0.2 + 0.6 * t;
        } else if (prep.data.shape === 'rond') {
          const a = t * 2 * Math.PI;
          const r = 0.3 * (1 + (Math.random() * 2 - 1) * jitter);
          x = 0.5 + r * Math.cos(a);
          y = 0.5 + r * Math.sin(a);
        } else {
          // Périmètre du carré [0.2 .. 0.8], avec un peu de tremblement.
          const s = Math.min(t * 4, 3.9999);
          const edge = Math.floor(s);
          const f = s - edge;
          const j = (Math.random() * 2 - 1) * jitter * 0.3;
          if (edge === 0) { x = 0.2 + 0.6 * f; y = 0.2 + j; }
          else if (edge === 1) { x = 0.8 + j; y = 0.2 + 0.6 * f; }
          else if (edge === 2) { x = 0.8 - 0.6 * f; y = 0.8 + j; }
          else { x = 0.2 + j; y = 0.8 - 0.6 * f; }
        }
        pts.push([x, y]);
      }
      return pts;
    };
    return [
      { delay: 400, data: { points: trace(0) } },
      { delay: 700, data: { points: trace(0.18) } },
      { delay: 500, data: { points: trace(0, true) } },
    ][bot];
  },
};

// --- Démarrage du serveur ----------------------------------------------------
const server = spawn('node', ['server/src/index.js'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
server.stderr.on('data', (d) => console.error('[server]', String(d).trim()));
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('le serveur ne démarre pas')), 5000);
  server.stdout.on('data', (d) => {
    if (String(d).includes('serveur prêt')) {
      clearTimeout(t);
      resolve();
    }
  });
});

const globalTimeout = setTimeout(() => {
  console.error('✗ Timeout global du test');
  server.kill();
  process.exit(1);
}, 260000);

try {
  // --- Connexion des 3 bots ---------------------------------------------------
  const connect = () =>
    new Promise((resolve) => {
      const s = io(URL, { transports: ['websocket'] });
      s.on('connect', () => resolve(s));
    });
  const [botA, botB, botC] = await Promise.all([connect(), connect(), connect()]);
  const sockets = [botA, botB, botC];
  console.log('Lobby :');

  // --- Création / join ---------------------------------------------------------
  const created = await emitAck(botA, C2S.CREATE, { name: 'BotA' });
  check(created.ok && /^[A-Z2-9]{5}$/.test(created.code), `salon créé avec un code valide (${created.code})`);

  const joinedB = await emitAck(botB, C2S.JOIN, { code: created.code, name: 'BotB' });
  const joinedC = await emitAck(botC, C2S.JOIN, { code: created.code.toLowerCase(), name: 'BotC' });
  check(joinedB.ok && joinedC.ok, 'BotB et BotC rejoignent (code insensible à la casse)');

  const badJoin = await emitAck(botC, C2S.JOIN, { code: 'ZZZZZ', name: 'X' });
  check(!badJoin.ok, 'un code inexistant est refusé');
  await sleep(150);

  // --- Réglages (hôte) ----------------------------------------------------------
  botA.emit(C2S.SETTINGS, { rounds: ROUNDS, speed: 'eclair' });
  const stateAfterSettings = await once(botB, S2C.STATE);
  check(
    stateAfterSettings.settings.rounds === ROUNDS && stateAfterSettings.settings.speed === 'eclair',
    `réglages de l'hôte propagés (${ROUNDS} manches, éclair)`,
  );
  check(stateAfterSettings.players.length === 3, '3 joueurs dans le salon');
  check(
    new Set(stateAfterSettings.players.map((p) => p.color)).size === 3,
    'chaque joueur a une couleur différente',
  );

  // --- Les bots jouent chaque manche ---------------------------------------------
  const acks = new Map(); // "round:bot" → ack
  const gamesSeen = [];

  sockets.forEach((socket, bot) => {
    socket.on(S2C.PREPARE, (prep) => {
      if (bot === 0) gamesSeen.push(prep.minigameId);
      const strategy = strategies[prep.minigameId];
      if (!strategy) return check(false, `stratégie inconnue pour ${prep.minigameId}`);
      const { delay, data } = strategy(prep, bot);
      setTimeout(async () => {
        const ack = await emitAck(socket, C2S.INPUT, { data, elapsed: delay });
        acks.set(`${prep.round}:${bot}`, ack);
      }, prep.startAt - Date.now() + delay);
    });
  });

  const results = [];
  botA.on(S2C.RESULT, (r) => results.push(r));

  // --- Lancement -----------------------------------------------------------------
  const badStart = await emitAck(botB, C2S.START);
  check(!badStart.ok, 'un invité ne peut pas lancer la partie');
  const started = await emitAck(botA, C2S.START);
  check(started.ok, "l'hôte lance la partie");

  const countdown = await once(botC, S2C.COUNTDOWN);
  check(countdown.startAt > Date.now(), 'compte à rebours reçu avec un timestamp futur');

  const firstPrep = await once(botC, S2C.PREPARE);
  check(
    firstPrep.round === 1 && firstPrep.total === ROUNDS && firstPrep.title?.k && firstPrep.duration > 0,
    `manche 1 reçue (clé « ${firstPrep.title?.k} »)`,
  );

  // --- Fin de partie ---------------------------------------------------------------
  const over = await once(botA, S2C.OVER, 240000);
  console.log(`Partie jouée : ${gamesSeen.join(' → ')}`);
  check(results.length === ROUNDS, `${ROUNDS} classements intermédiaires reçus`);
  check(new Set(gamesSeen).size >= 3, `variété des mini-jeux (${new Set(gamesSeen).size} jeux distincts)`);
  check(
    gamesSeen.every((g, i) => i === 0 || g !== gamesSeen[i - 1]),
    'jamais deux fois le même mini-jeu d’affilée',
  );

  const byId = (r, socket) => r.leaderboard.find((p) => p.id === socket.id);
  results.forEach((r, i) =>
    console.log(
      `    manche ${i + 1} (${gamesSeen[i]}) : A=${byId(r, botA).gained} B=${byId(r, botB).gained} C=${byId(r, botC).gained}`,
    ),
  );
  check(
    results.every((r) => byId(r, botA).gained > byId(r, botB).gained && byId(r, botB).gained > byId(r, botC).gained),
    'chaque manche : mieux jouer rapporte plus (A > B > C), tous jeux confondus',
  );
  check(
    [...acks.entries()].filter(([k]) => k.endsWith(':0')).every(([, a]) => a?.ok && a?.success),
    'toutes les réponses parfaites de BotA sont confirmées « success »',
  );
  check(
    results.every((r) => r.leaderboard.every((p, i, arr) => i === 0 || arr[i - 1].score >= p.score)),
    'classements triés par score décroissant',
  );
  check(results[ROUNDS - 1].finished === true, 'dernière manche marquée « finished »');
  check(over.podium.length === 3 && over.podium[0].rank === 1, 'podium reçu, vainqueur au rang 1');
  check(over.podium[0].id === botA.id, 'BotA (parfait partout) remporte la partie');

  // --- Replay -----------------------------------------------------------------------
  const replayed = await emitAck(botA, C2S.REPLAY);
  const stateAfterReplay = await once(botB, S2C.STATE);
  check(replayed.ok && stateAfterReplay.state === 'lobby', 'REJOUER ramène tout le monde au salon');
  check(stateAfterReplay.players.every((p) => p.score === 0), 'les scores sont remis à zéro');

  // --- Départ / transfert d'hôte ------------------------------------------------------
  botA.disconnect();
  const stateAfterLeave = await once(botB, S2C.STATE);
  check(stateAfterLeave.players.length === 2, "le départ de l'hôte retire son monstre");
  check(stateAfterLeave.hostId !== botA.id, "l'hôte est transféré à un autre joueur");

  botB.disconnect();
  botC.disconnect();
} catch (err) {
  failures += 1;
  console.error('  ✗ Exception :', err.message);
} finally {
  clearTimeout(globalTimeout);
  server.kill();
}

console.log(failures === 0 ? '\n✅ E2E : tout est vert.' : `\n❌ E2E : ${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
