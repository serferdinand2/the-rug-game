// A&A's tapestry cards that hold pieces (#37 part 2b; 03 §2.5): the building plots of Commercial Center, Monuments and Star Chamber, the landmarks on Space Race and Trade Routes, and National Parks' territories.
import { emit } from './events.js';
import { playerSeat } from './state.js';
import { hasEra, triggered } from './abilities.js';
import { landmarkCells } from './city.js';
import { controlledTerritories, itemCount } from './control.js';
import { askSlot } from './decisions/choose-slot.js';
import { tracksOf } from './tracks-in-play.js';
import { PLOT_CARDS } from './data/tapestry-cards.js';
import { BLACK_DIE, RED_DIE } from './data/dice.js';
import { MAPS } from './data/maps.js';

/** @typedef {import('./placing.js').Piece} Piece */
/** @typedef {{ card: string, row: number, col: number, rotation?: number }} PlotPlace */

/**
 * A piece on a card: a building or landmark on a plot square (a landmark's `row` and `col` are its footprint's top
 * left, which may lie off the card), or a landmark on Space Race or Trade Routes.
 * @typedef {{ building: import('./data/ids.js').BuildingId, row: number, col: number } | { landmark: string, row: number, col: number, rotation: number } | { landmark: string }} CardPiece
 */

/** VP a Commercial Center square gives instead of its printed benefit (03 §2.12). */
const SQUARE_VP = 3;

/** The VP per landmark on Trade Routes (03 §2.5). */
const TRADE_ROUTES_VP = 5;

/** How far a landmark's top left may lie from a plot card's: footprints are at most 4 by 4. */
const REACH = 4;

/**
 * A plot card's squares, row by row, left to right.
 * @param {string} card
 * @returns {{ row: number, col: number }[]}
 */
export function plotSquares(card) {
	return PLOT_CARDS[card].grid.flatMap((line, row) =>
		[...line].flatMap((x, col) => (x === 'X' ? [{ row, col }] : []))
	);
}

/**
 * The squares of a plot card its pieces cover.
 * @param {readonly CardPiece[]} pieces
 * @param {string} card
 * @returns {Set<string>} 'row,col' keys
 */
function coveredSquares(pieces, card) {
	const squares = new Set(
		plotSquares(card).map(({ row, col }) => `${row},${col}`)
	);
	return new Set(
		pieces
			.flatMap((piece) => cellsOf(piece))
			.map(({ row, col }) => `${row},${col}`)
			.filter((key) => squares.has(key))
	);
}

/**
 * The cells a piece on a plot card covers, on the card and off it.
 * @param {CardPiece} piece
 * @returns {{ row: number, col: number }[]}
 */
function cellsOf(piece) {
	if (!('row' in piece)) {
		return [];
	}
	return 'building' in piece
		? [{ row: piece.row, col: piece.col }]
		: landmarkCells(
				/** @type {import('./city.js').PlacedLandmark} */ (piece)
			);
}

/**
 * The player's plot cards at work: each the face-up top card of one of their era slots (CONTINUOUS, 03 §2.5).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
function activePlots(state, player) {
	const { tapestry, faceDown } = playerSeat(state, player).incomeMat;
	return tapestry.flatMap((slot) => {
		const top = slot.at(-1);
		return top !== undefined && !faceDown.includes(top) && top in PLOT_CARDS
			? [top]
			: [];
	});
}

/**
 * Where a piece may go on the player's plot cards: an income building on any open square; a landmark anywhere it
 * covers at least 1 open square and no covered one, hanging off the card's shape as far as it likes (03 §2.5).
 * Landmark spots covering the same squares count as one place.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Piece} piece
 * @returns {PlotPlace[]}
 */
function plotPlaces(state, player, piece) {
	const seat = playerSeat(state, player);
	if (!seat.onCards) {
		return [];
	}
	return activePlots(state, player).flatMap((card) => {
		const squares = plotSquares(card);
		const taken = coveredSquares(seat.onCards?.[card] ?? [], card);
		const open = squares.filter(
			({ row, col }) => !taken.has(`${row},${col}`)
		);
		if ('building' in piece) {
			return open.map(({ row, col }) => ({ card, row, col }));
		}
		const keys = new Set(squares.map(({ row, col }) => `${row},${col}`));
		/** @type {Set<string>} */
		const seen = new Set();
		/** @type {PlotPlace[]} */
		const places = [];
		for (let rotation = 0; rotation < 4; rotation++) {
			for (let row = -REACH; row <= REACH; row++) {
				for (let col = -REACH; col <= REACH; col++) {
					const on = landmarkCells({
						landmark: piece.landmark,
						row,
						col,
						rotation,
					})
						.map((cell) => `${cell.row},${cell.col}`)
						.filter((key) => keys.has(key));
					if (on.length === 0 || on.some((key) => taken.has(key))) {
						continue;
					}
					const key = on.sort().join(';');
					if (!seen.has(key)) {
						seen.add(key);
						places.push({ card, row, col, rotation });
					}
				}
			}
		}
		return places;
	});
}

/**
 * Space Race and Trade Routes, while their THIS ERA ability is the player's and lies on a card of theirs: Space
 * Race while it holds no landmark, Trade Routes always (03 §2.5).
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]} The cards on the mat
 */
function landmarkCards(state, player) {
	const seat = playerSeat(state, player);
	const era = seat.era;
	if (!seat.onCards || !era || era.card === null) {
		return [];
	}
	if (era.ability === 'trade-routes') {
		return [era.card];
	}
	if (era.ability === 'space-race' && !(seat.onCards[era.card]?.length > 0)) {
		return [era.card];
	}
	return [];
}

