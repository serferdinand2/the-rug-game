// Placing on the capital (#28): the lit plots of a building and the legal places a landmark snaps to.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DECISIONS, cityPlots, view } from '../src/lib/engine/game.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { GRID_SIZE, fits, rotateFootprint } from '../src/lib/capital.js';
import {
	plotTargets,
	legalNear,
	placeNear,
	placingPiece,
	landmarkPositions,
	optionAt,
	centredCorner,
	landingIndex,
	capitalPlacement,
} from '../src/lib/area/placement-targets.js';
import { stepAmong, turnAmong } from '../src/lib/placement.js';
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

test('landmarkPositions keeps the landmark places and leaves out the buildings and the panel', () => {
	const options = [
		BESIDE,
		at(1, 0, 3, null),
		at(2, -1, 4, 2),
		at(3, 5, 7, 0),
	];
	assert.deepEqual(landmarkPositions(options), [
		{ row: -1, col: 4, rotation: 2 },
		{ row: 5, col: 7, rotation: 0 },
	]);
	assert.deepEqual(landmarkPositions([BESIDE]), []);
});

test('optionAt finds the option exactly at a position and turn', () => {
	const options = [BESIDE, at(1, 4, 4, 0), at(2, 4, 4, 1), at(3, 6, 8, 0)];
	assert.equal(optionAt(options, { row: 4, col: 4, rotation: 1 }), 2);
	assert.equal(optionAt(options, { row: 6, col: 8, rotation: 0 }), 3);
	assert.equal(optionAt(options, { row: 4, col: 5, rotation: 0 }), null);
	assert.equal(optionAt(options, { row: 6, col: 8, rotation: 2 }), null);
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

/**
 * A real game's options for the Lighthouse on seat 1's capital, with a farm and a house built.
 * @returns {{ options: any[], plots: import('../src/lib/capital.js').PlotKind[] }}
 */
function lighthouseOptions() {
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
	return { options, plots: cityPlots(view(state, 1).seats[0]) };
}

test("every place the grid's own snapping reaches is one of the engine's answers, so a snapped move lands on it exactly", () => {
	const { options, plots } = lighthouseOptions();
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
});

test("every step and turn among the engine's positions lands on one of its options, over the edge included (R14)", () => {
	const { options } = lighthouseOptions();
	const positions = landmarkPositions(options);
	const start = /** @type {number} */ (placeNear(options, 4, 4, 0));
	let piece = {
		...placingPiece('lighthouse'),
		.../** @type {{ row: number, col: number, rotation: number }} */ (
			options[start].plot
		),
	};
	const turns = [piece.rotation];
	for (let step = 0; step < 4; step++) {
		const turned =
			/** @type {NonNullable<ReturnType<typeof turnAmong>>} */ (
				turnAmong(positions, piece)
			);
		assert.notEqual(optionAt(options, turned), null);
		piece = { ...piece, ...turned };
		turns.push(piece.rotation);
	}
	assert.deepEqual(turns, [0, 1, 2, 3, 0]);
	// Right until it can go no further: the last step hangs over the edge.
	let moved = { ...piece, row: 0, col: 0 };
	for (;;) {
		const next = stepAmong(positions, moved, 0, 1);
		if (!next) {
			break;
		}
		assert.notEqual(optionAt(options, { ...next, rotation: 0 }), null);
		moved = { ...moved, ...next };
	}
	assert.equal(moved.col, GRID_SIZE - 1);
});

test('the landmark being placed has its name and printed footprint', () => {
	assert.deepEqual(placingPiece('lighthouse'), {
		id: 'lighthouse',
		name: 'Lighthouse',
		footprint: FOOTPRINTS.lighthouse,
	});
	assert.equal(placingPiece('rubber-works').name, 'Rubber Works');
});

test('centredCorner accounts for the turned footprint', () => {
	assert.deepEqual(centredCorner(['XXX'], 0, 4, 4), { row: 4, col: 3 });
	assert.deepEqual(centredCorner(['XXX'], 1, 4, 4), { row: 3, col: 4 });
});

test('landingIndex centres a clicked plot and keeps a placed landmark turned', () => {
	const options = [at(0, 4, 3, 0), at(1, 4, 4, 0), at(2, 3, 4, 1)];
	const landmark = { ...placingPiece('lighthouse'), footprint: ['XXX'] };
	assert.equal(landingIndex(options, landmark, { row: 4, col: 4 }, null), 0);
	assert.equal(
		landingIndex(options, landmark, { row: 4, col: 4 }, { rotation: 1 }),
		2
	);
	assert.equal(
		landingIndex([BESIDE], landmark, { row: 4, col: 4 }, null),
		null
	);
});

test('capitalPlacement derives building preview and empty landmark state', () => {
	const capital = { pieces: [] };
	const fresh = { plots: [], landmarks: [] };
	const building = capitalPlacement(
		capital,
		{
			piece: { building: 'market' },
			options: [at(0, 2, 3, null)],
			picked: 0,
		},
		fresh
	);
	assert.equal(building.building, 'market');
	assert.equal(building.landmark, null);
	assert.deepEqual(building.picked, { row: 2, col: 3, rotation: null });
	assert.deepEqual(building.targets, [{ row: 2, col: 3, index: 0 }]);
	assert.deepEqual(building.preview, {
		row: 2,
		col: 3,
		building: 'market',
	});
	assert.deepEqual(building.positions, null);
	assert.deepEqual(building.placed, null);
	assert.deepEqual(building.pieces, []);
	assert.deepEqual(building.tray, []);

	assert.deepEqual(capitalPlacement(capital, null, fresh), {
		building: null,
		landmark: null,
		picked: null,
		targets: [],
		positions: null,
		preview: null,
		placed: null,
		pieces: [],
		tray: [],
	});
});

test('capitalPlacement derives a landmark, tray, legal positions, and fresh pieces', () => {
	const capital = {
		pieces: [
			{
				id: 'observatory',
				name: 'Observatory',
				footprint: FOOTPRINTS.observatory,
				row: 1,
				col: 1,
				rotation: 0,
			},
		],
	};
	const fresh = { plots: [], landmarks: ['observatory'] };
	const options = [at(0, 3, 4, 1), at(1, 6, 8, 0), BESIDE];
	const onCapital = capitalPlacement(
		capital,
		{
			piece: { landmark: 'lighthouse' },
			options,
			picked: 0,
		},
		fresh
	);
	assert.equal(onCapital.landmark?.id, 'lighthouse');
	assert.deepEqual(onCapital.picked, { row: 3, col: 4, rotation: 1 });
	assert.deepEqual(onCapital.positions, [
		{ row: 3, col: 4, rotation: 1 },
		{ row: 6, col: 8, rotation: 0 },
	]);
	assert.deepEqual(onCapital.placed, {
		...placingPiece('lighthouse'),
		row: 3,
		col: 4,
		rotation: 1,
	});
	assert.equal(onCapital.pieces.length, 2);
	assert.equal(onCapital.pieces[0].fresh, true);
	assert.equal(onCapital.tray.length, 0);

	const inTray = capitalPlacement(
		capital,
		{
			piece: { landmark: 'lighthouse' },
			options: [at(0, 6, 8, 0)],
			picked: null,
		},
		{ plots: [], landmarks: [] }
	);
	assert.equal(inTray.placed, null);
	assert.deepEqual(inTray.tray, [
		{ ...placingPiece('lighthouse'), rotation: 0 },
	]);
});
