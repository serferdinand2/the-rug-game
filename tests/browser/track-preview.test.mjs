// The track hover preview in Chromium (#81): hovering a space that two players share as their next space dashes only
// the line of the player taking the turn. The game test opens a two-seat hot-seat game, then closes the table.
import { expect, test } from '@playwright/test';
import { askedSeats } from '../../src/lib/engine/game.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const NAMES = ['Ana', 'Ben'];
const TRACK_NAMES = ['Exploration', 'Science', 'Technology', 'Military'];

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
 * The lanes whose dashed line is previewed under one track, by lane number from the top.
 * @param {import('@playwright/test').Locator} track
 * @returns {Promise<number[]>}
 */
function previewedLanes(track) {
	return track
		.locator('.rg-progress-lanes--preview')
		.evaluateAll((all) =>
			all.map((dash) =>
				Number(
					/** @type {HTMLElement} */ (dash).style.getPropertyValue(
						'--rg-progress-lanes-lane'
					)
				)
			)
		);
}

test("the library's tracks dash only the previewSeat's line where two players share the next space (#81)", async ({
	page,
}) => {
	await page.goto('/components.html');

	// Track: You and Ana are both on Navigation; hovering Ships dashes only your line (lane 0).
	const track = page.locator('#track .rg-track').first();
	await track.locator('.rg-track-space').nth(4).hover();
	await expect(track.locator('.rg-progress-lanes--preview')).toHaveCount(1);
	expect(await previewedLanes(track)).toEqual([0]);

	// Keyboard focus previews the same line.
	await page.mouse.move(0, 0);
	await expect(track.locator('.rg-progress-lanes--preview')).toHaveCount(0);
	await track.locator('.rg-track-space').nth(3).focus();
	await page.keyboard.press('Tab');
	await expect(track.locator('.rg-progress-lanes--preview')).toHaveCount(1);
	expect(await previewedLanes(track)).toEqual([0]);

	// Without a previewSeat, as on another player's turn, hovering dashes no line.
	const military = page.locator('#track .rg-track').nth(1);
	await military.locator('.rg-track-space').nth(1).hover();
	await expect(military.locator('.rg-progress-lanes--preview')).toHaveCount(
		0
	);

	// TrackBoard: You and Ana are both on Mathematics; hovering Herbalism dashes only your line.
	const science = page
		.locator('#track-board')
		.getByRole('group', { name: 'Science' });
	await science.locator('.rg-track-space').nth(2).hover();
	await expect(science.locator('.rg-progress-lanes--preview')).toHaveCount(1);
	expect(await previewedLanes(science)).toEqual([0]);
});

test("in a game, hovering a space both players reach next dashes only the active player's line (#81)", async ({
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
		/** @type {any} */
		let game = null;
		for (let moves = 0; moves < 200; moves++) {
			const view = await api(request, 'state', undefined, token);
			game = view.game;
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
			// Not the Futurists: they start four spaces up every track.
			const answer =
				op.answers.find(
					(/** @type {any} */ a) => a.civ !== 'futurists'
				) ?? op.answers[0];
			await api(
				request,
				'move',
				{
					version: own.version,
					seat,
					action: { decision: op.id, ...answer },
				},
				token
			);
		}

		// A track where both players are still at the start, so its first space is both players' next space.
		const players = game.seats.filter(
			(/** @type {any} */ s) => s.kind === 'player'
		);
		const at = [
			'exploration',
			'science',
			'technology',
			'military',
		].findIndex((track) =>
			players.every(
				(/** @type {any} */ s) => Math.max(0, ...s.tracks[track]) === 0
			)
		);
		expect(at, 'a track with both players at the start').toBeGreaterThan(
			-1
		);
		const lane = players.findIndex(
			(/** @type {any} */ s) => s.seat === seat
		);

		await page.addInitScript(
			(saved) => sessionStorage.setItem('rg-token', saved),
			token
		);
		await page.goto('/');
		await page
			.getByRole('button', { name: `I'm ${NAMES[seat - 1]}` })
			.click();
		await expect(page.locator('.rg-track-board')).toBeVisible();
		const notice = page.locator('.rg-income-notice');
		await expect(notice).toBeVisible();
		await page.locator('body').focus();
		await page.keyboard.press('Enter');
		await expect(notice).toHaveCount(0);

		const track = page
			.locator('.rg-track-board')
			.getByRole('group', { name: TRACK_NAMES[at] });
		await track.locator('.rg-track-space').first().hover();
		await expect(track.locator('.rg-progress-lanes--preview')).toHaveCount(
			1
		);
		expect(await previewedLanes(track)).toEqual([lane]);
	} finally {
		// A running hot-seat game is ended, then left, so the table closes and the address's table limit is free.
		const latest = await api(request, 'state', undefined, token);
		await api(request, 'end', { version: latest.version }, token);
		await api(request, 'leave', {}, token);
	}
});
