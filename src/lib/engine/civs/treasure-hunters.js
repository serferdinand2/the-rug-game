// The Treasure Hunters (03 §1.3, R114): 4 tokens and 2 territory tiles when they come in, and on income turns 2-5 a token onto an empty territory beside theirs for the treasure of a terrain it shows, each treasure once.
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { triggered } from '../abilities.js';
import { controlledTerritories, itemCount } from '../control.js';
import { terrainsOf } from '../terrain.js';
import { askHex } from '../decisions/choose-hex.js';
import { askSlot } from '../decisions/choose-slot.js';
import { MAPS, hexNeighbours } from '../data/maps.js';
import { BLACK_DIE, RED_DIE, SCIENCE_DIE, scienceFaces } from '../data/dice.js';
import { defaultDie, withDie } from '../science-die.js';
import { deepFreeze } from '../data/ids.js';
import { placeToken } from './civ.js';

/** @typedef {import('../data/ids.js').TerrainId} TerrainId */

/**
 * What a treasure rolls once its resource is gained: the black conquer die twice (one result kept), the science die
 * twice (one result to advance on), both conquer dice once, or the red conquer die twice (both results kept).
 * @typedef {'black' | 'science' | 'conquer' | 'red'} TreasureDie
 */

/**
 * One treasure on the mat (03 §1.3).
 * @typedef {Object} Treasure
 * @property {TerrainId} terrain - The terrain a territory must show for it
 * @property {Record<string, number>} gain - The resource gained first
 * @property {TreasureDie} die - What is rolled after it
 */

/**
 * The Treasure Hunters' own state.
 * @typedef {Object} TreasureHuntersData
 * @property {number} tokens - The tokens still on the mat
 * @property {TerrainId[]} used - The treasures claimed, in the order claimed; each is claimed once
 */

/** The civilization's id, which keys its civData and names its tokens on the map. */
const ID = 'treasure-hunters';

/** The tokens the Treasure Hunters start with, for the engine and the card (#107). */
export const TREASURE_HUNTERS_TOKENS = 4;

/** The territory tiles they gain when they come in. */
export const TREASURE_HUNTERS_TILES = 2;

/**
 * The treasures in the card's order (03 §1.3).
 * @type {readonly Treasure[]}
 */
export const TREASURES = deepFreeze(
	/** @type {Treasure[]} */ ([
		{ terrain: 'desert', gain: { coin: 1 }, die: 'black' },
		{ terrain: 'grassland', gain: { culture: 1 }, die: 'science' },
		{ terrain: 'mountain', gain: { worker: 1 }, die: 'conquer' },
		{ terrain: 'forest', gain: { food: 1 }, die: 'red' },
	])
);

/** The faces of each die a treasure rolls twice. */
const ROLLED_TWICE =
	/** @type {Readonly<Record<string, readonly unknown[]>>} */ ({
		black: BLACK_DIE,
		science: SCIENCE_DIE,
		red: RED_DIE,
	});

/**
 * The unused treasures a territory has, in the card's order: those whose terrain it shows anywhere, corners or island,
 * as R32 reads land masses (R114). None while it is unexplored.
 * @param {import('../state.js').State} state
 * @param {string} hex
 * @param {readonly TerrainId[]} used
 * @returns {TerrainId[]}
 */
function treasuresOn(state, hex, used) {
	const terrains = terrainsOf(state, hex);
	if (!terrains) {
		return [];
	}
	const shown = [...terrains.corners, ...terrains.island];
	return TREASURES.map(({ terrain }) => terrain).filter(
		(terrain) => !used.includes(terrain) && shown.includes(terrain)
	);
}

/**
 * The hexes a token may go on, in map order: explored territories with no item, next to one the player controls, that
 * have an unused treasure.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {readonly TerrainId[]} used
 * @returns {string[]}
 */
function treasureHexes(state, player, used) {
	const owned = new Set(controlledTerritories(state, player));
	return MAPS[state.map].hexes.filter(
		(hex) =>
			itemCount(state, hex) === 0 &&
			hexNeighbours(hex).some((other) => owned.has(other)) &&
			treasuresOn(state, hex, used).length > 0
	);
}

/**
 * The territory is chosen: the treasure to claim there, asked when it has more than one unused.
 * @type {import('../state.js').AutomaticKind}
 */
export function treasureHex(ctx, op) {
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.hex);
	/** @type {TreasureHuntersData} */
	const data = playerSeat(ctx.state, player).civData[ID];
	askSlot(ctx, player, {
		options: treasuresOn(ctx.state, hex, data.used),
		purpose: 'treasureHunters',
		then: { kind: 'treasureClaim', hex },
	});
}

