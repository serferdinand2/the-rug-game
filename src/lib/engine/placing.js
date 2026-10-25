// Placing a gained building or landmark: in the capital city, paying a reward for each district it completes (R13, FAQ #1), or in a place a civilization offers (#20 design §9).
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { hasEra, triggered } from './abilities.js';
import {
	buildingSpots,
	cityPlots,
	completeDistricts,
	landmarkCells,
	landmarkSpots,
	onGrid,
} from './city.js';
import { itemCount } from './control.js';
import { CRAFTSMEN_COLUMNS, craftsmenColumns } from './civs/craftsmen.js';
import { nomadsHexes } from './civs/nomads.js';
import { plotIndex } from '../capital.js';
import { CAPITAL_MATS, impassablePlots } from './data/capitals.js';

/** @typedef {{ building: import('./data/ids.js').BuildingId } | { landmark: string }} Piece */

/**
 * Where a gained piece may go: a capital plot (with a turn for a landmark), a Craftsmen column, a Nomads hex, or
 * beside the mat when the capital has no room but another place does (#20 design §9).
 * @typedef {{ row: number, col: number, rotation?: number } | { craftsmen: number } | { hex: string } | { besideMat: true }} Placement
 */

/**
 * How many impassable plots a piece covers, the mat's and the Architects' cubes: none until Terraforming lets pieces go there.
 * @param {import('./state.js').PlayerSeat} seat
 * @param {import('./city.js').PlacedBuilding | import('./city.js').PlacedLandmark} piece
 * @returns {number}
 */
function impassableCovered(seat, piece) {
	const mat = CAPITAL_MATS[/** @type {number} */ (seat.capital.mat) - 1];
	const impassable = [...impassablePlots(mat), ...seat.capital.cubes];
	const cells = 'building' in piece ? [piece] : landmarkCells(piece);
	return cells.filter(
		({ row, col }) =>
			onGrid(row, col) && impassable.includes(plotIndex(row, col))
	).length;
}

/**
 * Places a piece on the capital city. Each district it completes pays 1 resource of the player's choice, and the
 * `districtsCompleted` triggers follow that reward. Then come the piece's triggers, and last the `countsChanged`
 * triggers (#20 design §7, §9).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {import('./city.js').PlacedBuilding | import('./city.js').PlacedLandmark} piece
 * @param {boolean} automatic - True when nobody was asked: the piece had only one place
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
	/** @type {import('./state.js').NewOperation[]} */
	const ops = [];
	if (districts.length > 0) {
		emit(ctx.state, {
			type: 'districtsCompleted',
			player,
			districts: [...districts],
		});
		ops.push(
			{
				player,
				kind: 'effects',
				effects: [{ gain: { any: districts.length } }],
			},
			...triggered(ctx.state, 'districtsCompleted', {
				player,
				districts,
			})
		);
	}
	const impassable = impassableCovered(seat, piece);
	ops.push(
		...triggered(
			ctx.state,
			'piecePlaced',
			'building' in piece
				? { player, building: piece.building, impassable }
				: { player, landmark: piece.landmark, impassable }
		),
		...triggered(ctx.state, 'countsChanged', { player })
	);
	ctx.push(ops);
}

/**
 * Puts a piece beside the capital mat, where it still counts (FAQ #21, R71). A landmark stays there even if room
 * opens later, and doesn't break ties (R13).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {Piece} piece
 */
export function placeBesideMat(ctx, player, piece) {
	const seat = playerSeat(ctx.state, player);
	if ('building' in piece) {
		seat.besideMat.push(piece.building);
		emit(ctx.state, {
			type: 'placedBesideMat',
			player,
			building: piece.building,
		});
	} else {
		seat.besideMat.push(piece.landmark);
		emit(ctx.state, {
			type: 'placedBesideMat',
			player,
			landmark: piece.landmark,
		});
	}
}

/**
 * Puts an income building on the lowest open space of a Craftsmen column and gains that space's benefit. The column
 * counts as the capital for Monarchy, but it completes no district, row or column (#20 design §7).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {import('./data/ids.js').BuildingId} building
 * @param {number} column - 0-2, one with an open space
 */
export function placeInColumn(ctx, player, building, column) {
	/** @type {import('./civs/craftsmen.js').CraftsmenData} */
	const data = playerSeat(ctx.state, player).civData.craftsmen;
	data[column].push(building);
	emit(ctx.state, {
		type: 'buildingPlaced',
		player,
		building,
		craftsmen: column,
		automatic: false,
	});
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(
				CRAFTSMEN_COLUMNS[column][data[column].length - 1]
			),
		},
		...triggered(ctx.state, 'piecePlaced', {
			player,
			building,
			impassable: 0,
		}),
		...triggered(ctx.state, 'countsChanged', { player }),
	]);
}

