// The component library page (#48) in Chromium (#55): every section renders, without an error in the console.
import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';

/** Every library section, as src/library/sections/<area>/<Name>.svelte; the page shows one per file. */
const SECTIONS = readdirSync(
	new URL('../../src/library/sections/', import.meta.url),
	{ withFileTypes: true }
)
	.filter((entry) => entry.isDirectory())
	.flatMap((area) =>
		readdirSync(
			new URL(`../../src/library/sections/${area.name}/`, import.meta.url)
		).filter((file) => file.endsWith('.svelte'))
	);

test('the library page shows every section, with no console errors', async ({
	page,
}) => {
	/** @type {string[]} */
	const errors = [];
	page.on('console', (message) => {
		if (message.type() === 'error') {
			errors.push(message.text());
		}
	});
	page.on('pageerror', (error) => errors.push(error.message));
	expect(SECTIONS.length).toBeGreaterThan(40);
	await page.goto('/components.html');
	for (const file of SECTIONS) {
		const name = file.replace(/\.svelte$/, '');
		await expect(
			page.getByRole('heading', { name, exact: true }).first(),
			`the ${name} section`
		).toBeVisible();
	}
	expect(errors).toEqual([]);
});
