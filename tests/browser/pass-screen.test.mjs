// The hot-seat pass screen in Chromium (#30): a seat's own view is asked for only after its player takes the screen,
// when the game starts, when the turn passes and after a refresh; then the table is ended and left, so it closes.
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
 * Answers the seat's first open decision through the API, taking income when offered.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {number} seat
 * @returns {Promise<boolean>} Whether the seat had a decision to answer
 */
async function answer(request, token, seat) {
	const view = await api(request, `state?seat=${seat}`, undefined, token);
	const op = ops(view.game.pending ?? []).find(
		(o) => o.answers && o.player === seat
	);
	if (!op) {
		return false;
	}
	const chosen =
		op.answers.find((/** @type {any} */ a) => a.turn === 'income') ??
		op.answers[0];
	await api(
		request,
		'move',
		{ version: view.version, seat, action: { decision: op.id, ...chosen } },
		token
	);
	return true;
}

/**
 * The seat a hot-seat table asks first, from the public view.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function askedNow(request, token) {
	const view = await api(request, 'state', undefined, token);
	return { view, seat: askedSeats(view.game)[0] };
}

test("a hot-seat table asks for a seat's view only after its player takes the screen (#30)", async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
	/** @type {string[]} */
	const errors = [];
	page.on('console', (message) => {
		if (message.type() === 'error') {
			errors.push(message.text());
		}
	});
	page.on('pageerror', (error) => errors.push(error.message));
	/** The seats whose own view the page asked for, in order. @type {number[]} */
	const seatViews = [];
	page.on('request', (sent) => {
		const url = new URL(sent.url());
		if (url.pathname === '/api/state' && url.searchParams.has('seat')) {
			seatViews.push(Number(url.searchParams.get('seat')));
		}
	});

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
		// Setup through the API, until a player's first turn.
		for (let moves = 0; moves < 200; moves++) {
			const { view, seat } = await askedNow(request, token);
			const kinds = ops(view.game.pending ?? []).map((op) => op.kind);
			if (view.game.phase === 'play' && kinds.includes('chooseTurn')) {
				break;
			}
			await answer(request, token, seat);
		}

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');

		// The first player's turn: the pass screen names them, and no seat's view has been asked for.
		const first = (await askedNow(request, token)).seat;
		const firstName = NAMES[first - 1];
		await expect(
			page.getByRole('heading', {
				name: `Pass the screen to ${firstName}`,
			})
		).toBeVisible();
		await expect(page.getByText(`It's ${firstName}'s turn.`)).toBeVisible();
		await expect(page.locator('.rg-game')).toHaveCount(0);
		expect(seatViews).toEqual([]);

		await page.getByRole('button', { name: `I'm ${firstName}` }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		await expect(page.locator('.rg-game--private')).toBeVisible();
		expect(new Set(seatViews)).toEqual(new Set([first]));

		// The turn passes (answered through the API): the pass screen names the next player before their view loads.
		for (let moves = 0; moves < 50; moves++) {
			if ((await askedNow(request, token)).seat !== first) {
				break;
			}
			await answer(request, token, first);
		}
		const next = (await askedNow(request, token)).seat;
		const nextName = NAMES[next - 1];
		expect(next).not.toBe(first);
		await expect(
			page.getByRole('heading', {
				name: `Pass the screen to ${nextName}`,
			})
		).toBeVisible();
		await expect(page.locator('.rg-game')).toHaveCount(0);
		// A moment later, still nothing of the next player's has been asked for.
		await page.waitForTimeout(1500);
		expect(seatViews).not.toContain(next);
		await expect(page.locator('.rg-game')).toHaveCount(0);

		// A refresh shows the pass screen again before any seat's view is asked for.
		seatViews.length = 0;
		await page.reload();
		await expect(
			page.getByRole('heading', {
				name: `Pass the screen to ${nextName}`,
			})
		).toBeVisible();
		expect(seatViews).toEqual([]);

		await page.getByRole('button', { name: `I'm ${nextName}` }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		expect(new Set(seatViews)).toEqual(new Set([next]));
		expect(errors).toEqual([]);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});

test("the asked player's clock counts down on the pass screen, then in the game header (#89)", async ({
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
	room = await api(
		request,
		'settings',
		{ version: room.version, timer: 5 },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	try {
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		const name = NAMES[(await askedNow(request, token)).seat - 1];
		await expect(
			page.getByRole('heading', { name: `Pass the screen to ${name}` })
		).toBeVisible();

		// TurnClock titles itself with its player's name and the time left, which ticks down.
		const passClock = page.getByTitle(new RegExp(`^${name}: \\d+:\\d\\d$`));
		await expect(passClock).toBeVisible();
		const passed = await passClock.getAttribute('title');
		await expect(passClock).not.toHaveAttribute('title', String(passed));

		await page.getByRole('button', { name: `I'm ${name}` }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		const headerClock = page
			.locator('.rg-game')
			.getByTitle(new RegExp(`^${name}: \\d+:\\d\\d$`));
		await expect(headerClock).toBeVisible();
		const shown = await headerClock.getAttribute('title');
		await expect(headerClock).not.toHaveAttribute('title', String(shown));
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
