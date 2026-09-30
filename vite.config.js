import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

process.env.VITE_MEDIA ||= './media/'; // where photos/videos are served from

// SINGLE=1 → one self-contained index.html (for claude.ai Artifact / double-click preview)
export default defineConfig({
  base: './',
  plugins: process.env.SINGLE ? [viteSingleFile()] : [],
  build: { chunkSizeWarningLimit: 1500, assetsInlineLimit: process.env.SINGLE ? 100000000 : 4096 },
  server: { host: true },
});
