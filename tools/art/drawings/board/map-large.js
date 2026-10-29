// The large map (4–5 players), an example only: its 25 printed territories turned as printed, the other 36 hexes unexplored, in open sea.
import { drawBoard } from '../../parts/territory.js';

/** Draws the example board, painted as the game paints its map. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBoard('large');
}
