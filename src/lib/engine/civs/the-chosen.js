// The Chosen (02 §1.2): VP for the tracks they lead and resources for their achievements, every income turn.
import { opponents } from '../abilities.js';

/**
 * How many achievements a player holds.
 * @param {import('../state.js').State} state
 * @param {number} player
 * @returns {number}
 */
function achievementsHeld(state, player) {
	return Object.values(state.achievements).filter((seats) =>
		seats.includes(player)
	).length;
}

/** @type {import('./civ.js').Civ} */
export const theChosen = {
	id: 'the-chosen',
	incomeTurns: [2, 3, 4, 5],
	income(ctx, player, turn) {
		const { state } = ctx;
		const held = achievementsHeld(state, player);
		/** @type {import('../data/effects.js').Effect[]} */
		const effects = [
			{
				vp: {
					per: 'trackLead',
					each: opponents(state, player).length,
				},
			},
		];
		if (held > 0) {
			effects.push(
				turn === 5 ? { vp: 5 * held } : { gain: { any: held } }
			);
		}
		ctx.push([{ player, kind: 'effects', effects, ordered: true }]);
	},
	adjustment: {
		setup(ctx, player) {
			ctx.push([
				{
					player,
					kind: 'effects',
					effects: [{ vp: { per: 'opponent', each: 15 } }],
				},
			]);
		},
	},
};
