// Another player's tabs in Chromium (#145, owner 2026-10-30): a header chip shows that player's tabs in the player
// area, read-only and private cards hidden, and every way back returns to your own; then the table is ended and left.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';
import { amountWords } from '../../src/lib/words.js';
import { RESOURCES } from '../../src/lib/ui.js';

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

test("a chip shows that player's tabs, read-only with their hand hidden, and every way back returns to yours (#145)", async ({
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
		const other = 3 - seat;
		const name = NAMES[other - 1];
		const theirs = await api(
			request,
			`state?seat=${seat}`,
			undefined,
			token
		);
		const held = theirs.game.seats[other - 1].handCount;
		expect(theirs.game.seats[other - 1].hand).toBeUndefined();
		const ownPlayer = theirs.game.seats[seat - 1];
		const opponent = theirs.game.seats[other - 1];

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
		await expect(notice).toBeVisible();
		await notice.getByRole('button', { name: 'Got it' }).click();
		await expect(notice).toHaveCount(0);

		const tabs = page.locator('.rg-player-tabs');
		const inspecting = page.locator('.rg-player-tabs--inspecting');
		const chip = page.locator('.rg-player-chip', { hasText: name });
		const ownChip = page.locator('.rg-player-chip', {
			hasText: NAMES[seat - 1],
		});
		const back = page.getByRole('button', { name: 'Back to your area' });
		const footer = await page.locator('.rg-turn-bar').innerText();
		const summary = page.locator('.rg-self-summary');
		const summaryHead = summary.locator('.rg-self-summary--head strong');
		const counts = summary.locator('.rg-resource-chip--count');
		/** @param {any} entry @returns {string[]} */
		const amounts = (entry) =>
			RESOURCES.map((resource) => String(entry.resources[resource.id]));

		// Their chip shows their tabs, bordered in their colour, and not the players overview.
		await chip.click();
		await expect(inspecting).toBeVisible();
		await expect(page.locator('.rg-players-overview')).toHaveCount(0);
		await expect(tabs.getByText(`Viewing ${name}'s area`)).toBeVisible();
		const border = await inspecting.evaluate((element) => {
			const style = getComputedStyle(element);
			return { style: style.outlineStyle, width: style.outlineWidth };
		});
		expect(border.style).toBe('solid');
		expect(parseFloat(border.width)).toBeGreaterThan(0);

		// The summary belongs to the inspected player too, including their public resource counts.
		await expect(summaryHead).toContainText(name);
		const summaryBorder = await summary.evaluate(
			(element) => getComputedStyle(element).boxShadow
		);
		expect(summaryBorder).not.toBe('none');
		for (const resource of ['coin', 'worker', 'food', 'culture']) {
			await expect(
				summary.getByRole('img', {
					name: amountWords(resource, opponent.resources[resource]),
				})
			).toBeVisible();
		}
		await expect(summary.locator('.rg-resource-chip--changed')).toHaveCount(
			0
		);
		// The summary at the foot is theirs, framed in their colour, with their own resources (#157).
		await expect(counts).toHaveText(amounts(theirs.game.seats[other - 1]));
		const frame = await summary.evaluate(
			(element) => getComputedStyle(element).boxShadow
		);
		expect(frame).not.toBe('none');

		// Their hand is a count, with no card face.
		await tabs.getByRole('tab', { name: /^Hand/ }).click();
		await expect(
			tabs.getByText(
				held === 0
					? `${name} holds no tapestry cards.`
					: new RegExp(`${name} holds ${held} tapestry cards?\\.`)
			)
		).toBeVisible();
		await expect(tabs.locator('.rg-tapestry-card')).toHaveCount(0);

		// Their eras and terrain, read-only: no tile can be pressed.
		await tabs.getByRole('tab', { name: 'Eras' }).click();
		await expect(
			tabs.getByRole('heading', { name: `${name}'s eras` })
		).toBeVisible();
		await tabs.getByRole('tab', { name: 'Terrain' }).click();
		await expect(tabs.locator('[data-id^="terrain-tile-"]')).toHaveCount(0);

		// Your turn is untouched.
		expect(await page.locator('.rg-turn-bar').innerText()).toBe(footer);

		// Back to your area returns to your own tabs.
		await back.click();
		await expect(inspecting).toHaveCount(0);
		// And the summary is yours again, without the frame (#157).
		await expect(summaryHead).toContainText(NAMES[seat - 1]);
		await expect(counts).toHaveText(amounts(theirs.game.seats[seat - 1]));
		expect(
			await summary.evaluate(
				(element) => getComputedStyle(element).boxShadow
			)
		).toBe('none');
		await expect(
			tabs.getByRole('heading', { name: 'Territory tiles' })
		).toBeVisible();
		const expectOwnSummary = async () => {
			await expect(
				summary.locator('.rg-self-summary--head')
			).toContainText(NAMES[seat - 1]);
			await expect(summary).toHaveAttribute(
				'aria-label',
				'Your resources and game summary'
			);
		};
		await expectOwnSummary();
		for (const resource of ['coin', 'worker', 'food', 'culture']) {
			await expect(
				summary.getByRole('img', {
					name: amountWords(resource, ownPlayer.resources[resource]),
				})
			).toBeVisible();
		}

		// The same chip again goes back, and so does your own.
		await chip.click();
		await expect(inspecting).toBeVisible();
		await chip.click();
		await expect(inspecting).toHaveCount(0);
		await expectOwnSummary();
		await chip.click();
		await expect(inspecting).toBeVisible();
		await ownChip.click();
		await expect(inspecting).toHaveCount(0);
		await expectOwnSummary();

		// Escape goes back; their number key opens them as the chip does, and yours goes back (#83).
		await chip.click();
		await expect(inspecting).toBeVisible();
		await page.locator('body').focus();
		await page.keyboard.press('Escape');
		await expect(inspecting).toHaveCount(0);
		await expectOwnSummary();
		await page.keyboard.press(String(other));
		await expect(inspecting).toBeVisible();
		await page.keyboard.press(String(seat));
		await expect(inspecting).toHaveCount(0);
		await expectOwnSummary();
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		if (latest.phase === 'playing') {
			await api(request, 'end', { version: latest.version }, token);
		}
		await api(request, 'leave', {}, token);
	}
});
