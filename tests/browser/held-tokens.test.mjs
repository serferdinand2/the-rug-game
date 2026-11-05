// Another player's token moves while their advance shows, in Chromium with motion on (#179): at an online table the
// watcher looks at the World Map (or the tracks), the other player advances, the board switches to the tracks, and the
// token is drawn on the space it left until the display shows, then hops to the new one; at a hot-seat table the same happens to the
// player who takes the screen after the advance. Each test plays its table through the API to an advance, makes it
// with the screen open, and ends and leaves the table.
import { expect, test } from '@playwright/test';
import { askedSeats, openDecisions } from '../../src/lib/engine/game.js';
import { trackName } from '../../src/lib/game-names.js';

test.use({
	viewport: { width: 1920, height: 1080 },
	reducedMotion: 'no-preference',
});

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
 * Picks an answer that heads for an advance: an advance turn whenever it is offered, otherwise the first answer.
 * @param {{ answers: any[] }} op
 * @returns {any}
 */
function pick(op) {
	return (
		op.answers.find(
			(/** @type {any} */ answer) => answer.turn === 'advance'
		) ?? op.answers[0]
	);
}

/**
 * Records, from now on, every label the track's tokens show and every hop of a token on it, each with whether the
 * advance's display was on show; `window.__seen` holds them.
 * @param {import('@playwright/test').Page} page
 * @param {string} track - The track's name, its group's label
 */
async function watchTrack(page, track) {
	await page.evaluate((name) => {
		/** @type {{ label: string, shown: boolean }[]} */
		const seen = [];
		/** @type {{ shown: boolean }[]} */
		const hops = [];
		Reflect.set(window, '__seen', { seen, hops });
		const group = `[role="group"][aria-label="${name}"]`;
		const shown = () =>
			Boolean(
				document.querySelector('.rg-player-action[data-kind="advance"]')
			);
		const record = () => {
			const label = document
				.querySelector(`${group} .rg-progress-lanes`)
				?.getAttribute('aria-label');
			if (label && seen.at(-1)?.label !== label) {
				seen.push({ label, shown: shown() });
			}
		};
		// A hop is the token's animation of more than two keyframes (tokenHop, #175).
		const animate = Element.prototype.animate;
		Element.prototype.animate = function (frames, options) {
			if (
				Array.isArray(frames) &&
				frames.length > 2 &&
				this.matches('.rg-progress-lanes--token') &&
				this.closest(group)
			) {
				hops.push({ shown: shown() });
			}
			return animate.call(this, frames, options);
		};
		record();
		new MutationObserver(record).observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['aria-label'],
		});
	}, track);
}

/**
 * Checks the advance's display shows on the tracks, the token first drawn on the space it left, then reaching the new
 * one with a single hop while the display shows.
 * @param {import('@playwright/test').Page} page
 * @param {{ track: string, name: string, from: number }} advance - The track's name, the mover's name, the space left
 */
async function expectHeldThenHop(page, { track, name, from }) {
	const panel = page.locator('.rg-player-action[data-kind="advance"]');
	await expect(panel).toBeVisible({ timeout: 20000 });
	await expect(page.locator('.rg-track-board')).toBeVisible();
	const left = new RegExp(`\\b${name} ${from}\\b`);
	const reached = new RegExp(`\\b${name} ${from + 1}\\b`);
	await expect(
		page.getByRole('group', { name: track }).locator('.rg-progress-lanes')
	).toHaveAttribute('aria-label', reached);
	await page.waitForTimeout(300);
	const { seen, hops } =
		/** @type {{ seen: { label: string, shown: boolean }[], hops: { shown: boolean }[] }} */ (
			await page.evaluate(() => Reflect.get(window, '__seen'))
		);
	expect(
		seen[0]?.label,
		'the tracks first draw the token on the space it left'
	).toMatch(left);
	const arrival = seen.find((entry) => reached.test(entry.label));
	expect(
		arrival?.shown,
		'it reaches the new space while the display shows'
	).toBe(true);
	// Drawn on the new space first and taken back, it would hop backwards before the display too.
	expect(hops, 'one hop, while the display shows').toEqual([{ shown: true }]);
}

/** Where the watcher looks when the advance comes, and the titles: under reduced motion, nothing waits or hops. */
const WATCHES = /** @type {const} */ ({
	map: 'waits on the space it left until their advance shows, watched from the World Map, which switches to the tracks',
	tracks: 'waits on the space it left until their advance shows, watched from the tracks',
	reduced:
		'stands on its new space at once under reduced motion, without a hop',
});

