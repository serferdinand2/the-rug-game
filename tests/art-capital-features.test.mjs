// Every advanced biome lists its FEATURES for the game's mat composer (#6, #36), with valid variant indexes.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { BIOMES } from '../art/parts/capital-biomes/index.js';

const OPEN_COUNT = 8;
const BLOCKED_COUNT = 6;

/**
 * @param {readonly number[]} variants
 * @param {number} count
 * @param {string} what
 */
function assertIndexes(variants, count, what) {
	assert.ok(Array.isArray(variants), `${what} is a list`);
	for (const v of variants) {
		assert.ok(
			Number.isInteger(v) && v >= 0 && v < count,
			`${what}: ${v} is a variant index below ${count}`
		);
	}
	assert.equal(new Set(variants).size, variants.length, `${what} repeats`);
}

for (const [name, biome] of Object.entries(BIOMES)) {
	test(`${name} lists valid FEATURES`, () => {
		const { FEATURES } = biome;
		assert.ok(FEATURES, 'has FEATURES');
		assert.ok(Object.isFrozen(FEATURES), 'frozen');
		assert.ok(Object.isFrozen(FEATURES.pools));
		assertIndexes(FEATURES.pools.open, OPEN_COUNT, 'pools.open');
		assertIndexes(FEATURES.pools.blocked, BLOCKED_COUNT, 'pools.blocked');
		for (const entry of FEATURES.special) {
			assert.equal(typeof entry.blocked, 'boolean');
			assertIndexes(
				entry.variants,
				entry.blocked ? BLOCKED_COUNT : OPEN_COUNT,
				'special'
			);
			assert.ok(entry.variants.length > 0);
			assert.ok(entry.meaning.length > 10, 'says what it means');
		}
		for (const feature of FEATURES.matOnly) {
			assert.ok(feature.name.length > 0);
			assert.ok(feature.where.length > 10, 'says where it sits');
		}
		// Every variant is either ordinary or special, never both and never neither.
		for (const blocked of [false, true]) {
			const count = blocked ? BLOCKED_COUNT : OPEN_COUNT;
			const pool = blocked ? FEATURES.pools.blocked : FEATURES.pools.open;
			const special = FEATURES.special
				.filter((entry) => entry.blocked === blocked)
				.flatMap((entry) => [...entry.variants]);
			for (let v = 0; v < count; v++) {
				const places =
					(pool.includes(v) ? 1 : 0) +
					special.filter((s) => s === v).length;
				assert.ok(
					places >= 1,
					`${blocked ? 'blocked' : 'open'} variant ${v} is neither ordinary nor special`
				);
				assert.ok(
					!(pool.includes(v) && special.includes(v)),
					`variant ${v} is both`
				);
			}
		}
	});
}
