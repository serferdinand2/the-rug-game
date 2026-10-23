// Test helpers for the rules engine: a new game with fixed players and a seeded random.
import { createGame } from '../../src/lib/engine/setup.js';
import { seededRandom } from '../../src/lib/engine/random.js';

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

/**
 * A new base game for `count` players.
 * @param {number} count
 * @param {{ version?: 'original' | 'current', seed?: number }} [options]
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random }}
 */
export function newGame(count, { version = 'current', seed = 1 } = {}) {
	const random = seededRandom(seed);
	const players = NAMES.slice(0, count).map((name) => ({ name }));
	return { state: createGame({ players, version, random }), random };
}