for (const [start, title] of Object.entries(WATCHES)) {
	test(`another player's token ${title}`, async ({ browser, request }) => {
		test.setTimeout(240000);
		const ana = (await api(request, 'login', { name: 'Ana' })).token;
		const ben = (await api(request, 'login', { name: 'Ben' })).token;
		let room = await api(request, 'create', {}, ana);
		room = await api(request, 'join', { code: room.code }, ben);
		room = await api(request, 'start', { version: room.version }, ana);
		const tokens = { 1: ana, 2: ben };
		/** @type {import('@playwright/test').BrowserContext | null} */
		let context = null;
		try {
			// Play on through the API until a seat chooses which track to advance on.
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
					if (op.kind === 'chooseAdvance' && op.answers.length > 0) {
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
				throw new Error('Nobody advanced.');
			}
			const { seat, op } = found;
			const watcher = seat === 1 ? 2 : 1;
			const name = seat === 1 ? 'Ana' : 'Ben';
			const answer = op.answers[0];
			const from = Number(answer.from);

			// The other player's screen is open, on the World Map or the tracks, before the advance.
			context = await browser.newContext({
				viewport: { width: 1920, height: 1080 },
				reducedMotion: start === 'reduced' ? 'reduce' : 'no-preference',
			});
			const page = await context.newPage();
			await page.addInitScript(
				(saved) => sessionStorage.setItem('rg-token', saved),
				tokens[watcher]
			);
			await page.goto('/');
			await expect(page.locator('.rg-game')).toBeVisible();
			await page.waitForTimeout(500);
			const gotIt = page.getByRole('button', { name: 'Got it' });
			if (await gotIt.isVisible()) {
				await gotIt.click();
			}
			if (start === 'map') {
				await page.keyboard.press('m');
				await expect(page.locator('.rg-world-map')).toBeVisible();
			}
			await watchTrack(page, trackName(answer.track));

			room = await api(request, 'state', undefined, tokens[seat]);
			await api(
				request,
				'move',
				{
					version: room.version,
					action: { decision: op.id, ...answer },
				},
				tokens[seat]
			);

			if (start === 'reduced') {
				// The token is on its new space by the time the display shows, and nothing hops.
				await expect(
					page.locator('.rg-player-action[data-kind="advance"]')
				).toBeVisible({ timeout: 20000 });
				await expect(
					page
						.getByRole('group', { name: trackName(answer.track) })
						.locator('.rg-progress-lanes')
				).toHaveAttribute(
					'aria-label',
					new RegExp(`\\b${name} ${from + 1}\\b`),
					{ timeout: 100 }
				);
				const { hops } = await page.evaluate(() =>
					Reflect.get(window, '__seen')
				);
				expect(hops).toEqual([]);
				return;
			}
			// From the Map, the board switches to the tracks, and stays there (owner, 2026-11-05).
			await expectHeldThenHop(page, {
				track: trackName(answer.track),
				name,
				from,
			});
			await page.waitForTimeout(1000);
			await expect(page.locator('.rg-track-board')).toBeVisible();
		} finally {
			if (context) {
				await context.close();
			}
			// An online game ends once the other players have left; then the host ends it and leaves.
			await api(request, 'leave', {}, ben);
			const latest = await api(request, 'state', undefined, ana);
			await api(request, 'end', { version: latest.version }, ana);
			await api(request, 'leave', {}, ana);
		}
	});
}

test("at a hot-seat table, the player who takes the screen sees the last player's token wait, then hop", async ({
	page,
	request,
}) => {
	test.setTimeout(240000);
	const names = ['Ana', 'Ben'];
	const { token } = await api(request, 'login', { name: names[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: names[1] },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	/**
	 * The asked seat's first open decision, from its own view.
	 * @returns {Promise<{ seat: number, op: any, version: number }>}
	 */
	const asked = async () => {
		const seat = askedSeats(
			(await api(request, 'state', undefined, token)).game
		)[0];
		const view = await api(request, `state?seat=${seat}`, undefined, token);
		const op = openDecisions(view.game).find(
			(open) => open.player === seat && Array.isArray(open.answers)
		);
		return { seat, op, version: view.version };
	};
	/**
	 * Answers a seat's decision through the API.
	 * @param {{ seat: number, op: any, version: number }} now
	 * @param {any} choice
	 */
	const answer = (now, choice) =>
		api(
			request,
			'move',
			{
				version: now.version,
				seat: now.seat,
				action: { decision: now.op.id, ...choice },
			},
			token
		);

	try {
		// Through the API until a seat chooses which track to advance on.
		let now = await asked();
		for (let step = 0; step < 300; step++) {
			if (now.op?.kind === 'chooseAdvance' && now.op.answers.length) {
				break;
			}
			if (now.op) {
				await answer(now, pick(now.op));
			}
			now = await asked();
		}
		expect(now.op?.kind).toBe('chooseAdvance');
		const mover = now.seat;
		const name = names[mover - 1];
		const other = names[2 - mover];
		const choice = now.op.answers[0];

		// The mover takes the screen, and advances (through the API) with it open.
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page.getByRole('button', { name: `I'm ${name}` }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		await answer(now, choice);
		// The rest of the mover's turn, until the screen passes.
		for (let step = 0; step < 50; step++) {
			now = await asked();
			if (now.seat !== mover) {
				break;
			}
			if (now.op) {
				await answer(now, now.op.answers[0]);
			}
		}
		await expect(
			page.getByRole('heading', { name: `Pass the screen to ${other}` })
		).toBeVisible({ timeout: 15000 });

		// The next player takes the screen: the tracks draw the mover's token where it was, until the display shows.
		await watchTrack(page, trackName(choice.track));
		await page.getByRole('button', { name: `I'm ${other}` }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		const gotIt = page.getByRole('button', { name: 'Got it' });
		if (await gotIt.isVisible()) {
			await gotIt.click();
		}
		await expectHeldThenHop(page, {
			track: trackName(choice.track),
			name,
			from: Number(choice.from),
		});
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
