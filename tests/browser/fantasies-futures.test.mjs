// Fantasies & Futures in the lobby and the game (#39): the lobby's switch, and the Eras tab's fifth row for the income
// mat's overlay. The test ends and leaves its table.
import { expect, test } from '@playwright/test';

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
