// What Fantasies & Futures' mats pay outside their districts (03 FF.6, #40): the Savanna's income and the Quagmire's reeds.
import {
	cityPlots,
	completeDistricts,
	landmarkCells,
	onGrid,
	seatMat,
	seatShape,
} from './city.js';

/**
 * The Savanna's income: 1 resource of your choice per filled district, in the income of turns 2–4 (FF.6 2.5); 0 on
 * any other mat.
 * @param {import('./state.js').PlayerSeat} seat
 * @returns {number}
 */
export function savannaIncome(seat) {
	if (seat.capital.mat === null || !seatMat(seat).districtIncome) {
		return 0;
	}
	return completeDistricts(cityPlots(seat), seatShape(seat)).length;
}

/**
 * The Quagmire's VP at the end of income turn 5: for each landmark of the city (covering a grid plot, R89), −5 when any
 * plot of its footprint is a reed (R88), +3 otherwise (FF.6 2.4); 0 on any other mat.
 * @param {import('./state.js').PlayerSeat} seat
 * @returns {number}
 */
export function reedsVp(seat) {
	if (seat.capital.mat === null) {
		return 0;
	}
	const mat = seatMat(seat);
	if (!mat.reeds) {
		return 0;
	}
	const shape = seatShape(seat);
	const { on, off } = mat.reeds;
	return seat.capital.landmarks.reduce((sum, piece) => {
		const onReeds = landmarkCells(piece).some(
			({ row, col }) =>
				onGrid(row, col, shape) && mat.grid[row][col] === 'R'
		);
		return sum + (onReeds ? on : off);
	}, 0);
}
