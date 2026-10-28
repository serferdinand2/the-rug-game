// Test helpers for the rules engine: a new game with fixed players and a seeded random.
import { createGame } from '../../src/lib/engine/setup.js';
import { seededRandom } from '../../src/lib/engine/random.js';
import { play } from '../../src/lib/engine/play.js';
import { contextFor, run } from '../../src/lib/engine/loop.js';
import { startTurn } from '../../src/lib/engine/turn.js';
import { playTapestry } from '../../src/lib/engine/tapestry.js';
import { openDecisions } from '../../src/lib/engine/stack.js';
import { DECISIONS } from '../../src/lib/engine/kinds.js';

const NAMES = ['Ana', 'Bo', 'Cy', 'Dee', 'Eli'];

/**
 * A new base game for `count` players.
 * @param {number} count
 * @param {{ version?: 'original' | 'current', seed?: number, variants?: string[] }} [options]
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random }}
 */
export function newGame(
	count,
	{ version = 'current', seed = 1, variants = [] } = {}
) {
	const random = seededRandom(seed);
	const players = NAMES.slice(0, count).map((name) => ({ name }));
	return {
		state: createGame({ players, version, variants, random }),
		random,
	};
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
 * The civilizations startedGame() deals by default, in seat order: none has a setup effect or an adjustment.
 * They are cleared once play starts, so no civilization changes a test that doesn't ask for one (#20 design §11).
 */
const INERT_CIVS = [
	'leaders',
	'nomads',
	'inventors',
	'historians',
	'craftsmen',
];

/**
 * Makes each seat's setup pick keep a wanted civilization: it is swapped into the first place of the seat's dealt
 * options, from the other option, the deck or another seat's options, so every civilization stays in one place.
 * @param {import('../../src/lib/engine/state.js').State} state - A new game; changed in place
 * @param {string[]} wanted - In seat order
 */
function dealCivs(state, wanted) {
	const picks = openDecisions(state).filter((d) => d.kind === 'chooseCiv');
	for (const pick of picks) {
		const civ = wanted[/** @type {number} */ (pick.player) - 1];
		const holder = [
			pick.options,
			state.supply.civs,
			...picks.map((p) => p.options),
		].find((list) => list.includes(civ));
		if (!holder) {
			throw new Error(`${civ} isn't a civilization of this game.`);
		}
		holder[holder.indexOf(civ)] = pick.options[0];
		pick.options[0] = civ;
	}
}

/**
 * A game whose setup is done: the first player is choosing a turn.
 * Without `keepIncome`, every seat counts income turn 1 as taken without its gains: setup is answered with their
 * `incomeTurns` already 1, so the engine doesn't take it when setup ends (#77), and a test starts from what setup gave
 * and the holdings it sets, as before #77. With `keepIncome`, the state is the engine's own: every seat has taken
 * income turn 1, or the one it asks something is still deciding.
 * Without `civs`, every seat is dealt an inert civilization, which is cleared once play starts (back into the deck).
 * With `civs`, each seat keeps the one named for it, after its setup and, in the current version, its adjustment,
 * every setup question answered with its default.
 * @param {number} count
 * @param {{ version?: 'original' | 'current', seed?: number, variants?: string[], civs?: string[], keepIncome?: boolean }} [options]
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random }}
 */
export function startedGame(
	count,
	{ civs, keepIncome = false, ...options } = {}
) {
	const { state: dealt, random } = newGame(count, options);
	dealCivs(dealt, civs ?? INERT_CIVS);
	if (!keepIncome) {
		for (const seat of dealt.seats) {
			seat.incomeTurns = 1;
		}
	}
	const state = answerSetup(dealt, random);
	if (!civs) {
		for (const seat of state.seats) {
			if (seat.kind !== 'player') {
				continue;
			}
			const player = /** @type {any} */ (seat);
			state.supply.civs.push(...player.civs);
			player.civs = [];
			player.civData = {};
		}
	}
	return { state, random };
}

/**
 * A started game in which every seat has taken income turn 1, holding only what `fill` gives, and the current player
 * starts a new turn. `fill` changes that player's seat (and the state) before the turn starts, so the turn choice sees
 * the change.
 * @param {number} [count]
 * @param {(seat: any, state: import('../../src/lib/engine/state.js').State) => void} [fill]
 * @param {{ version?: 'original' | 'current', seed?: number, variants?: string[], civs?: string[] }} [options] - As startedGame()'s
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random, player: number }}
 */
export function readyTurn(count = 2, fill = () => {}, options) {
	const { state: started, random } = startedGame(count, options);
	const state = structuredClone(started);
	const player = /** @type {number} */ (state.current);
	const seat = state.seats[player - 1];
	fill(seat, state);
	state.pending.length = 0;
	startTurn(contextFor(state, random, state.pending), player);
	run(state, random);
	return { state, random, player };
}

/**
 * A started game in which the current player takes income turn 1 again, after `fill` changes their seat (and the
 * state): their turn starts with no income turns, so the engine takes the income itself and stops at whatever it asks
 * (#77). For a test that must set something up before income turn 1, which setup's end no longer leaves time for.
 * @param {number} [count]
 * @param {(seat: any, state: import('../../src/lib/engine/state.js').State) => void} [fill]
 * @param {{ version?: 'original' | 'current', seed?: number, variants?: string[], civs?: string[] }} [options] - As startedGame()'s
 * @returns {{ state: import('../../src/lib/engine/state.js').State, random: import('../../src/lib/engine/random.js').Random, player: number }}
 */
export function firstIncomeTurn(count = 2, fill = () => {}, options) {
	return readyTurn(
		count,
		(seat, state) => {
			seat.incomeTurns = 0;
			fill(seat, state);
		},
		options
	);
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

/**
 * Plays a tapestry card on top of one of a player's era slots, as a copy of the state, and runs its ability
 * until the next decision.
 * @param {import('../../src/lib/engine/state.js').State} state - Left unchanged
 * @param {import('../../src/lib/engine/random.js').Random} random
 * @param {number} player
 * @param {string} card
 * @param {number} [era]
 * @returns {import('../../src/lib/engine/state.js').State}
 */
export function resolveTapestry(state, random, player, card, era = 2) {
	const next = structuredClone(state);
	playTapestry(contextFor(next, random, next.pending), player, card, era);
	run(next, random);
	return next;
}

/**
 * Answers every open decision with its first answer until none is open.
 * @param {import('../../src/lib/engine/state.js').State} state
 * @param {import('../../src/lib/engine/random.js').Random} random
 * @param {number} [limit] - Most decisions to answer before giving up
 * @returns {import('../../src/lib/engine/state.js').State}
 */
export function answerDefaults(state, random, limit = 200) {
	for (let step = 0; step < limit; step++) {
		const [open] = openDecisions(state);
		if (!open) {
			return state;
		}
		const first = DECISIONS[open.kind].answers(state, open)[0];
		state = play(
			state,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...first },
			random
		);
	}
	throw new Error('A decision never ended.');
}

/**
 * A game where seat 1 conquers seat 2's lone outpost on '-2_-1', and seat 2 holds `hand`.
 * @param {string[]} hand
 * @param {Record<string, any>} [options]
 */
export function conquestGame(hand, options) {
	const { state: started } = startedGame(2, options);
	const state = structuredClone(started);
	for (const [key, hex] of Object.entries(state.hexes)) {
		hex.outposts = [];
		if (key !== '-2_-2' && key !== '-2_-1') {
			/** @type {any} */ (hex).tile = null;
		}
	}
	state.hexes['-2_-2'].outposts = [{ seat: 1, toppled: false }];
	state.hexes['-2_-1'].outposts = [{ seat: 2, toppled: false }];
	state.seats[1].hand = [...hand];
	return state;
}
