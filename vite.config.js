// Vite builds the Svelte app (index.html and src/) into public/, which server.mjs serves.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// npm run dev starts the server with .env; load it here too, so the dev proxy targets the same port.
try {
	process.loadEnvFile();
} catch {
	// No .env file: the defaults below apply.
}

/** @param {string} path - A path relative to this file */
const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
	root: fromHere('./'),
	publicDir: 'static',
	plugins: [svelte({ configFile: fromHere('./svelte.config.js') })],
	// The root also holds the docs' standalone HTML mockups; only the app's own pages are entries.
	optimizeDeps: {
		entries: ['index.html'],
	},
	build: {
		outDir: fromHere('./public'),
		emptyOutDir: true,
	},
	server: {
		// Match the server's default of 127.0.0.1; "localhost" may bind only to IPv6 (::1).
		host: '127.0.0.1',
		proxy: {
			'/api': `http://127.0.0.1:${process.env.PORT || 3020}`,
		},
	},
});
