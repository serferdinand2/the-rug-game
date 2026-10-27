// The names a blank name field gets (#25): one of Lazar's first parts and one of his endings.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRST_PARTS, ENDINGS, generateName } from '../src/lib/names.js';

test('a generated name joins a first part and an ending', () => {
	assert.equal(
		generateName(() => 0),
		'Astervale'
	);
	assert.equal(
		generateName((n) => n - 1),
		FIRST_PARTS.at(-1) + ENDINGS.at(-1)
	);
	assert.notEqual(
		generateName(() => 0),
		generateName(() => 1)
	);
});

test('there are at least 16 of each part, and every name fits a seat', () => {
	assert.ok(FIRST_PARTS.length >= 16);
	assert.ok(ENDINGS.length >= 16);
	for (const first of FIRST_PARTS) {
		for (const ending of ENDINGS) {
			const name = first + ending;
			assert.ok(name.length >= 3 && name.length <= 24, name);
		}
	}
});
