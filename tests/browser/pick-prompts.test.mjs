// The pick prompts in Chromium (#75): a choice of several resources, cards or tiles is made one by one in a panel at the
// screen's centre. Each test plays a two-seat hot-seat table through the API to the moment it needs, then answers with
// the mouse and the keyboard, and ends and leaves the table.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';

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
 * Picks an answer that heads along the exploration track: an advance there, otherwise any advance, otherwise the first.
 * @param {{ answers: any[] }} op
 * @returns {any}
 */
function pick(op) {
	const json = op.answers.map((answer) => JSON.stringify(answer));
	const explore = json.findIndex((text) => text.includes('"exploration"'));
	if (explore >= 0) {
		return op.answers[explore];
	}
	const advance = json.findIndex((text) => text.includes('"advance"'));
	return op.answers[advance >= 0 ? advance : 0];
}

/**
 * A two-seat hot-seat table, started.
 * @param {import('@playwright/test').APIRequestContext} request
 */
async function startTable(request) {
	const { token } = await api(request, 'login', { name: 'Ana' });
	let room = await api(request, 'create', { options: { mode: 'hotseat' } }, token);
	room = await api(request, 'add-seat', { version: room.version, name: 'Ben' }, token);
	room = await api(request, 'start', { version: room.version }, token);
	return { token, room };
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
				{ version: room.version, seat, action: { decision: op.id, ...pick(op) } },
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
 * Opens the table on a seat's screen, past the pass screen.
 * @param {import('@playwright/test').Page} page
 * @param {string} token
 * @param {number} seat
 */
async function takeScreen(page, token, seat) {
	await page.addInitScript((saved) => sessionStorage.setItem('rg-token', saved), token);
	await page.goto('/');
	const name = seat === 1 ? 'Ana' : 'Ben';
	await page.getByRole('button', { name: `I'm ${name}` }).click();
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
 * The centre of the decision panel's box.
 * @param {import('@playwright/test').Page} page
 */
async function panelCentre(page) {
	const box = await page.locator('.rg-decision-panel--panel').boundingBox();
	if (!box) {
		throw new Error('No decision panel.');
	}
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test('a bonus is paid with the 2 tiles the player picks', async ({ page, request }) => {
	test.setTimeout(300000);
	/** @type {string[]} */
	const errors = [];
	page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
	page.on('pageerror', (error) => errors.push(error.message));
	const { token, room } = await startTable(request);
	try {
		const { seat, op, game } = await playUntil(
			request,
			token,
			room,
			(open) =>
				open.kind === 'chooseBonus' &&
				open.cost?.territory === 2 &&
				open.answers.filter((/** @type {any} */ a) => a.pay !== null).length > 1,
			2500
		);
		const before = game.seats[seat - 1];
		const tiles = [...new Set(op.answers.flatMap((/** @type {any} */ a) => a.pay?.territory ?? []))];
		await takeScreen(page, token, seat);

		await expect(page.getByRole('heading', { name: 'Take the bonus: gain 5 VP?' })).toBeVisible();
		const centre = await panelCentre(page);
		expect(Math.abs(centre.x - 960)).toBeLessThanOrEqual(2);
		expect(Math.abs(centre.y - 540)).toBeLessThanOrEqual(2);
		await expect(page.getByText('Your tiles · 0 of 2 chosen')).toBeVisible();
		const pay = page.getByRole('button', { name: 'Pay 2 tiles', exact: true });
		await expect(pay).toBeDisabled();

		await page.getByTestId(`tile-${tiles[0]}`).click();
		await page.getByRole('tab', { name: /^Terrain/ }).click();
		await page.getByTestId(`terrain-tile-${tiles[1]}`).click();
		await expect(page.getByText('Your tiles · 2 of 2 chosen')).toBeVisible();
		await expect(page.getByTestId(`tile-${tiles[1]}`)).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId(`tile-${tiles[2]}`)).toBeDisabled();
		await expect(pay).toBeEnabled();
		await pay.click();

		await expect
			.poll(async () => {
				const state = await api(request, `state?seat=${seat}`, undefined, token);
				const after = state.game.seats[seat - 1];
				return [after.territoryTiles.length, after.vp - before.vp];
			})
			.toEqual([before.territoryTiles.length - 2, 5]);
		expect(errors).toEqual([]);
	} finally {
		await closeTable(request, token);
	}
});
