import { S2C, TIMING, SCORING } from '@quizz/shared';
import { mono } from './clock.js';
import { pickMinigame } from './minigames/index.js';

// Moteur d'une partie : enchaîne compte à rebours → manches → classements → victoire.
// Le serveur est autoritaire : il génère les manches, valide les inputs et score.
export class Game {
  constructor(io, room, { getRtt, onEnd }) {
    this.io = io;
    this.room = room;
    this.getRtt = getRtt;
    this.onEnd = onEnd;
    this.roundIndex = 0;
    this.round = null;
    this.lastMinigameId = null;
    this.prevRanks = new Map();
    this.timers = new Set();
    this.destroyed = false;
  }

  start() {
    const startAt = Date.now() + TIMING.COUNTDOWN_MS;
    this.#emit(S2C.COUNTDOWN, { startAt, seconds: TIMING.COUNTDOWN_MS / 1000 });
    this.#after(TIMING.COUNTDOWN_MS, () => this.#startRound());
  }

  destroy() {
    this.destroyed = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
  }

  onInput(socket, payload, cb) {
    const r = this.round;
    const player = this.room.players.get(socket.id);
    if (!r || r.closed || !player) return cb?.({ ok: false });
    // Les jeux « multi » (ex : Spam Click) mettent à jour leur réponse en continu.
    if (!r.def.multi && r.answers.has(socket.id)) return cb?.({ ok: false });

    // Durée mesurée à l'horloge MONOTONE : un saut d'heure murale (NTP) en
    // pleine manche ne peut ni rendre elapsed négatif ni rejeter des réponses.
    const serverElapsed = Math.round(mono() - r.startMono);
    // Trop tôt (impossible sans triche) ou trop tard : refusé.
    if (serverElapsed < 0 || serverElapsed > r.duration + TIMING.RESULT_GRACE_MS) return cb?.({ ok: false });

    // Le temps de réaction annoncé par le client est borné par ce que le serveur
    // observe (aller simple ≈ RTT/2, avec une marge) : il ne peut pas mentir en mieux.
    const rtt = this.getRtt(socket.id);
    let elapsed = Number(payload?.elapsed);
    if (!Number.isFinite(elapsed)) elapsed = serverElapsed;
    elapsed = Math.round(Math.min(Math.max(elapsed, serverElapsed - rtt - 300, 0), serverElapsed));

    const result = r.def.validate(r, payload?.data ?? {}, elapsed);
    r.answers.set(socket.id, { success: !!result.success, elapsed, detail: result.detail ?? null });
    // clientDetail : feedback révélé au joueur qui vient de répondre (ex : le vrai %).
    cb?.({ ok: true, success: !!result.success, detail: result.clientDetail ?? null });

    // Tout le monde a répondu → on écourte la manche (sauf jeux « multi »).
    const everyoneAnswered = !r.def.multi && [...this.room.players.values()]
      .filter((p) => p.connected)
      .every((p) => r.answers.has(p.id));
    if (everyoneAnswered && this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.timers.delete(this.roundTimer);
      this.roundTimer = this.#after(TIMING.EARLY_END_MS, () => this.#endRound());
    }
  }

  // ---- Interne -------------------------------------------------------------

