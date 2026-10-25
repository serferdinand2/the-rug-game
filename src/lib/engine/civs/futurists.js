// The Futurists (02 §1.2): when gained, at setup or mid-game, a head start of 4 spaces on every track and 1 of each resource.
import { playerSeat } from '../state.js';
import { LAST_SPACE, moveToken } from '../movement.js';
import { TRACK_IDS } from '../data/ids.js';

/** How many spaces the Futurists advance on each track. */
const HEAD_START = 4;

/** @type {import('./civ.js').Civ} */
export const futurists = {
	id: 'futurists',
	// The same at setup and mid-game (02 §1.2, my call: BGA redraws instead). On each track the most advanced token
	// jumps (my call), stopping at space 12: a jump gains no landmark, benefit or bonus (#20 design §7).
	setup(ctx, player) {
		const seat = playerSeat(ctx.state, player);
		for (const track of TRACK_IDS) {
			const tokens = seat.tracks[track];
			if (tokens.length === 0) {
				continue;
			}
			const from = Math.max(...tokens);
			const to = Math.min(from + HEAD_START, LAST_SPACE);
			if (to > from) {
				moveToken(ctx, player, {
					track,
					from,
					to,
					benefit: false,
					jump: true,
				});
			}
		}
		ctx.push([
			{
				player,
				kind: 'effects',
				effects: [
					{ gain: { coin: 1, worker: 1, food: 1, culture: 1 } },
				],
			},
		]);
	},
	adjustment: {
		firstTurnEnd(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ lose: { culture: 1, any: 1 } }],
				},
			]);
		},
	},
};
