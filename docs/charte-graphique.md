# Quizz Monsters — Charte graphique

Source : projet Claude Design `8cbafbbd-6b76-47f0-b997-93f30a76ab78` (fichier `Quizz Monsters - Charte Graphique.dc.html`).

Ambiance : party game d'arcade, néon sombre, créatures rigolotes. Une couleur par joueur, une silhouette de monstre commune.

## Couleurs

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#150c2b` | Fond de page |
| `--surface` | `#1f1440` | Panneaux / cartes principales |
| `--surface-2` | `#2a1b52` | Cartes secondaires, inputs, tuiles |
| `--gradient` | `linear-gradient(160deg,#1f1440 0%,#2a1a52 55%,#1f1440 100%)` | Fond des écrans |
| `--text` | `#f5f1ff` | Texte principal |
| `--text-muted` | `#b7a9dd` | Texte secondaire |
| `--text-dim` | `#8a7ab8` | Texte tertiaire / labels |
| `--text-disabled` | `#5c4d8a` | Boutons désactivés |
| `--border` | `rgba(255,255,255,0.06)` | Bordures de cartes |

### Palette joueurs (8 teintes, une par joueur)

| Nom | Hex |
|---|---|
| ROSE | `#ff2e88` |
| MENTHE | `#2effc7` |
| SOLEIL | `#ffd60a` |
| MANGUE | `#ff8a3d` |
| VIOLET | `#b967ff` |
| CIEL | `#3ad1ff` |
| POMME | `#7cff6b` |
| CORAIL | `#ff5d5d` |

Accents : ROSE = action principale (CTA), MENTHE = action secondaire / succès / "en direct", SOLEIL = hôte / rangs, CORAIL = négatif / descente.

Ombres de boutons 3D : rose → `0 6px 0 #b81f66` (8px pour les gros), menthe → `0 6px 0 #1a9c76`.

## Typographie

- **Fredoka** (500/600/700) — titres, boutons, scores, codes de salon.
- **Manrope** (400/600/700/800) — interface, corps de texte, badges.
- Google Fonts : `family=Fredoka:wght@500;600;700&family=Manrope:wght@400;600;700;800`.

## Composants

- **Bouton primaire** : Fredoka 600, texte `#150c2b` sur `#ff2e88`, border-radius 40px, ombre 3D `0 6px 0 #b81f66`, libellés en MAJUSCULES ("Créer un salon !").
- **Bouton secondaire** : contour 2px `#2effc7`, texte `#2effc7`, fond transparent.
- **Bouton désactivé** : fond `rgba(255,255,255,0.05)`, texte `#5c4d8a`, pas d'ombre.
- **Badges** : Fredoka/Manrope 600-800, pilule radius 14-20px — HÔTE (fond soleil), PRÊT ✓ (fond menthe), texte `#150c2b`.
- **Indicateurs delta classement** : triangle CSS ▲ menthe (montée) / ▼ corail (descente) + valeur, "—" gris si stable.
- **Cartes** : radius 16-28px, fond `#2a1b52`, bordure `1px solid rgba(255,255,255,0.06)`.
- **Code de salon** : Fredoka 700, letter-spacing 6px, fond `#2a1b52`, bordure `2px dashed rgba(255,255,255,0.15)`.
- **Halos décoratifs** : cercles flous (blur 90px) rose/menthe opacité 0.15-0.18 dans les coins des écrans.

## Mascotte (monstre)

Blob CSS pur, même silhouette pour tous, couleur = teinte du joueur :

- Corps : `border-radius: 58% 42% 45% 55% / 50% 55% 45% 50%`, ratio ~72×64 (9:8), `box-shadow: inset 0 -6px 0 rgba(0,0,0,0.15)` pour le volume.
- Yeux : 2 cercles blancs (~26% de la largeur) avec pupille `#150c2b` (~44% de l'œil), positionnés à ~27% du haut.
- Variante "hero" : + 2 cornes menthe (triangles CSS rotés ±8-10°) et bouche `#150c2b` radius `0 0 24px 24px`.

## Écrans définis dans la charte

1. **Accueil** — logo + mascotte hero, 2 cartes (Créer un salon / Rejoindre avec code), lien partie publique.
2. **Salon d'attente** — code du salon en évidence, réglages (manches, joueurs), grille 4 colonnes de joueurs avec badges HÔTE/PRÊT, gros bouton LANCER LA PARTIE.
3. **Compte à rebours** — anneau SVG de progression menthe, chiffre géant (150px) avec text-shadow rose, rangée de mascottes des joueurs.
4. **HUD en jeu** — bandeau haut : MANCHE x/y (gauche), consigne en gros bouton rose (centre), avatar+score perso (droite) ; barre de temps dégradé menthe→soleil ; zone de jeu + mini-classement "En direct" (top 3) à droite.
5. **Classement** — liste des joueurs : rang (soleil), mascotte, nom, (Toi), delta ▲▼, points gagnés (+xxx menthe), total ; "Prochaine manche dans 5s…".
6. **Victoire** — confettis CSS (palette joueurs), "X REMPORTE LA PARTIE !", podium 3 marches (2-1-3) avec mascottes à cornes, boutons REJOUER / QUITTER.

## Divers

- Nombres formatés avec espace fine des milliers (ex : `1 875 pts`).
- Écrans conçus en 1280×800, coins arrondis 28px.
- Liens : menthe, hover rose.
