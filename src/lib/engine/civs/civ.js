// What every civilization module shares: the Civ shape, the offer of an optional gain (design §4), tokens on the map (§8) and a civilization's discard. It imports no civilization, so they can import it.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';

/** @typedef {import('../state.js').Context} Context */

/**
 * Whether a player could pay for some advance holding these resources instead of their own; the turn choice gives it
 * to `opensAdvance`, and the `advanceTurnStarted` triggers in their payload (#33).
 * @typedef {(resources: Record<import('../data/ids.js').ResourceId, number>) => boolean} Affordable
 */

/**
 * A civilization's rules. Each module in this folder exports one, and keeps its own state in `seat.civData[id]`.
 * @typedef {Object} Civ
 * @property {string} id - The catalog id, such as 'the-chosen'
 * @property {(ctx: Context, player: number, midGame: boolean) => void} [setup] - Tokens and starting choices; `midGame` for a gain after setup
 * @property {boolean} [solo] - False for the civilizations the solo opponents cannot play: Advisors and Spies (#31 reads it)
 * @property {number[]} [incomeTurns] - The income turns its ability fires on, usually [2, 3, 4, 5]
 * @property {(ctx: Context, player: number, turn: number) => void} [income] - The ability in step 1
 * @property {Record<string, import('../eras.js').Hook>} [hooks] - #19's trigger handlers; every operation they return is passive
 * @property {(state: import('../state.js').State, player: number, affordable: Affordable) => boolean} [opensAdvance] -
 *   Whether what its `advanceTurnStarted` hook offers would make an advance affordable for a player who can't afford
 *   one now, so the turn choice offers an advance turn (the Utilitarians' Lighthouse, #33)
 * @property {(ctx: Context, player: number) => void} [firstTurnEnd] - At the end of income turn 1
 * @property {{ setup?: (ctx: Context, player: number) => void, firstTurnEnd?: (ctx: Context, player: number) => void }} [adjustment] - Current version only, the setup civilization only (R34)
 */

/**
 * An optional gain ("you may") for a civilization's owner: a choice with the decline first while they play.
 * A finished owner is asked nothing; the gain becomes a passive operation, of which only the VP runs (01 §4.3).
 * @param {import('../state.js').State} state
 * @param {number} owner
 * @param {import('../data/effects.js').Effect[]} effects
 * @returns {import('../state.js').NewOperation}
 */
export function offer(state, owner, effects) {
	if (seatOf(state, owner).finished) {
		return {
			player: owner,
			kind: 'effects',
			effects: structuredClone(effects),
			passive: true,
		};
	}
	return {
		player: owner,
		kind: 'chooseOption',
		options: [[], structuredClone(effects)],
		purpose: 'civOffer',
	};
}

/**
 * The placeToken effect, which the Traders' placement shares: one of a civilization's tokens leaves its mat
 * (`civData[civ].tokens`) for a hex. It is an item there, so a second item stops conquests, but it gives no control
 * (R33, #20 design §8).
 * @param {Context} ctx
 * @param {number} player
 * @param {{ hex: string, civ: string }} value
 * @throws {Error} With no token left: every caller checks first, so that is a bug, not a player's mistake
 */
export function placeToken(ctx, player, { hex, civ }) {
	const { state } = ctx;
	const data = playerSeat(state, player).civData[civ];
	if (!(data?.tokens > 0)) {
		throw new Error(`Seat ${player} has no ${civ} token left.`);
	}
	data.tokens -= 1;
	state.hexes[hex].tokens.push({ seat: player, civ });
	emit(state, { type: 'tokenPlaced', player, civ, hex });
}

/**
 * The discardCiv effect, which the Mystics' own discard shares: a civilization the player holds goes face up onto the
 * civilization discards, the one gained last when they hold it twice.
 * @param {Context} ctx
 * @param {number} player
 * @param {{ civ: string }} value
 * @throws {Error} For a civilization the player doesn't hold: a bug, not a player's mistake
 */
export function discardCiv(ctx, player, { civ }) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	const at = seat.civs.lastIndexOf(civ);
	if (at === -1) {
		throw new Error(`Seat ${player} holds no ${civ} to discard.`);
	}
	seat.civs.splice(at, 1);
	state.supply.civDiscard.push(civ);
	emit(state, { type: 'civDiscarded', player, civ });
}
