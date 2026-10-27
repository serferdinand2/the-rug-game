// The browser tests (#55), in Chromium only, set up as svelte_components runs its own: Playwright starts `npm run dev`
// and opens the pages on Vite's address.
import { defineConfig, devices } from '@playwright/test';

/** Vite's dev server, as vite.config.js binds it (127.0.0.1, not localhost, which may resolve to IPv6 only). */
const BASE_URL = 'http://127.0.0.1:5173';

export default defineConfig({
	testDir: './tests/browser',
	timeout: process.env.CI ? 60 * 1000 : 40 * 1000, // Extra time in CI
	expect: {
		timeout: process.env.CI ? 30 * 1000 : 20 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	// CI retries a failing test twice and reports a retried pass as flaky; local runs don't retry, so a flake shows.
	retries: process.env.CI ? 2 : 0,
	// Stop a CI run at the first test that fails every retry.
	maxFailures: process.env.CI ? 1 : undefined,
	workers: process.env.PLAYWRIGHT_WORKERS
		? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
		: process.env.CI
			? 1
			: undefined,
	reporter: 'list',
	use: {
		testIdAttribute: 'data-id',
		baseURL: BASE_URL,
		screenshot: process.env.CI ? 'off' : 'only-on-failure',
		trace: 'on-first-retry',
		actionTimeout: process.env.CI ? 15000 : 10000,
		navigationTimeout: process.env.CI ? 15000 : 10000,
	},
	webServer: {
		// The Node server and Vite side by side; Vite proxies /api to the server.
		command: 'npm run dev',
		url: BASE_URL,
		reuseExistingServer: true,
		timeout: process.env.CI ? 180 * 1000 : 120 * 1000,
	},
	// Chromium only, locally and in CI (owner, 2026-10-27).
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
