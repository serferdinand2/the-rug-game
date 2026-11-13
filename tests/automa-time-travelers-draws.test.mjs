import { test } from 'vitest';
import assert from 'node:assert/strict';
import { drawTech, canDraw } from '../src/lib/engine/tech.js';
import { timeTravelersBlocksSpaceTile } from '../src/lib/engine/automa-time-travelers.js';

function sample(landmark, deck, discard = []) {
	return {
		seq: 0,
		events: [],
		seats: [
			{
				kind: 'automa',
				civilization: 'time-travelers',
				timeTravelersLandmark: landmark,
			},
		],
		supply: { tech: { deck, discard } },
	};
}

test('the Time Travelers landmark tech is discarded when drawn and drawing continues', () => {
	const state = sample('bakery', ['bakery', 'clocks']);
	const card = drawTech({ state, random: () => 0 });
	assert.equal(card, 'clocks');
	assert.deepEqual(state.supply.tech.discard, ['bakery']);
	assert.equal(canDraw(state), false);
	assert.equal(drawTech({ state, random: () => 0 }), null);
	assert.deepEqual(state.supply.tech.discard, ['bakery']);
});

test('the block is limited to the chosen card, and Monolith blocks only tile 19', () => {
	const state = sample('treasury', ['bakery']);
	assert.equal(drawTech({ state, random: () => 0 }), 'bakery');
	state.seats[0].timeTravelersLandmark = 'monolith';
	assert.equal(timeTravelersBlocksSpaceTile(state, 19), true);
	assert.equal(timeTravelersBlocksSpaceTile(state, 18), false);
});
