// The setup prompts and the tracks in Chromium, at the 1920×1080 reference: each capital mat on offer is its 9×9 grid
// (#56), each civilization card is drawn whole inside its outline (#57, #58), and every track space shows its benefit
// (#59). The test plays a two-seat hot-seat table through setup with the mouse, then closes the table.
import { expect, test } from '@playwright/test';
import { TRACKS } from '../../src/lib/engine/data/tracks.js';

test.use({ viewport: { width: 1920, height: 1080 } });

/** A civilization card's full width; a row too tall for the shelf shrinks, never below 0.75 of it. */
const CIV_WIDTH = 425;

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

test('the tracks show every benefit, and setup shows capital mats as grids and civilization cards whole', async ({
	page,
	request,
}) => {
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
	await api(request, 'start', { version: room.version }, token);

	try {
		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		const heading = page.locator('.rg-decision-panel--panel h2');
		const confirm = page.locator('.rg-decision-panel--confirm');
		/**
		 * Takes the hot-seat screen for a player at the pass screen (#30).
		 * @param {string} name
		 */
		const takeScreen = async (name) => {
			await expect(
				page.getByRole('heading', {
					name: `Pass the screen to ${name}`,
				})
			).toBeVisible();
			await page.getByRole('button', { name: `I'm ${name}` }).click();
		};
		await takeScreen('Ana');

		// The tracks, drawn under every prompt: every space shows its benefit, and the 18 with a bonus show it, with
		// nothing cut off (#59). Some civilizations ask more once setup is over, so they are checked first.
		const spaces = page.locator('.rg-track-space');
		await expect(spaces).toHaveCount(48);
		await expect(page.locator('.rg-track-space--benefit')).toHaveCount(48);
		const tierCostOutline = await page
			.locator('.rg-tier-price .rg-resource-icon')
			.first()
			.evaluate((icon) => getComputedStyle(icon).outlineStyle);
		expect(tierCostOutline, 'tier cost resources have no box outline').toBe(
			'none'
		);
		// Each tier's price reads as priceWords puts it (#124).
		await expect(page.locator('.rg-tier-price').first()).toHaveAttribute(
			'aria-label',
			'Tier I costs 1 resource of your choice'
		);
		const bonuses = Object.values(TRACKS)
			.flatMap((track) => track.slice(1))
			.filter((space) => space.bonus).length;
		await expect(page.locator('.rg-track-space--bonus')).toHaveCount(
			bonuses
		);
		const cut = await spaces.evaluateAll((all) =>
			all
				.filter((space) => {
					const benefit = space.querySelector(
						'.rg-track-space--benefit'
					);
					const body = space
						.querySelector('.rg-track-space--body')
						?.getBoundingClientRect();
					const bonus = space
						.querySelector('.rg-track-space--bonus')
						?.getBoundingClientRect();
					return (
						(benefit &&
							benefit.scrollHeight > benefit.clientHeight + 1) ||
						(body &&
							bonus &&
							(bonus.right > body.right + 1 ||
								bonus.bottom > body.bottom + 1))
					);
				})
				.map((space) => space.getAttribute('aria-label'))
		);
		expect(cut).toEqual([]);
		await expect(
			page.getByRole('button', { name: /^Ships, exploration space 5/ })
		).toHaveAttribute('title', /Bonus: /);

		// Each seat chooses a capital, then a civilization; the screen passes to Ben in between.
		for (let seat = 0; seat < 2; seat++) {
			if (seat === 1) {
				await takeScreen('Ben');
			}
			await expect(heading).toHaveText('Choose your capital city');
			const mats = page.locator('.rg-card-shelf--mat .rg-card-fan--card');
			await expect(mats).toHaveCount(2);
			for (const mat of await mats.all()) {
				const grid = mat.locator('.rg-capital-grid');
				await expect(
					grid.locator('.rg-capital-grid--plot')
				).toHaveCount(81);
				await expect(
					grid.locator('.rg-capital-grid--blocked')
				).toHaveCount(22);
				const box = await grid.boundingBox();
				expect(box?.width).toBeGreaterThanOrEqual(360);
			}
			await mats.first().click();
			await confirm.click();

			await expect(heading).toHaveText('Choose your civilization');
			const civs = page.locator('.rg-card-shelf--civ .rg-card-fan--card');
			await expect(civs).toHaveCount(2);
			const shelf = await page.locator('.rg-card-shelf').boundingBox();
			const cards = [];
			for (const civ of await civs.all()) {
				const button = await civ.boundingBox();
				const card = await civ
					.locator('.rg-civilization-card')
					.boundingBox();
				if (!button || !card || !shelf) {
					throw new Error('A civilization card is not drawn.');
				}
				// The outline is the button's: it wraps the card exactly (#58).
				expect(Math.abs(button.width - card.width)).toBeLessThan(1.5);
				expect(Math.abs(button.height - card.height)).toBeLessThan(1.5);
				cards.push(card);
			}
			const width = cards[0].width;
			expect(width).toBeGreaterThanOrEqual(CIV_WIDTH * 0.75 - 1);
			expect(width).toBeLessThanOrEqual(CIV_WIDTH + 0.5);
			const tallest = Math.max(...cards.map((card) => card.height));
			if (width < CIV_WIDTH - 0.5 && width > CIV_WIDTH * 0.75 + 0.5) {
				// A row shrinks only as far as the shelf needs: its tallest card then fills the shelf's height.
				expect(tallest).toBeGreaterThan((shelf?.height ?? 0) - 16 - 2);
			}
			if (width >= CIV_WIDTH - 0.5) {
				// At full size, the whole row is inside the shelf (#57).
				for (const card of cards) {
					expect(card.y).toBeGreaterThanOrEqual(
						(shelf?.y ?? 0) - 0.5
					);
					expect(card.y + card.height).toBeLessThanOrEqual(
						(shelf?.y ?? 0) + (shelf?.height ?? 0) + 0.5
					);
				}
			}
			await civs.last().click();
			await confirm.click();
		}

		expect(errors).toEqual([]);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		await api(request, 'end', { version: latest.version }, token);
		await api(request, 'leave', {}, token);
	}
});
