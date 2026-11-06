// Which science die a roll uses: the d20 with the arts track, the d12 without, or the roller's pick with the variant "Roll either science die" (#35).
import { artsInPlay } from './tracks-in-play.js';

/** @typedef {'d12' | 'd20'} ScienceDie */

/**
 * The die a game rolls when nobody picks: the d20 whenever the arts track is in play (03 §7).
 * @param {import('./state.js').State} state
 * @returns {ScienceDie}
 */
export function defaultDie(state) {
	return artsInPlay(state) ? 'd20' : 'd12';
}

/**
 * The operations that roll a science die for `op`: the op with its `scienceDie`, or with the variant "Roll either
 * science die" a `chooseScienceDie` decision first, before each roll (#35 design §3.6). The d20 is offered first.
 * @param {import('./state.js').State} state
 * @param {number} player
 * @param {{ kind: string } & Record<string, any>} op - The operation that rolls, without its player
 * @returns {import('./state.js').NewOperation[]}
 */
export function withDie(state, player, op) {
	if (artsInPlay(state) && state.variants.includes('either-science-die')) {
		return [
			{
				player,
				kind: 'chooseScienceDie',
				options: ['d20', 'd12'],
				then: op,
			},
		];
	}
	return [{ ...op, player, scienceDie: defaultDie(state) }];
}
