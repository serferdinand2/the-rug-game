// Tests for the capital city's plots and legal places (#16; R13–R15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	CAPITAL_MATS,
	impassablePlots,
} from '../src/lib/engine/data/capitals.js';
import { FOOTPRINTS } from '../src/lib/art/footprints.js';
import { rotateFootprint, plotIndex } from '../src/lib/capital.js';
import {
	cityPlots,
	landmarkCells,
	buildingProblem,
	landmarkProblem,
	buildingSpots,
	landmarkSpots,
	completeDistricts,
	completeLines,
} from '../src/lib/engine/city.js';
import { startedGame } from './helpers/engine.mjs';

/**
 * A seat with the given mat, buildings and landmarks.
 * @param {number} mat
 * @param {any[]} [buildings]
 * @param {any[]} [landmarks]
 * @returns {any}
 */
function seatWith(mat, buildings = [], landmarks = []) {
	const seat = structuredClone(startedGame(2).state.seats[0]);
	seat.capital = { mat, buildings, landmarks };
	return seat;
}

/** @param {any[]} spots */
const key = (spots) => spots.map((s) => `${s.row},${s.col},${s.rotation}`);

test("cityPlots shows each basic mat's 22 impassable plots as blocked and the other 59 as empty", () => {
	for (let mat = 1; mat <= 6; mat++) {
		const plots = cityPlots(seatWith(mat));
		assert.equal(plots.length, 81);
		assert.equal(plots.filter((p) => p === 'blocked').length, 22);
		assert.equal(plots.filter((p) => p === 'empty').length, 59);
		const blocked = impassablePlots(CAPITAL_MATS[mat - 1]);
		plots.forEach((p, i) => {
			if (p === 'blocked') {
				assert.ok(blocked.includes(i));
			}
		});
	}
});

test('cityPlots refuses a seat with no mat', () => {
	assert.throws(() => cityPlots(seatWith(/** @type {any} */ (null))), Error);
});

test('no district, row or column of a basic mat starts complete', () => {
	for (let mat = 1; mat <= 6; mat++) {
		const plots = cityPlots(seatWith(mat));
		assert.deepEqual(completeDistricts(plots), []);
		assert.deepEqual(completeLines(plots), { rows: 0, columns: 0 });
	}
});

test('cityPlots shows buildings by type and a landmark on its grid plots only', () => {
	const bare = cityPlots(seatWith(1));
	const plots = cityPlots(
		seatWith(
			1,
			[{ building: 'farm', row: 0, col: 0 }],
			[{ landmark: 'lighthouse', row: -1, col: 7, rotation: 0 }]
		)
	);
	assert.equal(plots[plotIndex(0, 0)], 'farm');
	assert.equal(plots[plotIndex(0, 7)], 'landmark');
	assert.equal(plots[plotIndex(0, 8)], 'landmark');
	plots.forEach((p, i) => {
		if (![0, 7, 8].includes(i)) {
			assert.equal(p, bare[i]);
		}
	});
});

test('buildingSpots lists the open plots in reading order', () => {
	const spots = buildingSpots(seatWith(1));
	assert.equal(spots.length, 59);
	assert.deepEqual(spots.slice(0, 3), [
		{ row: 0, col: 0 },
		{ row: 0, col: 1 },
		{ row: 0, col: 2 },
	]);
	const after = buildingSpots(
		seatWith(1, [{ building: 'farm', row: 0, col: 0 }])
	);
	assert.equal(after.length, 58);
	assert.deepEqual(after[0], { row: 0, col: 1 });
});

test('buildingProblem refuses an impassable plot, a taken plot and a plot off the grid', () => {
	const seat = seatWith(1, [{ building: 'farm', row: 0, col: 0 }]);
	assert.equal(
		buildingProblem(seat, { row: 1, col: 0 }),
		"That plot isn't open."
	);
	assert.equal(
		buildingProblem(seat, { row: 0, col: 0 }),
		"That plot isn't open."
	);
	assert.equal(
		buildingProblem(seat, { row: 9, col: 0 }),
		'A building must go on a plot of your city.'
	);
	assert.equal(
		buildingProblem(seat, { row: 0, col: -1 }),
		'A building must go on a plot of your city.'
	);
	assert.equal(buildingProblem(seat, { row: 0, col: 1 }), null);
});

