// Outposts leaving a seat's supply: the one place that takes them, so civilizations can answer it (#20 design §4).
import { seatOf } from './state.js';
import { triggered } from './abilities.js';

/**
 * Takes one outpost from a seat's supply, then pushes the `outpostTaken` triggers (the Militants choose a row).
 * The caller checks that the seat has one, and puts it on the map.
 * @param {import('./state.js').Context} ctx
 * @param {number} player
 */
export function takeOutpost(ctx, player) {
	seatOf(ctx.state, player).outposts -= 1;
	ctx.push(triggered(ctx.state, 'outpostTaken', { player }));
}
