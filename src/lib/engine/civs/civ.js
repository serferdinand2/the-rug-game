// What every civilization module shares: the Civ shape and the offer of an optional gain (design §4). It imports no civilization, so they can import it.
import { seatOf } from '../state.js';

/** @typedef {import('../state.js').Context} Context */

/**
 * A civilization's rules. Each module in this folder exports one, and keeps its own state in `seat.civData[id]`.
 * @typedef {Object} Civ
 * @property {string} id - The catalog id, such as 'the-chosen'
 * @property {(ctx: Context, player: number, midGame: boolean) => void} [setup] - Tokens and starting choices; `midGame` for a gain after setup
 * @property {number[]} [incomeTurns] - The income turns its ability fires on, usually [2, 3, 4, 5]
 * @property {(ctx: Context, player: number, turn: number) => void} [income] - The ability in step 1
 * @property {Record<string, import('../eras.js').Hook>} [hooks] - #19's trigger handlers; every operation they return is passive
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
