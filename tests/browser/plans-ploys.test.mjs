// Plans & Ploys at a hot-seat table (#32): the landmark-card draft on the card shelf, then the kept card on the Civ tab
// with its goal line. The test plays the rest of setup through the API, then ends and leaves the table.
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

/**
 * Answers setup's questions with their first answers through the API until `stop` says so about the open one.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {(kinds: string[], game: any) => boolean} stop
 */
async function playUntil(request, token, stop) {
	for (let moves = 0; moves < 200; moves++) {
		const view = await api(request, 'state', undefined, token);
		const kinds = ops(view.game.pending ?? []).map((op) => op.kind);
		if (stop(kinds, view.game)) {
			return view;
		}
		const seat = askedSeats(view.game)[0];
		const own = await api(request, `state?seat=${seat}`, undefined, token);
		const op = ops(own.game.pending ?? []).find(
			(o) => o.answers && o.player === seat
		);
		await api(
			request,
			'move',
			{
				version: own.version,
				seat,
				action: { decision: op.id, ...op.answers[0] },
			},
			token
		);
	}
	throw new Error('Setup never got there.');
}

test('a Plans & Ploys table drafts landmark cards on the shelf, and the Civ tab shows the card kept with its goal (#32)', async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat', expansions: ['pp'] } },
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
		const drafting = await playUntil(request, token, (kinds) =>
			kinds.includes('chooseLandmarkCard')
		);
		const drafter = askedSeats(drafting.game)[0];
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[drafter - 1]}` })
			.click();

		// The draft: two landmark cards on the shelf, kept with Keep card.
		await expect(
			page.getByRole('heading', { name: 'Keep a landmark card' })
		).toBeVisible();
		const cards = page.locator('.rg-card-shelf .rg-landmark-card');
		await expect(cards).toHaveCount(2);
		const kept = await cards.first().getAttribute('aria-label');
		await page.locator('.rg-card-shelf button').first().click();
		await page.getByRole('button', { name: 'Keep card' }).click();
		await expect(
			page.getByRole('heading', { name: 'Keep a landmark card' })
		).toHaveCount(0);

		// The other player was left one card, kept without a question; play on to the first turn.
		const ready = await playUntil(
			request,
			token,
			(kinds, game) =>
				game.phase === 'play' && kinds.includes('chooseTurn')
		);
		const first = askedSeats(ready.game)[0];
		await page.reload();
		await page
			.getByRole('button', { name: `I'm ${NAMES[first - 1]}` })
			.click();
		const row = page.getByRole('tablist', { name: 'Your city and cards' });
		await row.getByRole('tab', { name: 'Civ' }).click();
		const held = page.locator('.rg-held-landmark-card');
		await expect(
			held.getByRole('heading', { name: 'Landmark card' })
		).toBeVisible();
		await expect(held.locator('.rg-held-landmark-card--line')).toHaveText(
			/^(Not met yet: \d+ of \d+ .+|Met: .+)$/
		);
		await expect(held.locator('.rg-landmark-card')).toHaveCount(1);
		const mine = await held
			.locator('.rg-landmark-card')
			.getAttribute('aria-label');
		// The first player keeps the card the drafter didn't.
		if (first !== drafter) {
			expect(mine).not.toBe(kept);
		}
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
