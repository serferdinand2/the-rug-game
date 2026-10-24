// The explore effect: put a territory tile from the hand on an unexplored hex, score its matching sides and take its benefit (R5, FAQ #19).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
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
