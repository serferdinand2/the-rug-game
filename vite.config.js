// Vite builds the Svelte client in client/ into public/, which server.mjs serves.
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	root: 'client',
	publicDir: 'static',
	plugins: [svelte()],
	build: {
		outDir: '../public',
		emptyOutDir: true,
	},
	server: {
		// During `npm run dev`, API calls go to the Node server started beside Vite.
		proxy: {
			'/api': `http://127.0.0.1:${process.env.PORT || 3020}`,
		},
	},
});
