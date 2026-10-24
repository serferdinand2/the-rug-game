// Putting a building or landmark in the capital city, and paying a reward for each district it completes (R13, FAQ #1).
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { buildingSpots, cityPlots, completeDistricts } from './city.js';

/**
 * Places a piece on the capital city. Each district it completes pays 1 resource of the player's choice.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {import('./city.js').PlacedBuilding | import('./city.js').PlacedLandmark} piece
 * @param {boolean} automatic - True when the piece went on the last open plot without a question
 */
export function placePiece(ctx, player, piece, automatic) {
	const seat = playerSeat(ctx.state, player);
	const before = completeDistricts(cityPlots(seat));
	if ('building' in piece) {
		seat.capital.buildings.push({
			building: piece.building,
			row: piece.row,
			col: piece.col,
		});
		emit(ctx.state, {
			type: 'buildingPlaced',
			player,
			building: piece.building,
			row: piece.row,
			col: piece.col,
			automatic,
		});
	} else {
		seat.capital.landmarks.push({
			landmark: piece.landmark,
			row: piece.row,
			col: piece.col,
			rotation: piece.rotation,
		});
		emit(ctx.state, {
			type: 'landmarkPlaced',
			player,
			landmark: piece.landmark,
			row: piece.row,
			col: piece.col,
			rotation: piece.rotation,
			automatic,
		});
	}
	const districts = completeDistricts(cityPlots(seat)).filter(
		(d) => !before.includes(d)
	);
	if (districts.length > 0) {
		emit(ctx.state, { type: 'districtsCompleted', player, districts });
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { any: districts.length } }],
			},
		]);
	}
}

/**
 * The automatic operation for a gained income building: it goes on the last open plot, beside the mat when the city is full, or waits for its player to choose.
 * @type {import('./state.js').AutomaticKind}
 */
export function placeBuilding(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const building = /** @type {import('./data/ids.js').BuildingId} */ (
		op.building
	);
	const seat = playerSeat(ctx.state, player);
	const spots = buildingSpots(seat);
	if (spots.length === 0) {
		// A full city keeps the building beside the mat, where it still counts (FAQ #21, R71).
		seat.besideMat.push(building);
		emit(ctx.state, { type: 'placedBesideMat', player, building });
	} else if (spots.length === 1) {
		placePiece(ctx, player, { building, ...spots[0] }, true);
	} else {
		ctx.push([{ player, kind: 'choosePlacement', building }]);
	}
}
