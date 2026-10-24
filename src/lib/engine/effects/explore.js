// The explore effect: put a territory tile from the hand on an unexplored hex, score its matching sides and take its benefit (R5, FAQ #19).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { SPACE_TILES } from '../data/space-tiles.js';
import { exploreHexes, matchingSides, turned } from '../map.js';
import { vp } from './vp.js';

/**
 * Every way a player can explore: each tile in their hand on each legal hex, in each of 6 turns.
 * Best score first, then by tile id, map order of the hex and turn.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {boolean} anywhere
 * @returns {{ tile: number, hex: string, orient: number }[]}
 */
export function exploreAnswers(state, player, anywhere) {
	const tiles = [...playerSeat(state, player).territoryTiles].sort(
		(a, b) => a - b
	);
	const hexes = exploreHexes(state, player, anywhere);
	const scored = [];
	for (const tile of tiles) {
		for (const hex of hexes) {
			for (let orient = 0; orient < 6; orient++) {
				scored.push({
					answer: { tile, hex, orient },
					score: matchingSides(state, hex, tile, orient),
				});
			}
		}
	}
	// Array.prototype.sort is stable, so ties keep the order above.
	scored.sort((a, b) => b.score - a.score);
	return scored.map((s) => s.answer);
}

/**
 * Explores a tile: it leaves the hand for the hex, scores its matching sides, and its benefit follows. No outpost is placed (01 §7.2).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ tile: number, hex: string, orient: number }} choice
 */
export function exploreTile(ctx, player, { tile, hex, orient }) {
	const seat = playerSeat(ctx.state, player);
	const score = matchingSides(ctx.state, hex, tile, orient);
	seat.territoryTiles.splice(seat.territoryTiles.indexOf(tile), 1);
	ctx.state.hexes[hex].tile = tile;
	ctx.state.hexes[hex].orient = orient;
	emit(ctx.state, {
		type: 'explored',
		player,
		hex,
		tile,
		orient,
		vp: score,
	});
	vp(ctx, player, score, /** @type {any} */ ({}));
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(TERRITORY_TILES[tile - 1].benefit),
			source: { hex },
		},
	]);
}

/**
 * The explore effect. With nothing to explore it does nothing; with one possible result it explores at once; otherwise its player chooses.
 * @type {import('../state.js').EffectHandler}
 */
export function explore(ctx, player, value) {
	const anywhere = value?.anywhere === true;
	const answers = exploreAnswers(ctx.state, player, anywhere);
	if (answers.length === 0) {
		emit(ctx.state, { type: 'noExplore', player });
		return;
	}
	const key = (
		/** @type {{ tile: number, hex: string, orient: number }} */ a
	) =>
		`${a.tile} ${a.hex} ${turned(
			/** @type {string[]} */ (
				/** @type {unknown} */ (TERRITORY_TILES[a.tile - 1].corners)
			),
			a.orient
		).join()}`;
	if (answers.every((a) => key(a) === key(answers[0]))) {
		exploreTile(ctx, player, answers[0]);
		return;
	}
	ctx.push([{ player, kind: 'chooseExplore', anywhere }]);
}

/**
 * The space tiles a player may explore: all they hold, or with `fromGained` only those the track space
 * that is running just gave them (R105), in the order gained.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {{ track?: string, space?: number } | null | undefined} source - The track space whose benefit is running
 * @param {boolean} fromGained
 * @returns {number[]}
 * @throws {Error} For `fromGained` outside a track space (a bug, not a player's mistake)
 */
export function spaceTileOptions(state, player, source, fromGained) {
	const held = playerSeat(state, player).spaceTiles;
	if (!fromGained) {
		return [...held];
	}
	if (!source || source.track === undefined) {
		throw new Error('exploreSpace with fromGained needs a track space.');
	}
	const events = state.events;
	let start = 0;
	for (let i = events.length - 1; i >= 0; i--) {
		const e = /** @type {any} */ (events[i]);
		if (
			e.type === 'spaceActivated' &&
			e.player === player &&
			e.track === source.track &&
			e.space === source.space
		) {
			start = i + 1;
			break;
		}
	}
	/** @type {number[]} */
	const gained = [];
	for (const e of /** @type {any[]} */ (events.slice(start))) {
		if (
			e.type === 'tilesGained' &&
			e.player === player &&
			e.stack === 'space'
		) {
			gained.push(...e.tiles);
		}
	}
	return gained.filter((tile) => held.includes(tile));
}

/**
 * Explores a space tile: it moves beside the income mat and its benefit follows (R5; 01 §7.2).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {number} tile
 */
export function exploreSpaceTile(ctx, player, tile) {
	const seat = playerSeat(ctx.state, player);
	seat.spaceTiles.splice(seat.spaceTiles.indexOf(tile), 1);
	seat.exploredSpace.push(tile);
	emit(ctx.state, { type: 'spaceExplored', player, tile });
	const { benefit, ordered } = SPACE_TILES[tile - 1];
	ctx.push([
		{
			player,
			kind: 'effects',
			effects: structuredClone(benefit),
			ordered,
			source: { spaceTile: tile },
		},
	]);
}

/**
 * The exploreSpace effect. With no tile to explore it does nothing; with one it explores at once; otherwise its player chooses.
 * @type {import('../state.js').EffectHandler}
 */
export function exploreSpace(ctx, player, value, op) {
	const options = spaceTileOptions(
		ctx.state,
		player,
		/** @type {any} */ (op.source),
		value?.fromGained === true
	);
	if (options.length === 0) {
		emit(ctx.state, { type: 'noSpaceTile', player });
		return;
	}
	if (options.length === 1) {
		exploreSpaceTile(ctx, player, options[0]);
		return;
	}
	ctx.push([{ player, kind: 'chooseSpaceTile', options }]);
}
