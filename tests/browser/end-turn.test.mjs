// End turn in Chromium (#146): a finished turn waits on a gold End turn button with a countdown; pressing it passes the turn. The table is ended and left, so it closes.
import { expect, test } from '@playwright/test';
import { askedSeats, openDecisions } from '../../src/lib/engine/game.js';

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
 * Answers the seat's first open decision through the API, taking income when offered.
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
 * The public view and the seat it asks first.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function askedNow(request, token) {
	const view = await api(request, 'state', undefined, token);
	return { view, seat: askedSeats(view.game)[0] };
}

test('a finished turn waits on End turn, which passes the turn (#146)', async ({
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
		// Setup and income turn 1 through the API, then the first player takes an income turn and answers what it asks,
		// until only End turn is open.
		let taken = false;
		let first = 0;
		for (let moves = 0; moves < 300; moves++) {
			const { view, seat } = await askedNow(request, token);
			const open = openDecisions(view.game).filter(
				(o) => o.player === seat
			);
			if (open.some((o) => o.kind === 'confirmEndTurn')) {
				first = seat;
				break;
			}
			if (open.some((o) => o.kind === 'chooseTurn')) {
				taken = true;
			}
			await answer(request, token, seat);
		}
		expect(taken, 'a turn was chosen first').toBe(true);
		const { view } = await askedNow(request, token);
		const turn = view.game.turn;

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[first - 1]}` })
			.click();
		const notice = page.locator('.rg-income-notice');
		if (await notice.count()) {
			await notice.getByRole('button', { name: 'Got it' }).click();
		}
		await expect(
			page.getByText('Nothing left to do this turn.')
		).toBeVisible();
		const endTurn = page.getByRole('button', { name: /^End turn \(\d\)$/ });
		await expect(endTurn).toBeVisible();

		// The header keeps the turn on the finished player, its glow dimmed as the turn is passing (#177).
		const chip = page.getByRole('button', {
			name: new RegExp(
				`^${NAMES[first - 1]}, .*current player, ending their turn$`
			),
		});
		await expect(chip).toHaveClass(/rg-player-chip--closing/);
		await expect(
			page.getByRole('button', { name: /current player/ })
		).toHaveCount(1);

		if (process.env.SHOTS) {
			await page.locator('.rg-turn-bar').screenshot({
				path: 'docs/ui/screens/game-end-turn.png',
			});
			const box = await chip.boundingBox();
			if (box) {
				await page.screenshot({
					path: 'docs/ui/screens/game-end-turn-header.png',
					clip: {
						x: 0,
						y: 0,
						width: 1920,
						height: box.y + box.height + 12,
					},
				});
			}
		}

		await endTurn.click();
		await expect
			.poll(async () => (await askedNow(request, token)).view.game.turn)
			.toBe(turn + 1);
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
