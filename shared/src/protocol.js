// Noms des évènements Socket.IO. Client → Serveur (C2S) et Serveur → Client (S2C).

export const C2S = {
  PING: 'time:ping',
  SYNC: 'time:sync',
  CREATE: 'room:create',
  JOIN: 'room:join',
  QUICKPLAY: 'room:quickplay',
  SETTINGS: 'room:settings',
  READY: 'room:ready',
  START: 'room:start',
  LEAVE: 'room:leave',
  REPLAY: 'room:replay',
  INPUT: 'round:input',
};

export const S2C = {
  STATE: 'room:state',
  COUNTDOWN: 'game:countdown',
  PREPARE: 'round:prepare',
  REVEAL: 'round:reveal',
  RESULT: 'round:result',
  OVER: 'game:over',
  ERROR: 'room:error',
};
