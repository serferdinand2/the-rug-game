// Plans & Ploys at a hot-seat table (#32, #33): the landmark-card draft on the card shelf, then the kept card on the Civ tab
// with its goal line, and How to play's Response cards tab. The test plays the rest of setup through the API, then ends and leaves the table.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';

const NAMES = ['Mira', 'Teodor', 'Vera', 'Ana'];

/** Most tables the Advisors test opens looking for a deal that includes them (the server allows 10 open per address). */
const ATTEMPTS = 6;

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
 * Answers the open questions through the API until `stop` says so about the open ones: with their first answers, or
 * with the answers `choose` gives.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {(kinds: string[], game: any, open: any[]) => boolean} stop
 * @param {(op: any) => any} [choose] - The answer to an operation; the first one when left out
 * @param {number} [limit] - Most answers before giving up
 */
async function playUntil(
	request,
	token,
	stop,
	choose = (op) => op.answers[0],
	limit = 200
) {
	for (let moves = 0; moves < limit; moves++) {
		const view = await api(request, 'state', undefined, token);
		const open = ops(view.game.pending ?? []);
		const kinds = open.map((op) => op.kind);
		if (stop(kinds, view.game, open)) {
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
				action: { decision: op.id, ...choose(op) },
			},
			token
		);
	}
	throw new Error('The game never got there.');
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

		// How to play has a tab for the response cards at a Plans & Ploys table (#33).
		await page.getByRole('button', { name: 'Menu' }).click();
		await page.getByRole('menuitem', { name: 'How to play' }).click();
		const help = page.getByRole('dialog', { name: 'How to play' });
		await help.getByRole('tab', { name: 'Response cards' }).click();
		await expect(help.getByRole('tabpanel')).toContainText(
			'Double Cross: the trap does nothing'
		);
		await expect(help.getByRole('tabpanel')).toContainText(
			'Surprise Party: if you are further along the Military track'
		);
		await page.keyboard.press('Escape');
		await expect(help).toHaveCount(0);
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});

/**
 * Opens a four-seat hot-seat Plans & Ploys table with the variant that deals only its civilizations, and starts it.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function startCivsTable(request, token) {
	let room = await api(
		request,
		'create',
		{
			options: {
				mode: 'hotseat',
				expansions: ['pp'],
				variants: ['civs-from-pp'],
			},
		},
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
	await api(request, 'start', { version: room.version }, token);
}

/**
 * Ends the table and leaves it.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function endTable(request, token) {
	const latest = await api(request, 'state', undefined, token);
	if (latest.phase === 'playing') {
		await api(request, 'end', { version: latest.version }, token);
	}
	await api(request, 'leave', {}, token);
}

/** The Advisors' question about a neighbour's draw, not the one about new cards gained mid-game. */
const isGift = (/** @type {any} */ op) =>
	op.kind === 'chooseGive' && op.vp === undefined;

test("the Advisors' owner is asked on the shelf to give a neighbour a tapestry card instead of their draw (#33)", async ({
	page,
	request,
}) => {
	test.setTimeout(240_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
	await page.addInitScript(
		(saved) => sessionStorage.setItem('rg-token', saved),
		token
	);
	/** @type {number | null} */
	let owner = null;
	for (let attempt = 0; attempt < ATTEMPTS && owner === null; attempt++) {
		await startCivsTable(request, token);
		let keep = false;
		try {
			// Take the Advisors when dealt, else the first civilization; advance whenever a turn allows, so a
			// neighbour of the Advisors draws a card.
			let dealt = false;
			const choose = (/** @type {any} */ op) => {
				if (op.kind === 'chooseCiv') {
					const advisors = op.answers.find(
						(/** @type {any} */ a) => a.civ === 'advisors'
					);
					dealt ||= advisors !== undefined;
					return advisors ?? op.answers[0];
				}
				return (
					op.answers.find(
						(/** @type {any} */ a) => a.turn === 'advance'
					) ?? op.answers[0]
				);
			};
			// A table nobody dealt the Advisors is left once its civilizations are chosen.
			const view = await playUntil(
				request,
				token,
				(_kinds, game, open) =>
					open.some(isGift) || (game.phase === 'play' && !dealt),
				choose,
				600
			);
			const question = ops(view.game.pending ?? []).find(isGift);
			if (question) {
				owner = question.player;
				keep = true;
			}
		} finally {
			if (!keep) {
				await endTable(request, token);
			}
		}
	}
	test.skip(
		owner === null,
		`no table was dealt the Advisors in ${ATTEMPTS} tries`
	);

	try {
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[Number(owner) - 1]}` })
			.click();
		const heading = page.getByRole('heading', {
			name: /instead of their draw\?$/,
		});
		await expect(heading).toBeVisible();
		await expect(
			page.locator('.rg-card-shelf button').first()
		).toBeVisible();
		await page.locator('.rg-card-shelf button').first().click();
		await page.getByRole('button', { name: 'Give card' }).click();
		await expect(heading).toHaveCount(0);
	} finally {
		await endTable(request, token);
	}
});
