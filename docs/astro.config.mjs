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
  site: 'https://play-ts.github.io',
  base: process.env.NODE_ENV === 'production' ? '/play.ts' : '/',
  trailingSlash: 'always',
  build: {
    assets: '_assets'
  }
});
