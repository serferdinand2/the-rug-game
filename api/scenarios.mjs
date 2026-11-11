// Named game scenarios for the browser tests (#184): a started game brought by a fixed function to the state a test needs. The start request may name one only when the server runs with TEST_SCENARIOS=true; the client never sends a state.
import { PlayerError } from '../src/lib/engine/errors.js';
import { DECISIONS } from '../src/lib/engine/kinds.js';
import { play } from '../src/lib/engine/play.js';
import { run } from '../src/lib/engine/loop.js';
import { openDecisions, push } from '../src/lib/engine/stack.js';

/** @typedef {import('../src/lib/engine/state.js').State} State */
/** @typedef {import('../src/lib/engine/random.js').Random} Random */

/**
 * Answers every open decision with its first answer until the current player is choosing a turn: setup, the first
 * income turn and whatever they ask.
 * @param {State} state
 * @param {Random} random
 * @returns {State}
 */
function toFirstTurn(state, random) {
	for (let step = 0; step < 500; step++) {
		const [open] = openDecisions(state);
		if (!open) {
			throw new Error('The game asks nothing.');
		}
		if (state.phase === 'play' && open.kind === 'chooseTurn') {
			return state;
		}
		const [answer] = DECISIONS[open.kind].answers(state, open);
		state = play(
			state,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...answer },
			random
		);
	}
	throw new Error('The game never reached a turn.');
}

/**
 * Takes a card out of wherever the supply holds it.
 * @param {string[][]} piles
 * @param {string} card
 */
function takeCard(piles, card) {
	for (const pile of piles) {
		const at = pile.indexOf(card);
		if (at !== -1) {
			pile.splice(at, 1);
			return;
		}
	}
	throw new Error(`${card} isn't in the supply.`);
}

/**
 * The scenarios by name. Each gets the game the start just made, with its random, and returns the game to play.
 * @type {Readonly<Record<string, (game: State, random: Random) => State>>}
 */
const SCENARIOS = Object.freeze({
	// A&A's places on cards (#184): the current player's era I slot holds Monuments and their bottom tech row Astrolabe,
	// and they gain a Farm, then the Forge, each asked where it goes.
	'aa-card-places': (game, random) => {
		if (!game.expansions.includes('aa')) {
			throw new PlayerError('This scenario needs Arts & Architecture.');
		}
		const state = structuredClone(toFirstTurn(game, random));
		const player = /** @type {number} */ (state.current);
		const seat = /** @type {any} */ (state.seats[player - 1]);
		// The deal may have put Monuments in a hand.
		takeCard(
			[
				state.supply.tapestry.deck,
				state.supply.tapestry.discard,
				...state.seats.map((s) => /** @type {any} */ (s).hand ?? []),
			],
			'monuments'
		);
		seat.incomeMat.tapestry[0].push('monuments');
		const { tech } = state.supply;
		takeCard([tech.deck, tech.faceUp, tech.discard], 'astrolabe');
		seat.tech.bottom.push('astrolabe');
		push(state, state.pending, [
			{
				player,
				kind: 'effects',
				effects: [{ building: 'farm' }, { landmark: 'forge' }],
			},
		]);
		run(state, random);
		return state;
	},
});

/**
 * The game a named scenario makes of a started one.
 * @param {{ scenarios?: boolean }} config - The server's settings: scenarios run only when `scenarios` is true
 * @param {string} name
 * @param {State} game
 * @param {Random} random
 * @returns {State}
 * @throws {PlayerError} When scenarios are off, the name is unknown, or the table can't have it
 */
export function withScenario(config, name, game, random) {
	if (config.scenarios !== true) {
		throw new PlayerError('Scenarios are off on this server.');
	}
	if (typeof name !== 'string' || !Object.hasOwn(SCENARIOS, name)) {
		throw new PlayerError('There is no such scenario.');
	}
	return SCENARIOS[name](game, random);
}
