// The Capital tab (#27 design §2.1): a seat's capital from the game view, with its landmarks, counts and pieces beside the mat.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	view,
	cityPlots,
	completeLines,
	completeDistricts,
} from '../src/lib/engine/game.js';
import { CAPITAL_MATS } from '../src/lib/engine/data/capitals.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { capitalView, matPlots, terrainSeed } from '../src/lib/area/capital.js';
import { newGame, startedGame } from './helpers/engine.mjs';

test("on a dealt game the plots are the engine's, on the seat's mat", () => {
	const { state } = startedGame(2);
	const seat = view(state, 1).seats[0];
	const capital = capitalView(seat, 'ABCD');
	assert.ok(capital);
	assert.deepEqual(capital.plots, cityPlots(seat));
	assert.equal(capital.mat, seat.capital.mat);
	const mat = CAPITAL_MATS[seat.capital.mat - 1];
	assert.equal(capital.name, mat.name);
	assert.equal(capital.biome, mat.name.toLowerCase());
	assert.deepEqual(capital.pieces, []);
	assert.deepEqual(capital.besideMat, []);
});

test('the terrain seed is a positive whole number from the table code, the same for every viewer', () => {
	const { state } = startedGame(2);
	const mine = capitalView(view(state, 1).seats[0], 'ABCD');
	const theirs = capitalView(view(state, 2).seats[0], 'ABCD');
	const other = capitalView(view(state, 1).seats[0], 'WXYZ');
	assert.ok(mine && theirs && other);
	assert.ok(Number.isInteger(mine.terrainSeed) && mine.terrainSeed > 0);
	assert.ok(mine.terrainSeed <= 0x7fffffff, 'fits a 32-bit signed integer');
	assert.equal(mine.terrainSeed, theirs.terrainSeed);
	assert.notEqual(mine.terrainSeed, other.terrainSeed);
});

test('landmarks are locked pieces with their footprints and names, and one hanging over the edge keeps its row and col (R106)', () => {
	const { state } = startedGame(2);
	const player = /** @type {any} */ (state.seats[0]);
	player.capital.landmarks = [
		{ landmark: 'train-station', row: 7, col: 2, rotation: 0 },
		{ landmark: 'clock-tower', row: -1, col: 8, rotation: 1 },
	];
	const seat = view(state, 1).seats[0];
	const capital = capitalView(seat, 'ABCD');
	assert.ok(capital);
	assert.deepEqual(capital.pieces, [
		{
			id: 'train-station',
			name: 'Train Station',
			footprint: FOOTPRINTS['train-station'],
			row: 7,
			col: 2,
			rotation: 0,
			locked: true,
		},
		{
			id: 'clock-tower',
			name: 'Clock Tower',
			footprint: FOOTPRINTS['clock-tower'],
			row: -1,
			col: 8,
			rotation: 1,
			locked: true,
		},
	]);
	assert.deepEqual(capital.plots, cityPlots(seat));
	assert.equal(capital.plots.length, 81);
});

test('the counts are the complete rows, columns and districts the engine finds', () => {
	const { state } = startedGame(2);
	const player = /** @type {any} */ (state.seats[0]);
	const open = cityPlots(player).flatMap((kind, index) =>
		kind === 'empty' && index < 27 ? [index] : []
	);
	player.capital.buildings = open.map((index) => ({
		building: 'house',
		row: Math.floor(index / 9),
		col: index % 9,
	}));
	const seat = view(state, 1).seats[0];
	const capital = capitalView(seat, 'ABCD');
	assert.ok(capital);
	const plots = cityPlots(seat);
	const lines = completeLines(plots);
	assert.deepEqual(capital.counts, {
		rows: lines.rows,
		columns: lines.columns,
		districts: completeDistricts(plots).length,
	});
	assert.ok(capital.counts.rows >= 3, 'the top three rows are full');
	assert.ok(capital.counts.districts >= 3, 'so are the top three districts');
});

test('pieces beside the mat are listed by name, buildings and landmarks alike', () => {
	const { state } = startedGame(2);
	const player = /** @type {any} */ (state.seats[0]);
	player.besideMat = ['farm', 'lighthouse', 'armory', 'birdwatching-perch'];
	const capital = capitalView(view(state, 1).seats[0], 'ABCD');
	assert.deepEqual(capital?.besideMat, [
		'Farm',
		'Lighthouse',
		'Armory',
		'Birdwatching Perch',
	]);
});

test('there is no capital before setup deals a mat', () => {
	const { state } = newGame(2);
	assert.equal(capitalView(view(state, 1).seats[0], 'ABCD'), null);
});

test('a mat on offer has its own plots: the impassable ones blocked, the rest empty (#56)', () => {
	for (const mat of CAPITAL_MATS) {
		const plots = matPlots(mat.number);
		assert.equal(plots.length, 81);
		assert.deepEqual(
			plots,
			mat.grid
				.join('')
				.split('')
				.map((c) => (c === '1' ? 'blocked' : 'empty'))
		);
		assert.equal(plots.filter((p) => p === 'blocked').length, 22);
	}
	assert.throws(() => matPlots(7), RangeError);
});

test('the mats on offer use the seed the capital will have once chosen (#56)', () => {
	const { state } = startedGame(2);
	const seat = view(state, 1).seats[0];
	assert.equal(capitalView(seat, 'ABCD')?.terrainSeed, terrainSeed('ABCD'));
});
