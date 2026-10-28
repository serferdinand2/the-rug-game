// The first turn in Chromium (#77): the game takes every player's income turn 1 when setup ends, and each player's
// screen says so once, in a notice a refresh doesn't bring back; then the table is ended and left, so it closes.
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

/**
 * Answers the seat's first open decision through the API with its first answer, taking income when offered.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {number} seat
 */
async function answer(request, token, seat) {
	const view = await api(request, `state?seat=${seat}`, undefined, token);
	const op = ops(view.game.pending ?? []).find(
		(o) => o.answers && o.player === seat
	);
	const chosen =
		op.answers.find((/** @type {any} */ a) => a.turn === 'income') ??
		op.answers[0];
	await api(
		request,
		'move',
		{ version: view.version, seat, action: { decision: op.id, ...chosen } },
		token
	);
}

/**
 * Whether the seat's open decision is its turn choice, from the public view.
 * @param {any} view
 * @param {number} seat
 */
const choosingTurn = (view, seat) =>
	ops(view.game.pending ?? []).some(
		(o) => o.player === seat && o.kind === 'chooseTurn'
	);

/**
 * The seat the table asks first, from the public view.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function askedNow(request, token) {
	const view = await api(request, 'state', undefined, token);
	return { view, seat: askedSeats(view.game)[0] };
}

test('the first turn is taken for every player, and the notice says so once per player (#77)', async ({
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
		// Setup through the API, and anything a civilization's income turn 1 asks, until a turn choice: nobody is
		// asked to take income turn 1.
		for (let moves = 0; moves < 200; moves++) {
			const { view, seat } = await askedNow(request, token);
			if (view.game.phase === 'play' && choosingTurn(view, seat)) {
				break;
			}
			await answer(request, token, seat);
		}
		const { view, seat: first } = await askedNow(request, token);
		expect(
			view.game.seats.map((/** @type {any} */ s) => s.incomeTurns)
		).toEqual([1, 1]);

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		const firstName = NAMES[first - 1];
		await page.getByRole('button', { name: `I'm ${firstName}` }).click();

		// The notice says what happened, over the board, until Got it.
		const notice = page.locator('.rg-income-notice');
		await expect(
			notice.getByRole('heading', { name: 'Era I begins' })
		).toBeVisible();
		await expect(notice.getByText('You start with')).toBeVisible();
		// While it is open, the footer offers no income, so era I can't end by accident.
		await expect(
			page.getByRole('button', { name: 'Take income' })
		).toHaveCount(0);
		// One Escape closes one thing: the log opened over it closes first, and the notice stays.
		await page.getByRole('button', { name: 'Log and scores' }).click();
		await expect(page.locator('.rg-log-panel')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.rg-log-panel')).toHaveCount(0);
		await expect(
			notice.getByRole('heading', { name: 'Era I begins' })
		).toBeVisible();
		// So does the header menu's.
		await page.getByRole('button', { name: 'Menu' }).click();
		await expect(page.getByRole('menu')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('menu')).toHaveCount(0);
		await expect(
			notice.getByRole('heading', { name: 'Era I begins' })
		).toBeVisible();
		// With nothing else open, Escape closes it.
		await page.keyboard.press('Escape');
		await expect(notice).toHaveCount(0);
		await expect(
			page.getByText('Choose a space to advance to, or take income.')
		).toBeVisible();
		await expect(
			page.getByRole('button', { name: 'Take income' })
		).toBeVisible();

		// A refresh doesn't bring it back.
		await page.reload();
		await page.getByRole('button', { name: `I'm ${firstName}` }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		await expect(
			page.getByText('Choose a space to advance to, or take income.')
		).toBeVisible();
		await expect(notice).toHaveCount(0);

		// The turn passes (answered through the API): the next player gets a notice of their own over their turn choice.
		for (let moves = 0; moves < 50; moves++) {
			const { view: now, seat } = await askedNow(request, token);
			if (now.game.current !== first && choosingTurn(now, seat)) {
				break;
			}
			await answer(request, token, seat);
		}
		const next = (await askedNow(request, token)).seat;
		expect(next).not.toBe(first);
		await page
			.getByRole('button', { name: `I'm ${NAMES[next - 1]}` })
			.click();
		await expect(
			notice.getByRole('heading', { name: 'Era I begins' })
		).toBeVisible();
		await notice.getByRole('button', { name: 'Got it' }).click();
		await expect(notice).toHaveCount(0);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
