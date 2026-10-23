// Test helpers for the rules engine: a new game with fixed players and a seeded random.
import { createGame } from '../../src/lib/engine/setup.js';
import { seededRandom } from '../../src/lib/engine/random.js';
import { play } from '../../src/lib/engine/play.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { DECISIONS } from '../../src/lib/engine/kinds.js';

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

/**
 * Answers every setup pick with its default until the game is in play.
 * @param {import('../../src/lib/engine/state.js').State} state
 * @param {import('../../src/lib/engine/random.js').Random} random
 * @returns {import('../../src/lib/engine/state.js').State}
 */
export function answerSetup(state, random) {
	while (state.phase === 'setup') {
		const decision = openDecisions(state)[0];
		const answer = DECISIONS[decision.kind].answers(state, decision)[0];
		state = play(
			state,
			decision.player,
			{ decision: decision.id, ...answer },
			random
		);
	}
	return state;
}

/**
 * A game whose setup is done: the first player is choosing a turn.
 * @param {number} count
 * @param {{ version?: 'original' | 'current', seed?: number }} [options]
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random }}
 */
export function startedGame(count, options) {
	const { state, random } = newGame(count, options);
	return { state: answerSetup(state, random), random };
}
