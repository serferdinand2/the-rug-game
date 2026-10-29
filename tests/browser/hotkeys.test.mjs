// The game's hotkeys in Chromium (#83): a hot-seat game played with the keys; then the table is ended and left, so it
// closes.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const NAMES = ['Marko', 'Vera'];

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
 * Every operation of a stack, and of the lanes of any group on it.
 * @param {any[]} stack
 * @returns {any[]}
 */
function ops(stack) {
	return stack.flatMap((op) =>
		op.kind === 'group'
			? op.lanes.flatMap((/** @type {any} */ lane) => ops(lane.stack))
			: [op]
	);
}

test('the keys close the notice, switch tabs, the board and players, peek at the log, advance and take income (#83)', async ({
	page,
	request,
}) => {
	const { token } = await api(request, 'login', { name: NAMES[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: NAMES[1] },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	try {
		// Setup through the API, until a turn choice.
		let seat = 0;
		for (let moves = 0; moves < 200; moves++) {
			const view = await api(request, 'state', undefined, token);
			seat = askedSeats(view.game)[0];
			const open = ops(view.game.pending ?? []);
			if (
				view.game.phase === 'play' &&
				open.some((o) => o.player === seat && o.kind === 'chooseTurn')
			) {
				break;
			}
			const own = await api(
				request,
				`state?seat=${seat}`,
				undefined,
				token
			);
			const op = ops(own.game.pending ?? []).find(
				(o) => o.answers && o.player === seat
			);
			// Not the Futurists: they start four spaces up every track, so 1 would select Ships rather than open
			// Scouting's payment (#88).
			const answer =
				op.answers.find(
					(/** @type {any} */ a) => a.civ !== 'futurists'
				) ?? op.answers[0];
			await api(
				request,
				'move',
				{
					version: own.version,
					seat,
					action: { decision: op.id, ...answer },
				},
				token
			);
		}

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[seat - 1]}` })
			.click();
		await expect(page.locator('.rg-game--board')).toBeVisible();

		// Enter closes the first-income notice, as its Got it would.
		const notice = page.locator('.rg-income-notice');
		await expect(notice).toBeVisible();
		await page.locator('body').focus();
		await page.keyboard.press('Enter');
		await expect(notice).toHaveCount(0);

		// W shows the Hand tab, Q the Capital again.
		await page.keyboard.press('w');
		await expect(page.getByRole('tab', { name: /^Hand/ })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		await page.keyboard.press('q');
		await expect(
			page.getByRole('tab', { name: 'Capital' })
		).toHaveAttribute('aria-selected', 'true');

		// M goes to the World Map, and back to the tracks.
		await page.keyboard.press('m');
		await expect(page.locator('.rg-world-map')).toBeVisible();
		await page.keyboard.press('m');
		await expect(page.locator('.rg-track-board')).toBeVisible();

		// 2 opens the players overview, and 2 again closes it.
		await page.keyboard.press('2');
		await expect(page.locator('.rg-players-overview')).toBeVisible();
		await page.keyboard.press('2');
		await expect(page.locator('.rg-players-overview')).toHaveCount(0);

		// Tab held shows the log and scores until it is let go.
		await page.keyboard.down('Tab');
		await expect(page.locator('.rg-log-panel')).toBeVisible();
		await page.keyboard.up('Tab');
		await expect(page.locator('.rg-log-panel')).toHaveCount(0);
		await page.locator('body').focus();

		// A asks which track, and 1 picks Exploration: a choice of payment opens its panel.
		await page.keyboard.press('a');
		await expect(
			page.getByRole('heading', { name: 'Advance on which track?' })
		).toBeVisible();
		await page.keyboard.press('1');
		const pay = page.getByRole('dialog', { name: 'Advance to Scouting' });
		await expect(pay).toBeVisible();
		await pay.getByRole('button', { name: 'Cancel', exact: true }).click();
		await expect(pay).toHaveCount(0);
		await page.locator('body').focus();

		// I asks before taking income; Esc goes back, and I twice takes it.
		await page.keyboard.press('i');
		const ask = page.getByRole('heading', { name: 'Take an income turn?' });
		await expect(ask).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(ask).toHaveCount(0);

		// I, then L for the log: one Esc closes the log and leaves the question, and the next closes the question (#88).
		await page.keyboard.press('i');
		await expect(ask).toBeVisible();
		await page.keyboard.press('l');
		const log = page.locator('.rg-log-panel');
		await expect(log).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(log).toHaveCount(0);
		await expect(ask).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(ask).toHaveCount(0);
		const before = await api(
			request,
			`state?seat=${seat}`,
			undefined,
			token
		);
		expect(before.game.seats[seat - 1].incomeTurns).toBe(1);
		await page.keyboard.press('i');
		await expect(ask).toBeVisible();
		await page.keyboard.press('i');
		await expect
			.poll(async () => {
				const after = await api(
					request,
					`state?seat=${seat}`,
					undefined,
					token
				);
				return after.game.seats[seat - 1].incomeTurns;
			})
			.toBe(2);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
