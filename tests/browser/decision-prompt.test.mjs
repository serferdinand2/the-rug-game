// Where the decision prompt opens, in Chromium at the 1920×1080 reference (#79): at the centre of the tracks, cards on
// the shelf and the panel as one stack. Each test plays a two-seat hot-seat table through the API to the moment it needs,
// then ends and leaves the table.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';
import { promptFor } from '../../src/lib/prompts.js';

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
 * A two-seat hot-seat table, started.
 * @param {import('@playwright/test').APIRequestContext} request
 */
async function startTable(request) {
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
	room = await api(request, 'start', { version: room.version }, token);
	return { token, room };
}

/**
 * Picks an answer that advances where it can, so the game moves on to the tracks' benefits and bonuses.
 * @param {{ answers: any[] }} op
 * @returns {any}
 */
function pick(op) {
	const advance = op.answers.findIndex((answer) =>
		JSON.stringify(answer).includes('"advance"')
	);
	return op.answers[advance >= 0 ? advance : 0];
}

/**
 * Plays on through the API until `wanted` says a seat's open decision is the moment the test needs.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {any} room
 * @param {(op: any, seat: number, game: any) => boolean} wanted
 * @param {number} limit - Most moves to make
 * @returns {Promise<{ seat: number, op: any, game: any }>}
 */
async function playUntil(request, token, room, wanted, limit) {
	for (let step = 0; step < limit; step++) {
		let acted = false;
		for (const seat of [1, 2]) {
			room = await api(request, `state?seat=${seat}`, undefined, token);
			const op = openDecisions(room.game).find(
				(open) => open.player === seat && Array.isArray(open.answers)
			);
			if (!op) {
				continue;
			}
			if (wanted(op, seat, room.game)) {
				return { seat, op, game: room.game };
			}
			room = await api(
				request,
				'move',
				{
					version: room.version,
					seat,
					action: { decision: op.id, ...pick(op) },
				},
				token
			);
			acted = true;
			break;
		}
		if (!acted) {
			await new Promise((resolve) => setTimeout(resolve, 300));
		}
	}
	throw new Error('The moment the test needs was never reached.');
}

/**
 * Opens the table on a seat's screen, past the pass screen and the first-income notice (#77).
 * @param {import('@playwright/test').Page} page
 * @param {string} token
 * @param {number} seat
 */
async function takeScreen(page, token, seat) {
	await page.addInitScript(
		(saved) => sessionStorage.setItem('rg-token', saved),
		token
	);
	await page.goto('/');
	const name = seat === 1 ? 'Ana' : 'Ben';
	await page.getByRole('button', { name: `I'm ${name}` }).click();
	await expect(page.locator('.rg-game--board')).toBeVisible();
	const notice = page.locator('.rg-income-notice');
	if ((await notice.count()) > 0) {
		await notice.getByRole('button', { name: 'Got it' }).click();
		await expect(notice).toHaveCount(0);
	}
}

/**
 * Ends a running hot-seat game, then leaves it, so the table closes and the address's table limit is free.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function closeTable(request, token) {
	const latest = await api(request, 'state', undefined, token);
	await api(request, 'end', { version: latest.version }, token);
	await api(request, 'leave', {}, token);
}

/**
 * An element's box, which must be there.
 * @param {import('@playwright/test').Locator} locator
 */
async function boxOf(locator) {
	const box = await locator.boundingBox();
	if (!box) {
		throw new Error('Nothing to measure.');
	}
	return box;
}

test("cards on the shelf and the panel open as one stack at the tracks' centre (#79)", async ({
	page,
	request,
}) => {
	test.setTimeout(120000);
	const { token, room } = await startTable(request);
	try {
		const { seat, op } = await playUntil(
			request,
			token,
			room,
			(open) => open.kind === 'chooseCiv',
			20
		);
		await takeScreen(page, token, seat);
		await expect(
			page.getByRole('heading', { name: 'Choose your civilization' })
		).toBeVisible();
		const scrim = await boxOf(page.locator('.rg-decision-panel'));
		const shelf = await boxOf(page.locator('.rg-decision-panel--shelf'));
		const panel = await boxOf(page.locator('.rg-decision-panel--panel'));
		// The shelf and the panel share the tracks' centre line, and the stack's middle is the shared area's, not the
		// screen's (owner).
		const centre = scrim.x + scrim.width / 2;
		expect(centre).toBeLessThan(800);
		expect(
			Math.abs(shelf.x + shelf.width / 2 - centre)
		).toBeLessThanOrEqual(2);
		expect(
			Math.abs(panel.x + panel.width / 2 - centre)
		).toBeLessThanOrEqual(2);
		expect(panel.y).toBeGreaterThan(shelf.y + shelf.height);
		const middle = (shelf.y + panel.y + panel.height) / 2;
		expect(
			Math.abs(middle - (scrim.y + scrim.height / 2))
		).toBeLessThanOrEqual(2);
		// Every card is on the screen, above the panel, and the cards are pressable.
		const cards = page.locator('.rg-card-shelf .rg-card-fan--card');
		await expect(cards).toHaveCount(op.answers.length);
		for (const card of await cards.all()) {
			const box = await boxOf(card);
			expect(box.y).toBeGreaterThanOrEqual(58);
			expect(box.y + box.height).toBeLessThanOrEqual(panel.y);
		}
		await cards.first().click();
		await expect(
			page.getByRole('button', { name: 'Keep civilization' })
		).toBeEnabled();
	} finally {
		await closeTable(request, token);
	}
});

test("an options prompt opens at the tracks' centre, no longer at the bottom of the board (#79)", async ({
	page,
	request,
}) => {
	test.setTimeout(300000);
	const { token, room } = await startTable(request);
	try {
		const { seat, op, game } = await playUntil(
			request,
			token,
			room,
			(open, at, view) => {
				// The turn's own choice is the footer's, not a panel's.
				if (
					open.kind === 'chooseTurn' ||
					open.kind === 'chooseAdvance'
				) {
					return false;
				}
				const prompt = promptFor(open, view, at);
				return (
					prompt !== null &&
					prompt.layout === 'options' &&
					!prompt.picks &&
					!prompt.trade &&
					!prompt.income
				);
			},
			400
		);
		await takeScreen(page, token, seat);
		const prompt = /** @type {any} */ (promptFor(op, game, seat));
		await expect(
			page.getByRole('heading', { name: prompt.title })
		).toBeVisible();
		const panel = await boxOf(page.locator('.rg-decision-panel--panel'));
		const scrim = await boxOf(page.locator('.rg-decision-panel'));
		expect(
			Math.abs(panel.x + panel.width / 2 - (scrim.x + scrim.width / 2))
		).toBeLessThanOrEqual(2);
		expect(
			Math.abs(panel.y + panel.height / 2 - (scrim.y + scrim.height / 2))
		).toBeLessThanOrEqual(2);
	} finally {
		await closeTable(request, token);
	}
});
