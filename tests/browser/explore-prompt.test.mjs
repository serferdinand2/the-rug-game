// The explore prompt in Chromium (#74): every tile the player holds is offered, and the one they pick lands on the
// hex they click in the turn they choose. The test plays a two-seat hot-seat table through the API until a seat must
// explore with two or more tiles, then explores with the mouse and the R key, and closes the table.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';
import { exploreTiles, tileScores } from '../../src/lib/area/explore.js';

test.use({ viewport: { width: 1920, height: 1080 } });

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
 * Picks an answer: exploration first, then an advance, otherwise the first.
 * @param {{ answers: any[] }} op
 * @returns {any}
 */
function pick(op) {
	const json = op.answers.map((answer) => JSON.stringify(answer));
	const explore = json.findIndex((text) => text.includes('"exploration"'));
	if (explore >= 0) {
		return op.answers[explore];
	}
	const advance = json.findIndex((text) => text.includes('"advance"'));
	return op.answers[advance >= 0 ? advance : 0];
}

/** Turns a hex's label name ("−1,−1") back into its key ("-1_-1"). */
const hexKey = (/** @type {string} */ name) =>
	name.replaceAll('−', '-').replace(',', '_');

test('an explore offers every tile, and places the one the player picks in the turn they choose', async ({
	page,
	request,
}) => {
	test.setTimeout(120000);
	/** @type {string[]} */
	const errors = [];
	page.on('console', (message) => {
		if (message.type() === 'error') {
			errors.push(message.text());
		}
	});
	page.on('pageerror', (error) => errors.push(error.message));

	const { token } = await api(request, 'login', { name: 'Ana' });
	let room = await api(
		request,
		'create',
		{ options: { mode: 'hotseat' } },
		token
	);
	room = await api(
		request,
		'add-seat',
		{ version: room.version, name: 'Ben' },
		token
	);
	room = await api(request, 'start', { version: room.version }, token);

	try {
		// Play on through the API until a seat must explore with at least two tiles to choose from.
		/** @type {{ seat: number, op: any, game: any } | null} */
		let found = null;
		for (let step = 0; step < 400 && !found; step++) {
			let acted = false;
			for (const seat of [1, 2]) {
				room = await api(
					request,
					`state?seat=${seat}`,
					undefined,
					token
				);
				const op = openDecisions(room.game).find(
					(open) =>
						open.player === seat && Array.isArray(open.answers)
				);
				if (!op) {
					continue;
				}
				if (
					op.kind === 'chooseExplore' &&
					exploreTiles(/** @type {any} */ (op)).length >= 2
				) {
					found = { seat, op, game: room.game };
					break;
				}
				room = await api(
					request,
					'move',
					{
						version: room.version,
						seat,
						action: { decision: op.id, ...pick(op) },
					},
					token
				);
				acted = true;
				break;
			}
			if (!found && !acted) {
				await new Promise((resolve) => setTimeout(resolve, 300));
			}
		}
		if (!found) {
			throw new Error('No explore with several tiles was reached.');
		}
		const { seat, op, game } = found;
		const tiles = exploreTiles(op);

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		const name = seat === 1 ? 'Ana' : 'Ben';
		await expect(
			page.getByRole('heading', { name: `Pass the screen to ${name}` })
		).toBeVisible();
		await page.getByRole('button', { name: `I'm ${name}` }).click();

		const group = page.getByRole('group', { name: 'Your tiles' });
		const buttons = group.getByRole('button');
		await expect(buttons).toHaveCount(tiles.length);
		await expect(group.locator('[aria-pressed="true"]')).toHaveCount(0);
		const explore = page.getByRole('button', {
			name: 'Explore',
			exact: true,
		});
		await expect(explore).toBeDisabled();

		// Choose the hex and the tile from the view: the first lit hex where a tile other than the first scores below
		// the best any tile reaches there; otherwise the first lit hex and the highest-numbered tile.
		const targets = page.locator('.rg-world-map--target');
		const names = (
			await targets.evaluateAll((all) =>
				all.map((hex) => hex.getAttribute('aria-label') ?? '')
			)
		).map((text) => {
			const found = /^Hex (−?\d+,−?\d+):/.exec(text);
			if (!found) {
				throw new Error(`Unexpected hex label: ${text}`);
			}
			return found[1];
		});
		/** @type {number} */
		let hexIndex = 0;
		let chosen = Math.max(...tiles);
		let better = false;
		for (const [index, hexName] of names.entries()) {
			const here = tileScores(game, op, hexKey(hexName));
			const best = Math.max(...tiles.map((tile) => here[tile].vp));
			const lower = tiles
				.filter((tile) => tile !== tiles[0] && here[tile].vp < best)
				.sort((x, y) => here[x].vp - here[y].vp || y - x);
			if (lower.length > 0) {
				hexIndex = index;
				chosen = lower[0];
				better = true;
				break;
			}
		}
		test.info().annotations.push({
			type: 'choice',
			description: better
				? `hex ${names[hexIndex]}: tile ${chosen} scores below the best`
				: `no hex has a lower-scoring tile; first hex, tile ${chosen}`,
		});
		const hex = hexKey(names[hexIndex]);
		const scores = tileScores(game, op, hex);
		expect(chosen).not.toBe(tiles[0]);
		if (better) {
			expect(scores[chosen].vp).toBeLessThan(
				Math.max(...tiles.map((tile) => scores[tile].vp))
			);
		}

		// A lit hex picks the lowest-numbered tile at its best turn.
		await targets.nth(hexIndex).click();
		await expect(page.getByTestId(`tile-${tiles[0]}`)).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(explore).toBeEnabled();
		// With a tile picked, another lit hex's label says what that tile best scores there.
		/** @param {number} tile */
		const checkOtherLabel = async (tile) => {
			const other = names.findIndex((_, index) => index !== hexIndex);
			if (other < 0) {
				return;
			}
			const vp = tileScores(game, op, hexKey(names[other]))[tile].vp;
			await expect(targets.nth(other)).toHaveAttribute(
				'aria-label',
				`Hex ${names[other]}: unexplored. Up to ${vp} VP.`
			);
		};
		await checkOtherLabel(tiles[0]);

		await page.getByTestId(`tile-${chosen}`).click();
		await expect(page.getByTestId(`tile-${chosen}`)).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await checkOtherLabel(chosen);
		await page.keyboard.press('r');
		await explore.click();

		await expect
			.poll(async () => {
				const state = await api(
					request,
					`state?seat=${seat}`,
					undefined,
					token
				);
				const placed = state.game.hexes[hex];
				return placed.tile === undefined
					? null
					: [placed.tile, placed.orient];
			})
			.toEqual([chosen, (scores[chosen].orient + 1) % 6]);

		expect(errors).toEqual([]);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		await api(request, 'end', { version: latest.version }, token);
		await api(request, 'leave', {}, token);
	}
});
