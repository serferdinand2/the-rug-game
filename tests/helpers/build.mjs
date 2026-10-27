// Vitest's global setup (#55): builds the client into build/ once, before the suites that read the build run.
import { build } from 'vite';

/** Builds the app with the project's own vite.config.js, quietly. */
export async function setup() {
	await build({ logLevel: 'error' });
}
