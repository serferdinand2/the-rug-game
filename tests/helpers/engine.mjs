// Test helpers for the rules engine: a new game with fixed players and a seeded random.
import { createGame } from '../../src/lib/engine/setup.js';
import { seededRandom } from '../../src/lib/engine/random.js';
import { play } from '../../src/lib/engine/play.js';
import { contextFor, run } from '../../src/lib/engine/loop.js';
import { startTurn } from '../../src/lib/engine/turn.js';
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

/** Effects that later issues build (#17–#20). */
const HANDOFF_EFFECTS = [
	'explore',
	'exploreSpace',
	'conquer',
	'tileBenefit',
	'invent',
	'upgrade',
	'techBenefit',
	'tapestryOnTop',
	'gainCiv',
];

/** Operations #14 and #15 push for later issues: civilization abilities (#20) and tapestry abilities (#19). */
const HANDOFF_OPERATIONS = ['civAbilities', 'tapestryAbility'];

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

/**
 * A started game in which the current player has taken income turn 1 and starts a new turn.
 * `fill` changes that player's seat (and the state) before the turn starts, so the turn choice sees the change.
 * @param {number} [count]
 * @param {(seat: any, state: import('../../src/lib/engine/state.js').State) => void} [fill]
 * @param {{ version?: 'original' | 'current', seed?: number }} [options]
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random, player: number }}
 */
export function readyTurn(count = 2, fill = () => {}, options) {
	const { state: started, random } = startedGame(count, options);
	const state = structuredClone(started);
	const player = /** @type {number} */ (state.current);
	const seat = state.seats[player - 1];
	seat.incomeTurns = 1;
	fill(seat, state);
	state.pending.length = 0;
	startTurn(contextFor(state, random, state.pending), player);
	run(state, random);
	return { state, random, player };
}

/**
 * Answers the open decision of a kind for a player.
 * @param {import('../../src/lib/engine/state.js').State} state
 * @param {import('../../src/lib/engine/random.js').Random} random
 * @param {number} player
 * @param {string} kind
 * @param {Record<string, any>} answer
 * @returns {import('../../src/lib/engine/state.js').State}
 */
export function answer(state, random, player, kind, answer) {
	const decision = openDecisions(state).find(
		(d) => d.kind === kind && d.player === player
	);
	if (!decision) {
		throw new Error(`Seat ${player} has no open ${kind}.`);
	}
	return play(state, player, { decision: decision.id, ...answer }, random);
}

/**
 * Answers every open capital placement with its first answer until none is open (not the district rewards).
 * @param {import('../../src/lib/engine/state.js').State} state
 * @param {import('../../src/lib/engine/random.js').Random} random
 * @returns {import('../../src/lib/engine/state.js').State}
 */
export function placeAll(state, random) {
	for (;;) {
		const decision = openDecisions(state).find(
			(d) => d.kind === 'choosePlacement'
		);
		if (!decision) {
			return state;
		}
		const answer = DECISIONS.choosePlacement.answers(state, decision)[0];
		state = play(
			state,
			/** @type {number} */ (decision.player),
			{ decision: decision.id, ...answer },
			random
		);
	}
}
