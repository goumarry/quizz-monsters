import { io } from 'socket.io-client';
import { C2S } from '@quizz/shared';

// En dev, Vite proxy /socket.io vers le serveur local. Pour CrazyGames, le
// client (statique) et le serveur multijoueur sont hébergés séparément :
// builder avec VITE_SERVER_URL=https://ton-serveur.example.com (wss requis).
const SERVER_URL = import.meta.env.VITE_SERVER_URL;
export const socket = SERVER_URL ? io(SERVER_URL) : io();

// Horloge locale STABLE (monotone) : contrairement à Date.now(), elle ne saute
// pas quand l'appareil resynchronise son heure — crucial en pleine manche.
export const clock = () => performance.timeOrigin + performance.now();

let offset = 0; // horloge serveur − horloge locale
let rtt = 100;

export function emitAck(event, payload) {
  return new Promise((resolve) => {
    if (payload === undefined) socket.emit(event, resolve);
    else socket.emit(event, payload, resolve);
  });
}

// Synchro type NTP : plusieurs allers-retours, on garde l'échantillon au RTT minimal.
export async function syncClock(samples = 5) {
  let best = Infinity;
  for (let i = 0; i < samples; i++) {
    const sentAt = clock();
    const serverTime = await emitAck(C2S.PING);
    const roundTrip = clock() - sentAt;
    if (roundTrip < best) {
      best = roundTrip;
      offset = serverTime - (sentAt + roundTrip / 2);
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  rtt = Math.round(best);
  socket.emit(C2S.SYNC, rtt);
}

// Convertit un timestamp serveur en timestamp local.
export const toLocal = (serverTs) => serverTs - offset;
export const getRtt = () => rtt;
