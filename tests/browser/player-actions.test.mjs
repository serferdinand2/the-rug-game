// What other players just did, in Chromium (#153): at an online table, the tapestry card one player plays shows on the
// other's screen with their name, holds while hovered, closes by its Close button, takes no focus, and doesn't show again
// after a reload. The test plays the table through the API to an income turn, answers it with the watcher's screen
// open, and ends and leaves the table.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';
import { tapestryCardOf, tapestryName } from '../../src/lib/game-names.js';

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
 * Picks an answer that heads for an income turn: income whenever it is offered, otherwise the first answer.
 * @param {{ answers: any[] }} op
 * @returns {any}
 */
function pick(op) {
	return (
		op.answers.find(
			(/** @type {any} */ answer) => answer.turn === 'income'
		) ?? op.answers[0]
	);
}

test("an opponent's tapestry card shows with their name, holds while hovered, and closes by its button", async ({
	browser,
	request,
}) => {
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
		// Play on through the API until a seat must choose a tapestry card from their hand.
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
				if (
					op.kind === 'chooseTapestry' &&
					op.answers.some((/** @type {any} */ a) => a.card)
				) {
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
			throw new Error('No tapestry card was played.');
		}
		const { seat, op } = found;
		const watcher = seat === 1 ? 2 : 1;
		const name = seat === 1 ? 'Ana' : 'Ben';
		const answer = op.answers.find((/** @type {any} */ a) => a.card);

		// The other player's screen is open before the card is played.
		context = await browser.newContext({
			viewport: { width: 1920, height: 1080 },
		});
		const page = await context.newPage();
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			tokens[watcher]
		);
		await page.goto('/');
		await expect(page.locator('.rg-game')).toBeVisible();
		await page.waitForTimeout(500);
		// The first-income notice is the watcher's own: the actions wait until it is closed.
		const gotIt = page.getByRole('button', { name: 'Got it' });
		if (await gotIt.isVisible()) {
			await gotIt.click();
		}

		room = await api(request, 'state', undefined, tokens[seat]);
		await api(
			request,
			'move',
			{ version: room.version, action: { decision: op.id, ...answer } },
			tokens[seat]
		);

		const panel = page.locator('.rg-player-action[data-kind="tapestry"]');
		await expect(panel).toBeVisible({ timeout: 15000 });
		await expect(panel.getByText(`${name}'s turn`)).toBeVisible();
		await expect(panel.locator('.rg-player-action--headline')).toHaveText(
			tapestryCardOf(answer.card)?.id === 'trap'
				? `${name} played a trap as a tapestry card`
				: `${name} played ${tapestryName(answer.card)}`
		);
		await expect(panel.locator('.rg-tapestry-card')).toBeVisible();
		// It takes no focus.
		expect(
			await page.evaluate(() =>
				Boolean(document.activeElement?.closest('.rg-player-action'))
			)
		).toBe(false);

		// Hovering holds it past its 4 seconds.
		await panel.hover();
		await expect(panel).toHaveClass(/rg-player-action--paused/);
		await page.waitForTimeout(5000);
		await expect(panel).toBeVisible();

		// The Close button closes it at once.
		await panel.getByRole('button', { name: /^Close/ }).click();
		await expect(panel).toHaveCount(0);

		// The footer keeps what happened, and nothing plays after a reload.
		await page.mouse.move(5, 5);
		await expect(page.getByText('Just now:')).toBeVisible();
		await expect(
			page.getByRole('button', { name: 'Show again' })
		).toBeVisible();
		await page.reload();
		await expect(page.locator('.rg-game')).toBeVisible();
		await page.waitForTimeout(1500);
		await expect(page.locator('.rg-player-action')).toHaveCount(0);
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
