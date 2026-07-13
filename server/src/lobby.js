import {
  S2C, PLAYER_COLORS, ROOM, SPEEDS, DEFAULT_SETTINGS, MONSTER_NAMES,
  AVATAR_FACES, AVATAR_ACCESSORIES,
} from '@quizz/shared';
import { Game } from './game.js';

// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export class LobbyManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // code → room
    this.rtts = new Map(); // socketId → rtt estimé (ms)
  }

  setRtt(socket, rtt) {
    const value = Number(rtt);
    if (Number.isFinite(value)) this.rtts.set(socket.id, Math.min(Math.max(value, 0), 1000));
  }

  // ---- Cycle de vie des salons -------------------------------------------

  create(socket, payload, cb) {
    this.leave(socket);
    const room = this.#newRoom({ isPublic: false });
    this.#addPlayer(room, socket, payload);
    cb?.({ ok: true, code: room.code });
    this.#broadcast(room);
  }

  join(socket, payload, cb) {
    const code = String(payload?.code ?? '').trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return cb?.({ ok: false, error: { k: 'err.noRoom' } });
    if (room.state !== 'lobby') return cb?.({ ok: false, error: { k: 'err.inProgress' } });
    if (room.players.size >= ROOM.MAX_PLAYERS) return cb?.({ ok: false, error: { k: 'err.full' } });
    this.leave(socket);
    this.#addPlayer(room, socket, payload);
    cb?.({ ok: true, code: room.code });
    this.#broadcast(room);
  }

  quickplay(socket, payload, cb) {
    this.leave(socket);
    let room = [...this.rooms.values()].find(
      (r) => r.isPublic && r.state === 'lobby' && r.players.size < ROOM.MAX_PLAYERS,
    );
    if (!room) room = this.#newRoom({ isPublic: true });
    this.#addPlayer(room, socket, payload);
    cb?.({ ok: true, code: room.code });
    this.#broadcast(room);
  }

  leave(socket) {
    const room = this.#roomOf(socket);
    if (!room) return;
    socket.leave(room.code);
    socket.data.code = null;
    room.players.delete(socket.id);
    if (room.players.size === 0) return this.#destroy(room);
    if (room.hostId === socket.id) {
      room.hostId = [...room.players.values()].find((p) => p.connected)?.id ?? room.players.keys().next().value;
    }
    this.#broadcast(room);
  }

  onDisconnect(socket) {
    this.rtts.delete(socket.id);
    const room = this.#roomOf(socket);
    if (!room) return;
    if (room.state === 'lobby' || room.state === 'ended') return this.leave(socket);
    // En pleine partie : on garde le joueur (et son score) mais on le marque déconnecté.
    const player = room.players.get(socket.id);
    if (player) player.connected = false;
    if (![...room.players.values()].some((p) => p.connected)) return this.#destroy(room);
    if (room.hostId === socket.id) {
      room.hostId = [...room.players.values()].find((p) => p.connected).id;
    }
    this.#broadcast(room);
  }

  // ---- Actions de l'hôte --------------------------------------------------

  updateSettings(socket, payload) {
    const room = this.#roomOf(socket);
    if (!room || room.hostId !== socket.id || room.state !== 'lobby') return;
    const rounds = Number(payload?.rounds);
    if (ROOM.ROUNDS_OPTIONS.includes(rounds)) room.settings.rounds = rounds;
    if (payload?.speed in SPEEDS) room.settings.speed = payload.speed;
    this.#broadcast(room);
  }

  setReady(socket, payload) {
    const room = this.#roomOf(socket);
    const player = room?.players.get(socket.id);
    if (!player || room.state !== 'lobby') return;
    player.ready = !!payload?.ready;
    this.#broadcast(room);
  }

  startGame(socket, cb) {
    const room = this.#roomOf(socket);
    if (!room || room.hostId !== socket.id) return cb?.({ ok: false, error: { k: 'err.hostOnly' } });
    if (room.state !== 'lobby') return cb?.({ ok: false, error: { k: 'err.already' } });
    if (room.players.size < ROOM.MIN_PLAYERS) return cb?.({ ok: false, error: { k: 'err.notEnough' } });
    room.state = 'playing';
    room.game = new Game(this.io, room, {
      getRtt: (id) => this.rtts.get(id) ?? 200,
      onEnd: () => {
        room.state = 'ended';
        room.game = null;
        // Purge des joueurs partis en cours de route.
        for (const [id, p] of room.players) if (!p.connected) room.players.delete(id);
        if (room.players.size === 0) this.#destroy(room);
      },
    });
    cb?.({ ok: true });
    this.#broadcast(room);
    room.game.start();
  }

  replay(socket, cb) {
    const room = this.#roomOf(socket);
    if (!room || room.hostId !== socket.id || room.state !== 'ended') return cb?.({ ok: false });
    room.state = 'lobby';
    for (const p of room.players.values()) {
      p.score = 0;
      p.ready = false;
    }
    cb?.({ ok: true });
    this.#broadcast(room);
  }

  onInput(socket, payload, cb) {
    const room = this.#roomOf(socket);
    if (!room?.game) return cb?.({ ok: false });
    room.game.onInput(socket, payload, cb);
  }

  // ---- Interne -------------------------------------------------------------

  #newRoom({ isPublic }) {
    let code;
    do {
      code = Array.from({ length: ROOM.CODE_LENGTH }, () =>
        CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
      ).join('');
    } while (this.rooms.has(code));
    const room = {
      code,
      isPublic,
      state: 'lobby', // lobby | playing | ended
      hostId: null,
      players: new Map(),
      settings: { ...DEFAULT_SETTINGS },
      game: null,
    };
    this.rooms.set(code, room);
    return room;
  }

  #destroy(room) {
    room.game?.destroy();
    room.game = null;
    this.rooms.delete(room.code);
  }

  #addPlayer(room, socket, payload) {
    let name = String(payload?.name ?? '').trim().slice(0, ROOM.MAX_NAME_LENGTH);
    if (!name) name = MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
    const used = new Set([...room.players.values()].map((p) => p.color));
    // Couleur d'avatar choisie par le joueur si elle est libre, sinon la première libre.
    const preferred = PLAYER_COLORS[Number(payload?.color)];
    const color = (preferred && !used.has(preferred) && preferred)
      || PLAYER_COLORS.find((c) => !used.has(c))
      || PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
    room.players.set(socket.id, {
      id: socket.id,
      name,
      color,
      face: AVATAR_FACES.includes(payload?.face) ? payload.face : AVATAR_FACES[0],
      accessory: AVATAR_ACCESSORIES.includes(payload?.accessory) ? payload.accessory : AVATAR_ACCESSORIES[0],
      ready: false,
      connected: true,
      score: 0,
    });
    if (!room.hostId) room.hostId = socket.id;
    socket.join(room.code);
    socket.data.code = room.code;
  }

  #roomOf(socket) {
    return socket.data.code ? this.rooms.get(socket.data.code) : undefined;
  }

  #broadcast(room) {
    this.io.to(room.code).emit(S2C.STATE, serializeRoom(room));
  }
}

export function serializeRoom(room) {
  return {
    code: room.code,
    isPublic: room.isPublic,
    state: room.state,
    hostId: room.hostId,
    settings: room.settings,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      face: p.face,
      accessory: p.accessory,
      ready: p.ready,
      connected: p.connected,
      score: p.score,
    })),
  };
}
