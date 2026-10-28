// The explore prompt (#28, #74): the tiles an explore offers, what each scores on the lit hexes, and the answer for a tile, hex and turn.
import { matchingSides, turned } from '../engine/game.js';
import { describeTurn } from '../describe.js';
import { hexName, territoryWords } from '../hexmap.js';
import { TERRITORY_TILES } from '../engine/data/territory-tiles.js';

/** @typedef {import('../ui.js').Terrain} Terrain */

/** @typedef {{ vp: number, orient: number }} Score */
/** @typedef {{ tile: number, hex: string, orient: number }} ExploreAnswer */

/**
 * The best VP among a tile's turns on a hex, with the lowest turn that scores it.
 * @param {any} game
 * @param {string} hex
 * @param {number} tile
 * @param {ExploreAnswer[]} answers - The decision's answers
 * @returns {Score}
 */
function bestTurn(game, hex, tile, answers) {
	/** @type {Score} */
	let best = { vp: -1, orient: 0 };
	const turns = answers
		.filter((a) => a.tile === tile && a.hex === hex)
		.map((a) => a.orient)
		.sort((a, b) => a - b);
	for (const orient of turns) {
		const vp = matchingSides(game, hex, tile, orient);
		if (vp > best.vp) {
			best = { vp, orient };
		}
	}
	return best;
}

/**
 * The distinct tiles a decision offers, lowest first.
 * @param {{ answers: ExploreAnswer[] }} decision - The viewer's open chooseExplore
 * @returns {number[]}
 */
export function exploreTiles(decision) {
	return [...new Set(decision.answers.map((a) => a.tile))].sort(
		(a, b) => a - b
	);
}

/**
 * Each offered tile's best VP and lowest best turn on a hex.
 * @param {any} game - The game as view() gives it to the viewer
 * @param {{ answers: ExploreAnswer[] }} decision
 * @param {string} hex
 * @returns {Record<number, Score>}
 */
export function tileScores(game, decision, hex) {
	/** @type {Record<number, Score>} */
	const scores = {};
	for (const tile of exploreTiles(decision)) {
		scores[tile] = bestTurn(game, hex, tile, decision.answers);
	}
	return scores;
}

/**
 * A tile's best VP and lowest best turn on every hex the decision lights.
 * @param {any} game - The game as view() gives it to the viewer
 * @param {{ answers: ExploreAnswer[] }} decision
 * @param {number} tile
 * @returns {Record<string, Score>}
 */
export function hexScores(game, decision, tile) {
	/** @type {Record<string, Score>} */
	const scores = {};
	for (const answer of decision.answers) {
		if (answer.tile === tile && !(answer.hex in scores)) {
			scores[answer.hex] = bestTurn(
				game,
				answer.hex,
				tile,
				decision.answers
			);
		}
	}
	return scores;
}

/**
 * The place of a tile, hex and turn in the decision's answers.
 * @param {{ answers: ExploreAnswer[] }} decision
 * @param {ExploreAnswer} pick
 * @returns {number} -1 when there is no such answer
 */
export function exploreIndex(decision, { tile, hex, orient }) {
	return decision.answers.findIndex(
		(a) => a.tile === tile && a.hex === hex && a.orient === orient
	);
}

/**
 * A tile as it would lie, with its island and pictures.
 * @param {number} tile - 1-48
 * @param {number} orient - 0-5
 * @returns {{ corners: Terrain[], island: Terrain[], clouds: boolean, volcano: boolean }}
 */
export function tilePreview(tile, orient) {
	const data = TERRITORY_TILES[tile - 1];
	return {
		corners: /** @type {Terrain[]} */ (
			/** @type {unknown} */ (turned(data.corners, orient))
		),
		island: /** @type {Terrain[]} */ (
			/** @type {unknown} */ ([...data.island])
		),
		clouds: data.clouds,
		volcano: data.volcano,
	};
}

/**
 * A tile in words, without its number, as the map words it (#113): "Territory tile: forest and sea, with an island
 * of desert, with clouds".
 * @param {number} tile - 1-48
 * @returns {string}
 */
export function tileWords(tile) {
	return `Territory tile: ${territoryWords(TERRITORY_TILES[tile - 1])}`;
}

/**
 * A hex and a turn in words: "Hex 2,−1, turned once".
 * @param {string} hex
 * @param {number} orient - 0-5
 * @returns {string}
 */
export function exploreLine(hex, orient) {
	const turn = describeTurn(orient);
	return turn ? `Hex ${hexName(hex)}, ${turn}` : `Hex ${hexName(hex)}`;
}
