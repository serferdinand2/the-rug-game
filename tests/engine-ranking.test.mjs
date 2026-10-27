// Tests for the final ranking and its tiebreaks, recorded step by step (#15; R10–R13).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { rankPlayers, landmarksInCity } from '../src/lib/engine/ranking.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A started game whose seats end with the given VP, resources and landmarks in the city.
 * @param {'original' | 'current'} version
 * @param {{ vp: number, resources?: number, landmarks?: string[] }[]} seats
 */
function finalState(version, seats) {
	const { state: started } = startedGame(seats.length, { version });
	const state = structuredClone(started);
	seats.forEach((s, i) => {
		const seat = /** @type {any} */ (state.seats[i]);
		seat.vp = s.vp;
		seat.resources = {
			coin: s.resources ?? 0,
			worker: 0,
			food: 0,
			culture: 0,
		};
		seat.capital.landmarks = (s.landmarks ?? []).map((landmark, i) => ({
			landmark,
			row: 0,
			col: i * 4,
			rotation: 0,
		}));
	});
	return state;
}

test('a new game has no result yet, and no landmarks in any city', () => {
	const { state } = startedGame(2);
	assert.equal(state.result, null);
	assert.deepEqual(
		state.seats.map((s) => landmarksInCity(s)),
		[[], []]
	);
});

test('players are ranked by VP, and no tie means no tiebreak lines', () => {
	const state = finalState('current', [{ vp: 10 }, { vp: 30 }, { vp: 20 }]);
	assert.deepEqual(rankPlayers(state), {
		ranking: [
			{ seat: 2, place: 1, vp: 30 },
			{ seat: 3, place: 2, vp: 20 },
			{ seat: 1, place: 3, vp: 10 },
		],
		ties: [],
	});
});

test('R10: in the original rules a VP tie is broken by resources left', () => {
	const state = finalState('original', [
		{ vp: 40, resources: 3, landmarks: ['fusion-reactor'] },
		{ vp: 40, resources: 5 },
	]);
	assert.deepEqual(rankPlayers(state), {
		ranking: [
			{ seat: 2, place: 1, vp: 40 },
			{ seat: 1, place: 2, vp: 40 },
		],
		ties: [
			{
				vp: 40,
				seats: [1, 2],
				steps: [
					{
						by: 'resources',
						values: [
							{ seat: 1, value: 3 },
							{ seat: 2, value: 5 },
						],
					},
				],
			},
		],
	});
});

test('R11: in the current rules the tallest landmark in the city breaks a tie first', () => {
	const state = finalState('current', [
		{ vp: 87, resources: 0, landmarks: ['forge', 'fusion-reactor'] },
		{ vp: 50, resources: 9 },
		{ vp: 87, resources: 8, landmarks: ['lighthouse'] },
	]);
	assert.deepEqual(rankPlayers(state), {
		ranking: [
			{ seat: 1, place: 1, vp: 87 },
			{ seat: 3, place: 2, vp: 87 },
			{ seat: 2, place: 3, vp: 50 },
		],
		ties: [
			{
				vp: 87,
				seats: [1, 3],
				steps: [
					{
						by: 'tallestLandmark',
						values: [
							{ seat: 1, value: 'fusion-reactor' },
							{ seat: 3, value: 'lighthouse' },
						],
					},
				],
			},
		],
	});
});

test('R11: any landmark beats none, and two players with none go on to resources', () => {
	const one = finalState('current', [
		{ vp: 20, resources: 0, landmarks: ['treasury'] },
		{ vp: 20, resources: 8 },
	]);
	assert.deepEqual(
		rankPlayers(one).ranking.map((p) => p.seat),
		[1, 2]
	);
	const none = finalState('current', [
		{ vp: 20, resources: 2 },
		{ vp: 20, resources: 4 },
	]);
	assert.deepEqual(rankPlayers(none).ties[0].steps, [
		{
			by: 'tallestLandmark',
			values: [
				{ seat: 1, value: null },
				{ seat: 2, value: null },
			],
		},
		{
			by: 'resources',
			values: [
				{ seat: 1, value: 2 },
				{ seat: 2, value: 4 },
			],
		},
	]);
	assert.deepEqual(
		rankPlayers(none).ranking.map((p) => p.seat),
		[2, 1]
	);
});

test('three tied players split over two steps, each step listing only the players it compared', () => {
	const state = finalState('current', [
		{ vp: 50, resources: 1, landmarks: ['bakery'] },
		{ vp: 50, resources: 4 },
		{ vp: 50, resources: 6 },
	]);
	assert.deepEqual(rankPlayers(state), {
		ranking: [
			{ seat: 1, place: 1, vp: 50 },
			{ seat: 3, place: 2, vp: 50 },
			{ seat: 2, place: 3, vp: 50 },
		],
		ties: [
			{
				vp: 50,
				seats: [1, 2, 3],
				steps: [
					{
						by: 'tallestLandmark',
						values: [
							{ seat: 1, value: 'bakery' },
							{ seat: 2, value: null },
							{ seat: 3, value: null },
						],
					},
					{
						by: 'resources',
						values: [
							{ seat: 2, value: 4 },
							{ seat: 3, value: 6 },
						],
					},
				],
			},
		],
	});
});

test('players still tied after every step share a place, and the next place skips (1, 1, 3)', () => {
	const state = finalState('current', [
		{ vp: 60, resources: 2 },
		{ vp: 60, resources: 2 },
		{ vp: 10, resources: 7 },
	]);
	const result = rankPlayers(state);
	assert.deepEqual(result.ranking, [
		{ seat: 1, place: 1, vp: 60 },
		{ seat: 2, place: 1, vp: 60 },
		{ seat: 3, place: 3, vp: 10 },
	]);
	assert.deepEqual(
		result.ties.map((t) => t.steps.map((s) => s.by)),
		[['tallestLandmark', 'resources']]
	);
});

test('ties at two VP levels give one ties entry each', () => {
	const state = finalState('original', [
		{ vp: 30, resources: 1 },
		{ vp: 70, resources: 1 },
		{ vp: 30, resources: 5 },
		{ vp: 70, resources: 3 },
	]);
	const result = rankPlayers(state);
	assert.deepEqual(
		result.ranking.map((p) => [p.seat, p.place]),
		[
			[4, 1],
			[2, 2],
			[3, 3],
			[1, 4],
		]
	);
	assert.deepEqual(
		result.ties.map((t) => [t.vp, t.seats]),
		[
			[70, [2, 4]],
			[30, [1, 3]],
		]
	);
});

test('four players all tied on everything share first place', () => {
	const state = finalState('current', [
		{ vp: 0 },
		{ vp: 0 },
		{ vp: 0 },
		{ vp: 0 },
	]);
	const result = rankPlayers(state);
	assert.deepEqual(
		result.ranking.map((p) => p.place),
		[1, 1, 1, 1]
	);
	assert.equal(result.ties.length, 1);
	assert.deepEqual(result.ties[0].seats, [1, 2, 3, 4]);
});

test('R13: landmarksInCity names the landmarks placed on the grid', () => {
	const state = finalState('current', [
		{ vp: 1, landmarks: ['forge', 'fusion-reactor'] },
	]);
	assert.deepEqual(landmarksInCity(state.seats[0]), [
		'forge',
		'fusion-reactor',
	]);
});
