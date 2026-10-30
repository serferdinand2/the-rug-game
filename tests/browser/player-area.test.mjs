// The player area at desktop and laptop sizes (#64): the tab row, the capital grid and Your overview's counters stay
// inside the right quarter of the play screen, and every tab can be selected. The test plays setup through the API,
// takes the hot-seat screen, then ends and leaves the table.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';

const NAMES = ['Marko', 'Vera'];

/** Window sizes, widest first; from 1366 up, every tab shows without scrolling the row. */
const SIZES = [
	{ width: 1920, height: 1080, allTabsShown: true },
	{ width: 1536, height: 864, allTabsShown: true },
	{ width: 1440, height: 900, allTabsShown: true },
	{ width: 1366, height: 768, allTabsShown: true },
	{ width: 1280, height: 720, allTabsShown: false },
];

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

test('the player area keeps its tabs, capital and counters inside it at every desktop size (#64)', async ({
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
		// Setup through the API, with each seat's first answer, until a player's first turn.
		for (let moves = 0; moves < 200; moves++) {
			const view = await api(request, 'state', undefined, token);
			const kinds = ops(view.game.pending ?? []).map((op) => op.kind);
			if (view.game.phase === 'play' && kinds.includes('chooseTurn')) {
				break;
			}
			const seat = askedSeats(view.game)[0];
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
		const view = await api(request, 'state', undefined, token);
		const first = askedSeats(view.game)[0];

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[first - 1]}` })
			.click();
		const area = page.locator('.rg-game--private');
		await expect(area).toBeVisible();
		const row = page.getByRole('tablist', { name: 'Your city and cards' });
		const capital = row.getByRole('tab', { name: 'Capital' });

		for (const { width, height, allTabsShown } of SIZES) {
			const size = `${width}×${height}`;
			await page.setViewportSize({ width, height });
			await capital.click();
			const bounds = await area.boundingBox();
			if (!bounds) {
				throw new Error('The player area is not drawn.');
			}
			/**
			 * Whether a box lies across the player area's width, edges included.
			 * @param {{ x: number, width: number } | null} box
			 */
			const inside = (box) =>
				box !== null &&
				box.x >= bounds.x - 0.5 &&
				box.x + box.width <= bounds.x + bounds.width + 0.5;

			expect(
				inside(await row.boundingBox()),
				`the tab row at ${size}`
			).toBe(true);
			expect(
				inside(
					await page
						.locator('.rg-player-tabs .rg-capital-grid')
						.boundingBox()
				),
				`the capital grid at ${size}`
			).toBe(true);
			const counters = page.locator('.rg-self-summary--resource');
			await expect(counters).toHaveCount(4);
			for (const counter of await counters.all()) {
				expect(
					inside(await counter.boundingBox()),
					`a counter at ${size}`
				).toBe(true);
			}
			if (allTabsShown) {
				expect(
					await row.evaluate(
						(el) => el.scrollWidth <= el.clientWidth
					),
					`every tab shows at ${size}`
				).toBe(true);
			}

			// Every tab can be selected, and stays inside the player area once it is.
			for (const tab of await row.getByRole('tab').all()) {
				await tab.click();
				await expect(tab).toHaveAttribute('aria-selected', 'true');
				expect(
					inside(await tab.boundingBox()),
					`${await tab.textContent()} at ${size}`
				).toBe(true);
			}
		}

		// Each tech card's box on the Tech tab, the display's included, is as tall as the card it scales (#84).
		await page.setViewportSize({ width: 1920, height: 1080 });
		await row.getByRole('tab', { name: 'Tech' }).click();
		const cards = page.locator('.rg-player-tabs .rg-technology-card');
		await expect(cards.first()).toBeVisible();
		const heights = await cards.evaluateAll((drawn) =>
			drawn.map((card) => [
				card.getBoundingClientRect().height,
				card.closest('.rg-scaled-card')?.getBoundingClientRect()
					.height ?? 0,
			])
		);
		for (const [card, box] of heights) {
			expect(
				Math.abs(box - card),
				`a ${box}px box for a ${card}px tech card`
			).toBeLessThanOrEqual(0.5);
		}

		// A display card hovered is shown in full over the shared area by CardPreview, and goes on leave (#96). The last
		// card is the one no neighbour covers.
		const display = page
			.getByRole('group', { name: 'Face-up tech cards' })
			.getByRole('button')
			.last();
		const preview = page.locator('.rg-card-preview');
		await display.hover();
		await expect(preview).toBeVisible();
		await expect(preview.locator('.rg-technology-card')).toHaveCount(1);
		const title = await display
			.locator('.rg-card-band')
			.first()
			.textContent();
		expect(title?.trim()).toBeTruthy();
		await expect(preview.locator('.rg-card-band').first()).toHaveText(
			/** @type {string} */ (title)
		);
		await page.mouse.move(5, 5);
		await expect(preview).toHaveCount(0);
		expect(errors).toEqual([]);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
