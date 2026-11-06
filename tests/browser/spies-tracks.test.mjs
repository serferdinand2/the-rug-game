// The Spies' pick of a neighbour's track space (#172), in Chromium: the prompt stays at the centre of the tracks with
// no scrim, so a lit space around it takes a real click, and Confirm sends it. Civilizations are dealt at random, so
// the test deals one hot-seat Plans & Ploys table again until the Spies are offered, as the Traders' test does.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee'];

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
 * Ends a running table and leaves it, so it closes.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function close(request, token) {
	const latest = await api(request, 'state', undefined, token);
	if (latest.phase === 'playing') {
		await api(request, 'end', { version: latest.version }, token);
	}
	await api(request, 'leave', {}, token);
}

/**
 * The first open decision a seat can answer, from its own view.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {number} seat
 */
async function openOf(request, token, seat) {
	const view = await api(request, `state?seat=${seat}`, undefined, token);
	const op = openDecisions(view.game).find(
		(o) => o.player === seat && Array.isArray(o.answers)
	);
	return { view, op };
}

test("the Spies pick a neighbour's track space with a click on a lit space around the prompt, and Confirm sends it (#172)", async ({
	page,
	request,
}) => {
	test.setTimeout(240_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
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
	/** The seat offered the Spies, once a deal offers them. */
	let spies = 0;
	for (let deal = 0; deal < 30 && !spies; deal++) {
		room = await api(request, 'state', undefined, token);
		if (room.phase === 'playing') {
			room = await api(request, 'end', { version: room.version }, token);
		}
		await api(request, 'start', { version: room.version }, token);
		for (let seat = 1; seat <= NAMES.length && !spies; seat++) {
			const { op } = await openOf(request, token, seat);
			if (
				op?.kind === 'chooseCiv' &&
				op.answers.some((/** @type {any} */ a) => a.civ === 'spies')
			) {
				spies = seat;
			}
		}
	}
	expect(spies, 'a deal offered the Spies').toBeGreaterThan(0);

	try {
		// Setup and turns through the API: everyone advances while they can, so the neighbours' tokens leave the
		// start, and the Spies put their income turn's token on option 3, a track space.
		/** @type {any} */
		let pick = null;
		for (let step = 0; step < 1500 && !pick; step++) {
			let acted = false;
			for (let seat = 1; seat <= NAMES.length && !pick; seat++) {
				const { view, op } = await openOf(request, token, seat);
				if (!op) {
					continue;
				}
				if (op.kind === 'chooseSlot' && op.purpose === 'spiesSpace') {
					pick = op;
					break;
				}
				const advance = op.answers.filter(
					(/** @type {any} */ a) => a.turn && a.turn !== 'income'
				);
				const answer =
					op.answers.find(
						(/** @type {any} */ a) =>
							(seat === spies && a.civ === 'spies') ||
							(op.purpose === 'spies' && a.slot === 3)
					) ??
					advance[step % Math.max(advance.length, 1)] ??
					op.answers[0];
				await api(
					request,
					'move',
					{
						version: view.version,
						seat,
						action: { decision: op.id, ...answer },
					},
					token
				);
				acted = true;
				break;
			}
			expect(acted || pick, 'some seat had a decision').toBeTruthy();
		}
		expect(pick, "the Spies' track space is asked").toBeTruthy();

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[spies - 1]}` })
			.click();
		await expect(
			page.getByRole('heading', {
				name: "Choose a neighbour's track space",
			})
		).toBeVisible();

		// Every answer is a lit space, and a real click on one picks it: nothing covers the tracks around the panel.
		const spaces = pick.answers.map(
			(/** @type {any} */ a) => `${a.slot.track} space ${a.slot.space}`
		);
		await expect(page.locator('.rg-track-space--available')).toHaveCount(
			new Set(spaces).size
		);
		await page
			.locator(
				`.rg-track-space--available[aria-label*="${spaces[0]}, available"]`
			)
			.click();
		await expect(page.locator('.rg-track-space--selected')).toHaveCount(1);
		// Two neighbours on one space share it, and the panel asks whose it is.
		const sharing = spaces.filter(
			(/** @type {string} */ s) => s === spaces[0]
		).length;
		const owners = page.locator('.rg-decision-panel .rg-decision-option');
		if (sharing > 1) {
			await expect(owners).toHaveCount(sharing);
			await owners.first().click();
		}
		await page.getByRole('button', { name: /Confirm choice/ }).click();
		await expect(
			page.getByRole('heading', {
				name: "Choose a neighbour's track space",
			})
		).toHaveCount(0);
	} finally {
		await close(request, token);
	}
});
