// The Traders' token on the map (#180), in Chromium: the Map opens by itself for the placement, and once placed the
// token leaves a square of the card's reserve empty and shows on the map with the card's token picture.
// Civilizations are dealt at random, so the test deals one hot-seat table of five again until the Traders are offered,
// as Deal again does, rather than opening tables against the server's limit; then it ends and leaves it.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

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
 * Ends a running table and leaves it, so it closes.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function close(request, token) {
	const latest = await api(request, 'state', undefined, token);
	if (latest.phase === 'playing') {
		await api(request, 'end', { version: latest.version }, token);
	}
	await api(request, 'leave', {}, token);
}

/**
 * The first open decision a seat can answer, from its own view.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {number} seat
 */
async function openOf(request, token, seat) {
	const view = await api(request, `state?seat=${seat}`, undefined, token);
	const op = openDecisions(view.game).find(
		(o) => o.player === seat && Array.isArray(o.answers)
	);
	return { view, op };
}

test("the Map opens for the Traders' token, which then leaves the card and shows the card's token picture on the map (#180)", async ({
	page,
	request,
}) => {
	test.setTimeout(240_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	for (const name of NAMES.slice(1)) {
		room = await api(
			request,
			'add-seat',
			{ version: room.version, name },
			token
		);
	}
	/** The seat offered the Traders, once a deal offers them: 10 of the 16 civilizations are dealt each time. */
	let trader = 0;
	for (let deal = 0; deal < 20 && !trader; deal++) {
		room = await api(request, 'state', undefined, token);
		if (room.phase === 'playing') {
			room = await api(request, 'end', { version: room.version }, token);
		}
		await api(request, 'start', { version: room.version }, token);
		for (let seat = 1; seat <= NAMES.length && !trader; seat++) {
			const { op } = await openOf(request, token, seat);
			if (
				op?.kind === 'chooseCiv' &&
				op.answers.some((/** @type {any} */ a) => a.civ === 'traders')
			) {
				trader = seat;
			}
		}
	}
	expect(trader, 'a deal offered the Traders').toBeGreaterThan(0);

	try {
		// Setup and turns through the API, the Traders taking income, until their token is to be placed.
		let place = null;
		for (let step = 0; step < 800 && !place; step++) {
			let acted = false;
			for (let seat = 1; seat <= NAMES.length && !place; seat++) {
				const { view, op } = await openOf(request, token, seat);
				if (!op) {
					continue;
				}
				if (op.kind === 'chooseSlot' && op.purpose === 'traders') {
					place = op;
					break;
				}
				const answer =
					op.answers.find(
						(/** @type {any} */ a) =>
							(seat === trader && a.civ === 'traders') ||
							a.turn === 'income'
					) ?? op.answers[0];
				await api(
					request,
					'move',
					{
						version: view.version,
						seat,
						action: { decision: op.id, ...answer },
					},
					token
				);
				acted = true;
				break;
			}
			expect(acted || place, 'some seat had a decision').toBeTruthy();
		}
		expect(place, 'the Traders were asked to place a token').toBeTruthy();

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[trader - 1]}` })
			.click();

		// The Map shows by itself, its territories lit; the reserve on the Civ tab's card is still full.
		const board = page.getByRole('navigation', {
			name: 'Shared board view',
		});
		await expect(board.getByRole('button', { pressed: true })).toHaveText(
			/Map/
		);
		const targets = page.locator('.rg-world-map--target');
		await expect(targets).toHaveCount(place.options.length);
		await page.getByRole('tab', { name: 'Civ' }).click();
		const reserve = page.locator('.rg-card-token-reserve');
		await expect(reserve).toHaveAttribute(
			'aria-label',
			'4 of 4 player tokens remain'
		);

		await targets.first().click();
		await page
			.locator('.rg-decision-panel')
			.getByRole('button', { name: 'Confirm choice' })
			.click();

		// The turn's next choice, its tapestry card, opens the Hand tab: back to the card.
		await expect(page.getByRole('tab', { name: /^Hand/ })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await page.getByRole('tab', { name: 'Civ' }).click();
		await expect(reserve).toHaveAttribute(
			'aria-label',
			'3 of 4 player tokens remain'
		);
		// The tapestry choice leaves the Map on show.
		await expect(board.getByRole('button', { pressed: true })).toHaveText(
			/Map/
		);
		const placed = page.locator('image.rg-world-map--token');
		await expect(placed).toHaveCount(1);
		await expect(placed).toHaveAttribute(
			'href',
			/piece\/token-[a-z]+\.svg/
		);
	} finally {
		await close(request, token);
	}
});
