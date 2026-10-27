// The explore effect: put a territory tile from the hand on an unexplored hex, score its matching sides and take its benefit (R5, FAQ #19).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { hasEra, opponents } from '../abilities.js';
import { TERRITORY_TILES } from '../data/territory-tiles.js';
import { SPACE_TILES } from '../data/space-tiles.js';
import { exploreHexes, matchingSides } from '../map.js';
import { turned } from '../terrain.js';
import { gainTiles } from './gain.js';
import { vp } from './vp.js';

/** How many territory tiles Age of Sail draws before each explore (02 §3). */
const SAIL_DRAW = 3;

/**
 * Every way a player can explore: each tile in their hand on each legal hex, in each of 6 turns.
 * Best score first, then by tile id, map order of the hex and turn.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {boolean} anywhere
 * @param {number} [only] - The only tile that may be explored (Coal Baron), if the player still holds it
 * @returns {{ tile: number, hex: string, orient: number }[]}
 */
export function exploreAnswers(state, player, anywhere, only) {
	const tiles = playerSeat(state, player)
		.territoryTiles.filter((tile) => only === undefined || tile === only)
		.sort((a, b) => a - b);
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
 * Militarism first offers an outpost on the hex; Exploitation offers the benefit twice instead of the VP (design §8).
 * @param {import('../state.js').Context} ctx
 * @param {number} player
 * @param {{ tile: number, hex: string, orient: number }} choice
 */
export function exploreTile(ctx, player, { tile, hex, orient }) {
	const { state } = ctx;
	const seat = playerSeat(state, player);
	const score = matchingSides(state, hex, tile, orient);
	seat.territoryTiles.splice(seat.territoryTiles.indexOf(tile), 1);
	state.hexes[hex].tile = tile;
	state.hexes[hex].orient = orient;
	emit(state, {
		type: 'explored',
		player,
		hex,
		tile,
		orient,
		vp: score,
	});
	/** @type {import('../state.js').NewOperation[]} */
	const ops = [];
	if (hasEra(state, player, 'militarism') && seat.outposts > 0) {
		ops.push({
			player,
			kind: 'chooseOption',
			options: [[], [{ placeOutpost: { hex } }]],
			purpose: 'militarism',
		});
	}
	const benefit = () => structuredClone(TERRITORY_TILES[tile - 1].benefit);
	if (hasEra(state, player, 'exploitation')) {
		ops.push({
			player,
			kind: 'chooseOption',
			options: [
				[{ vp: score }, ...benefit()],
				[...benefit(), ...benefit()],
			],
			purpose: 'exploitation',
			source: { hex },
		});
	} else {
		vp(ctx, player, score, /** @type {any} */ ({ source: { hex } }));
		ops.push({
			player,
			kind: 'effects',
			effects: benefit(),
			source: { hex },
		});
	}
	ctx.push(ops);
}

/**
 * The explore effect. With nothing to explore it does nothing; with one possible result it explores at once; otherwise its player chooses.
 * `tile` limits it to that tile (Coal Baron). Under Age of Sail it first draws 3 territory tiles, even when no hex can then be
 * explored, and the player may give a tile to an opponent; `sailed` marks the explore that follows (design §8).
 * @type {import('../state.js').EffectHandler}
 */
export function explore(ctx, player, value, op) {
	const { state } = ctx;
	if (hasEra(state, player, 'age-of-sail') && value?.sailed !== true) {
		gainTiles(ctx, player, 'territory', SAIL_DRAW);
		if (
			playerSeat(state, player).territoryTiles.length > 0 &&
			opponents(state, player).length > 0
		) {
			ctx.push([
				// The gift's VP is Age of Sail's (#29).
				{ player, kind: 'chooseGift', origin: 'tapestry' },
				{
					player,
					kind: 'effects',
					effects: [{ explore: { ...value, sailed: true } }],
					source: op.source,
				},
			]);
			return;
		}
	}
	const anywhere = value?.anywhere === true;
	/** @type {number | undefined} */
	const tile = value?.tile;
	const answers = exploreAnswers(state, player, anywhere, tile);
	if (answers.length === 0) {
		emit(state, { type: 'noExplore', player });
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
	ctx.push([
		{
			player,
			kind: 'chooseExplore',
			anywhere,
			...(tile !== undefined && { tile }),
		},
	]);
}

/**
 * The space tiles a player may explore: all they hold, or with `fromGained` only those the track space
 * that is running just gave them (R105), in the order gained. The benefit started at the player's latest
 * activation of that space, or their latest copy of it (Marriage of State).
 * @param {import('../state.js').State} state
 * @param {number} player
 * @param {{ track?: string, space?: number } | null | undefined} source - The track space whose benefit is running
 * @param {boolean} fromGained
 * @returns {number[]}
 * @throws {Error} For `fromGained` outside a track space, or with no activation or copy of it on record (bugs, not player mistakes)
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
	let start = -1;
	for (let i = events.length - 1; i >= 0; i--) {
		const e = /** @type {any} */ (events[i]);
		if (
			(e.type === 'spaceActivated' || e.type === 'benefitCopied') &&
			e.player === player &&
			e.track === source.track &&
			e.space === source.space
		) {
			start = i + 1;
			break;
		}
	}
	if (start === -1) {
		throw new Error(
			'exploreSpace with fromGained found no spaceActivated or benefitCopied event.'
		);
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
