// Shadow Empire reuses the base cards, and base Automa civilizations retain their income rules (02 §9.1, §9.3).
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
	AUTOMA_CARDS,
	SHADOW_EMPIRE_CARDS,
} from '../src/lib/engine/data/automa-cards.js';
import { AUTOMA_CIVS } from '../src/lib/engine/data/automa-civs.js';

test('the Shadow Empire pool contains only the same twelve base card records', () => {
	assert.deepEqual(
		SHADOW_EMPIRE_CARDS.map((card) => card.id),
		[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	);
	for (const card of SHADOW_EMPIRE_CARDS) {
		assert.strictEqual(
			card,
			AUTOMA_CARDS.find((base) => base.id === card.id)
		);
	}
	assert.ok(Object.isFrozen(SHADOW_EMPIRE_CARDS));
	assert.throws(() => SHADOW_EMPIRE_CARDS.pop(), TypeError);
});

test('the four base Automa civilizations retain their favourite tracks and exact income abilities', () => {
	assert.deepEqual(AUTOMA_CIVS, [
		{
			id: 'explorers',
			name: 'Explorers',
			favouriteTrack: 'exploration',
			incomeAbilities: [
				{
					kind: 'advance',
					turns: [2, 4],
					track: 'exploration',
					withBenefits: true,
				},
				{
					kind: 'advance',
					turns: [3, 5],
					track: 'military',
					withBenefits: true,
				},
			],
		},
		{
			id: 'conquerors',
			name: 'Conquerors',
			favouriteTrack: 'military',
			incomeAbilities: [
				{
					kind: 'conquerIfFewerTerritoriesThanIncomeTurn',
					turns: [2, 3, 4, 5],
				},
				{
					kind: 'reinforceWithToppledShadowEmpireOutpost',
					turns: [2, 3, 4, 5],
					minimumSingleTokenTerritories: 3,
					tiebreaker: 'hex',
				},
				{
					kind: 'score',
					turns: [2, 3, 4, 5],
					per: 'territory',
					vp: 1,
					multiplied: false,
				},
			],
		},
		{
			id: 'scientists',
			name: 'Scientists',
			favouriteTrack: 'science',
			incomeAbilities: [
				{
					kind: 'scienceDieAdvance',
					turns: [3, 4, 5],
					withBenefits: true,
				},
			],
		},
		{
			id: 'engineers',
			name: 'Engineers',
			favouriteTrack: 'technology',
			incomeAbilities: [
				{
					kind: 'score',
					turns: [2, 3, 4, 5],
					per: 'landmark',
					vp: 1,
					multiplied: false,
				},
			],
		},
	]);
});

test('civilization definitions and nested income rules cannot be mutated', () => {
	function frozen(value) {
		if (value && typeof value === 'object') {
			assert.ok(Object.isFrozen(value));
			for (const child of Object.values(value)) {
				frozen(child);
			}
		}
	}
	frozen(AUTOMA_CIVS);
	assert.throws(() => {
		AUTOMA_CIVS[1].incomeAbilities[1].minimumSingleTokenTerritories = 2;
	}, TypeError);
	assert.throws(
		() => AUTOMA_CIVS[0].incomeAbilities[0].turns.push(5),
		TypeError
	);
});
