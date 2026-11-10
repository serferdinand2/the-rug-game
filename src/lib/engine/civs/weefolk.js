// The Weefolk (F&F, #40; 03 FF.3, DQ 21–24): tokens living unnoticed in opponents' capitals, scored by their lines.
import { emit } from '../events.js';
import { playerSeat, seatOf } from '../state.js';
import { offer } from './civ.js';
import { buildingSpots, landmarkCells } from '../city.js';

/**
 * The opponents a Weefolk token may go to: the active ones, or the finished ones when none is active (DQ 23, R148; Jamey:
 * "if there is an active opponent, you should give the token to them").
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number[]}
 */
function hosts(state, player) {
	const others = state.seats.filter(
		(s) => s.kind === 'player' && s.seat !== player
	);
	const active = others.filter((s) => !s.finished);
	return (active.length > 0 ? active : others).map((s) => s.seat);
}

/**
 * Gives a Weefolk token: the Weefolk pick the opponent, who picks the plot.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 */
function give(ctx, player) {
	const options = hosts(ctx.state, player);
	if (options.length === 0) {
		return;
	}
	if (options.length === 1) {
		askPlot(ctx, options[0], player);
		return;
	}
	ctx.push([{ player, kind: 'chooseHost', options }]);
}

/**
 * Asks the opponent where the Weefolk token goes in their capital: an open plot, or with none, a plot whose income
 * building it replaces, set aside (DQ 22). Placing it is no building (DQ 24).
 * @param {import('../state.js').Context} ctx
 * @param {number} host
 * @param {number} weefolk
 */
export function askPlot(ctx, host, weefolk) {
	const seat = playerSeat(ctx.state, host);
	if (seat.capital.mat === null) {
		return;
	}
	const open = buildingSpots(seat).map(({ row, col }) => ({ row, col }));
	const options =
		open.length > 0
			? open
			: seat.capital.buildings.map(({ row, col }) => ({
					row,
					col,
					replace: true,
				}));
	if (options.length === 0) {
		emit(ctx.state, { type: 'noPlot', player: host });
		return;
	}
	ctx.push([
		{
			player: host,
			kind: 'choosePlot',
			purpose: 'weefolk',
			token: weefolk,
			options,
		},
	]);
}

/**
 * The Weefolk's VP on income turn 5: for each of their tokens in an opponent's capital, 1 VP per income building and
 * per landmark in its row and in its column; a landmark counts once per line its footprint touches (DQ 21).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number}
 */
export function weefolkVp(state, player) {
	let vp = 0;
	for (const other of state.seats) {
		if (other.kind !== 'player' || other.seat === player) {
			continue;
		}
		const { capital } = playerSeat(state, other.seat);
		for (const token of (capital.tokens ?? []).filter(
			(t) => t.seat === player
		)) {
			for (const line of /** @type {const} */ (['row', 'col'])) {
				vp += capital.buildings.filter(
					(b) => b[line] === token[line]
				).length;
				vp += capital.landmarks.filter((piece) =>
					landmarkCells(piece).some(
						(cell) => cell[line] === token[line]
					)
				).length;
			}
		}
	}
	return vp;
}

/** @type {import('./civ.js').Civ} */
export const weefolk = {
	id: 'weefolk',
	solo: false,
	incomeTurns: [2, 3, 4, 5],
	// Gained mid-game, a token is given at once (03 FF.3).
	setup(ctx, player, midGame) {
		playerSeat(ctx.state, player).civData.weefolk = {};
		if (midGame) {
			give(ctx, player);
		}
	},
	income(ctx, player, turn) {
		ctx.push([
			{ player, kind: 'weefolkGive' },
			...(turn === 5
				? [{ player, kind: 'weefolkScore' }]
				: [
						offer(
							ctx.state,
							player,
							[
								{
									trade: {
										offers: [
											{
												pay: { territory: 1 },
												gain: [{ anyBuilding: {} }],
											},
										],
										optional: true,
									},
								},
							],
							'civOffer',
							{ civ: 'weefolk' }
						),
					]),
		]);
	},
};

/**
 * The Weefolk give their token (at the start of an income turn).
 * @type {import('../state.js').AutomaticKind}
 */
export function weefolkGive(ctx, op) {
	give(ctx, /** @type {number} */ (op.player));
}

/**
 * The Weefolk's scoring on income turn 5, after the turn's token is placed.
 * @type {import('../state.js').AutomaticKind}
 */
export function weefolkScore(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const vp = weefolkVp(ctx.state, player);
	emit(ctx.state, { type: 'weefolkScored', player, vp });
	if (vp > 0 && !seatOf(ctx.state, player).finished) {
		ctx.push([
			{ player, kind: 'effects', effects: [{ vp }], origin: 'civ' },
		]);
	}
}
