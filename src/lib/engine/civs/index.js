// The civilization registry: every base civilization by id, the ones a player holds, and the offer of an optional gain (design §4).
import { isPlayerSeat, playerSeat, seatOf } from '../state.js';
import { alchemists } from './alchemists.js';
import { architects } from './architects.js';
import { craftsmen } from './craftsmen.js';
import { entertainers } from './entertainers.js';
import { futurists } from './futurists.js';
import { heralds } from './heralds.js';
import { historians } from './historians.js';
import { inventors } from './inventors.js';
import { isolationists } from './isolationists.js';
import { leaders } from './leaders.js';
import { merrymakers } from './merrymakers.js';
import { militants } from './militants.js';
import { mystics } from './mystics.js';
import { nomads } from './nomads.js';
import { theChosen } from './the-chosen.js';
import { traders } from './traders.js';

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
 * Every base civilization, by catalog id.
 * @type {Record<string, Civ>}
 */
export const CIVS = {
	alchemists,
	architects,
	craftsmen,
	entertainers,
	futurists,
	heralds,
	historians,
	inventors,
	isolationists,
	leaders,
	merrymakers,
	militants,
	mystics,
	nomads,
	'the-chosen': theChosen,
	traders,
};

/**
 * The rules of one civilization.
 * @param {string} id
 * @returns {Civ}
 * @throws {Error} For an id with no civilization (a bug, not a player's mistake)
 */
export function findCiv(id) {
	if (!Object.hasOwn(CIVS, id)) {
		throw new Error(`There is no civilization ${id}.`);
	}
	return CIVS[id];
}

/**
 * The civilizations a player holds, the one chosen at setup first and those gained later after it.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {Civ[]} Empty for a seat that isn't a player
 */
export function civsOf(state, player) {
	if (!isPlayerSeat(state, player)) {
		return [];
	}
	return playerSeat(state, player).civs.map(findCiv);
}

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
