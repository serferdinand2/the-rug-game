// The table's look (#174) in Chromium: on the viewer's turn each token stands on its track space, the capital counters
// are named, Take income sits on the footer's right with its key, the header shows the turn, and How to play has a
// Symbols tab. The test starts an online table through the API, opens Ana's screen, and ends and leaves the table.
import { expect, test } from '@playwright/test';
import { openDecisions } from '../../src/lib/engine/game.js';

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

test("on the viewer's turn the tokens stand on the spaces, the counters are named and the footer's actions sit on the right (#174)", async ({
	browser,
	request,
}) => {
	test.setTimeout(120000);
	const ana = (await api(request, 'login', { name: 'Ana' })).token;
	const ben = (await api(request, 'login', { name: 'Ben' })).token;
	let room = await api(request, 'create', {}, ana);
	room = await api(request, 'join', { code: room.code }, ben);
	room = await api(request, 'start', { version: room.version }, ana);
	const tokens = { 1: ana, 2: ben };
	// Both players answer their setup with the first answer, each from their own view, until Ana chooses her turn.
	for (let step = 0; step < 80; step++) {
		let acted = false;
		let ready = false;
		for (const seat of /** @type {const} */ ([1, 2])) {
			room = await api(request, 'state', undefined, tokens[seat]);
			const op = openDecisions(room.game).find(
				(open) => open.player === seat && Array.isArray(open.answers)
			);
			if (seat === 1 && op?.kind === 'chooseTurn') {
				ready = true;
				break;
			}
			if (!op || op.answers.length === 0) {
				continue;
			}
			await api(
				request,
				'move',
				{
					version: room.version,
					action: { decision: op.id, ...op.answers[0] },
				},
				tokens[seat]
			);
			acted = true;
			break;
		}
		if (ready) {
			break;
		}
		if (!acted) {
			await new Promise((resolve) => setTimeout(resolve, 300));
		}
	}
	const context = await browser.newContext({
		viewport: { width: 1920, height: 1080 },
	});
	try {
		const page = await context.newPage();
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			ana
		);
		await page.goto('/');
		await expect(page.locator('.rg-game')).toBeVisible();

		// Each token stands on the bottom edge of a track space: its middle within a few pixels of that edge.
		const edges = await page.evaluate(() =>
			[...document.querySelectorAll('.rg-track')].map((track) => {
				const space = track
					.querySelector('.rg-track-space')
					?.getBoundingClientRect();
				return [
					...track.querySelectorAll('.rg-progress-lanes--token'),
				].map((token) => {
					const box = token.getBoundingClientRect();
					return Math.abs(
						(box.top + box.bottom) / 2 - (space?.bottom ?? 0)
					);
				});
			})
		);
		expect(edges.length).toBe(4);
		for (const track of edges) {
			expect(track.length).toBe(2);
			for (const distance of track) {
				expect(distance).toBeLessThan(6);
			}
		}
		// No progress line is drawn any more.
		await expect(page.locator('.rg-progress-lanes--line')).toHaveCount(0);

		// The capital counters say what they count.
		const counters = page.getByRole('group', {
			name: 'Completed capital sections',
		});
		await expect(counters).toContainText('Rows');
		await expect(counters).toContainText('Columns');
		await expect(counters).toContainText('Districts');

		// Ana's turn: the first-income notice closes, then the footer offers income.
		const gotIt = page.getByRole('button', { name: 'Got it' });
		if (await gotIt.isVisible()) {
			await gotIt.click();
		}
		const takeIncome = page
			.locator('.rg-turn-bar')
			.getByRole('button', { name: /^Take income/ });
		await expect(takeIncome).toBeVisible({ timeout: 20000 });
		await expect(takeIncome.locator('kbd')).toHaveText('I');
		// It stands on the footer's right, after the turn label.
		const label = await page.locator('.rg-turn-bar--label').boundingBox();
		const income = await takeIncome.boundingBox();
		expect(income?.x ?? 0).toBeGreaterThan(960);
		expect(income?.x ?? 0).toBeGreaterThan(label?.x ?? 0);
		// The header shows that it is Ana's turn, and so does the tab.
		await expect(page.locator('.rg-top-bar')).toHaveClass(
			/rg-top-bar--yours/
		);
		await expect(page).toHaveTitle('● Your turn · The Rug Game');

		// With a space chosen, Take income shrinks to its button beside Advance, and the footer keeps its height.
		await page.locator('.rg-track-space--available').first().click();
		const footer = page.locator('.rg-turn-bar');
		const advance = footer.getByRole('button', { name: /^Advance/ });
		await expect(advance).toBeVisible();
		const bar = await footer.boundingBox();
		for (const button of [advance, takeIncome]) {
			const box = await button.boundingBox();
			expect(box?.y ?? 0).toBeGreaterThanOrEqual(bar?.y ?? 0);
			expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
				(bar?.y ?? 0) + (bar?.height ?? 0) + 1
			);
		}
		expect((await advance.boundingBox())?.x ?? 0).toBeGreaterThan(
			(await takeIncome.boundingBox())?.x ?? 0
		);
		await page.keyboard.press('Escape');

		// How to play has a Symbols tab, after Advancing on a track.
		await page.keyboard.press('h');
		const help = page.getByRole('dialog', { name: 'How to play' });
		const tabs = help.getByRole('tab');
		const names = await tabs.allTextContents();
		expect(names.indexOf('Symbols')).toBe(
			names.indexOf('Advancing on a track') + 1
		);
		await help.getByRole('tab', { name: 'Symbols' }).click();
		await expect(help.locator('.rg-symbol-key')).toBeVisible();
		await expect(help.getByText('Roll the science die')).toBeVisible();
		await page.keyboard.press('Escape');
	} finally {
		await context.close();
		// An online game ends once the other players have left; then the host ends it and leaves.
		await api(request, 'leave', {}, ben);
		const latest = await api(request, 'state', undefined, ana);
		await api(request, 'end', { version: latest.version }, ana);
		await api(request, 'leave', {}, ana);
	}
});
