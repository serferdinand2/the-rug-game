// The track spaces' text in Chromium (#69): 10px at the 1920×1080 reference, then larger as the board grows, with
// nothing in a space cut off or overlapping. The test opens a two-seat hot-seat game, then closes the table.
import { expect, test } from '@playwright/test';

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
 * Each screen, with the size of a space's name and of the first resource's picture there. That resource is in a
 * bonus (Mathematics' "pay 1 resource"), whose pictures grow 18, 19, then 20px with the space (#85).
 */
const SCREENS = [
	{ width: 1920, height: 1080, text: '10px', resource: 18 },
	{ width: 2240, height: 1260, text: '11px', resource: 19 },
	{ width: 2560, height: 1440, text: '12px', resource: 20 },
	{ width: 3840, height: 2160, text: '12px', resource: 20 },
];

test('the track spaces keep 10px text at 1920×1080 and grow it on larger screens, with nothing cut off', async ({
	page,
	request,
}) => {
	const { token } = await api(request, 'login', { name: 'Ana' });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: 'Ben' },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	try {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page.getByRole('button', { name: "I'm Ana" }).click();
		const spaces = page.locator('.rg-track-space');
		await expect(spaces).toHaveCount(48);

		for (const screen of SCREENS) {
			await page.setViewportSize(screen);
			const name = page.locator('.rg-track-space--name').first();
			await expect(name, `${screen.width}px`).toHaveCSS(
				'font-size',
				screen.text
			);
			await expect(
				page.locator('.rg-space-glyphs--resource img').first()
			).toHaveCSS('width', `${screen.resource}px`);

			const faults = await spaces.evaluateAll((all) =>
				all.flatMap((space) => {
					const label = space.getAttribute('aria-label');
					/** @param {string} part */
					const box = (part) =>
						space
							.querySelector(`.rg-track-space--${part}`)
							?.getBoundingClientRect();
					const benefit = space.querySelector(
						'.rg-track-space--benefit'
					);
					const nameText = space.querySelector(
						'.rg-track-space--name'
					);
					const body = box('body');
					const parts = ['name', 'benefit', 'bonus', 'landmark']
						.map((part) => box(part))
						.filter((part) => part !== undefined);
					const found = [];
					if (
						benefit &&
						(benefit.scrollHeight > benefit.clientHeight + 1 ||
							benefit.scrollWidth > benefit.clientWidth + 1)
					) {
						found.push(`${label}: its benefit is cut off`);
					}
					if (
						nameText &&
						nameText.scrollWidth > nameText.clientWidth + 1
					) {
						found.push(`${label}: its name is cut off`);
					}
					for (let i = 1; i < parts.length; i++) {
						if (parts[i].top < parts[i - 1].bottom - 1) {
							found.push(`${label}: its parts overlap`);
						}
					}
					const last = parts.at(-1);
					if (body && last && last.bottom > body.bottom + 1) {
						found.push(`${label}: it runs out of the space`);
					}
					return found;
				})
			);
			expect(faults, `${screen.width}×${screen.height}`).toEqual([]);
		}
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		await api(request, 'end', { version: latest.version }, token);
		await api(request, 'leave', {}, token);
	}
});