  #startRound() {
    const def = pickMinigame(this.lastMinigameId);
    this.lastMinigameId = def.id;
    const created = def.create(this.room.settings);
    const startAt = Date.now() + TIMING.PREPARE_MS;
    this.round = {
      def,
      startAt,
      startMono: mono() + TIMING.PREPARE_MS,
      duration: created.duration,
      data: created.data, // envoyé aux clients
      state: created.state, // secret côté serveur (ex : position de la cible)
      title: created.title,
      answers: new Map(),
    };
    this.#emit(S2C.PREPARE, {
      round: this.roundIndex + 1,
      total: this.room.settings.rounds,
      minigameId: def.id,
      title: created.title,
      data: created.data,
      startAt,
      duration: created.duration,
    });
    this.roundTimer = this.#after(
      TIMING.PREPARE_MS + created.duration + TIMING.RESULT_GRACE_MS,
      () => this.#endRound(),
    );
  }

  #endRound() {
    const r = this.round;
    if (!r) return;

    // Phase de révélation : certains jeux montrent la bonne réponse à tout le
    // monde pendant quelques secondes avant le classement (% du verre, case de
    // l'intrus…). La manche est verrouillée, plus aucun input accepté.
    if (r.def.reveal && !r.revealed) {
      r.revealed = true;
      r.closed = true;
      this.#emit(S2C.REVEAL, { data: r.def.reveal(r) });
      this.roundTimer = this.#after(r.def.revealMs ?? 2500, () => this.#endRound());
      return;
    }

    this.round = null;
    this.roundTimer = null;

    const entries = [...this.room.players.values()].map((p) => {
      const a = r.answers.get(p.id);
      return { id: p.id, success: a?.success ?? false, elapsed: a?.elapsed ?? null, detail: a?.detail ?? null };
    });
    (r.def.score ?? defaultScore)(entries, r);

    for (const e of entries) {
      const p = this.room.players.get(e.id);
      if (p) p.score += e.gained;
    }

    const leaderboard = [...this.room.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => {
        const e = entries.find((en) => en.id === p.id);
        return {
          id: p.id,
          name: p.name,
          color: p.color,
          face: p.face,
          accessory: p.accessory,
          connected: p.connected,
          score: p.score,
          rank: i + 1,
          delta: this.prevRanks.has(p.id) ? this.prevRanks.get(p.id) - (i + 1) : 0,
          gained: e?.gained ?? 0,
          success: e?.success ?? false,
          // Résumé lisible de la réponse (comparaison entre joueurs).
          result: e ? resultText(e, r) : null,
        };
      });
    this.prevRanks = new Map(leaderboard.map((l) => [l.id, l.rank]));

    this.roundIndex += 1;
    const finished = this.roundIndex >= this.room.settings.rounds;
    this.#emit(S2C.RESULT, {
      round: this.roundIndex,
      total: this.room.settings.rounds,
      leaderboard,
      finished,
      nextAt: Date.now() + TIMING.LEADERBOARD_MS,
    });
    this.#after(TIMING.LEADERBOARD_MS, () => (finished ? this.#over(leaderboard) : this.#startRound()));
  }

  #over(leaderboard) {
    this.#emit(S2C.OVER, { leaderboard, podium: leaderboard.slice(0, 3) });
    this.destroy();
    this.onEnd();
  }

  #emit(event, payload) {
    this.io.to(this.room.code).emit(event, payload);
  }

  #after(ms, fn) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      if (!this.destroyed) fn();
    }, ms);
    this.timers.add(t);
    return t;
  }
}

// Scoring par défaut : réussite = base fixe + bonus dégressif selon le rang de rapidité.
export function defaultScore(entries) {
  const ok = entries.filter((e) => e.success).sort((a, b) => a.elapsed - b.elapsed);
  entries.forEach((e) => (e.gained = 0));
  ok.forEach((e, i) => {
    e.gained = SCORING.BASE + Math.round((SCORING.SPEED_BONUS * (ok.length - i)) / ok.length);
  });
}

// Résumé de la réponse d'un joueur, affiché sur le classement pour que chacun
// puisse se comparer (réponse donnée, temps, réflexe…). On envoie une CLÉ de
// traduction (+ paramètres) : chaque client l'affiche dans sa langue. Chaque
// mini-jeu peut fournir son propre format via def.formatResult(entry, round).
function resultText(e, r) {
  if (e.elapsed === null && !e.detail) return { k: 'res.none' };
  const custom = r.def.formatResult?.(e, r);
  if (custom) return custom;
  if (!e.success) return { k: 'res.missed' };
  return { k: 'res.found', s: (e.elapsed / 1000).toFixed(1) };
}
