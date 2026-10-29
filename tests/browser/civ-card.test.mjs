// A civilization's choice made on its card (#78), in Chromium: the Entertainers move their token on the Civ tab's card.
// Civilizations are dealt at random, so the test deals one hot-seat table of five again until the Entertainers are
// offered, as Deal again does, rather than opening tables against the server's limit; then it ends and leaves it.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

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

test('the Entertainers move their token on the Civ tab card, and Confirm choice sends the space picked there (#78)', async ({
	page,
	request,
}) => {
	test.setTimeout(240_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
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
	/** The seat offered the Entertainers, once a deal offers them: 10 of the 16 civilizations are dealt each time. */
	let entertainer = 0;
	for (let deal = 0; deal < 20 && !entertainer; deal++) {
		room = await api(request, 'state', undefined, token);
		if (room.phase === 'playing') {
			room = await api(request, 'end', { version: room.version }, token);
		}
		await api(request, 'start', { version: room.version }, token);
		for (let seat = 1; seat <= NAMES.length && !entertainer; seat++) {
			const { op } = await openOf(request, token, seat);
			if (
				op?.kind === 'chooseCiv' &&
				op.answers.some(
					(/** @type {any} */ a) => a.civ === 'entertainers'
				)
			) {
				entertainer = seat;
			}
		}
	}
	expect(entertainer, 'a deal offered the Entertainers').toBeGreaterThan(0);

	try {
		// Setup and turns through the API, the Entertainers taking income, until their token is to move.
		let move = null;
		for (let step = 0; step < 800 && !move; step++) {
			let acted = false;
			for (let seat = 1; seat <= NAMES.length && !move; seat++) {
				const { view, op } = await openOf(request, token, seat);
				if (!op) {
					continue;
				}
				if (op.kind === 'chooseSlot' && op.purpose === 'entertainers') {
					move = op;
					break;
				}
				const answer =
					op.answers.find(
						(/** @type {any} */ a) =>
							(seat === entertainer &&
								a.civ === 'entertainers') ||
							a.turn === 'income'
					) ?? op.answers[0];
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
			expect(acted || move, 'some seat had a decision').toBeTruthy();
		}
		expect(move, 'the Entertainers were asked to move').toBeTruthy();

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[entertainer - 1]}` })
			.click();

		// The Civ tab opens by itself; the token's next spaces are buttons on the card, the panel lists none of them.
		await expect(page.getByRole('tab', { name: 'Civ' })).toHaveAttribute(
			'aria-selected',
			'true'
		);
		const spots = page.locator('[data-id^="civ-spot-"]');
		await expect(spots).toHaveCount(4);
		const panel = page.locator('.rg-decision-panel');
		await expect(panel.getByRole('button', { name: /Column/ })).toHaveCount(
			0
		);

		await page.locator('[data-id="civ-spot-c1r2"]').click();
		await expect(panel.getByText('Gain 1 culture')).toBeVisible();
		await panel.getByRole('button', { name: 'Confirm choice' }).click();

		await expect
			.poll(async () => {
				const view = await api(request, 'state', undefined, token);
				return view.game.seats[entertainer - 1].civData.entertainers.at;
			})
			.toBe('c1r2');
	} finally {
		await close(request, token);
	}
});
