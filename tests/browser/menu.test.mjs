// The header's menu in Chromium (#99): each screen's entries come from menu.js, and PageHeader turns sound on and off
// and leaves the table. The test ends and leaves the table it opens.
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1920, height: 1080 } });

/**
 * Sends one table API request as a guest.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} endpoint
 * @param {Record<string, unknown> | undefined} body - Left out for a GET
 * @param {string} [token]
 * @returns {Promise<any>}
 */
async function api(request, endpoint, body, token) {
	const headers = token ? { Authorization: `Bearer ${token}` } : {};
	const response =
		body === undefined
			? await request.get(`/api/${endpoint}`, { headers })
			: await request.post(`/api/${endpoint}`, { headers, data: body });
	expect(response.ok(), `${endpoint}: ${await response.text()}`).toBe(true);
	return response.json();
}

/**
 * The menu's entries, as the player reads them.
 * @param {import('@playwright/test').Page} page
 */
async function menuEntries(page) {
	await page.getByRole('button', { name: 'Menu' }).click();
	const entries = await page.getByRole('menuitem').allTextContents();
	await page.keyboard.press('Escape');
	return entries.map((entry) => entry.trim());
}

test('the landing page offers How to play, the gallery and About, and turns sound on and off (#99)', async ({
	page,
}) => {
	await page.goto('/');
	expect(await menuEntries(page)).toEqual([
		'How to play',
		'Card gallery',
		'About this project',
	]);
	const mute = page.getByRole('button', { name: 'Mute' });
	const before = await mute.getAttribute('aria-pressed');
	await mute.click();
	await expect(mute).not.toHaveAttribute('aria-pressed', String(before));
	const saved = await page.evaluate(() => localStorage.getItem('rg-sound'));
	expect(saved).toBe(before === 'true' ? 'on' : 'off');
	await mute.click();
	await expect(mute).toHaveAttribute('aria-pressed', String(before));
});

test('the pass screen offers Leave table, which brings back the landing page (#99)', async ({
	page,
	request,
}) => {
	const { token } = await api(request, 'login', { name: 'Marko' });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: 'Vera' },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	try {
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await expect(
			page.getByRole('heading', { name: /^Pass the screen to/ })
		).toBeVisible();
		expect(await menuEntries(page)).toEqual([
			'How to play',
			'Card gallery',
			'Leave table',
		]);
		await page.getByRole('button', { name: 'Menu' }).click();
		await page.getByRole('menuitem', { name: 'Leave table' }).click();
		await expect(
			page.getByRole('heading', { name: /^Pass the screen to/ })
		).toHaveCount(0);
		await expect(
			page.getByRole('button', { name: 'Join table' })
		).toBeVisible();
	} finally {
		// Left through the menu already, unless the test failed before that.
		const headers = { Authorization: `Bearer ${token}` };
		const latest = await request.get('/api/state', { headers });
		if (latest.ok()) {
			const view = await latest.json();
			if (view.phase === 'playing') {
				await api(request, 'end', { version: view.version }, token);
			}
			await api(request, 'leave', {}, token);
		}
	}
});
