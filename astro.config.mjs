import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [react(), svelte()],
  vite: { plugins: [tailwindcss()], server: { proxy: { '/api': 'http://localhost:4322', '/mcp': 'http://localhost:4322' } } },
});
