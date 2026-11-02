// The Tinkerers (03 §1.3, R48): a tech card for each opponent when the game starts with them, and on income turns 2-5 a token on one of four options, each once, that bends one of their tracks.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { advanceBlocked, opponents } from '../abilities.js';
import { askSlot } from '../decisions/choose-slot.js';
import { LAST_SPACE, moveToken } from '../movement.js';
import { TRACKS, advanceCost } from '../data/tracks.js';
import { TRACK_IDS } from '../data/ids.js';

/** @typedef {import('../data/ids.js').TrackId} TrackId */

/**
 * One option, as the card numbers it: 1 pay back, 2 catch up, 3 step back, 4 jump ahead (03 §1.3).
 * @typedef {1 | 2 | 3 | 4} TinkerersOption
 */

/**
 * The Tinkerers' own state.
 * @typedef {Object} TinkerersData
 * @property {TinkerersOption[]} used - The options a token covers, in the order used; each is used once a game
 */

/**
 * A token an option acts on: its track and space, and the space it moves to (every option but pay back).
 * @typedef {{ track: TrackId, from: number, to?: number }} Target
 */

/**
 * The options in the card's order.
 * @type {readonly TinkerersOption[]}
 */
export const TINKERERS_OPTIONS = Object.freeze(
	/** @type {TinkerersOption[]} */ ([1, 2, 3, 4])
);

/** The spaces step back (option 3) goes back. */
export const TINKERERS_STEP_BACK = 3;

/**
 * How each moving option moves (03 §1.3): catch up gains the benefit, not the bonus; step back the benefit, and the
 * bonus may be paid; jump ahead neither benefit nor landmark (R9's exception), nor an advance, but the bonus free.
 * @type {Readonly<Record<number, { benefit: boolean, noBonus?: boolean, freeBonus?: boolean, jump?: boolean }>>}
 */
const MOVES = Object.freeze({
	2: { benefit: true, noBonus: true },
	3: { benefit: true },
	4: { benefit: false, freeBonus: true, jump: true },
});

/**
 * The Tinkerers' state of a player.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {TinkerersData}
 */
function dataOf(state, player) {
	return playerSeat(state, player).civData.tinkerers;
}

/**
 * The first space after `from` whose bonus a token could take, or null with none left on the track.
 * @param {TrackId} track
 * @param {number} from
 * @returns {number | null}
 */
function nextBonus(track, from) {
	for (let space = from + 1; space <= LAST_SPACE; space++) {
		if (TRACKS[track][space].bonus) {
			return space;
		}
	}
	return null;
}

/**
 * Where a moving option takes a token, or null when it can't: to the closest opponent token ahead (catch up), exactly
 * 3 spaces back (step back), or to the next space with a bonus (jump ahead).
 * @param {TinkerersOption} option - 2, 3 or 4
 * @param {TrackId} track
 * @param {number} from
 * @param {number[]} theirs - The opponents' tokens on the track
 * @returns {number | null}
 */
function destination(option, track, from, theirs) {
	if (option === 2) {
		const ahead = theirs.filter((space) => space > from);
		return ahead.length > 0 ? Math.min(...ahead) : null;
	}
	if (option === 3) {
		return from >= TINKERERS_STEP_BACK ? from - TINKERERS_STEP_BACK : null;
	}
	return nextBonus(track, from);
}

/**
 * What an option can act on now, in track order and then from the lowest token: pay back each of the player's tokens
 * past the start, the moving options each token they can move. Catch up and jump ahead leave out a track the player
 * may not advance on (design §5).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {TinkerersOption} option
 * @returns {Target[]}
 */
function targets(state, player, option) {
	const seat = seatOf(state, player);
	const rivals = opponents(state, player).map((other) =>
		seatOf(state, other)
	);
	const forward = option === 2 || option === 4;
	return TRACK_IDS.flatMap((track) => {
		if (forward && advanceBlocked(state, player, track)) {
			return [];
		}
		const froms = [...new Set(seat.tracks[track])].sort((a, b) => a - b);
		if (option === 1) {
			return froms
				.filter((from) => from > 0)
				.map((from) => ({ track, from }));
		}
		const theirs = rivals.flatMap((rival) => rival.tracks[track]);
		return froms.flatMap((from) => {
			const to = destination(option, track, from, theirs);
			return to === null ? [] : [{ track, from, to }];
		});
	});
}

/**
 * Covers the option picked (`slot`) with a token, then acts on it: pay back asks which token's space pays; a move
 * offers its tokens, a lone one moved without asking (as Socialism's).
 * @type {import('../state.js').AutomaticKind}
 */
export function tinkerersOption(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {TinkerersOption} */
	const option = op.slot;
	dataOf(state, player).used.push(option);
	emit(state, { type: 'tinkerersUsed', player, option });
	const tokens = targets(state, player, option);
	if (option === 1) {
		askSlot(ctx, player, {
			options: tokens.map(({ track, from }) => ({ track, space: from })),
			purpose: 'tinkerersPayBack',
			then: { kind: 'tinkerersPayBack' },
		});
		return;
	}
	const move = MOVES[option];
	if (tokens.length === 1) {
		const [{ track, from, to }] = tokens;
		moveToken(ctx, player, {
			track,
			from,
			to: /** @type {number} */ (to),
			...move,
		});
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseMove',
			direction: 'jump',
			options: tokens,
			optional: false,
			purpose: 'tinkerers',
			option,
			...move,
		},
	]);
}

/**
 * Pay back on the token picked (`slot`, `{ track, space }`): the resources advancing into its space cost, the
 * resources of the player's choice chosen as any gain's.
 * @type {import('../state.js').AutomaticKind}
 */
export function tinkerersPayBack(ctx, op) {
	/** @type {{ track: TrackId, space: number }} */
	const { track, space } = op.slot;
	ctx.push([
		{
			player: op.player,
			kind: 'effects',
			effects: [
				{
					gain: /** @type {import('../data/effects.js').Gain} */ (
						advanceCost(track, space)
					),
				},
			],
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const tinkerers = {
	id: 'tinkerers',
	incomeTurns: [2, 3, 4, 5],
	// Only when the game starts with them (R113's exception), each opponent invents the top card of the tech deck. Income
	// turn 1 has no upgrade step, so "they may not upgrade during their first income turn" needs nothing.
	setup(ctx, player, midGame) {
		playerSeat(ctx.state, player).civData.tinkerers =
			/** @type {TinkerersData} */ ({ used: [] });
		if (midGame) {
			return;
		}
		ctx.push(
			opponents(ctx.state, player).map((other) => ({
				player: other,
				kind: 'effects',
				effects: [{ invent: { deckOnly: true } }],
			}))
		);
	},
	// You may put a token on an option not yet used, among those with something to act on.
	income(ctx, player) {
		const { state } = ctx;
		const { used } = dataOf(state, player);
		askSlot(ctx, player, {
			options: TINKERERS_OPTIONS.filter(
				(option) =>
					!used.includes(option) &&
					targets(state, player, option).length > 0
			),
			optional: true,
			purpose: 'tinkerers',
			then: { kind: 'tinkerersOption' },
		});
	},
	// The current rules replace the printed gain: each opponent gains a tapestry card and the tech card (R48).
	adjustment: {
		setup(ctx, player) {
			ctx.push(
				opponents(ctx.state, player).map((other) => ({
					player: other,
					kind: 'effects',
					effects: [{ gain: { tapestry: 1 } }],
				}))
			);
		},
	},
};
