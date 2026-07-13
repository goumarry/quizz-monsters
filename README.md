# Quizz Monsters 👾

Party game web multijoueur en temps réel : des mini-jeux de 3 à 10 secondes, le plus rapide gagne le plus de points. Pensé pour CrazyGames (ultra-léger, graphismes 100 % CSS).

## Stack

- **Client** : Vite + JS vanilla (DOM/CSS, aucun framework, aucune image).
- **Serveur** : Node.js + Socket.IO, **autoritaire** (génère les manches, valide les inputs, calcule les scores).
- **Équité** : synchro d'horloge type NTP par client ; chaque manche démarre à un timestamp serveur commun ; les temps de réaction annoncés sont bornés par ce que le serveur observe (anti-triche).

## Démarrer en dev

```bash
npm install
npm run dev:server   # serveur sur :3210 (terminal 1)
npm run dev:client   # Vite sur :5173, proxy websocket vers :3210 (terminal 2)
```

Ouvre http://localhost:5173 dans plusieurs onglets pour simuler plusieurs joueurs.

## Production

```bash
npm run build   # build du client dans client/dist
npm start       # le serveur Node sert client/dist et les websockets sur :3210
```

## Tests

```bash
npm run test:e2e   # simule une partie complète à 3 joueurs (bots socket.io)
```

## Structure

```
shared/   protocole (évènements socket) + constantes communes
server/   lobby (salons privés/publics), moteur de partie, mini-jeux serveur
client/   écrans (accueil, salon, compte à rebours, HUD, classement, victoire),
          mini-jeux client, synchro d'horloge, tokens CSS de la charte
docs/     charte graphique (docs/charte-graphique.md)
```

## Mini-jeux disponibles

| id | Consigne | Scoring |
|---|---|---|
| `intrus` | Trouve l'unique symbole différent dans la grille (1 seul essai) | vitesse |
| `chrono` | Stoppe le chrono pile sur la cible (l'affichage se cache en route) | précision (1000 pts pile dessus, 0 à 800 ms d'écart) |
| `spam` | Clique le monstre le plus de fois possible | rang au compteur (borné à 25 clics/s anti-autoclick) |
| `aires` | Clique la forme à la plus grande aire (15 types : étoiles, croix, flèches, hexagones…) | vitesse |
| `verre` | Devine le % de remplissage d'un verre souvent évasé (piège : hauteur ≠ %) | précision (0 pt à 30 points d'écart) |
| `feu` | Écran rouge… clique dès qu'il passe au vert (faux départ = 0) | réflexe (1000 pts ≤ 150 ms, 0 pt à 750 ms) |
| `stroop` | Le mot « BLEU » écrit en rose : clique la couleur de l'encre, pas le mot (ou l'inverse, 1 fois sur 2) | vitesse |
| `memo` | Grille de monstres montrée 1,5 s puis masquée : où était le monstre X ? | vitesse |
| `dessine` | Dessine un rond ou un carré d'un seul trait sur le canvas | précision du tracé (10 pts par %) |

Certains jeux (`intrus`, `aires`, `verre`, `memo`) ont une **phase de révélation** :
la bonne réponse s'affiche pour tout le monde pendant 1,5 à 3 s avant le classement
(champ `reveal(round)` + `revealMs` côté serveur, méthode `reveal(data)` côté client).

Astuce dev : `QM_FORCE_GAME=verre npm run dev:server` force un mini-jeu précis.

## Ajouter un mini-jeu

1. `server/src/minigames/<id>.js` — `create(settings)` (données de la manche, la
   solution reste côté serveur), `validate(round, data)`, `score()` optionnel.
   L'enregistrer dans `server/src/minigames/index.js`.
2. `client/src/minigames/<id>.js` — `mount(area, data, ctx)` : rendu + capture
   d'input, `ctx.submit(...)` pour répondre. L'enregistrer dans
   `client/src/minigames/index.js`.

Le moteur (tirage au sort, splash de consigne, chrono synchronisé, scoring,
classement) est commun : rien d'autre à toucher.

## CrazyGames — mise en ligne

Le SDK v3 est intégré (`client/src/sdk.js` + script dans `client/index.html`) :
pub interstitielle en fin de partie (`requestAd('midgame')`, son coupé pendant
la pub), `gameplayStart/Stop`, `happytime`, liens d'invitation
(`game.inviteLink({ code })` / `getInviteParam('code')`). Hors CrazyGames, tout
retombe en no-op — le jeu reste jouable partout. Sur localhost le SDK est en
mode « local » et affiche des pubs de démonstration.

Le jeu étant multijoueur, CrazyGames héberge **le client** (fichiers statiques)
et le serveur Socket.IO doit être hébergé **ailleurs** (Railway, Render, Fly.io,
VPS…), accessible en **HTTPS/WSS** :

```bash
# 1. Déployer le serveur (Node ≥ 20) : PORT fourni par l'hébergeur
npm ci --omit=dev && node server/src/index.js

# 2. Builder le client en pointant vers ce serveur
VITE_SERVER_URL=https://ton-serveur.example.com npm run build

# 3. Zipper client/dist et l'uploader sur le portail développeur CrazyGames
cd client/dist && zip -r ../../quizz-monsters.zip .
```

Sans `VITE_SERVER_URL`, le client se connecte à sa propre origine (mode
auto-hébergé : `npm start` sert `client/dist` + les websockets sur :3210).

Note fiabilité : les timestamps partagés (début de manche…) sont en heure
murale, mais les **durées** sont mesurées en horloge **monotone**
(`server/src/clock.js`, `clock()` dans `client/src/net.js`) et les clients se
resynchronisent toutes les 10 s — une correction NTP en pleine manche ne peut
ni fausser les temps ni faire rejeter des réponses.
