// Landmark placement on the capital grid: pieces as occupied plots, snapping, keyboard moves, turning and the drawn outline.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	pieceShape,
	withPieces,
	completionCounts,
	snapPiece,
	stepPiece,
	rotatePiece,
	fillPath,
	outlinePath,
	controlsAnchor,
	pieceArea,
} from '../src/lib/placement.js';

/** An empty capital with the given plots set. */
function capital(/** @type {Record<number, string>} */ set = {}) {
	return /** @type {import('../src/lib/capital.js').PlotKind[]} */ (
		Array.from({ length: 81 }, (_, index) => set[index] ?? 'empty')
	);
}

const lighthouse = {
	id: 'lighthouse',
	footprint: ['XX', 'XX'],
	row: 0,
	col: 0,
};
const rubberWorks = ['..XX', '..XX', 'XXXX', 'XXXX'];

test('a piece takes the shape of its footprint turned by its rotation', () => {
	assert.deepEqual(pieceShape(lighthouse), ['XX', 'XX']);
	assert.deepEqual(
		pieceShape({ ...lighthouse, footprint: ['XXX', 'XXX'], rotation: 1 }),
		['XX', 'XX', 'XX']
	);
});

test('pieces fill the plots they cover as landmarks, without changing the plots given', () => {
	const plots = capital({ 0: 'blocked' });
	const filled = withPieces(plots, [{ ...lighthouse, row: 1, col: 1 }]);
	assert.deepEqual(
		[10, 11, 19, 20].map((index) => filled[index]),
		['landmark', 'landmark', 'landmark', 'landmark']
	);
	assert.equal(filled[0], 'blocked');
	assert.equal(filled[12], 'empty');
	assert.equal(plots[10], 'empty');
});

test('a piece over the edge fills only its plots on the grid (R106)', () => {
	const filled = withPieces(capital(), [
		{ ...lighthouse, row: 6, col: -1 },
		{ ...lighthouse, id: 'forge', row: 8, col: 4 },
	]);
	assert.equal(filled.length, 81);
	assert.deepEqual(
		filled.flatMap((kind, index) => (kind === 'landmark' ? [index] : [])),
		[54, 63, 76, 77]
	);
});

test("a piece's area is its shape's rectangle on the grid, with how far it hangs over each edge", () => {
	assert.deepEqual(pieceArea(['XX', 'XX'], 3, 4), {
		row: 3,
		col: 4,
		rows: 2,
		cols: 2,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	});
	assert.deepEqual(pieceArea(['XXX', 'XXX', 'XXX'], 7, -2), {
		row: 7,
		col: 0,
		rows: 2,
		cols: 1,
		top: 0,
		right: 0,
		bottom: 1,
		left: 2,
	});
	assert.deepEqual(pieceArea(['XX', 'XX'], -1, 8), {
		row: 0,
		col: 8,
		rows: 1,
		cols: 1,
		top: 1,
		right: 1,
		bottom: 0,
		left: 0,
	});
});

test('only locked pieces count towards completed rows, columns and districts', () => {
	const plots = capital(
		Object.fromEntries(
			[0, 1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15].map((index) => [
				index,
				'house',
			])
		)
	);
	const piece = { ...lighthouse, row: 0, col: 7 };
	assert.deepEqual(completionCounts(plots, [piece]), {
		rows: 0,
		columns: 0,
		districts: 0,
	});
	assert.deepEqual(completionCounts(plots, [{ ...piece, locked: true }]), {
		rows: 2,
		columns: 0,
		districts: 0,
	});
});

test('a piece snaps to the nearest fit, ignoring its own plots but not the others', () => {
	const other = { id: 'forge', footprint: ['XX', 'XX'], row: 0, col: 2 };
	const moving = { ...lighthouse, row: 0, col: 0 };
	assert.deepEqual(snapPiece(capital(), [moving, other], moving, 0, 1), {
		row: 0,
		col: 0,
	});
	assert.deepEqual(snapPiece(capital(), [moving, other], moving, 0, 3), {
		row: 0,
		col: 4,
	});
	const full = capital(
		Object.fromEntries([...Array(81).keys()].map((i) => [i, 'farm']))
	);
	assert.equal(snapPiece(full, [], moving, 4, 4), null);
});

test('an arrow key moves a piece one plot, hopping over plots it cannot cover', () => {
	const plots = capital({ 3: 'market', 12: 'market' });
	const piece = { ...lighthouse, row: 0, col: 0 };
	assert.deepEqual(stepPiece(plots, [piece], piece, 0, 1), {
		row: 0,
		col: 1,
	});
	assert.deepEqual(stepPiece(plots, [piece], { ...piece, col: 1 }, 0, 1), {
		row: 0,
		col: 4,
	});
	assert.equal(stepPiece(plots, [piece], piece, -1, 0), null);
	assert.equal(stepPiece(plots, [piece], { ...piece, col: 7 }, 0, 1), null);
});

test('turning a piece gives its next rotation and a position where the turned shape fits', () => {
	const launchPad = {
		id: 'launch-pad',
		footprint: ['XXX', 'XXX'],
		row: 7,
		col: 0,
	};
	assert.deepEqual(rotatePiece(capital(), [launchPad], launchPad), {
		rotation: 1,
		row: 6,
		col: 0,
	});
	assert.deepEqual(
		rotatePiece(capital(), [], { ...lighthouse, rotation: 3 }),
		{ rotation: 0, row: 0, col: 0 }
	);
	const full = capital(
		Object.fromEntries(
			[...Array(81).keys()]
				.filter((i) => ![0, 1, 2, 9, 10, 11].includes(i))
				.map((i) => [i, 'farm'])
		)
	);
	const pad = { ...launchPad, row: 0, col: 0 };
	assert.equal(rotatePiece(full, [pad], pad), null);
});

test('a shape is filled with one unit square per covered plot', () => {
	assert.equal(
		fillPath(['.X', 'XX']),
		'M1 0h1v1h-1zM0 1h1v1h-1zM1 1h1v1h-1z'
	);
});

test('the outline follows only the edges on the border of the shape', () => {
	assert.equal(
		outlinePath(['XX', 'XX']),
		'M0 0h1M0 0v1M1 0h1M2 0v1M0 2h1M0 1v1M1 2h1M2 1v1'
	);
	const segments = outlinePath(rubberWorks).match(/M/g)?.length;
	assert.equal(segments, 16, 'the Rubber Works border is 16 plot edges long');
});

test('the placement controls sit at the rightmost plot of the top row', () => {
	assert.deepEqual(controlsAnchor(['XX', 'XX']), { row: 0, col: 1 });
	assert.deepEqual(controlsAnchor(['XX..', 'XX..', 'XXXX', 'XXXX']), {
		row: 0,
		col: 1,
	});
	assert.deepEqual(controlsAnchor(['..XX', '..XX', 'XXXX', 'XXXX']), {
		row: 0,
		col: 3,
	});
});
