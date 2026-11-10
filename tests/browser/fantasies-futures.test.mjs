// Fantasies & Futures in the lobby and the game (#39): the lobby's switch, and the Eras tab's fifth row for the income
// mat's overlay; and its advanced mats kept and drawn on the Capital tab (#40). The tests end and leave their tables.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';
import { capitalMat, matShape } from '../../src/lib/engine/data/capitals.js';

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
 * Answers the open questions through the API until the first turn is asked: a joint pick keeps its advanced mat,
 * anything else its first answer.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 */
async function playToFirstTurn(request, token) {
	for (let moves = 0; moves < 100; moves++) {
		const view = await api(request, 'state', undefined, token);
		const kinds = ops(view.game.pending ?? []).map((op) => op.kind);
		if (view.game.phase === 'play' && kinds.includes('chooseTurn')) {
			return view;
		}
		const seat = askedSeats(view.game)[0];
		const own = await api(request, `state?seat=${seat}`, undefined, token);
		const op = ops(own.game.pending ?? []).find(
			(o) => o.answers && o.player === seat
		);
		const answer =
			op.kind === 'chooseMatAndCiv'
				? (op.answers.find(
						(/** @type {any} */ a) => a.capital === op.mats.at(-1)
					) ?? op.answers[0])
				: op.answers[0];
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
	throw new Error('The game never reached its first turn.');
}

test("the lobby offers Fantasies & Futures, and its game shows the income mat's overlay on the Eras tab (#39)", async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
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

	try {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		const settings = page.getByRole('region', { name: 'Table settings' });
		const ff = settings
			.getByRole('group', { name: 'Expansions' })
			.getByRole('button', { name: 'Fantasies & Futures' });
		await expect(ff).toHaveAttribute('aria-pressed', 'false');
		await ff.click();
		await expect(ff).toHaveAttribute('aria-pressed', 'true');
		await expect
			.poll(
				async () =>
					(await api(request, 'state', undefined, token)).options
						.expansions
			)
			.toEqual(['ff']);

		await page.getByRole('button', { name: 'Start game' }).click();
		await page.getByRole('button', { name: `I'm ${NAMES[0]}` }).click();
		const tabs = page.getByRole('tablist', { name: 'Your city and cards' });
		await tabs.getByRole('tab', { name: 'Eras' }).click();
		const eras = page.getByRole('group', { name: 'Your eras' });
		await expect(eras.getByText('Income turn 5')).toBeVisible();
		await expect(eras.getByText('Nothing reserved')).toBeVisible();
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});

test('an F&F table deals one of its six mats, and the Capital tab draws it with its relief and overlay (#40)', async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
	const { token } = await api(request, 'login', { name: NAMES[0] });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat', expansions: ['ff'] } },
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
		const ready = await playToFirstTurn(request, token);
		const first = askedSeats(ready.game)[0];
		const number = ready.game.seats[first - 1].capital.mat;
		expect(number).toBeGreaterThanOrEqual(13);
		const mat = capitalMat(number);
		const { rows, cols } = matShape(mat);
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[first - 1]}` })
			.click();
		const tabs = page.getByRole('tablist', { name: 'Your city and cards' });
		await tabs.getByRole('tab', { name: 'Capital' }).click();
		await expect(page.locator('.rg-capital-city--name')).toHaveText(
			mat.name
		);
		await expect(
			page.getByRole('group', {
				name: `Capital city, ${rows} by ${cols} plots`,
			})
		).toBeVisible();
		await expect(
			page.locator('img.rg-capital-grid--relief').first()
		).toHaveAttribute('src', new RegExp(`capital-relief/${mat.id}\\.svg$`));
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});

test("the library shows F&F's pieces: a player's token on a capital plot and the civilizations' live cards (#40)", async ({
	page,
}) => {
	await page.goto('/components.html#capital-grid');
	await expect(
		page
			.locator('#capital-grid img[src="/art/piece/token-red.svg"]')
			.first()
	).toBeVisible();
	await page.goto('/components.html#civilization-card');
	const cards = page.locator('#civilization-card');
	await expect(cards.getByText('On spot 5').first()).toBeVisible();
	await expect(cards.getByText('No die here').first()).toBeVisible();
	await expect(cards.getByText('2 submerged').first()).toBeVisible();
});