/**
 * National Parks' places: each territory the player controls on the map whose only item is an outpost of theirs.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @returns {string[]}
 */
function parksHexes(state, player) {
	if (!hasEra(state, player, 'national-parks')) {
		return [];
	}
	const owned = new Set(controlledTerritories(state, player));
	return MAPS[state.map].hexes.filter(
		(hex) =>
			owned.has(hex) &&
			itemCount(state, hex) === 1 &&
			state.hexes[hex].outposts.some(
				(o) => o.seat === player && !o.toppled && !o.piece
			)
	);
}

/**
 * Every place A&A's tapestry cards offer a gained piece: plot squares, Space Race or Trade Routes (landmarks only),
 * and National Parks' territories.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {Piece} piece
 * @returns {import('./placing.js').Placement[]}
 */
export function cardPlaces(state, player, piece) {
	return [
		...plotPlaces(state, player, piece),
		...('landmark' in piece
			? landmarkCards(state, player).map((card) => ({ card }))
			: []),
		...parksHexes(state, player).map((hex) => ({ hex, parks: true })),
	];
}

/**
 * Puts a piece on a card and pushes what it gives (03 §2.5): on Commercial Center, its printed benefit or 3 VP for
 * each square newly covered; on Monuments or Star Chamber, its reward once every square is covered; on Space Race,
 * a space tile explored; on Trade Routes, 5 VP per landmark there and a conquer with both dice. The piece is the
 * player's, not the capital's: no district, no `piecePlaced` (Monarchy), and it breaks no tie (R13).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {Piece} piece
 * @param {{ card: string, row?: number, col?: number, rotation?: number }} place
 */
export function placeOnCard(ctx, player, piece, place) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	const held = ((seat.onCards ??= {})[place.card] ??= []);
	const before =
		place.card in PLOT_CARDS ? coveredSquares(held, place.card) : null;
	/** @type {CardPiece} */
	const placed =
		place.row === undefined
			? { landmark: /** @type {any} */ (piece).landmark }
			: 'building' in piece
				? {
						building: piece.building,
						row: place.row,
						col: /** @type {number} */ (place.col),
					}
				: {
						landmark: piece.landmark,
						row: place.row,
						col: /** @type {number} */ (place.col),
						rotation: place.rotation ?? 0,
					};
	held.push(placed);
	emit(state, {
		type: 'piecePlacedOnCard',
		player,
		card: place.card,
		...structuredClone(placed),
	});
	ctx.push([
		...rewardOps(state, player, place.card, held, before),
		...triggered(state, 'countsChanged', { player }),
	]);
}

/**
 * What a piece just placed on a card gives.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {string} card - On the mat
 * @param {readonly CardPiece[]} held - The card's pieces, the new one included
 * @param {Set<string> | null} before - A plot card's squares covered before it
 * @returns {import('./state.js').NewOperation[]}
 */
function rewardOps(state, player, card, held, before) {
	/** @param {import('./data/effects.js').Effect[]} effects */
	const run = (effects) => [
		{ player, kind: 'effects', effects, source: { tapestry: card } },
	];
	if (before !== null) {
		const after = coveredSquares(held, card);
		const squares = plotSquares(card).map(
			({ row, col }) => `${row},${col}`
		);
		const plot = PLOT_CARDS[card];
		if (plot.squares) {
			// In reading order, one question each (Jamey: per square, 03 §2.12).
			return run(
				squares.flatMap((key, i) =>
					after.has(key) && !before.has(key)
						? [
								{
									choice: [
										structuredClone(
											plot.squares?.[i] ?? []
										),
										[{ vp: SQUARE_VP }],
									],
								},
							]
						: []
				)
			);
		}
		const done = squares.every((key) => after.has(key));
		const was = squares.every((key) => before.has(key));
		if (!done || was) {
			return [];
		}
		return card === 'star-chamber'
			? run([{ advance: { tracks: tracksOf(state), freeBonus: true } }])
			: run([
					{
						choice: [
							[{ vp: 8 }],
							[
								{
									gain: {
										culture: 1,
										coin: 1,
										food: 1,
										worker: 1,
									},
								},
							],
						],
					},
				]);
	}
	const ability = playerSeat(state, player).era?.ability;
	if (ability === 'space-race') {
		return run([{ gain: { space: 1 } }, { exploreSpace: {} }]);
	}
	return run([
		{ vp: TRADE_ROUTES_VP * held.length },
		{ conquer: { bothDice: 'always' } },
	]);
}

/**
 * Puts a piece on a National Parks territory, a second item there, so nobody can conquer it (R33, as the Nomads'
 * pieces), then the player picks the black or the red conquer die to roll (03 §2.5).
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 * @param {Piece} piece
 * @param {string} hex - One of parksHexes()
 */
export function placeInPark(ctx, player, piece, hex) {
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
		parks: true,
	});
	ctx.push(triggered(ctx.state, 'countsChanged', { player }));
	askSlot(ctx, player, {
		options: ['black', 'red'],
		purpose: 'nationalParks',
		then: { kind: 'parksRoll', hex },
	});
}

/**
 * Rolls the conquer die National Parks' player picked, and gives its face; the black die's "?" is the territory's
 * tile benefit (R8).
 * @type {import('./state.js').AutomaticKind}
 */
export function parksRoll(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const die = op.slot === 'red' ? 'red' : 'black';
	const face = ctx.random(6);
	emit(ctx.state, { type: 'parksDieRolled', player, die, face });
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [
				structuredClone((die === 'red' ? RED_DIE : BLACK_DIE)[face]),
			],
			source: { hex: op.hex },
		},
	]);
}
