// Arts & Architecture at a hot-seat table (#35 part 4): the arts track on the board with its masterpiece row and a card
// shown in full, then a masterpiece created from the shelf and shown on the Civ tab. The test plays through the API
// between the looks, then ends and leaves the table.
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
 * An answer that heads up the arts track: advance whenever offered, on the arts track when it can, and decline the
 * bonuses and trades; otherwise the first answer.
 * @param {any} op
 * @returns {any}
 */
function upTheArts(op) {
	if (op.kind === 'chooseTurn') {
		return op.answers.find((a) => a.turn === 'advance') ?? op.answers[0];
	}
	if (op.kind === 'chooseAdvance') {
		return op.answers.find((a) => a.track === 'arts') ?? op.answers[0];
	}
	if (op.kind === 'chooseBonus' || op.kind === 'chooseTrade') {
		return op.answers.at(-1);
	}
	return op.answers[0];
}

/**
 * Answers the open questions through the API until `stop` says so about the open ones, the server's own answers
 * waited for.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {(kinds: string[], game: any) => boolean} stop
 * @param {number} [limit] - Most answers before giving up
 */
async function playUntil(request, token, stop, limit = 400) {
	for (let moves = 0; moves < limit; moves++) {
		const view = await api(request, 'state', undefined, token);
		const kinds = ops(view.game.pending ?? []).map((op) => op.kind);
		if (stop(kinds, view.game)) {
			return view;
		}
		const seat = askedSeats(view.game)[0];
		if (seat === undefined) {
			await new Promise((resolve) => setTimeout(resolve, 300));
			continue;
		}
		const own = await api(request, `state?seat=${seat}`, undefined, token);
		const op = ops(own.game.pending ?? []).find(
			(o) => o.answers && o.player === seat
		);
		if (!op) {
			await new Promise((resolve) => setTimeout(resolve, 300));
			continue;
		}
		await api(
			request,
			'move',
			{
				version: own.version,
				seat,
				action: { decision: op.id, ...upTheArts(op) },
			},
			token
		);
	}
	throw new Error('The game never got there.');
}

test('an Arts & Architecture table shows the arts track with its masterpieces, and a masterpiece created lands on the Civ tab (#35)', async ({
	page,
	request,
}) => {
	test.setTimeout(180_000);
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
	await api(request, 'start', { version: room.version }, token);

	try {
		const ready = await playUntil(
			request,
			token,
			(kinds, game) =>
				game.phase === 'play' && kinds.includes('chooseTurn')
		);
		const first = askedSeats(ready.game)[0];
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[first - 1]}` })
			.click();

		await expect(page.locator('.rg-game--board')).toBeVisible();
		const notice = page.locator('.rg-income-notice');
		if ((await notice.count()) > 0) {
			await notice.getByRole('button', { name: 'Got it' }).click();
			await expect(notice).toHaveCount(0);
		}

		// The arts track, fifth, with the 3 face-up masterpieces and the deck on its line (owner, #35 part 4).
		await expect(page.locator('.rg-track')).toHaveCount(5);
		await expect(
			page.getByRole('heading', { name: 'Arts', exact: true })
		).toBeVisible();
		const row = page.locator('.rg-masterpiece-row');
		await expect(row.locator('.rg-masterpiece-chip')).toHaveCount(3);
		await expect(row).toContainText('Deck · 17');
		await row.locator('.rg-masterpiece-chip').first().hover();
		await expect(
			page.locator('.rg-card-preview .rg-masterpiece-card')
		).toBeVisible();
		await page.mouse.move(0, 0);

		// Up the arts track to Dance, which creates: the face-up cards and the deck's back on the shelf.
		const creating = await playUntil(request, token, (kinds) =>
			kinds.includes('chooseCreate')
		);
		const creator = askedSeats(creating.game)[0];
		await page.reload();
		await page
			.getByRole('button', { name: `I'm ${NAMES[creator - 1]}` })
			.click();
		await expect(
			page.getByRole('heading', { name: 'Create a masterpiece' })
		).toBeVisible();
		const shelf = page.locator('.rg-card-shelf');
		await expect(shelf.locator('.rg-masterpiece-card')).toHaveCount(3);
		await expect(shelf.locator('.rg-masterpiece-back')).toHaveCount(1);
		const taken = await shelf
			.locator('.rg-masterpiece-card')
			.first()
			.getAttribute('aria-label');
		await shelf.locator('button').first().click();
		await page.getByRole('button', { name: 'Take card' }).click();
		await expect(
			page.getByRole('heading', { name: 'Create a masterpiece' })
		).toHaveCount(0);

		// The masterpiece shows on the creator's Civ tab, under the landmark card (owner).
		const tabs = page.getByRole('tablist', { name: 'Your city and cards' });
		await tabs.getByRole('tab', { name: 'Civ' }).click();
		const name = String(taken).replace(/ masterpiece card$/, '');
		await expect(
			page.locator('.rg-player-tabs--masterpieces .rg-masterpiece-chip')
		).toContainText([name]);
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
