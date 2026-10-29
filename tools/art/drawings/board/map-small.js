// The small map (1–3 players), an example only: its 13 printed territories turned as printed, the other 21 hexes unexplored, in open sea.
import { drawBoard } from '../../parts/territory.js';

/** Draws the example board, painted as the game paints its map. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBoard('small');
}
