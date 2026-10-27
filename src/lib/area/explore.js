// The explore choices of the map prompt (#28): each tile the viewer holds, in each turn, on one chosen hex.
import { matchingSides, turned } from '../engine/game.js';
import { describeTile } from '../describe.js';
import { TERRITORY_TILES } from '../engine/data/territory-tiles.js';

/** @typedef {import('../ui.js').Terrain} Terrain */

/**
 * One way to explore a hex.
 * @typedef {Object} ExploreChoice
 * @property {number} index - The answer's place in decision.answers
 * @property {number} tile - 1-48
 * @property {number} orient - 0-5
 * @property {Terrain[]} corners - The tile's corner terrains as it would lie, clockwise from the top-left
 * @property {Terrain[]} island - The terrains of the tile's island, empty when it has none
 * @property {number} vp - The sides that match the neighbours, 1 VP each
 * @property {string} label - The tile and its turn in words, such as 'Tile 19, turned 3 times'
 * @property {boolean} clouds - The tile's picture shows clouds (R77)
 * @property {boolean} volcano - The tile's picture shows a volcano (R77)
 */

/**
 * The choices for a hex: the decision's answers on that hex, with the tile as it would lie and the VP it scores.
 * The engine scores on the view's hexes, which show every explored tile.
 * @param {any} game - The game as view() gives it to the viewer
 * @param {{ answers: { tile: number, hex: string, orient: number }[] }} decision - The viewer's open chooseExplore
 * @param {string} hex
 * @returns {ExploreChoice[]}
 */
export function exploreChoices(game, decision, hex) {
	/** @type {ExploreChoice[]} */
	const choices = [];
	decision.answers.forEach((answer, index) => {
		if (answer.hex !== hex) {
			return;
		}
		const data = TERRITORY_TILES[answer.tile - 1];
		choices.push({
			index,
			tile: answer.tile,
			orient: answer.orient,
			corners: /** @type {Terrain[]} */ (
				/** @type {unknown} */ (turned(data.corners, answer.orient))
			),
			island: /** @type {Terrain[]} */ (
				/** @type {unknown} */ ([...data.island])
			),
			vp: matchingSides(game, hex, answer.tile, answer.orient),
			label: describeTile(answer.tile, answer.orient),
			clouds: data.clouds,
			volcano: data.volcano,
		});
	});
	return choices.sort(
		(a, b) => b.vp - a.vp || a.tile - b.tile || a.orient - b.orient
	);
}
