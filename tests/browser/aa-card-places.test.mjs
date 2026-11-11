// A&A's places on cards as lit targets (#184): from the aa-card-places scenario, a Farm goes on a lit square of
// Monuments under the capital, then the Forge on Astrolabe, lit whole; the Eras tab draws the Farm on the card. The test
// ends and leaves its table.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';

const NAMES = ['Mira', 'Teodor'];

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

test('a Farm on a lit square of Monuments, then the Forge on Astrolabe, from the Capital tab (#184)', async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat', expansions: ['aa'] } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: NAMES[1] },
		token
	);
	await api(
		request,
		'start',
		{ version: room.version, scenario: 'aa-card-places' },
		token
	);

	try {
		const started = await api(request, 'state', undefined, token);
		const seat = askedSeats(started.game)[0];
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[seat - 1]}` })
			.click();
		const notice = page.locator('.rg-income-notice');
		if ((await notice.count()) > 0) {
			await notice.getByRole('button', { name: 'Got it' }).click();
		}

		// The Farm: Monuments' open squares lit under the capital; one picked, then placed from the panel.
		await expect(
			page.getByRole('heading', { name: 'Where does the Farm go?' })
		).toBeVisible();
		const square = page.locator('[data-id="plot-card-monuments-1-2"]');
		await expect(square).toBeVisible();
		await square.click();
		const panel = page.locator('.rg-decision-panel');
		await expect(panel).toContainText('On Monuments, row 2, column 3');
		await panel.getByRole('button', { name: /^Place/ }).click();

		// The Forge: Astrolabe lit whole, picked, then placed.
		await expect(
			page.getByRole('heading', { name: 'Where does the Forge go?' })
		).toBeVisible();
		const astrolabe = page.locator(
			'[data-id="capital-tab-holder-astrolabe"]'
		);
		await astrolabe.click();
		await expect(astrolabe).toHaveAttribute('aria-pressed', 'true');
		await panel.getByRole('button', { name: /^Place/ }).click();
		await expect(
			page.getByRole('heading', { name: 'Where does the Forge go?' })
		).toHaveCount(0);

		const own = await api(request, `state?seat=${seat}`, undefined, token);
		const mine = own.game.seats[seat - 1];
		expect(mine.onCards.monuments).toEqual([
			{ building: 'farm', row: 1, col: 2 },
		]);
		expect(mine.techLandmarks.astrolabe).toBe('forge');

		// The Eras tab draws the Farm on Monuments' square.
		const tabs = page.getByRole('tablist', { name: 'Your city and cards' });
		await tabs.getByRole('tab', { name: 'Eras' }).click();
		await page
			.getByRole('button', { name: /Era I\b/ })
			.first()
			.click();
		await expect(
			page.locator('[data-id="plot-card-monuments-1-2"] img')
		).toHaveCount(1);
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
