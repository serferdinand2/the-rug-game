// Capital-grid geometry for the interface: footprints, legal positions and completed rows, columns and districts.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
	GRID_SIZE,
	plotIndex,
	rotateFootprint,
	footprintCells,
	fits,
	nearestFit,
	groupsOf,
	completedGroups,
	groupBounds,
} from '../src/lib/capital.js';

/** An empty capital with the given plots set. */
function capital(/** @type {Record<number, string>} */ set = {}) {
	return Array.from({ length: 81 }, (_, index) => set[index] ?? 'empty');
}

test('a capital is 9 by 9 and plots count row by row', () => {
	assert.equal(GRID_SIZE, 9);
	assert.equal(plotIndex(0, 0), 0);
	assert.equal(plotIndex(1, 0), 9);
	assert.equal(plotIndex(8, 8), 80);
});

test('a footprint turns clockwise a quarter at a time', () => {
	const rubberWorks = ['..XX', '..XX', 'XXXX', 'XXXX'];
	assert.deepEqual(rotateFootprint(rubberWorks, 1), [
		'XX..',
		'XX..',
		'XXXX',
		'XXXX',
	]);
	assert.deepEqual(rotateFootprint(['XXX', 'XXX'], 1), ['XX', 'XX', 'XX']);
	assert.deepEqual(rotateFootprint(rubberWorks, 4), rubberWorks);
	assert.deepEqual(
		rotateFootprint(rubberWorks, -1),
		rotateFootprint(rubberWorks, 3)
	);
});

test('a footprint covers only its X plots', () => {
	assert.deepEqual(footprintCells(['.X', 'XX'], 2, 3), [22, 30, 31]);
});

test('a footprint over the edge covers only the plots on the grid (R106)', () => {
	assert.deepEqual(footprintCells(['XX', 'XX'], 6, -1), [54, 63]);
	assert.deepEqual(footprintCells(['XX', 'XX'], 2, 8), [26, 35]);
	assert.deepEqual(footprintCells(['XXX', 'XXX'], -1, 0), [0, 1, 2]);
	assert.deepEqual(footprintCells(['XX', 'XX'], 8, 8), [80]);
});

test('a landmark fits only on open plots inside the grid', () => {
	const plots = capital({ 10: 'blocked', 40: 'market' });
	assert.equal(fits(plots, ['XX', 'XX'], 0, 2), true);
	assert.equal(
		fits(plots, ['XX', 'XX'], 0, 0),
		false,
		'covers an impassable plot'
	);
	assert.equal(fits(plots, ['XX', 'XX'], 3, 3), false, 'covers a market');
	assert.equal(fits(plots, ['XX', 'XX'], 8, 0), false, 'runs off the bottom');
	assert.equal(
		fits(plots, ['XX', 'XX'], 0, 8),
		false,
		'runs off the right edge'
	);
	assert.equal(
		fits(capital({ 0: 'blocked' }), ['.X', 'XX'], 0, 0),
		true,
		'its empty corner may sit on a blocked plot'
	);
});

test('a dropped landmark snaps to the nearest legal position', () => {
	const plots = capital({ 0: 'blocked', 1: 'blocked', 9: 'blocked' });
	assert.deepEqual(nearestFit(plots, ['XX', 'XX'], 0, 0), { row: 1, col: 1 });
	assert.deepEqual(nearestFit(plots, ['XX', 'XX'], 0, 3), { row: 0, col: 3 });
	assert.deepEqual(nearestFit(plots, ['XX', 'XX'], 8, 8), { row: 7, col: 7 });
	const full = capital(
		Object.fromEntries([...Array(81).keys()].map((i) => [i, 'house']))
	);
	assert.equal(nearestFit(full, ['X'], 4, 4), null);
});

test('there are nine rows, nine columns and nine districts', () => {
	assert.equal(groupsOf('rows').length, 9);
	assert.deepEqual(groupsOf('rows')[1], [9, 10, 11, 12, 13, 14, 15, 16, 17]);
	assert.deepEqual(
		groupsOf('columns')[2],
		[2, 11, 20, 29, 38, 47, 56, 65, 74]
	);
	assert.deepEqual(
		groupsOf('districts')[4],
		[30, 31, 32, 39, 40, 41, 48, 49, 50]
	);
});

test('impassable plots count as filled when a group is complete', () => {
	const filledRow = Object.fromEntries(
		[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [i, i % 2 ? 'blocked' : 'farm'])
	);
	const plots = capital({ ...filledRow, 9: 'house' });
	assert.deepEqual(completedGroups(plots, 'rows'), [groupsOf('rows')[0]]);
	assert.deepEqual(completedGroups(plots, 'columns'), []);
	assert.deepEqual(completedGroups(capital(), 'districts'), []);
});

test('a group knows the rectangle it covers', () => {
	assert.deepEqual(groupBounds(groupsOf('rows')[2]), {
		row: 2,
		col: 0,
		rows: 1,
		cols: 9,
	});
	assert.deepEqual(groupBounds(groupsOf('columns')[5]), {
		row: 0,
		col: 5,
		rows: 9,
		cols: 1,
	});
	assert.deepEqual(groupBounds(groupsOf('districts')[8]), {
		row: 6,
		col: 6,
		rows: 3,
		cols: 3,
	});
});
