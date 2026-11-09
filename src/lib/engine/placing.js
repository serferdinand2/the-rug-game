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
	seatImpassable,
	seatShape,
} from './city.js';
import { itemCount } from './control.js';
import { CRAFTSMEN_COLUMNS, craftsmenColumns } from './civs/craftsmen.js';
import { nomadsHexes } from './civs/nomads.js';
import { holdsLandmark, isLocked } from './tech.js';
import { upgradeCard } from './effects/tech.js';
import { techCard } from './data/tech-cards.js';
import { cardPlaces } from './card-pieces.js';
import { plotIndex } from '../capital.js';

/** @typedef {{ building: import('./data/ids.js').BuildingId } | { landmark: string }} Piece */

/**
 * Where a gained piece may go: a capital plot (with a turn for a landmark), a Craftsmen column, a Nomads hex, an A&A
 * landmark tech card (#37), or beside the mat when the capital has no room but another place does (#20 design §9).
 * A&A's tapestry cards add plot squares, Space Race and Trade Routes (`card`) and National Parks' territories (`parks`).
 * @typedef {{ row: number, col: number, rotation?: number } | { craftsmen: number } | { hex: string } | { tech: string } | { card: string, row?: number, col?: number, rotation?: number } | { hex: string, parks: true } | { besideMat: true }} Placement
 */

/**
 * Whether a player's pieces may cover impassable plots, the mat's and the Architects' cubes: under Terraforming, or
 * while they hold the Riverfolk (03 §1.3). Terraforming's 5 VP stay its own (eras.js).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {boolean}
 */
export function buildsOverImpassable(state, player) {
	return (
		hasEra(state, player, 'terraforming') ||
		playerSeat(state, player).civs.includes('riverfolk')
	);
}

/**
 * How many impassable plots a piece covers, the mat's, the Architects' cubes and the Canyon's surrounded cacti: none
 * unless buildsOverImpassable. Counted against the plots impassable before the piece landed: a cactus the piece
 * itself surrounds while covering it was a regular plot when covered (03 §2 Canyon; R122).
 * @param {import('./state.js').PlayerSeat} seat
 * @param {import('./city.js').PlacedBuilding | import('./city.js').PlacedLandmark} piece
 * @param {readonly number[]} impassable - seatImpassable() before the piece was placed
 * @returns {number}
 */
function impassableCovered(seat, piece, impassable) {
	const shape = seatShape(seat);
	const cells = 'building' in piece ? [piece] : landmarkCells(piece);
	return cells.filter(
		({ row, col }) =>
			onGrid(row, col, shape) &&
			impassable.includes(plotIndex(row, col, shape))
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
	const shape = seatShape(seat);
	const before = completeDistricts(cityPlots(seat), shape);
	const impassableBefore = seatImpassable(seat);
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
	const ops = payDistricts(ctx, player, before);
	const impassable = impassableCovered(seat, piece, impassableBefore);
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
 * The reward for the districts a change to the capital just completed: 1 resource of the player's choice for each,
 * then the `districtsCompleted` triggers. Filling a district's last plot pays, however it is filled (01 §6.1): by a
 * placed piece, or by a building Cloud City moves (#36 design §3.5).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {readonly number[]} before - The districts complete before the change
 * @returns {import('./state.js').NewOperation[]} To push, in order
 */
export function payDistricts(ctx, player, before) {
	const seat = playerSeat(ctx.state, player);
	const districts = completeDistricts(
		cityPlots(seat),
		seatShape(seat)
	).filter((d) => !before.includes(d));
	if (districts.length === 0) {
		return [];
	}
	emit(ctx.state, {
		type: 'districtsCompleted',
		player,
		districts: [...districts],
	});
	return [
		{
			player,
			kind: 'effects',
			effects: [{ gain: { any: districts.length } }],
		},
		...triggered(ctx.state, 'districtsCompleted', { player, districts }),
	];
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
 * Puts a gained landmark on one of the player's A&A landmark tech cards, which upgrades it at once; the upgrade and
 * all it triggers resolve before whatever gave the landmark goes on (03 §2). The landmark stays there for the game. It
 * is owned, but not in the capital, so it fires no `piecePlaced` and breaks no tie (R13).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {string} landmark
 * @param {string} card - One of techPlaces()
 */
export function placeOnTech(ctx, player, landmark, card) {
	const held = /** @type {Record<string, string>} */ (
		playerSeat(ctx.state, player).techLandmarks
	);
	held[card] = landmark;
	emit(ctx.state, { type: 'landmarkPlacedOnTech', player, landmark, card });
	upgradeCard(ctx, player, card);
}

/**
 * The A&A landmark tech cards a gained landmark may go on: the player's bottom- and middle-row cards whose
 * prerequisite is a landmark on the card, holding none (03 §2). Not a top-row card, which a landmark can't upgrade
 * (R126), nor one Ceramics locked this turn (#35).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
function techPlaces(state, player) {
	const { tech, techLandmarks } = playerSeat(state, player);
	if (!techLandmarks) {
		return [];
	}
	return [...tech.bottom, ...tech.middle].filter(
		(card) =>
			'landmark' in techCard(card).requires &&
			!holdsLandmark(state, player, card) &&
			!isLocked(state, player, card)
	);
}

/**
 * The places a piece may go other than the capital: the Craftsmen's columns with room (income buildings only),
 * then the Nomads' hexes, then the landmark tech cards (landmarks only, #37), then A&A's tapestry cards' (#37).
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
		...('landmark' in piece
			? techPlaces(state, player).map((tech) => ({ tech }))
			: []),
		...cardPlaces(state, player, piece),
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
	const overImpassable = buildsOverImpassable(state, player);
	/** @type {Placement[]} */
	const capital =
		'landmark' in piece
			? landmarkSpots(seat, piece.landmark, overImpassable)
			: buildingSpots(seat, overImpassable);
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
	const spots = buildingSpots(seat, buildsOverImpassable(ctx.state, player));
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
		buildsOverImpassable(ctx.state, player)
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
		// A landmark card's landmark names its card, for the placing prompt (#32).
		ctx.push([
			{
				player,
				kind: 'choosePlacement',
				landmark,
				...(op.source ? { source: op.source } : {}),
			},
		]);
	}
}
