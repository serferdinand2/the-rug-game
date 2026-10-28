// How to play in the game, in Chromium (#42): the menu opens the rules and the keyboard shortcuts, Escape closes them,
// and a player's chip carries their civilization's ability; then the table is ended and left, so it closes.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';
import { civAbilityText } from '../../src/lib/civ-rules.js';
import { RULES_HELP } from '../../src/lib/rules-help.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const NAMES = ['Marko', 'Vera'];

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

test('the menu opens How to play on the rules and on the keyboard shortcuts, and a chip carries its civilization (#42)', async ({
	page,
	request,
}) => {
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
	await api(request, 'start', { version: room.version }, token);

	try {
		// Setup through the API, until a turn choice.
		let seat = 0;
		for (let moves = 0; moves < 200; moves++) {
			const view = await api(request, 'state', undefined, token);
			seat = askedSeats(view.game)[0];
			const open = ops(view.game.pending ?? []);
			if (
				view.game.phase === 'play' &&
				open.some((o) => o.player === seat && o.kind === 'chooseTurn')
			) {
				break;
			}
			const own = await api(
				request,
				`state?seat=${seat}`,
				undefined,
				token
			);
			const op = ops(own.game.pending ?? []).find(
				(o) => o.answers && o.player === seat
			);
			await api(
				request,
				'move',
				{
					version: own.version,
					seat,
					action: { decision: op.id, ...op.answers[0] },
				},
				token
			);
		}

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[seat - 1]}` })
			.click();
		await expect(page.locator('.rg-game--board')).toBeVisible();
		const notice = page.locator('.rg-income-notice');
		if ((await notice.count()) > 0) {
			await notice.getByRole('button', { name: 'Got it' }).click();
		}

		// How to play opens on the first rules section.
		await page.getByRole('button', { name: 'Menu' }).click();
		await page.getByRole('menuitem', { name: 'How to play' }).click();
		const panel = page.getByRole('dialog', { name: 'How to play' });
		await expect(panel).toBeVisible();
		await expect(
			panel.getByRole('tab', { name: RULES_HELP[0].title })
		).toHaveAttribute('aria-selected', 'true');
		await expect(panel.getByRole('tabpanel')).toContainText(
			/** @type {any} */ (RULES_HELP[0].blocks[0]).text ??
				/** @type {any} */ (RULES_HELP[0].blocks[0]).list[0]
		);
		await page.keyboard.press('Escape');
		await expect(panel).toHaveCount(0);

		// Keyboard shortcuts opens on its own tab.
		await page.getByRole('button', { name: 'Menu' }).click();
		await page
			.getByRole('menuitem', { name: 'Keyboard shortcuts' })
			.click();
		await expect(
			panel.getByRole('tab', { name: 'Keyboard shortcuts' })
		).toHaveAttribute('aria-selected', 'true');
		await expect(
			panel.getByText('Turn the territory tile on the chosen hex.')
		).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(panel).toHaveCount(0);

		// A player's chip carries their civilization's full ability in its tooltip.
		const view = await api(request, 'state', undefined, token);
		const player = view.game.seats[0];
		const ability = civAbilityText(player.civs[0], view.game.version);
		expect(ability).toBeTruthy();
		const chip = page.locator('.rg-player-chip').first();
		await expect(chip).toHaveAttribute(
			'title',
			new RegExp(
				String(ability)
					.split('\n')[0]
					.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			)
		);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
