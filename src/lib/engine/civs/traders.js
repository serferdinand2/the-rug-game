// The Traders (02 §1.2): a token on a territory each income turn, for VP beside opponents or a territory's benefit, and the die an opponent leaves when conquering it.
import { playerSeat } from '../state.js';
import { controlledTerritories, itemCount } from '../control.js';
import { askSlot } from '../decisions/choose-slot.js';
import { MAPS, hexNeighbours } from '../data/maps.js';
import { offer, placeToken } from './civ.js';

/**
 * The Traders' own state.
 * @typedef {Object} TradersData
 * @property {number} tokens - The tokens still on the mat
 */

/**
 * The other player seats. abilities.js's opponents() would bring in the civilization cycle; like it, this counts only
 * player seats until #31 adds the bots.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number[]}
 */
function rivals(state, player) {
	return state.seats
		.filter((s) => s.kind === 'player' && s.seat !== player)
		.map((s) => s.seat);
}

/**
 * The hexes a token may go on, in map order: any explored territory with no item, or whose one item is an opponent's
 * upright outpost (a Nomads piece is no outpost, #20 design §8).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
function tradersHexes(state, player) {
	const others = rivals(state, player);
	return MAPS[state.map].hexes.filter((hex) => {
		const { tile, outposts } = state.hexes[hex];
		const items = itemCount(state, hex);
		if (tile === null || items > 1) {
			return false;
		}
		const [only] = outposts;
		return (
			items === 0 ||
			(only !== undefined &&
				!only.toppled &&
				!only.piece &&
				others.includes(only.seat))
		);
	});
}

/**
 * Puts a Traders token on the hex picked (`slot`). On an empty territory it scores 1 VP for each neighbouring territory
 * an opponent controls; on an opponent's lone outpost it gives the territory tile's benefit.
 * @type {import('../state.js').AutomaticKind}
 */
export function tradersToken(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.slot);
	const empty = itemCount(state, hex) === 0;
	placeToken(ctx, player, { hex, civ: 'traders' });
	if (!empty) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ tileBenefit: {} }],
				source: { hex },
			},
		]);
		return;
	}
	// The token gives no control (R33), so counting after placing it is the same as before.
	const theirs = new Set(
		rivals(state, player).flatMap((seat) =>
			controlledTerritories(state, seat)
		)
	);
	const vp = hexNeighbours(hex).filter((other) => theirs.has(other)).length;
	if (vp > 0) {
		ctx.push([{ player, kind: 'effects', effects: [{ vp }] }]);
	}
}

/** @type {import('./civ.js').Civ} */
export const traders = {
	id: 'traders',
	incomeTurns: [2, 3, 4, 5],
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData.traders =
			/** @type {TradersData} */ ({ tokens: 4 });
	},
	// You may place a token while one is left.
	income(ctx, player) {
		const { state } = ctx;
		/** @type {TradersData} */
		const data = playerSeat(state, player).civData.traders;
		if (data.tokens === 0) {
			return;
		}
		askSlot(ctx, player, {
			options: tradersHexes(state, player),
			optional: true,
			purpose: 'traders',
			then: { kind: 'tradersToken' },
		});
	},
	hooks: {
		// An opponent conquered a territory holding the owner's token and kept one die: the owner may gain the other, as if
		// they had rolled it on that territory. A finished owner gets only its VP.
		dieKept(state, owner, { player, hex, other }) {
			const token = state.hexes[hex].tokens.some(
				(t) => t.seat === owner && t.civ === 'traders'
			);
			if (player === owner || !token) {
				return [];
			}
			return [{ ...offer(state, owner, [other]), source: { hex } }];
		},
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ gain: { any: 2 } }, { vp: 10 }],
				},
			]);
		},
	},
};
