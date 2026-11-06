// Arts & Architecture's advanced mats at a hot-seat table (#36): the joint pick of a mat and a civilization on two
// shelves, then the kept advanced mat in the Capital tab. The test plays the rest of setup through the API, then ends
// and leaves the table.
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
 * The answer the API gives: a joint pick keeps its advanced mat, anything else its first answer.
 * @param {any} op
 */
function choose(op) {
	if (op.kind === 'chooseMatAndCiv') {
		const advanced = op.mats.at(-1);
		return (
			op.answers.find((/** @type {any} */ a) => a.capital === advanced) ??
			op.answers[0]
		);
	}
	return op.answers[0];
}

/**
 * Answers the open questions through the API until the first turn is asked.
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
	throw new Error('The game never reached its first turn.');
}

test('an Arts & Architecture table keeps a mat and a civilization on two shelves, and the Capital tab draws the advanced mat (#36)', async ({
	page,
	request,
}) => {
	test.setTimeout(120_000);
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
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page.getByRole('button', { name: `I'm ${NAMES[0]}` }).click();

		// The joint pick: the mats' shelf over the civilizations'; Confirm waits for both.
		await expect(
			page.getByRole('heading', {
				name: 'Choose your capital city and civilization',
			})
		).toBeVisible();
		const shelves = page.locator(
			'.rg-decision-prompt--joint .rg-card-shelf'
		);
		await expect(shelves).toHaveCount(2);
		const mats = shelves.nth(0).locator('button');
		await expect(mats).toHaveCount(3);
		const keep = page.getByRole('button', { name: 'Keep these' });
		await mats.last().click();
		await expect(keep).toBeDisabled();
		await shelves.nth(1).locator('button:not([disabled])').first().click();
		await expect(keep).toBeEnabled();
		await keep.click();
		await expect(
			page.getByRole('heading', {
				name: 'Choose your capital city and civilization',
			})
		).toHaveCount(0);

		// The other seat keeps its advanced mat too, through the API; then the first player's Capital tab.
		const ready = await playToFirstTurn(request, token);
		const first = askedSeats(ready.game)[0];
		const number = ready.game.seats[first - 1].capital.mat;
		expect(number).toBeGreaterThanOrEqual(7);
		const mat = capitalMat(number);
		const { rows, cols } = matShape(mat);
		await page.reload();
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
	} finally {
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
