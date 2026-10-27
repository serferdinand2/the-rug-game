// The small map (1–3 players), an example only: its 13 printed territories turned as printed, the other 21 hexes unexplored, in open sea.
import { drawBoard } from '../../parts/territory.js';

/** Draws the example board; the game composes its own map from the hex pictures. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBoard('small');
}