/**
 * Claims the treasure picked (`slot`) on the hex: a token goes there, so they control it (R114), and the treasure is
 * used. Then its resource and its roll. It is no conquest: no response, no conquest dice and no middle island.
 * Control changed, so the `countsChanged` triggers come last (#20 design §7, Mystics).
 * @type {import('../state.js').AutomaticKind}
 */
export function treasureClaim(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	const hex = /** @type {string} */ (op.hex);
	const treasure = /** @type {Treasure} */ (
		TREASURES.find(({ terrain }) => terrain === op.slot)
	);
	placeToken(ctx, player, { hex, civ: ID });
	/** @type {TreasureHuntersData} */
	const data = playerSeat(state, player).civData[ID];
	data.used.push(treasure.terrain);
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: [{ gain: structuredClone(treasure.gain) }],
		},
		...(treasure.die === 'science'
			? withDie(state, player, {
					kind: 'treasureRoll',
					hex,
					die: treasure.die,
				})
			: [{ player, kind: 'treasureRoll', hex, die: treasure.die }]),
		...triggered(state, 'countsChanged', { player }),
	]);
}

/**
 * A treasure's roll (03 §1.3). Its results act on the claimed hex, so the black die's "?" gives that tile's benefit
 * (nothing on a printed territory, R8); their VP count as the civilization's, not the map's. Two rolls alike leave
 * nothing to choose.
 * @type {import('../state.js').AutomaticKind}
 */
export function treasureRoll(ctx, op) {
	const { state } = ctx;
	const player = /** @type {number} */ (op.player);
	/** @type {TreasureDie} */
	const die = op.die;
	const on = {
		source: { hex: op.hex },
		origin: /** @type {const} */ ('civ'),
	};
	if (die === 'conquer') {
		// Red then black, as a conquest rolls them; black's result is gained first, as a conquest's both dice are.
		const red = ctx.random(RED_DIE.length);
		const black = ctx.random(BLACK_DIE.length);
		emit(state, {
			type: 'treasureRolled',
			player,
			die,
			faces: [red, black],
		});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [
					structuredClone(BLACK_DIE[black]),
					structuredClone(RED_DIE[red]),
				],
				ordered: true,
				...on,
			},
		]);
		return;
	}
	// The science treasure rolls the game's science die, the d20 with the arts track (#35); its event then names it.
	const scienceDie =
		die === 'science' ? (op.scienceDie ?? defaultDie(state)) : null;
	const rolled =
		die === 'science'
			? scienceFaces(scienceDie ?? 'd12')
			: ROLLED_TWICE[die];
	const faces = [ctx.random(rolled.length), ctx.random(rolled.length)];
	emit(state, {
		type: 'treasureRolled',
		player,
		die,
		faces,
		...(scienceDie === 'd20' && { scienceDie }),
	});
	if (die === 'science') {
		// The research procedure: the player may advance on the track chosen, with its benefit and bonus (01 §3.3).
		const [first, second] = faces.map((face) => rolled[face]);
		const then = {
			kind: 'researchRolled',
			noBenefit: false,
			offTrackVp: 0,
		};
		ctx.push([
			first === second
				? { ...then, player, track: first }
				: {
						player,
						kind: 'chooseRoll',
						options: [first, second],
						then,
					},
		]);
		return;
	}
	if (die === 'red') {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: faces.map((face) => structuredClone(RED_DIE[face])),
				ordered: true,
				...on,
			},
		]);
		return;
	}
	const [first, second] = faces.map((face) => BLACK_DIE[face]);
	if (JSON.stringify(first) === JSON.stringify(second)) {
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [structuredClone(first)],
				...on,
			},
		]);
		return;
	}
	ctx.push([
		{
			player,
			kind: 'chooseOption',
			options: [[structuredClone(first)], [structuredClone(second)]],
			purpose: 'treasureHunters',
			...on,
		},
	]);
}

/** @type {import('./civ.js').Civ} */
export const treasureHunters = {
	id: ID,
	incomeTurns: [2, 3, 4, 5],
	// At setup or when gained mid-game (R113): the tokens on the mat and 2 territory tiles. No adjustment (F&F p.32).
	setup(ctx, player) {
		playerSeat(ctx.state, player).civData[ID] =
			/** @type {TreasureHuntersData} */ ({
				tokens: TREASURE_HUNTERS_TOKENS,
				used: [],
			});
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [{ gain: { territory: TREASURE_HUNTERS_TILES } }],
			},
		]);
	},
	// You may move a token onto a territory with a treasure while one is left.
	income(ctx, player) {
		/** @type {TreasureHuntersData} */
		const data = playerSeat(ctx.state, player).civData[ID];
		if (data.tokens === 0) {
			return;
		}
		askHex(
			ctx,
			player,
			treasureHexes(ctx.state, player, data.used),
			true,
			'treasureHunters',
			{ kind: 'treasureHex' }
		);
	},
};
