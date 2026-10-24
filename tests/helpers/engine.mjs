// Test helpers for the rules engine: a new game with fixed players and a seeded random.
import { createGame } from '../../src/lib/engine/setup.js';
import { seededRandom } from '../../src/lib/engine/random.js';
import { play } from '../../src/lib/engine/play.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { DECISIONS, AUTOMATIC } from '../../src/lib/engine/kinds.js';
import { EFFECTS } from '../../src/lib/engine/effects/index.js';

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

/** Effects that later issues build (#16–#20). */
const HANDOFF_EFFECTS = [
	'explore',
	'exploreSpace',
	'conquer',
	'tileBenefit',
	'invent',
	'upgrade',
	'techBenefit',
	'tapestryOnTop',
	'scoreCapital',
	'gainCiv',
];

/** Operations #14 pushes for #16 to resolve. */
const HANDOFF_OPERATIONS = ['placeLandmark', 'placeBuilding'];

/**
 * Stands in for the effects and operations later issues build, recording each one they are given.
 * Call `restore()` when the test ends, for example with `t.after(handoffs.restore)`.
 * @returns {{ calls: { kind: string, player: number | null, value: any }[], restore: () => void }}
 */
export function stubHandoffs() {
	/** @type {{ kind: string, player: number | null, value: any }[]} */
	const calls = [];
	for (const kind of HANDOFF_EFFECTS) {
		if (Object.hasOwn(EFFECTS, kind)) {
			throw new Error(`${kind} is built now; stop standing in for it.`);
		}
		EFFECTS[kind] = (ctx, player, value) => {
			calls.push({ kind, player, value: structuredClone(value) });
		};
	}
	for (const kind of HANDOFF_OPERATIONS) {
		if (Object.hasOwn(AUTOMATIC, kind) || Object.hasOwn(DECISIONS, kind)) {
			throw new Error(`${kind} is built now; stop standing in for it.`);
		}
		AUTOMATIC[kind] = (ctx, op) => {
			const {
				id: _id,
				batch: _batch,
				kind: _kind,
				player,
				...value
			} = op;
			calls.push({ kind, player, value });
		};
	}
	return {
		calls,
		restore() {
			for (const kind of HANDOFF_EFFECTS) {
				delete EFFECTS[kind];
			}
			for (const kind of HANDOFF_OPERATIONS) {
				delete AUTOMATIC[kind];
			}
		},
	};
}
