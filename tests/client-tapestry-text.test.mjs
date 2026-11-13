// The tapestry cards' faces in words (#26, #126): each card's ability, and the trap's note.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { describeTapestryCard } from '../src/lib/cards/tapestry-text.js';
import { describeEffects } from '../src/lib/describe.js';
import { TAPESTRY_CARDS } from '../src/lib/engine/data/tapestry-cards.js';
import { assertReadable } from './helpers/readable.mjs';

test('every tapestry card face has words, also for the rules the engine keeps in code', () => {
	for (const card of TAPESTRY_CARDS) {
		const { ability, note } = describeTapestryCard(card.id);
		assertReadable(ability, `tapestry card ${card.id}'s ability`);
		assert.notEqual(ability, 'Nothing', `${card.id} has no words`);
		assert.doesNotMatch(
			ability,
			/\bresolve\b/i,
			`${card.id}: "${ability}"`
		);
		if (note !== undefined) {
			assertReadable(note, `tapestry card ${card.id}'s note`);
		}
	}
	// A card whose rules are all effects reads as them.
	const democracy = /** @type {any} */ (
		TAPESTRY_CARDS.find((c) => c.id === 'democracy')
	);
	assert.equal(
		describeTapestryCard('democracy').ability,
		describeEffects(democracy.played, { ordered: democracy.ordered })
	);
	assert.equal(describeTapestryCard('democracy').note, undefined);
	assert.equal(
		describeTapestryCard('academia').ability,
		'Whenever you invent a tech card or gain a tapestry card, gain 3 VP'
	);
	// R22: the trap is a response card, and gains 10 VP played as a card.
	assert.deepEqual(
		describeTapestryCard('trap-5'),
		describeTapestryCard('trap')
	);
	assert.equal(
		describeTapestryCard('trap').note,
		'Played as a tapestry card on an income turn: gain 10 VP'
	);
	assert.equal(
		describeTapestryCard('no-such-card').ability,
		describeEffects([{ notAnEffect: {} }])
	);
});

test('a Plans & Ploys response card reads as its response, and its note says what it gains as a tapestry card (#33)', () => {
	for (const id of [
		'double-cross',
		'retreat',
		'stolen-plans',
		'surprise-party',
		'surrender',
	]) {
		const { ability, note } = describeTapestryCard(id);
		assert.match(ability, /^When /, `${id}: "${ability}"`);
		assert.match(
			String(note),
			/^Played as a tapestry card on an income turn: /,
			id
		);
	}
	assert.equal(
		describeTapestryCard('surrender').note,
		'Played as a tapestry card on an income turn: gain 1 resource of your choice and 7 VP'
	);
	assert.match(describeTapestryCard('retreat').ability, /1 worker/);
});

test("Cloud Colonies' face reads as its card: 3 VP per territory you control whose picture shows clouds (#49)", () => {
	assert.equal(
		describeTapestryCard('cloud-colonies').ability,
		'Gain 3 VP for each territory you control whose picture shows clouds'
	);
});
