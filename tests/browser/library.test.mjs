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

/**
 * A colour as the page computes it, such as 'rgb(226, 184, 87)' for 'var(--gold)', so a test compares like with like.
 * @param {import('@playwright/test').Page} page
 * @param {string} value - Any CSS colour, token or color-mix()
 * @returns {Promise<string>}
 */
function computedColor(page, value) {
	return page.evaluate((colour) => {
		const probe = document.createElement('i');
		probe.style.color = colour;
		document.body.append(probe);
		const rgb = getComputedStyle(probe).color;
		probe.remove();
		return rgb;
	}, value);
}

test("a decision panel confirms in solid gold, or in its track's colour, as the play mockup does (#65)", async ({
	page,
}) => {
	await page.goto('/components.html');
	const section = page.locator('#decision-panel');
	const gold = await computedColor(page, 'var(--gold)');
	const ink = await computedColor(page, 'var(--ink)');

	for (const [title, label] of [
		['Choose a tapestry card', 'Confirm choice'],
		['Choose where to explore', 'Explore'],
	]) {
		const confirm = section
			.getByRole('dialog', { name: title })
			.getByRole('button', { name: label });
		await expect(confirm, title).toHaveCSS('background-color', gold);
		await expect(confirm, title).toHaveCSS('color', ink);
	}

	// A decision about a track keeps the mockup's track tint (main-screen.html, [data-track] #decision-confirm).
	const tracked = section
		.getByRole('dialog', { name: 'Choose a track' })
		.getByRole('button', { name: 'Confirm choice' });
	await expect(tracked).toHaveCSS(
		'background-color',
		await computedColor(
			page,
			'color-mix(in srgb, var(--exploration) 65%, var(--text))'
		)
	);
	await expect(tracked).toHaveCSS('color', ink);
});
