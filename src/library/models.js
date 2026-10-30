// The library's review games (#131): games dealt with a fixed seed and played to a decision, so the sections show the engine's own models.
import {
	DECISIONS,
	askedSeats,
	createGame,
	defaultAction,
	openDecisions,
	play,
	view,
} from '../lib/engine/game.js';
import { seededRandom } from '../lib/engine/random.js';
import { advanceOptions, myDecision } from '../lib/turn.js';

/** @typedef {import('../lib/prompt-state.svelte.js').PromptSource} PromptSource */
/** @typedef {import('../lib/engine/random.js').Random} Random */
/** @typedef {import('../lib/engine/data/ids.js').TrackId} TrackId */

/** The play-page mockup's players, by seat. */
const NAMES = ['You', 'Ana', 'Marko', 'Vera'];

/** Every review game is dealt from this seed. */
const SEED = 1;

/** No resources: a seat's holdings start from it. */
const NONE = Object.freeze({ coin: 0, food: 0, worker: 0, culture: 0 });

/**
 * A four-player game dealt with the fixed seed, its setup answered with the default picks.
 * @returns {{ state: any, random: Random }}
 */
function dealt() {
	const random = seededRandom(SEED);
	let state = createGame({
		players: NAMES.map((name) => ({ name })),
		version: 'current',
		random,
	});
	while (state.phase === 'setup') {
		const seat = askedSeats(state)[0];
		const action = /** @type {{ decision: number }} */ (
			defaultAction(state, seat)
		);
		state = play(state, seat, action, random);
	}
	return { state, random };
}

/**
 * Plays on until `seat` is asked a decision of `kind`, answering each other decision with the first answer `prefer`
 * accepts for its kind, or its first.
 * @param {any} state
 * @param {Random} random
 * @param {number} seat
 * @param {string} kind
 * @param {Record<string, (answer: any) => boolean>} [prefer]
 * @returns {any} The state with the decision open
 */
function playUntil(state, random, seat, kind, prefer = {}) {
	for (let step = 0; step < 50; step++) {
		if (
			openDecisions(state).some(
				(op) => op.player === seat && op.kind === kind
			)
		) {
			return state;
		}
		const [open] = openDecisions(state);
		if (!open) {
			break;
		}
		const answers = DECISIONS[open.kind].answers(state, open);
		const wanted = prefer[open.kind];
		const answer = (wanted && answers.find(wanted)) ?? answers[0];
		state = play(
			state,
			/** @type {number} */ (open.player),
			{ decision: open.id, ...answer },
			random
		);
	}
	throw new Error(`Seat ${seat} was never asked ${kind}.`);
}

/**
 * A prompt state's source for the seat's open decision, or its advance, in a view of the state. Nothing is sent.
 * @param {any} state
 * @param {number} seat
 * @param {{ decision?: boolean, advance?: TrackId }} want
 * @returns {PromptSource}
 */
function sourceOf(state, seat, want) {
	const game = view(state, seat);
	return {
		game,
		seat,
		decision: want.decision ? myDecision(game, seat) : null,
		board: 'tracks',
		advance:
			advanceOptions(game, seat).find((o) => o.track === want.advance) ??
			null,
		held: { ...NONE, ...game.seats[seat - 1].resources },
		busy: false,
		move: async () => false,
	};
}

/**
 * Gives the player to move these holdings and track spaces: a review fixture, not a played game.
 * @param {any} state - Changed in place
 * @param {Record<string, number>} resources
 * @param {Partial<Record<TrackId, number>>} [tracks]
 */
function hold(state, resources, tracks = {}) {
	const seat = state.seats[state.current - 1];
	seat.resources = { ...NONE, ...resources };
	for (const [track, space] of Object.entries(tracks)) {
		seat.tracks[track] = [space];
	}
}

/** Where each of the mockup's players stands, by track, in seat order. */
const BOARD_POSITIONS = Object.freeze({
	exploration: [4, 2, 5, 1],
	science: [2, 1, 3, 6],
	technology: [5, 0, 2, 3],
	military: [1, 6, 0, 2],
});

/**
 * The board as seat 1 sees it: the dealt game, with the mockup's players moved to its spaces.
 * @returns {any}
 */
export function boardView() {
	const { state } = dealt();
	for (const [track, positions] of Object.entries(BOARD_POSITIONS)) {
		positions.forEach((space, index) => {
			state.seats[index].tracks[track] = [space];
		});
	}
	return view(state, 1);
}

/**
 * An advance to Tanks (tier III) with a choice of payment: its 1 culture and 2 resources of the player's choice,
 * holding 2 coins, 1 food and 3 culture.
 * @returns {PromptSource}
 */
export function tanksPayment() {
	const { state } = dealt();
	hold(state, { coin: 2, food: 1, culture: 3 }, { military: 6 });
	return sourceOf(state, state.current, { advance: 'military' });
}

/**
 * Space Shuttle's bonus, 3 territory tiles for 10 VP, asked after an advance there with 6 tiles in hand.
 * @returns {PromptSource}
 */
export function shuttleBonus() {
	const { state: dealtState, random } = dealt();
	const seat = dealtState.current;
	hold(dealtState, { food: 2 }, { exploration: 9 });
	dealtState.seats[seat - 1].territoryTiles = [6, 13, 19, 21, 25, 29];
	const state = playUntil(dealtState, random, seat, 'chooseBonus', {
		chooseTurn: (a) => a.turn === 'advance',
		chooseAdvance: (a) => a.track === 'exploration',
	});
	return sourceOf(state, seat, { decision: true });
}

/**
 * An income turn that has played Guilds, at its tapestry step.
 * @param {number} vp - The player's VP when the card is played
 * @param {Record<string, number>} resources - What the player holds then
 * @returns {{ state: any, random: Random, seat: number }} With the trade open
 */
function guilds(vp, resources) {
	const { state: dealtState, random } = dealt();
	const seat = dealtState.current;
	dealtState.seats[seat - 1].hand = ['guilds'];
	const asked = playUntil(dealtState, random, seat, 'chooseTapestry', {
		chooseTurn: (a) => a.turn === 'income',
	});
	asked.seats[seat - 1].vp = vp;
	hold(asked, resources);
	const state = playUntil(asked, random, seat, 'chooseTrade', {
		chooseTapestry: (a) => a.card === 'guilds',
	});
	return { state, random, seat };
}

/**
 * Guilds' six trades for a player with 12 VP, 2 food and 1 culture: the 15 VP trade is out of reach.
 * @returns {PromptSource}
 */
export function guildsTrade() {
	const { state, seat } = guilds(12, { food: 2, culture: 1 });
	return sourceOf(state, seat, { decision: true });
}

/**
 * The 3 resources Guilds' 15 VP trade gains, for a player holding 1 coin and 7 food: 2 more food go past the cap.
 * @returns {PromptSource}
 */
export function capWarning() {
	const { state: trading, random, seat } = guilds(15, { coin: 1, food: 7 });
	const state = playUntil(trading, random, seat, 'chooseResource', {
		chooseTrade: (a) => a.offer === 2,
	});
	return sourceOf(state, seat, { decision: true });
}
