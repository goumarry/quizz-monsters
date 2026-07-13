import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server } from 'socket.io';
import { C2S } from '@quizz/shared';
import { LobbyManager } from './lobby.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
// En production le serveur sert directement le build du client.
app.use(express.static(path.resolve(__dirname, '../../client/dist')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });
const lobby = new LobbyManager(io);

io.on('connection', (socket) => {
  // Synchro d'horloge : le client mesure son offset via des allers-retours.
  // Heure MURALE : elle reste proche de l'heure vraie (l'offset client reste
  // borné) — les durées, elles, sont mesurées en monotone (voir clock.js).
  socket.on(C2S.PING, (cb) => {
    if (typeof cb === 'function') cb(Date.now());
  });
  socket.on(C2S.SYNC, (rtt) => lobby.setRtt(socket, rtt));

  socket.on(C2S.CREATE, (payload, cb) => lobby.create(socket, payload, cb));
  socket.on(C2S.JOIN, (payload, cb) => lobby.join(socket, payload, cb));
  socket.on(C2S.QUICKPLAY, (payload, cb) => lobby.quickplay(socket, payload, cb));
  socket.on(C2S.SETTINGS, (payload) => lobby.updateSettings(socket, payload));
  socket.on(C2S.READY, (payload) => lobby.setReady(socket, payload));
  socket.on(C2S.START, (cb) => lobby.startGame(socket, cb));
  socket.on(C2S.REPLAY, (cb) => lobby.replay(socket, cb));
  socket.on(C2S.LEAVE, () => lobby.leave(socket));
  socket.on(C2S.INPUT, (payload, cb) => lobby.onInput(socket, payload, cb));
  socket.on('disconnect', () => lobby.onDisconnect(socket));
});

const PORT = process.env.PORT || 3210;
server.listen(PORT, () => {
  console.log(`Quizz Monsters — serveur prêt sur http://localhost:${PORT}`);
});
