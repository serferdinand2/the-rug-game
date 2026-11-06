// Cloud City's moves (03 §2 Cloud City; R121): at the start of income turns 2–5, up to 2 income buildings move, one at a time, each from a cloud that isn't complete to a plot in another cloud.
import { emit } from '../events.js';
import { PlayerError } from '../errors.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import {
	buildingSpots,
	cityPlots,
	completeDistricts,
	seatShape,
} from '../city.js';
import { buildsOverImpassable, payDistricts } from '../placing.js';
import { plotIndex } from '../../capital.js';

/** @typedef {import('../state.js').State} State */
/** @typedef {{ row: number, col: number }} Plot */

/**
 * The district a plot belongs to, or -1 for none.
 * @param {import('../../capital.js').Shape} shape
 * @param {Plot} plot
 * @returns {number}
 */
function districtOf(shape, { row, col }) {
	const index = plotIndex(row, col, shape);
	return shape.districts.findIndex((d) => d.includes(index));
}

/**
 * Where a building on a plot may move: any plot the player could put an income building on now (the Riverfolk's and
 * Terraforming's impassable plots included), in another district (#36 design §3.5).
 * @param {State} state
 * @param {number} player
 * @param {Plot} from
 * @returns {Plot[]}
 */
function destinations(state, player, from) {
	const seat = playerSeat(state, player);
	const shape = seatShape(seat);
	const home = districtOf(shape, from);
	return buildingSpots(seat, buildsOverImpassable(state, player)).filter(
		(plot) => districtOf(shape, plot) !== home
	);
}

/**
 * The income buildings that may move now: each in a district that isn't complete, with somewhere to go.
 * @param {State} state
 * @param {number} player
 * @returns {Plot[]} In reading order
 */
function movable(state, player) {
	const seat = playerSeat(state, player);
	const shape = seatShape(seat);
	const complete = completeDistricts(cityPlots(seat), shape);
	return seat.capital.buildings
		.filter((b) => !complete.includes(districtOf(shape, b)))
		.filter((b) => destinations(state, player, b).length > 0)
		.map(({ row, col }) => ({ row, col }))
		.sort((a, b) => a.row - b.row || a.col - b.col);
}

/**
 * The next move to ask for, while some are left and one is possible.
 * @param {State} state
 * @param {number} player
 * @param {number} left - Moves still allowed
 * @returns {import('../state.js').NewOperation[]}
 */
function nextMove(state, player, left) {
	return left > 0 && movable(state, player).length > 0
		? [{ player, kind: 'chooseCloudMove', left }]
		: [];
}

/**
 * Asks a player for their first move, if any can be made.
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} left - Moves allowed this income turn
 */
export function askCloudMove(ctx, player, left) {
	ctx.push(nextMove(ctx.state, player, left));
}

/**
 * Whether an answer names one of the plots given.
 * @param {Plot[]} plots
 * @param {Record<string, any>} answer
 * @returns {boolean}
 */
function among(plots, answer) {
	return plots.some((p) => p.row === answer.row && p.col === answer.col);
}

/** @type {import('../state.js').DecisionKind} */
export const chooseCloudMove = {
	hidden: [],
	answers(state, decision) {
		return [
			{ stop: true },
			...movable(state, /** @type {number} */ (decision.player)),
		];
	},
	check(state, decision, answer) {
		if (answer.stop === true) {
			return;
		}
		if (
			!among(
				movable(state, /** @type {number} */ (decision.player)),
				answer
			)
		) {
			throw new PlayerError(
				'Choose an income building in a cloud that is not complete, or stop.'
			);
		}
	},
	resolve(ctx, decision, answer) {
		if (answer.stop === true) {
			return;
		}
		// The building is named, so the Capital tab can preview it where it may go (#36).
		const seat = playerSeat(
			ctx.state,
			/** @type {number} */ (decision.player)
		);
		const moving = seat.capital.buildings.find(
			(b) => b.row === answer.row && b.col === answer.col
		);
		ctx.push([
			{
				player: decision.player,
				kind: 'chooseCloudPlot',
				from: { row: answer.row, col: answer.col },
				building: moving?.building,
				left: decision.left,
			},
		]);
	},
};

/** @type {import('../state.js').DecisionKind} */
export const chooseCloudPlot = {
	hidden: [],
	answers(state, decision) {
		return destinations(
			state,
			/** @type {number} */ (decision.player),
			decision.from
		);
	},
	check(state, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		if (!among(destinations(state, player, decision.from), answer)) {
			throw new PlayerError('Choose an open plot in another cloud.');
		}
	},
	// A move is neither gaining nor placing a building, so no piecePlaced trigger fires; a cloud it fills pays its
	// reward, then the counts may have changed (#36 design §3.5).
	resolve(ctx, decision, answer) {
		const player = /** @type {number} */ (decision.player);
		const seat = playerSeat(ctx.state, player);
		const before = completeDistricts(cityPlots(seat), seatShape(seat));
		const building = seat.capital.buildings.find(
			(b) => b.row === decision.from.row && b.col === decision.from.col
		);
		if (!building) {
			throw new Error('There is no building on the plot to move.');
		}
		building.row = answer.row;
		building.col = answer.col;
		emit(ctx.state, {
			type: 'buildingMoved',
			player,
			building: building.building,
			from: { ...decision.from },
			to: { row: answer.row, col: answer.col },
		});
		ctx.push([
			...payDistricts(ctx, player, before),
			...triggered(ctx.state, 'countsChanged', { player }),
			...nextMove(ctx.state, player, decision.left - 1),
		]);
	},
};
