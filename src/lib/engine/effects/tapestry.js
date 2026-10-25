// The tapestry effects: tapestryOnTop (design §7, R25, FAQ #10).
import { emit } from '../events.js';
import { playerSeat } from '../state.js';
import { currentEra, playTapestry } from '../tapestry.js';

/**
 * Plays a card from the hand on top of the current era's slot (Nuclear Bomb, Printing Press). Nothing is played
 * with an empty hand (FAQ #10) or with no current era (R25); the only card in hand is played without asking.
 * @type {import('../state.js').EffectHandler}
 */
export function tapestryOnTop(ctx, player) {
	const era = currentEra(ctx.state, player);
	const { hand } = playerSeat(ctx.state, player);
	if (era === null || hand.length === 0) {
		emit(ctx.state, { type: 'noTapestryOnTop', player });
		return;
	}
	if (hand.length === 1) {
		playTapestry(ctx, player, hand.splice(0, 1)[0], era);
		return;
	}
	ctx.push([{ player, kind: 'chooseTapestry', options: [...hand], era }]);
}
