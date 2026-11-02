// The Infiltrators (03 §1.3, §1.8): 1 culture when they come in; on income turns 2-5 an outpost beside an opponent's lone outpost, sharing its control, or a player token on an opponent's capital-city territory for VP, the third there gaining a civilization; while held, a civilization gained is drawn 3 to keep 1.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { opponents, triggered } from '../abilities.js';
import { askHex } from '../decisions/choose-hex.js';
import { takeOutpost } from '../outposts.js';
import { MAPS } from '../data/maps.js';

/** The civilization's id, which names their player tokens on the map. */
const ID = 'infiltrators';

/** The culture they gain when they come in (03 §1.3). */
export const INFILTRATORS_CULTURE = 1;

/** How many civilizations a player holding them draws when gaining one, keeping 1 (03 §1.3); civ-turns.js reads it. */
export const INFILTRATORS_DRAW = 3;

/** Their token on one opponent's capital-city territory that gains a civilization: the third there (03 §1.3, §1.8). */
export const INFILTRATORS_CIV_TOKEN = 3;

/**
 * The opponent whose lone outpost a territory holds, when it holds nothing else: an upright outpost, never a Nomads
 * piece (#20 design §8). Null for any other territory.
 * @param {import('../state.js').State} state
 * @param {string} hex
 * @param {number} player
 * @returns {number | null}
 */
function shareable(state, hex, player) {
	const { outposts, tokens } = state.hexes[hex];
	const [only] = outposts;
	if (outposts.length !== 1 || tokens.length > 0) {
		return null;
	}
	return !only.toppled && !only.piece && only.seat !== player
		? only.seat
		: null;
}

/**
 * The opponent whose capital-city territory a hex is, where their two outposts started (#33's `seat.start`); null for
 * any other hex.
 * @param {import('../state.js').State} state
 * @param {string} hex
 * @param {number} player
 * @returns {number | null}
 */
function capitalOf(state, hex, player) {
	return (
		opponents(state, player).find(
			(other) => playerSeat(state, other).start === hex
		) ?? null
	);
}

/**
 * The hexes they may pick, in map order: (A) each territory to share, with an outpost left in their supply, and (B)
 * each opponent's capital-city territory. A start hex always holds its seat's 2 outposts, so no hex is both.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
function infiltratorsHexes(state, player) {
	const outposts = playerSeat(state, player).outposts > 0;
	return MAPS[state.map].hexes.filter(
		(hex) =>
			capitalOf(state, hex, player) !== null ||
			(outposts && shareable(state, hex, player) !== null)
	);
}

/**
 * The hex is picked: a player token on an opponent's capital-city territory (B), or an outpost to share a territory (A).
 * @type {import('../state.js').AutomaticKind}
 */
export function infiltrate(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.hex);
	const capital = capitalOf(ctx.state, hex, player);
	if (capital !== null) {
		infiltrateCapital(ctx, player, hex, capital);
		return;
	}
	share(ctx, player, hex);
}

/**
 * Option A: an outpost from their supply stands beside the opponent's, and the territory is `shared`, so each seat with
 * an upright outpost there controls it (control.js). It is no conquest: nothing topples, no dice, no response and no
 * middle island. Its tile's benefit follows (nothing on a printed territory, R8), then the `countsChanged` triggers, as
 * control changed (#20 design §7, Mystics); the `outpostTaken` triggers wait below them, as below a conquest.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} hex
 */
function share(ctx, player, hex) {
	const { state } = ctx;
	const opponent = /** @type {number} */ (shareable(state, hex, player));
	takeOutpost(ctx, player);
	state.hexes[hex].outposts.push({ seat: player, toppled: false });
	state.hexes[hex].shared = true;
	emit(state, { type: 'outpostPlaced', player, hex, sharedWith: opponent });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ tileBenefit: {} }],
			source: { hex },
		},
		...triggered(state, 'countsChanged', { player }),
	]);
}

/**
 * Option B: a player token, not from a limited reserve, on the opponent's capital-city territory; it is an item there,
 * but gives no control (R33). 1 VP for each outpost still in that opponent's supply, then a civilization when it is
 * their third token on that same territory (03 §1.8).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {string} hex
 * @param {number} capital - The opponent whose territory it is
 */
function infiltrateCapital(ctx, player, hex, capital) {
	const { state } = ctx;
	const { tokens } = state.hexes[hex];
	tokens.push({ seat: player, civ: ID });
	emit(state, { type: 'tokenPlaced', player, civ: ID, hex, capital });
	const vp = seatOf(state, capital).outposts;
	const mine = tokens.filter((t) => t.seat === player && t.civ === ID);
	/** @type {import('../data/effects.js').Effect[]} */
	const effects = [
		...(vp > 0 ? [{ vp }] : []),
		...(mine.length === INFILTRATORS_CIV_TOKEN ? [{ gainCiv: {} }] : []),
	];
	if (effects.length > 0) {
		ctx.push([{ player, kind: 'effects', effects }]);
	}
}

/** @type {import('./civ.js').Civ} */
export const infiltrators = {
	id: ID,
	incomeTurns: [2, 3, 4, 5],
	// At setup or when gained mid-game (R113), except that the current rules give the civilization chosen at setup none
	// (F&F p.32, R34): that adjustment withholds the gain rather than taking it back, so it lives here.
	setup(ctx, player, midGame) {
		if (!midGame && ctx.state.version === 'current') {
			return;
		}
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { culture: INFILTRATORS_CULTURE } }],
			},
		]);
	},
	// They may pick a territory to share or an opponent's capital-city territory.
	income(ctx, player) {
		askHex(
			ctx,
			player,
			infiltratorsHexes(ctx.state, player),
			true,
			'infiltrators',
			{ kind: 'infiltrate' }
		);
	},
};
