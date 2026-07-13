import { MONSTER_NAMES, AVATAR_FACES, AVATAR_ACCESSORIES } from '@quizz/shared';

function randomName() {
  return MONSTER_NAMES[Math.floor(Math.random() * MONSTER_NAMES.length)];
}

export const store = {
  name: localStorage.getItem('qm-name') || randomName(),
  color: Number(localStorage.getItem('qm-color') ?? 0), // index dans PLAYER_COLORS
  face: AVATAR_FACES.includes(localStorage.getItem('qm-face')) ? localStorage.getItem('qm-face') : AVATAR_FACES[0],
  accessory: AVATAR_ACCESSORIES.includes(localStorage.getItem('qm-accessory'))
    ? localStorage.getItem('qm-accessory')
    : AVATAR_ACCESSORIES[0],
  room: null, // dernier room:state reçu
  leaderboard: null, // dernier classement reçu
  inviteCode: new URLSearchParams(location.search).get('code')?.toUpperCase() ?? '',
};

export function setName(name) {
  store.name = name;
  localStorage.setItem('qm-name', name);
}

export function setColor(index) {
  store.color = index;
  localStorage.setItem('qm-color', String(index));
}

export function setFace(face) {
  store.face = face;
  localStorage.setItem('qm-face', face);
}

export function setAccessory(accessory) {
  store.accessory = accessory;
  localStorage.setItem('qm-accessory', accessory);
}

export function me() {
  return store.room?.players.find((p) => p.id === myId());
}

let _myId = null;
export function setMyId(id) {
  _myId = id;
}
export function myId() {
  return _myId;
}

export function isHost() {
  return store.room && store.room.hostId === myId();
}
