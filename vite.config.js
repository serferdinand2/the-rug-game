// Vite builds the Svelte app (index.html and src/) into build/, which server.mjs serves; Vitest runs tests/ (#55).
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
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
		entries: ['index.html', 'components.html', 'cards.html'],
	},
	build: {
		outDir: fromHere('./build'),
		emptyOutDir: true,
		// Two pages: the game, and the component library (#48).
		rolldownOptions: {
			input: {
				game: fromHere('./index.html'),
				components: fromHere('./components.html'),
				gallery: fromHere('./cards.html'),
				cards: fromHere('./docs/ui/collectors-review.html'),
			},
		},
	},
	server: {
		// Match the server's default of 127.0.0.1; "localhost" may bind only to IPv6 (::1).
		host: '127.0.0.1',
		proxy: {
			'/api': `http://127.0.0.1:${process.env.PORT || 3020}`,
		},
	},
	// The Node suites (#55). The browser tests in tests/browser/ are Playwright's.
	test: {
		include: ['tests/*.test.mjs'],
		environment: 'node',
		// Builds build/ once, for the suites that read the build.
		globalSetup: ['tests/helpers/build.mjs'],
		// Random full games and the simulation run for seconds, not milliseconds; a hang still stops at CI's limit.
		testTimeout: 5 * 60_000,
		hookTimeout: 2 * 60_000,
		// node:test put back every mocked method after its test; Vitest does so with this.
		restoreMocks: true,
	},
});