test('R14: a landmark may hang off the edge, but must cover at least one plot of the city', () => {
	const seat = seatWith(1);
	assert.ok(key(landmarkSpots(seat, 'lighthouse')).includes('-1,-1,0'));
	assert.equal(
		landmarkProblem(seat, {
			landmark: 'lighthouse',
			row: -2,
			col: 0,
			rotation: 0,
		}),
		'A landmark must cover at least one plot of your city.'
	);
});

test('R15: a landmark is offered in all four rotations, each covering its turned footprint', () => {
	const seat = seatWith(1);
	const spots = landmarkSpots(seat, 'rubber-works');
	for (let rotation = 0; rotation < 4; rotation++) {
		const mine = spots.filter((s) => s.rotation === rotation);
		assert.ok(mine.length > 0);
		const rows = rotateFootprint(FOOTPRINTS['rubber-works'], rotation);
		const { row, col } = mine[0];
		/** @type {{ row: number, col: number }[]} */
		const expected = [];
		rows.forEach((line, dy) =>
			[...line].forEach((c, dx) => {
				if (c === 'X') {
					expected.push({ row: row + dy, col: col + dx });
				}
			})
		);
		assert.deepEqual(
			landmarkCells({ landmark: 'rubber-works', row, col, rotation }),
			expected
		);
	}
});

test('R15: a chiral landmark is never offered mirrored', () => {
	/** @param {{ row: number, col: number }[]} cells */
	const shape = (cells) => {
		const r = Math.min(...cells.map((c) => c.row));
		const c0 = Math.min(...cells.map((c) => c.col));
		return cells
			.map((c) => `${c.row - r},${c.col - c0}`)
			.sort()
			.join(';');
	};
	// ['XXX.', '.XXX'] is the mirror of the Perch's ['.XXX', 'XXX.'], and so are its turned forms.
	const mirrorCells = ['XXX.', '.XXX'].flatMap((line, row) =>
		[...line].flatMap((x, col) => (x === 'X' ? [{ row, col }] : []))
	);
	const mirrors = new Set();
	let turned = mirrorCells;
	for (let turn = 0; turn < 4; turn++) {
		mirrors.add(shape(turned));
		// A quarter turn clockwise: (row, col) becomes (col, -row).
		turned = turned.map((c) => ({ row: c.col, col: -c.row }));
	}
	// The shape looks the same turned half way, so it has 2 distinct forms.
	assert.equal(mirrors.size, 2);
	const spots = landmarkSpots(seatWith(1), 'birdwatching-perch');
	assert.ok(spots.length > 0);
	for (const s of spots) {
		assert.ok(
			!mirrors.has(
				shape(landmarkCells({ landmark: 'birdwatching-perch', ...s }))
			),
			JSON.stringify(s)
		);
	}
});

test('landmark spots fully on the grid come first, and the default is unturned from the top left', () => {
	const spots = landmarkSpots(seatWith(1), 'lighthouse');
	assert.deepEqual(spots[0], { row: 0, col: 2, rotation: 0 });
	const onGrid = (/** @type {any} */ s) =>
		landmarkCells({ landmark: 'lighthouse', ...s }).every(
			(c) => c.row >= 0 && c.row < 9 && c.col >= 0 && c.col < 9
		);
	const firstOff = spots.findIndex((s) => !onGrid(s));
	assert.ok(firstOff > 0);
	assert.ok(spots.slice(firstOff).every((s) => !onGrid(s)));
});

test('R106: two landmarks cannot overlap off the grid', () => {
	const seat = seatWith(
		1,
		[],
		[{ landmark: 'fusion-reactor', row: -2, col: 0, rotation: 2 }]
	);
	assert.equal(
		landmarkProblem(seat, {
			landmark: 'lighthouse',
			row: -1,
			col: 2,
			rotation: 0,
		}),
		'Another landmark is already there.'
	);
	assert.equal(
		landmarkProblem(seat, {
			landmark: 'lighthouse',
			row: -1,
			col: 3,
			rotation: 0,
		}),
		null
	);
});

test('completeDistricts and completeLines count impassable plots as filled', () => {
	const seat = seatWith(5, [
		{ building: 'farm', row: 0, col: 0 },
		{ building: 'house', row: 0, col: 1 },
		{ building: 'market', row: 0, col: 2 },
	]);
	const plots = cityPlots(seat);
	assert.deepEqual(completeDistricts(plots), [0]);
	assert.deepEqual(completeLines(plots), { rows: 0, columns: 0 });
});
