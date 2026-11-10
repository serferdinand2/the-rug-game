// The Celestials (F&F, #40; 03 FF.3, R99): a floating capital token that drifts between territories for both dice.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { offer } from './civ.js';
import { askHex } from '../decisions/choose-hex.js';
import { BLACK_DIE, RED_DIE } from '../data/dice.js';
import { illuminatiTake } from './illuminati.js';
import { hexNeighbours } from '../data/maps.js';
import { landmarkCells, onGrid, seatShape } from '../city.js';

/** @typedef {{ hex: string | null }} CelestialsData - The territory the token floats over */

/**
 * The Celestials' token replaces one of the outposts on their start territory: their own, else the first standing
 * one, which goes back to its owner's supply (03 FF.3; DQ 6, R146 when there is a choice).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
function float(ctx, player) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	/** @type {CelestialsData} */
	const data = (seat.civData.celestials = { hex: null });
	const hex = seat.start === null ? undefined : state.hexes[seat.start];
	if (!hex) {
		return;
	}
	const own = hex.outposts.findIndex((o) => o.seat === player && !o.piece);
	const at =
		own !== -1
			? own
			: hex.outposts.findIndex((o) => !o.toppled && !o.piece);
	if (at !== -1) {
		const [outpost] = hex.outposts.splice(at, 1);
		playerSeat(state, outpost.seat).outposts += 1;
	}
	hex.tokens.push({ seat: player, civ: 'celestials' });
	data.hex = /** @type {string} */ (seat.start);
	emit(state, { type: 'celestialsLanded', player, hex: data.hex });
}

/**
 * The Celestials' VP on income turn 5: −2 per landmark hanging off the capital, +5 per landmark wholly in it (03
 * FF.3); none in City in a Bottle (R99).
 * @param {import('../state.js').PlayerSeat} seat
 * @returns {number}
 */
export function celestialsVp(seat) {
	if (seat.capital.mat === null) {
		return 0;
	}
	const shape = seatShape(seat);
	return seat.capital.landmarks.reduce(
		(sum, piece) =>
			sum +
			(landmarkCells(piece).every(({ row, col }) =>
				onGrid(row, col, shape)
			)
				? 5
				: -2),
		0
	);
}

/** @type {import('./civ.js').Civ} */
export const celestials = {
	id: 'celestials',
	incomeTurns: [2, 3, 4, 5],
	// At setup the token takes an outpost's place; gained mid-game, they may first be discarded to draw another.
	setup(ctx, player, midGame) {
		if (!midGame) {
			float(ctx, player);
			return;
		}
		ctx.push([
			{
				...offer(
					ctx.state,
					player,
					[{ discardCiv: { civ: 'celestials' } }, { gainCiv: {} }],
					'civOffer',
					{
						civ: 'celestials',
					}
				),
			},
			{ player, kind: 'celestialsFloat' },
		]);
	},
	income(ctx, player, turn) {
		const seat = playerSeat(ctx.state, player);
		if (turn === 5) {
			const vp = celestialsVp(seat);
			emit(ctx.state, { type: 'celestialsScored', player, vp });
			if (vp !== 0) {
				ctx.push([
					{
						player,
						kind: 'effects',
						effects: [{ vp }],
						origin: 'civ',
					},
				]);
			}
			return;
		}
		/** @type {CelestialsData | undefined} */
		const data = seat.civData.celestials;
		if (!data?.hex) {
			return;
		}
		const options = hexNeighbours(data.hex).filter(
			(key) =>
				ctx.state.hexes[key]?.tile !== null &&
				ctx.state.hexes[key] !== undefined
		);
		askHex(ctx, player, options, true, 'celestials', {
			kind: 'celestialsMove',
		});
	},
};

/**
 * Places the token after a mid-game gain the Celestials kept.
 * @type {import('../state.js').AutomaticKind}
 */
export function celestialsFloat(ctx, op) {
	const player = /** @type {number} */ (op.player);
	if (playerSeat(ctx.state, player).civs.includes('celestials')) {
		float(ctx, player);
	}
}

/**
 * Moves the Celestials' token onto the hex picked and gains both conquer dice; no control (03 FF.3; the black "?"
 * pays the territory moved into, DQ 5).
 * @type {import('../state.js').AutomaticKind}
 */
export function celestialsMove(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {CelestialsData} */
	const data = playerSeat(state, player).civData.celestials;
	if (data.hex) {
		const from = state.hexes[data.hex];
		const at = from.tokens.findIndex(
			(t) => t.seat === player && t.civ === 'celestials'
		);
		if (at !== -1) {
			from.tokens.splice(at, 1);
		}
	}
	state.hexes[op.hex].tokens.push({ seat: player, civ: 'celestials' });
	data.hex = op.hex;
	const red = ctx.random(6);
	const black = ctx.random(6);
	emit(state, { type: 'celestialsMoved', player, hex: op.hex, red, black });
	// The Illuminati: the conquer dice rolled pay them first (#40, DQ 13, R149), so they are pushed last.
	const paid = illuminatiTake(ctx, player, { red, black, hex: op.hex });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				structuredClone(BLACK_DIE[black]),
				structuredClone(RED_DIE[red]),
			],
			ordered: true,
			source: { hex: op.hex },
			origin: 'civ',
		},
	]);
	ctx.push(paid);
}
