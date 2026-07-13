// Deux horloges complémentaires — ne pas les mélanger :
//  - Date.now() (murale) : la timebase PARTAGÉE avec les clients (startAt,
//    nextAt…). Les corrections NTP peuvent la faire sauter de quelques
//    centaines de ms, mais elle reste proche de l'heure vraie : l'offset
//    mesuré par les clients reste borné pendant toute la session.
//  - mono() (monotone) : la mesure des DURÉES côté serveur (elapsed d'une
//    manche). Elle ne saute jamais (un saut rendrait serverElapsed négatif et
//    ferait rejeter des réponses), mais elle peut dériver de plusieurs %
//    (ex : WSL2) — ne jamais l'envoyer à un client.
export const mono = () => performance.now();
