// The dialogs on Dialog (#87), in Chromium: the launch page's How to play and the game's Table settings take the
// focus, close with Escape, the backdrop or their button, and give the focus back to the menu that opened them.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';

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

/**
 * Whether the focus is inside the open dialog.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
function focusInDialog(page) {
	return page.evaluate(() =>
		Boolean(document.activeElement?.closest('[role="dialog"]'))
	);
}

test("the launch page's How to play takes the focus, closes with Escape or the backdrop, and gives the focus back", async ({
	page,
}) => {
	await page.goto('/');
	const menu = page.getByRole('button', { name: 'Menu' });
	const dialog = page.getByRole('dialog', { name: 'How to play' });

	await menu.click();
	await page.getByRole('menuitem', { name: 'How to play' }).click();
	await expect(dialog).toBeVisible();
	await expect(dialog).toHaveAttribute('aria-modal', 'true');
	expect(await focusInDialog(page)).toBe(true);
	await page.keyboard.press('Escape');
	await expect(dialog).toHaveCount(0);
	await expect(menu).toBeFocused();

	await menu.click();
	await page.getByRole('menuitem', { name: 'How to play' }).click();
	await expect(dialog).toBeVisible();
	await page.mouse.click(8, 540);
	await expect(dialog).toHaveCount(0);
	await expect(menu).toBeFocused();
});

test("the game's Table settings takes the focus, closes with Escape or Done, and gives the focus back", async ({
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

		const menu = page.getByRole('button', { name: 'Menu' });
		const dialog = page.getByRole('dialog', { name: 'Table settings' });
		await menu.click();
		await page.getByRole('menuitem', { name: 'Table settings' }).click();
		await expect(dialog).toBeVisible();
		// The settings sit over the board only, so the header and footer stay in use.
		await expect(dialog).toHaveAttribute('aria-modal', 'false');
		expect(await focusInDialog(page)).toBe(true);
		await expect(
			dialog.getByRole('group', { name: 'Turn timer' })
		).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(dialog).toHaveCount(0);
		await expect(menu).toBeFocused();

		await menu.click();
		await page.getByRole('menuitem', { name: 'Table settings' }).click();
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Done' }).click();
		await expect(dialog).toHaveCount(0);
		await expect(menu).toBeFocused();
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
