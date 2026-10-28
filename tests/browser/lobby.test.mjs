// The lobby's table settings and the in-game Table settings in Chromium (#98): the host's choices reach the table, and
// a guest sees them locked. Each test ends and leaves the tables it opens.
import { expect, test } from '@playwright/test';

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
 * Waits until the table, as the server keeps it, passes a check.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} token
 * @param {(room: any) => unknown} check
 */
async function tableReaches(request, token, check) {
	await expect
		.poll(async () =>
			Boolean(check(await api(request, 'state', undefined, token)))
		)
		.toBe(true);
}

test('the host changes the turn timer, undo and a variant in the lobby, then the timer and undo in the game', async ({
	page,
	request,
}) => {
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

	try {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		const settings = page.getByRole('region', { name: 'Table settings' });
		await expect(settings).toBeVisible();

		const timer = settings.getByRole('group', { name: 'Turn timer' });
		await expect(
			timer.getByRole('button', { name: 'Off' })
		).toHaveAttribute('aria-pressed', 'true');
		await timer.getByRole('button', { name: '5 min' }).click();
		await tableReaches(request, token, (table) => table.timer === 5);
		await expect(
			timer.getByRole('button', { name: '5 min' })
		).toHaveAttribute('aria-pressed', 'true');

		const undo = settings.getByRole('group', { name: 'Undo rules' });
		await undo.getByRole('button', { name: 'No undo' }).click();
		await tableReaches(request, token, (table) => table.undo === false);

		const draft = settings.getByRole('group', {
			name: 'Income turn 1: draw 2 tapestry cards, keep 1',
		});
		await draft.getByRole('button', { name: 'Yes' }).click();
		await tableReaches(request, token, (table) =>
			table.options.variants.includes('tapestry-draft')
		);
		await expect(
			settings.getByText('Tapestry draft', { exact: true })
		).toBeVisible();

		await page.getByRole('button', { name: 'Start game' }).click();
		await page.getByRole('button', { name: "I'm Ana" }).click();
		await expect(page.locator('.rg-game--board')).toBeVisible();
		const notice = page.locator('.rg-income-notice');
		if ((await notice.count()) > 0) {
			await notice.getByRole('button', { name: 'Got it' }).click();
		}

		await page.getByRole('button', { name: 'Menu' }).click();
		await page.getByRole('menuitem', { name: 'Table settings' }).click();
		const dialog = page.getByRole('dialog', { name: 'Table settings' });
		await expect(dialog).toBeVisible();
		const gameTimer = dialog.getByRole('group', { name: 'Turn timer' });
		await expect(
			gameTimer.getByRole('button', { name: '5 min' })
		).toHaveAttribute('aria-pressed', 'true');
		await gameTimer.getByRole('button', { name: '2 min' }).click();
		await tableReaches(request, token, (table) => table.timer === 2);
		const gameUndo = dialog.getByRole('group', { name: 'Undo rules' });
		await expect(
			gameUndo.getByRole('button', { name: 'No undo' })
		).toHaveAttribute('aria-pressed', 'true');
		await gameUndo.getByRole('button', { name: 'Allow undo' }).click();
		await tableReaches(request, token, (table) => table.undo === true);
		await dialog.getByRole('button', { name: 'Done' }).click();
		await expect(dialog).toHaveCount(0);
	} finally {
		// The hot-seat game, if it started, is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});

test('a guest at an online table sees the mode and the settings locked, and the empty seats to share', async ({
	page,
	request,
}) => {
	const host = await api(request, 'login', { name: 'Vera' });
	const table = await api(
		request,
		'create',
		{ options: { mode: 'online' } },
		host.token
	);
	const guest = await api(request, 'login', { name: 'Iva' });

	try {
		await api(request, 'join', { code: table.code }, guest.token);
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			guest.token
		);
		await page.goto('/');
		const settings = page.getByRole('region', { name: 'Table settings' });
		await expect(settings).toBeVisible();

		const mode = page.getByRole('group', { name: 'Mode' });
		await expect(mode).toHaveAttribute(
			'title',
			'Only the host changes the mode.'
		);
		await expect(
			mode.getByRole('button', { name: 'Online mode' })
		).toBeDisabled();

		for (const name of ['Rules', 'Turn timer', 'Undo rules']) {
			const group = settings.getByRole('group', { name, exact: true });
			for (const choice of await group.getByRole('button').all()) {
				await expect(choice, name).toBeDisabled();
			}
		}
		await expect(
			settings.locator('[title="Only the host changes the table."]')
		).toHaveCount(3);

		// Online, an empty seat is filled by sharing the code, so a guest may still press it.
		await expect(
			page.getByRole('group', { name: 'Seat 3: empty' })
		).toBeVisible();
		await expect(
			page
				.getByRole('group', { name: 'Seat 3: empty' })
				.getByRole('button', { name: 'Open seat' })
		).toBeVisible();
	} finally {
		await api(request, 'leave', {}, guest.token);
		await api(request, 'leave', {}, host.token);
	}
});
