// The dice tray in Chromium (#61): a conquest's dice roll in the middle of both players' screens at an online table,
// land on the faces the server rolled, take no focus, and don't roll again after a reload. The test plays the table
// through the API to a conquest, answers it with both screens open, and ends and leaves the table.
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
 * Picks an answer that heads along the military track, whose first space conquers: an advance there, otherwise any
 * advance, otherwise the first.
 * @param {{ answers: any[] }} op
 * @returns {any}
 */
function pick(op) {
	const json = op.answers.map((answer) => JSON.stringify(answer));
	const military = json.findIndex((text) => text.includes('"military"'));
	if (military >= 0) {
		return op.answers[military];
	}
	const advance = json.findIndex((text) => text.includes('"advance"'));
	return op.answers[advance >= 0 ? advance : 0];
}

/**
 * Opens the table on a player's screen, in a context of its own.
 * @param {import('@playwright/test').Browser} browser
 * @param {string} token
 */
async function screenOf(browser, token) {
	const context = await browser.newContext({
		viewport: { width: 1920, height: 1080 },
	});
	const page = await context.newPage();
	await page.addInitScript(
		(saved) => sessionStorage.setItem('rg-token', saved),
		token
	);
	await page.goto('/');
	await expect(page.locator('.rg-game')).toBeVisible();
	return { context, page };
}

test("a conquest's dice roll on both players' screens, on the faces the server rolled", async ({
	browser,
	request,
}) => {
	test.setTimeout(240000);
	const ana = (await api(request, 'login', { name: 'Ana' })).token;
	const ben = (await api(request, 'login', { name: 'Ben' })).token;
	let room = await api(request, 'create', {}, ana);
	room = await api(request, 'join', { code: room.code }, ben);
	room = await api(request, 'start', { version: room.version }, ana);
	const tokens = { 1: ana, 2: ben };
	/** @type {{ context: import('@playwright/test').BrowserContext }[]} */
	const screens = [];
	try {
		// Play on through the API until a seat must choose a territory to conquer.
		/** @type {{ seat: 1 | 2, op: any } | null} */
		let found = null;
		for (let step = 0; step < 600 && !found; step++) {
			let acted = false;
			for (const seat of /** @type {const} */ ([1, 2])) {
				room = await api(request, 'state', undefined, tokens[seat]);
				const op = openDecisions(room.game).find(
					(open) =>
						open.player === seat && Array.isArray(open.answers)
				);
				if (!op) {
					continue;
				}
				if (op.kind === 'chooseConquer') {
					found = { seat, op };
					break;
				}
				room = await api(
					request,
					'move',
					{
						version: room.version,
						action: { decision: op.id, ...pick(op) },
					},
					tokens[seat]
				);
				acted = true;
				break;
			}
			if (!found && !acted) {
				await new Promise((resolve) => setTimeout(resolve, 300));
			}
		}
		if (!found) {
			throw new Error('No conquest was reached.');
		}
		const { seat, op } = found;
		const roller = await screenOf(browser, tokens[seat]);
		const other = await screenOf(browser, tokens[seat === 1 ? 2 : 1]);
		screens.push(roller, other);

		room = await api(request, 'state', undefined, tokens[seat]);
		room = await api(
			request,
			'move',
			{
				version: room.version,
				action: { decision: op.id, ...op.answers[0] },
			},
			tokens[seat]
		);
		const rolled = room.game.events.findLast(
			(/** @type {any} */ e) => e.type === 'conquerDiceRolled'
		);
		expect(rolled).toBeTruthy();
		const name = seat === 1 ? 'Ana' : 'Ben';

		for (const [page, caption] of [
			[roller.page, 'You roll the conquer dice'],
			[other.page, `${name} rolls the conquer dice`],
		]) {
			const tray = /** @type {import('@playwright/test').Page} */ (
				page
			).locator('.rg-dice-tray');
			await expect(tray).toBeVisible({ timeout: 15000 });
			await expect(tray.getByText(String(caption))).toBeVisible();
			await expect(tray.locator('[data-die="red"]')).toHaveAttribute(
				'data-face',
				String(rolled.red)
			);
			await expect(tray.locator('[data-die="black"]')).toHaveAttribute(
				'data-face',
				String(rolled.black)
			);
			// The tray takes no focus and holds nothing to focus.
			await expect(
				tray.locator('button, [tabindex], a, input')
			).toHaveCount(0);
			expect(
				await /** @type {import('@playwright/test').Page} */ (
					page
				).evaluate(() =>
					Boolean(document.activeElement?.closest('.rg-dice-tray'))
				)
			).toBe(false);
		}

		// After a reload, the roll doesn't play again.
		await roller.page.reload();
		await expect(roller.page.locator('.rg-game')).toBeVisible();
		await roller.page.waitForTimeout(1500);
		await expect(roller.page.locator('.rg-dice-tray')).toHaveCount(0);
	} finally {
		for (const screen of screens) {
			await screen.context.close();
		}
		// An online game ends once the other players have left; then the host ends it and leaves.
		await api(request, 'leave', {}, ben);
		const latest = await api(request, 'state', undefined, ana);
		await api(request, 'end', { version: latest.version }, ana);
		await api(request, 'leave', {}, ana);
	}
});
