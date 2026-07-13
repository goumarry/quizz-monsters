import { defineConfig } from 'vite';

export default defineConfig({
  // Chemins relatifs : CrazyGames sert le jeu depuis un sous-dossier de son
  // CDN, les chemins absolus (/assets/…) y donnent un écran blanc.
  base: './',
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3210',
        ws: true,
      },
    },
  },
});