/**
 * Puts a Nomads piece on a hex, where it gives control and topples like an outpost (#20 design §7, §8). On a
 * territory the player controls, which held 1 item, it pays 1 resource of their choice. It is no conquest and fires
 * no `piecePlaced`: it is not in the capital, so Monarchy and Terraforming score nothing for it.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {Piece} piece
 * @param {string} hex - One of nomadsHexes()
 */
export function placeOnMap(ctx, player, piece, hex) {
	const held = itemCount(ctx.state, hex) === 1;
	ctx.state.hexes[hex].outposts.push({
		seat: player,
		toppled: false,
		piece: structuredClone(piece),
	});
	emit(ctx.state, {
		type: 'piecePlacedOnMap',
		player,
		hex,
		piece: structuredClone(piece),
	});
	ctx.push([
		...(held
			? [
					{
						player,
						kind: 'effects',
						effects: [{ gain: { any: 1 } }],
					},
				]
			: []),
		...triggered(ctx.state, 'countsChanged', { player }),
	]);
}

/**
 * The places a piece may go other than the capital: the Craftsmen's columns with room (income buildings only),
 * then the Nomads' hexes.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Piece} piece
 * @returns {Placement[]}
 */
function otherPlaces(state, player, piece) {
	return [
		...('building' in piece
			? craftsmenColumns(playerSeat(state, player)).map((craftsmen) => ({
					craftsmen,
				}))
			: []),
		...nomadsHexes(state, player).map((hex) => ({ hex })),
	];
}

/**
 * Every place a gained piece may go, the answers to `choosePlacement`: the capital plots, then the other places.
 * With no capital plot but another place, beside the mat comes first (#20 design §9).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Piece} piece
 * @returns {Placement[]}
 */
export function placements(state, player, piece) {
	const seat = playerSeat(state, player);
	const terraform = hasEra(state, player, 'terraforming');
	/** @type {Placement[]} */
	const capital =
		'landmark' in piece
			? landmarkSpots(seat, piece.landmark, terraform)
			: buildingSpots(seat, terraform);
	const others = otherPlaces(state, player, piece);
	return capital.length === 0 && others.length > 0
		? [{ besideMat: true }, ...others]
		: [...capital, ...others];
}

/**
 * The automatic operation for a gained income building: it goes on the last open plot when there is no other place,
 * beside the mat when there is no place at all, or waits for its player to choose.
 * @type {import('./state.js').AutomaticKind}
 */
export function placeBuilding(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const building = /** @type {import('./data/ids.js').BuildingId} */ (
		op.building
	);
	const seat = playerSeat(ctx.state, player);
	const spots = buildingSpots(
		seat,
		hasEra(ctx.state, player, 'terraforming')
	);
	const others = otherPlaces(ctx.state, player, { building });
	if (spots.length === 0 && others.length === 0) {
		placeBesideMat(ctx, player, { building });
	} else if (spots.length === 1 && others.length === 0) {
		placePiece(ctx, player, { building, ...spots[0] }, true);
	} else {
		ctx.push([{ player, kind: 'choosePlacement', building }]);
	}
}

/**
 * The automatic operation for a gained landmark: it goes in the only place it fits when there is no other place,
 * beside the mat when there is no place at all, or waits for its player to choose a spot and a turn (R13-R15).
 * Spots that cover the same plots count as one place, so a square landmark turned four ways is still one.
 * @type {import('./state.js').AutomaticKind}
 */
export function placeLandmark(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const landmark = /** @type {string} */ (op.landmark);
	const seat = playerSeat(ctx.state, player);
	const spots = landmarkSpots(
		seat,
		landmark,
		hasEra(ctx.state, player, 'terraforming')
	);
	const places = new Set(
		spots.map((spot) =>
			landmarkCells({ landmark, ...spot })
				.map((c) => `${c.row},${c.col}`)
				.sort()
				.join(';')
		)
	);
	const others = otherPlaces(ctx.state, player, { landmark });
	if (spots.length === 0 && others.length === 0) {
		placeBesideMat(ctx, player, { landmark });
	} else if (places.size === 1 && others.length === 0) {
		placePiece(ctx, player, { landmark, ...spots[0] }, true);
	} else {
		ctx.push([{ player, kind: 'choosePlacement', landmark }]);
	}
}
