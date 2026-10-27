// The results, the log and the scores in Chromium (#29): a two-seat hot-seat game played to the end shows the final
// standings with each player's VP by source, reviews the board with the log and scores, and comes back; then the
// table is left, so it closes.
import { expect, test } from '@playwright/test';

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

test('a finished game shows the results; the board, log and scores can be reviewed', async ({
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
		{ version: room.version, name: 'Bo' },
		token
	);
	await api(request, 'start', { version: room.version }, token);

	try {
		// Every seat answers its first answer, and takes income whenever it may, until the game ends.
		for (let moves = 0; moves < 2000; moves++) {
			const views = await Promise.all(
				[1, 2].map((seat) =>
					api(request, `state?seat=${seat}`, undefined, token)
				)
			);
			if (views[0].game.phase === 'over') {
				break;
			}
			const open = views.flatMap((view, i) =>
				ops(view.game.pending ?? [])
					.filter((op) => op.answers && op.player === i + 1)
					.map((op) => ({ view, op }))
			);
			const next = open[0];
			expect(next, 'someone is asked until the game ends').toBeTruthy();
			const answer =
				next.op.answers.find(
					(/** @type {any} */ a) => a.turn === 'income'
				) ?? next.op.answers[0];
			await api(
				request,
				'move',
				{
					version: next.view.version,
					seat: next.op.player,
					action: { decision: next.op.id, ...answer },
				},
				token
			);
		}

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');

		// The final standings, as the end screen draws them.
		await expect(
			page.getByRole('heading', { name: 'Final standings' })
		).toBeVisible();
		const rows = page.locator('.rg-standing-row');
		await expect(rows).toHaveCount(2);
		await expect(page.locator('.rg-results--yours h2')).toHaveText(
			/The winners?/
		);
		await expect(
			page.getByRole('heading', { name: 'How the tie was decided' })
		).toBeVisible();
		await expect(page.locator('.rg-results--facts')).toContainText(
			'Hot-seat · 2 players'
		);

		// A name opens where the VP came from, adding up to the player's score.
		const first = rows.first();
		await first.locator('.rg-standing-row--name').click();
		await expect(first.locator('.rg-standing-row--sources')).toBeVisible();
		const score = Number(
			(
				await first.locator('.rg-standing-row--score').textContent()
			)?.replace(/\D/g, '')
		);
		const parts = await first
			.locator('.rg-standing-row--list dd')
			.allTextContents();
		expect(
			parts.reduce((sum, text) => sum + Number.parseInt(text, 10), 0)
		).toBe(score);

		// The board as it ended, with the log and the scores.
		await page.getByRole('button', { name: 'Review game board' }).click();
		await expect(page.locator('.rg-game')).toBeVisible();
		await expect(page.locator('.rg-turn-bar')).toContainText(
			'Game complete'
		);
		await expect(page.locator('.rg-turn-bar')).toContainText(
			'The game is complete.'
		);
		// A change at the table (here the undo setting) brings a new room view, but the same deal: the board stays.
		const finished = await api(request, 'state', undefined, token);
		await api(
			request,
			'settings',
			{ version: finished.version, undo: !finished.undo },
			token
		);
		await expect
			.poll(
				async () =>
					(await api(request, 'state', undefined, token)).version
			)
			.toBeGreaterThan(finished.version);
		await page.waitForTimeout(1500);
		await expect(page.locator('.rg-game')).toBeVisible();
		await expect(
			page.getByRole('heading', { name: 'Final standings' })
		).toHaveCount(0);
		await page.getByRole('button', { name: 'Log and scores' }).click();
		const log = page.getByRole('log', { name: 'Table log' });
		await expect(log).toBeVisible();
		if (process.env.CAPTURE_GAME_LOG === '1') {
			await page.screenshot({ path: 'docs/ui/screens/game-log.png' });
		}
		expect(await log.locator('li').count()).toBeGreaterThan(20);
		await expect(log).toContainText('The game is over');
		await page.getByRole('tab', { name: 'Scores' }).click();
		await expect(page.locator('.rg-score-board--row')).toHaveCount(2);
		await page.keyboard.press('Escape');
		await expect(log).toHaveCount(0);

		// And back to the results.
		await page.getByRole('button', { name: 'Results' }).click();
		await expect(
			page.getByRole('heading', { name: 'Final standings' })
		).toBeVisible();
		expect(errors).toEqual([]);
	} finally {
		// Leaving a finished table closes it, so the address's table limit is free again.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
