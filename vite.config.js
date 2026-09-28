import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // three.js alone is ~600 kB minified; one chunk is fine for a single-page storybook.
  build: { chunkSizeWarningLimit: 900 },
  server: { port: 5178 },
});
