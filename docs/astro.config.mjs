// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['play.ts']
    }
  },
  // GitHub Pages configuration
  site: 'https://conneroisu.github.io',
  base: process.env.DEV !== '' ? '/play.ts' : '/',
  trailingSlash: 'always',
  build: {
    assets: '_assets'
  }
});
