// Placing on the capital (#28): the lit plots of a building and the legal places a landmark snaps to.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DECISIONS, cityPlots, view } from '../src/lib/engine/game.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { GRID_SIZE, fits, rotateFootprint } from '../src/lib/capital.js';
import {
	plotTargets,
	legalNear,
	nextRotation,
	placeNear,
	placingPiece,
} from '../src/lib/area/placement-targets.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A capital option as the prompt gives it.
 * @param {number} index
 * @param {number} row
 * @param {number} col
 * @param {number | null} rotation
 */
const at = (index, row, col, rotation) => ({
	index,
	place: 'capital',
	label: `Option ${index}`,
	art: [],
	plot: { row, col, rotation },
});

const BESIDE = { index: 9, place: 'panel', label: 'Beside the mat', art: [] };

test('legalNear picks the nearest of three places with that rotation', () => {
	const options = [
		at(0, 0, 0, 0),
		at(1, 4, 5, 0),
		at(2, 4, 4, 1),
		at(3, 8, 8, 0),
		BESIDE,
	];
	assert.equal(legalNear(options, 4, 4, 0), 1);
	assert.equal(legalNear(options, 7, 6, 0), 3);
	assert.equal(legalNear(options, 1, 1, 0), 0);
	assert.equal(legalNear(options, 0, 0, 1), 2);
});

test('legalNear gives a tie to the lower index', () => {
	const options = [at(1, 4, 5, 0), at(0, 4, 3, 0)];
	assert.equal(legalNear(options, 4, 4, 0), 0);
});

test('legalNear reaches a place over the edge (R106)', () => {
	const options = [at(0, -1, 3, 2), at(1, 5, 5, 2)];
	assert.equal(legalNear(options, 0, 3, 2), 0);
});

test('legalNear is null for a rotation no option has', () => {
	const options = [at(0, 2, 2, 0), at(1, 3, 3, 1)];
	assert.equal(legalNear(options, 2, 2, 2), null);
	assert.equal(legalNear([BESIDE], 4, 4, 0), null);
	assert.equal(legalNear([], 4, 4, 0), null);
});

test('nextRotation cycles from 3 to 0, nearest the same top-left', () => {
	const options = [at(0, 2, 2, 3), at(1, 6, 6, 0), at(2, 2, 3, 0)];
	assert.equal(nextRotation(options, 0), 2);
});

test('nextRotation skips a rotation with no legal place', () => {
	const options = [at(0, 4, 4, 0), at(1, 4, 4, 2), at(2, 0, 0, 3)];
	assert.equal(nextRotation(options, 0), 1);
	assert.equal(nextRotation(options, 1), 2);
	assert.equal(nextRotation(options, 2), 0);
});

test('nextRotation is null when no other rotation is legal', () => {
	const options = [at(0, 4, 4, 1), at(1, 0, 0, 1)];
	assert.equal(nextRotation(options, 0), null);
	assert.equal(nextRotation(options, 7), null);
	assert.equal(nextRotation([BESIDE], 9), null);
});

test('placeNear prefers the rotation asked for, then the nearest place of any rotation', () => {
	const options = [at(0, 0, 0, 0), at(1, 4, 4, 1), at(2, 3, 4, 3)];
	assert.equal(placeNear(options, 4, 4, 0), 0);
	assert.equal(placeNear(options, 4, 4, 2), 1);
	assert.equal(placeNear(options, 3, 5, 2), 2);
	assert.equal(placeNear([BESIDE], 4, 4, 0), null);
});

test('plotTargets keeps the indexes of the building places and leaves out the panel options', () => {
	const options = [
		{ index: 0, place: 'panel', label: 'Beside the mat', art: [] },
		at(1, 0, 3, null),
		at(2, 5, 7, null),
	];
	assert.deepEqual(plotTargets(options), [
		{ row: 0, col: 3, index: 1 },
		{ row: 5, col: 7, index: 2 },
	]);
	assert.deepEqual(plotTargets([BESIDE]), []);
});

test("every place the grid's own snapping reaches is one of the engine's answers, so a snapped move lands on it exactly", () => {
	const { state } = startedGame(2);
	const seat = state.seats[0];
	seat.capital.buildings.push(
		{ building: 'farm', row: 4, col: 4 },
		{ building: 'house', row: 2, col: 6 }
	);
	const decision = {
		player: 1,
		kind: 'choosePlacement',
		landmark: 'lighthouse',
	};
	const options = DECISIONS.choosePlacement
		.answers(state, decision)
		.map((/** @type {any} */ answer, /** @type {number} */ index) =>
			at(index, answer.row, answer.col, answer.rotation)
		);
	const plots = cityPlots(view(state, 1).seats[0]);
	for (let rotation = 0; rotation < 4; rotation++) {
		const shape = rotateFootprint(FOOTPRINTS.lighthouse, rotation);
		for (let row = 0; row < GRID_SIZE; row++) {
			for (let col = 0; col < GRID_SIZE; col++) {
				if (!fits(plots, shape, row, col)) {
					continue;
				}
				const index = /** @type {number} */ (
					legalNear(options, row, col, rotation)
				);
				assert.deepEqual(options[index].plot, { row, col, rotation });
			}
		}
	}
	const start = /** @type {number} */ (placeNear(options, 4, 4, 0));
	const turns = [start];
	for (let step = 0; step < 4; step++) {
		turns.push(
			/** @type {number} */ (nextRotation(options, turns.at(-1) ?? start))
		);
	}
	assert.deepEqual(
		turns.map((index) => options[index].plot?.rotation),
		[0, 1, 2, 3, 0]
	);
});

test('the landmark being placed has its name and printed footprint', () => {
	assert.deepEqual(placingPiece('lighthouse'), {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
	});
	assert.equal(placingPiece('rubber-works').name, 'Rubber Works');
});
