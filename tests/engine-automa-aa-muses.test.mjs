// Muses' documented income sequence and threshold (#38).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { botMusesIncome } from '../src/lib/engine/automa-expansion-aa.js';

test('Muses move twice on arts unless arts is their favourite', () => {
	for (const [favourite, kinds] of [
		['science', ['botAdvance', 'botAdvance', 'effects', 'botMusesScore']],
		['arts', ['botAdvance', 'botResearch', 'effects', 'botMusesScore']],
	]) {
		const queued = [];
		const human = { kind: 'player', seat: 1 };
		const bot = {
			kind: 'automa',
			seat: 2,
			favouriteTrack: favourite,
			incomePair: { trackCard: 1, tiebreakerCard: 2 },
		};
		botMusesIncome(
			{
				state: { seats: [human, bot] },
				push: (ops) => queued.push(...ops),
			},
			{ player: 2 }
		);
		assert.deepEqual(
			queued.map((op) => op.kind),
			kinds
		);
		assert.equal(queued[0].track, 'arts');
		assert.equal(queued[2].effects[0].advance.noBenefit, true);
	}
});
